// Pull-to-refresh composable for the mobile notes list.
//
// Attaches native touchstart/touchmove/touchend listeners to a scroll container
// and triggers an async `onRefresh` callback when the user pulls down past a
// threshold. The indicator supports a real-world "gravity release" feel:
//   - While dragging the indicator closely tracks the finger (~1:1 with a
//     subtle resistance past `threshold`) and the inner icon rotates 0 -> 90deg
//     based on pull progress for a tensed-spring feel.
//   - When the user releases past the threshold, the indicator softly "parks"
//     into its loading position and the icon begins spinning (handled by the
//     caller via a `.spin` class on `iconEl` driven by `isSyncingAll`).
//   - The icon keeps spinning until `onRefresh` resolves, then performs a
//     brief confirmation pause + elastic slide-up exit (back-out easing).
//   - If the user releases below the threshold (cancel), the indicator snaps
//     back with the same back-out easing — gravity release feel.
//
// Implementation note: listeners are attached to `document` (capture phase) and
// the scroll container is resolved lazily on every event. This sidesteps the
// common problem where the container element is not yet mounted when the
// composable's own onMounted hook runs (e.g. when the page is wrapped in
// <Suspense> with async setup).

import { onMounted, onUnmounted } from 'vue';

type PullToRefreshOptions = {
  // Resolver for the scroll container element (e.g. document.getElementById).
  target: () => HTMLElement | null;
  // Resolver for the indicator element that will be translated while pulling.
  indicator: () => HTMLElement | null;
  // Resolver for the inner icon element that gets rotated during drag and
  // carries a `.spin` class during loading.
  iconEl?: () => HTMLElement | null;
  // Async callback invoked when the pull distance passes the threshold.
  // The icon keeps spinning until this promise resolves.
  onRefresh: () => Promise<void>;
  // Returns true when a refresh is currently in flight (used to block a new
  // gesture while the previous sync is still running).
  isRefreshing: () => boolean;
  // Whether the gesture should be active. Resolved on every touchstart.
  enabled?: () => boolean;
  // Minimum pull distance (px) required to trigger onRefresh. Default 70.
  threshold?: number;
  // Maximum pull distance (px). Resistance is applied beyond `threshold` so
  // the indicator feels heavier the further the user pulls. Default 100.
  maxPull?: number;
}

// Back-out easing: gentle overshoot on the way home, gives a "spring release"
// feel for both the cancel snap-back and the post-refresh slide-up exit.
const EASING_BACK_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
// Exponential-out easing: quick start, slow settle — used when the indicator
// "parks" into its loading position after a successful release.
const EASING_EXPO_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

// Initial parked-above-viewport transform (matches the inline style seeded on
// the indicator in pages/index/index.vue).
const PARKED_TRANSFORM = 'translateY(-160%)';
// Position the indicator parks at while loading. Just below the top edge so
// the floating card peeks out from under the toolbar.
const LOADING_OFFSET = 28;
// How far below the top edge the indicator sits at the threshold. Visually the
// whole card should hang just below the upper boundary of the scroll area.
// (Plain numeric, used directly in translateY(<n>px).)
const PEEK_OFFSET = 8;

function usePullToRefresh(options: PullToRefreshOptions) {
  const threshold = options.threshold ?? 70;
  const maxPull = options.maxPull ?? 100;

  let startY: number | null = null;
  let pulling = false;
  let triggered = false;
  // Tracks the most recent pull distance so touchEnd can decide whether to
  // refresh without parsing transform back out of the DOM (which would be
  // unreliable once a CSS transition / spinning class kicks in).
  let currentPull = 0;
  // Distinct timers used so we can cancel a pending snap-back / exit when a
  // new gesture interrupts.
  let styleResetTimer: ReturnType<typeof setTimeout> | null = null;
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  const capStyleResetTimer = () => {
    if (styleResetTimer) {
      clearTimeout(styleResetTimer);
      styleResetTimer = null;
    }
  };

  const clearExitTimer = () => {
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
  };

  // Reset the icon's inline transform (used by the drag-time rotation) so the
  // CSS `.spin` animation (if any) can fully own the transform.
  const clearIconRotation = () => {
    const ic = options.iconEl?.();
    if (ic) ic.style.transform = '';
  };

  // Apply live values during drag (no transition — must feel 1:1 with finger).
  const applyLive = (offset: number, opacity: number, rotationDeg: number) => {
    const el = options.indicator();
    if (!el) return;
    el.style.transition = '';
    el.style.transform = `translateY(${offset}px)`;
    el.style.opacity = String(opacity);
    el.style.zIndex = '1';
    el.style.top = '12px';
    const ic = options.iconEl?.();
    if (ic) ic.style.transform = `rotate(${rotationDeg}deg)`;
  };

  // Animate the indicator back to its parked-above-viewport position with
  // an elastic / gravity-release easing. Used both for cancel (below
  // threshold) and as the tail of the post-refresh exit sequence.
  const snapBackToHidden = (durationMs: number) => {
    const el = options.indicator();
    if (!el) return;
    capStyleResetTimer();
    clearExitTimer();
    el.style.transition = `transform ${durationMs}ms ${EASING_BACK_OUT}, opacity ${durationMs}ms ${EASING_BACK_OUT}`;
    el.style.transform = PARKED_TRANSFORM;
    el.style.opacity = '0';
    styleResetTimer = setTimeout(() => {
      if (el) el.style.transition = '';
      clearIconRotation();
      styleResetTimer = null;
    }, durationMs + 20);
  };

  // Park the indicator in its loading position after a successful release.
  const parkInLoadingPosition = () => {
    const el = options.indicator();
    if (!el) return;
    capStyleResetTimer();
    el.style.transition = `transform 260ms ${EASING_EXPO_OUT}, opacity 260ms ease`;
    el.style.transform = `translateY(${LOADING_OFFSET}px)`;
    el.style.opacity = '1';
    styleResetTimer = setTimeout(() => {
      if (el) el.style.transition = '';
      styleResetTimer = null;
    }, 280);
    // The rotation accumulated during dragging is now handed off to the
    // CSS .spin animation (caller adds `.spin` when isSyncingAll flips true).
    clearIconRotation();
  };

  // Cancel-and-release sequence used after `onRefresh` settles: keep the
  // icon spinning briefly for tactile confirmation, then slide the card up
  // out of view with an elastic back-out easing.
  const playExitAnimation = () => {
    clearExitTimer();
    exitTimer = setTimeout(() => {
      snapBackToHidden(420);
      exitTimer = null;
    }, 50); // 200ms of continued spin as a tactile "ok" confirmation.
  };

  // Returns true if the touch event happened inside (or on) the scroll target.
  const isInsideTarget = (touchTarget: EventTarget | null, target: HTMLElement): boolean => {
    let node: Node | null = touchTarget as Node | null;
    while (node) {
      if (node === target) return true;
      node = node.parentNode;
    }
    return false;
  };

  const onTouchStart = (e: TouchEvent) => {
    if (options.enabled && !options.enabled()) return;
    if (options.isRefreshing()) return;
    const target = options.target();
    if (!target) return;
    if (!isInsideTarget(e.target, target)) return;
    if (target.scrollTop > 0) return;
    if (e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    pulling = false;
    triggered = false;
    currentPull = 0;
    // A new gesture should cancel any in-flight exit animation; the user is
    // re-engaging and the card must track the finger again.
    clearExitTimer();
    capStyleResetTimer();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (startY === null) return;
    const currentY = e.touches[0].clientY;
    let deltaY = currentY - startY;

    if (deltaY <= 0) {
      if (pulling) {
        pulling = false;
        applyLive(0, 0, 0);
      }
      return;
    }

    const target = options.target();
    if (!target) return;

    if (target.scrollTop > 0) {
      if (pulling) {
        pulling = false;
        applyLive(0, 0, 0);
      }
      return;
    }

    // Resistance: first `threshold` px feel light, then heavy.
    let pullDistance: number;
    if (deltaY <= threshold) {
      pullDistance = deltaY;
    } else {
      const excess = deltaY - threshold;
      pullDistance = threshold + excess * 0.4;
    }
    pullDistance = Math.min(pullDistance, maxPull);
    currentPull = pullDistance;
    pulling = true;
    if (e.cancelable) e.preventDefault();

    // Indicator translateY relative to its parked position; provide a small
    // peek at the very start of the pull so the card emerges from the top.
    const offset = pullDistance >= threshold
      ? pullDistance + PEEK_OFFSET
      : (pullDistance / threshold) * (threshold + PEEK_OFFSET);
    const opacity = Math.min(pullDistance / threshold, 1);
    const rotation = Math.min(pullDistance / threshold, 1) * 90;
    applyLive(offset, opacity, rotation);
  };

  const onTouchEnd = () => {
    if (startY === null) return;
    const wasPulling = pulling;
    startY = null;
    pulling = false;

    if (!wasPulling) return;

    if (currentPull >= threshold && !options.isRefreshing() && !triggered) {
      triggered = true;
      parkInLoadingPosition();
      Promise.resolve(options.onRefresh())
        .catch(() => { /* errors are surfaced by the caller */ })
        .finally(() => {
          triggered = false;
          playExitAnimation();
        });
    } else {
      // Cancel / not enough pull: gravity-release snap-back.
      snapBackToHidden(450);
    }
  };

  onMounted(() => {
    document.addEventListener('touchstart', onTouchStart as EventListener, { capture: true, passive: true });
    document.addEventListener('touchmove', onTouchMove as EventListener, { capture: true, passive: false });
    document.addEventListener('touchend', onTouchEnd as EventListener, { capture: true, passive: true });
    document.addEventListener('touchcancel', onTouchEnd as EventListener, { capture: true, passive: true });
  });

  onUnmounted(() => {
    capStyleResetTimer();
    clearExitTimer();
    document.removeEventListener('touchstart', onTouchStart as EventListener, { capture: true } as EventListenerOptions);
    document.removeEventListener('touchmove', onTouchMove as EventListener, { capture: true } as EventListenerOptions);
    document.removeEventListener('touchend', onTouchEnd as EventListener, { capture: true } as EventListenerOptions);
    document.removeEventListener('touchcancel', onTouchEnd as EventListener, { capture: true } as EventListenerOptions);
  });
}

export { usePullToRefresh };