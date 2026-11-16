// Pull-to-refresh composable for the mobile notes list.
//
// The gesture is intentionally coordinated with the note-row swipe and drawer
// swipe through utils/gesture.ts: only one of them can own a touch sequence.
// A pull has three phases: a short arm/dead-zone, progressive rubber-band
// resistance, then a spring-like settle into the loading position.

import { onMounted, onUnmounted } from 'vue';
import { claimGesture, completeGesture, getGestureOwner, releaseGesture, resetGesture } from './gesture';

type PullToRefreshOptions = {
  // Resolver for the scroll container element (e.g. document.getElementById).
  target: () => HTMLElement | null;
  // Resolver for the indicator element that will be translated while pulling.
  indicator: () => HTMLElement | null;
  // Resolver for the inner icon that gets rotated during drag and carries a
  // `.spin` class during loading.
  iconEl?: () => HTMLElement | null;
  // Async callback invoked when the pull distance passes the threshold.
  onRefresh: () => Promise<void>;
  // Returns true when a refresh is currently in flight.
  isRefreshing: () => boolean;
  // Whether the gesture should be active. Resolved on every touchstart.
  enabled?: () => boolean;
  // Minimum pull distance (px) required to trigger onRefresh. Default 70.
  threshold?: number;
  // Maximum pull distance (px). Default 100.
  maxPull?: number;
}

const OWNER = 'pull-to-refresh';
const ARM_DISTANCE = 10;
const DRAG_KNEE = 42;
const DRAG_RESISTANCE = 0.68;
const EASING_BACK_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const EASING_SETTLE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const PARKED_TRANSFORM = 'translateY(-160%) scale(0.96)';
const LOADING_OFFSET = 28;
const PEEK_OFFSET = 8;

function usePullToRefresh(options: PullToRefreshOptions) {
  const threshold = options.threshold ?? 70;
  const maxPull = options.maxPull ?? 100;

  let startX = 0;
  let startY: number | null = null;
  let axis: 'vertical' | 'horizontal' | null = null;
  let pulling = false;
  let triggered = false;
  let currentPull = 0;
  let styleResetTimer: ReturnType<typeof setTimeout> | null = null;
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  const clearStyleResetTimer = () => {
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

  const clearIconRotation = () => {
    const icon = options.iconEl?.();
    if (icon) icon.style.transform = '';
  };

  const applyLive = (offset: number, opacity: number, rotationDeg: number, progress: number) => {
    const element = options.indicator();
    if (!element) return;
    element.style.transition = '';
    element.style.transform = `translateY(${offset}px) scale(${0.9 + progress * 0.1})`;
    element.style.opacity = String(opacity);
    element.style.zIndex = '1';
    element.style.top = '12px';
    element.style.setProperty('--ptr-progress', progress.toFixed(3));
    element.style.boxShadow = `0 ${6 + progress * 10}px ${18 + progress * 14}px rgb(var(--ui-overlay) / ${0.08 + progress * 0.1})`;

    const icon = options.iconEl?.();
    if (icon) icon.style.transform = `rotate(${rotationDeg}deg)`;
  };

  const snapBackToHidden = (durationMs: number) => {
    const element = options.indicator();
    if (!element) return;
    clearStyleResetTimer();
    clearExitTimer();
    element.style.transition = `transform ${durationMs}ms ${EASING_BACK_OUT}, opacity ${durationMs}ms ${EASING_BACK_OUT}`;
    element.style.transform = PARKED_TRANSFORM;
    element.style.opacity = '0';
    styleResetTimer = setTimeout(() => {
      if (element) {
        element.style.transition = '';
        element.style.boxShadow = '';
      }
      clearIconRotation();
      styleResetTimer = null;
    }, durationMs + 20);
  };

  const parkInLoadingPosition = () => {
    const element = options.indicator();
    if (!element) return;
    clearStyleResetTimer();
    // A longer settle for a bigger pull gives the card visual weight instead
    // of snapping into place at a fixed speed.
    const settleDistance = Math.abs(currentPull + PEEK_OFFSET - LOADING_OFFSET);
    const settleDuration = 360 + Math.min(settleDistance * 1.4, 160);
    element.style.transition = `transform ${settleDuration}ms ${EASING_SETTLE}, opacity 240ms ease`;
    element.style.transform = `translateY(${LOADING_OFFSET}px) scale(1)`;
    element.style.opacity = '1';
    element.style.setProperty('--ptr-progress', '1');
    element.style.boxShadow = '0 16px 34px rgb(var(--ui-overlay) / 0.18)';
    styleResetTimer = setTimeout(() => {
      if (element) element.style.transition = '';
      styleResetTimer = null;
    }, settleDuration + 20);
    clearIconRotation();
  };

  const playExitAnimation = () => {
    clearExitTimer();
    exitTimer = setTimeout(() => {
      snapBackToHidden(520);
      exitTimer = null;
    }, 120);
  };

  const isInsideTarget = (touchTarget: EventTarget | null, target: HTMLElement) => {
    let node: Node | null = touchTarget as Node | null;
    while (node) {
      if (node === target) return true;
      node = node.parentNode;
    }
    return false;
  };

  const onTouchStart = (event: TouchEvent) => {
    if (options.enabled && !options.enabled()) return;
    if (options.isRefreshing()) return;

    const target = options.target();
    if (!target || !isInsideTarget(event.target, target)) return;
    if (target.scrollTop > 0 || event.touches.length !== 1) return;

    resetGesture();
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    axis = null;
    pulling = false;
    triggered = false;
    currentPull = 0;
    clearExitTimer();
    clearStyleResetTimer();
  };

  const onTouchMove = (event: TouchEvent) => {
    if (startY === null) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (axis === null) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < ARM_DISTANCE) return;
      // Horizontal movement belongs to the note row or the drawer swipe.
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
        axis = 'horizontal';
        return;
      }
      if (deltaY <= 0 || !claimGesture(OWNER, 'vertical')) return;
      axis = 'vertical';
    }

    if (axis !== 'vertical' || getGestureOwner() !== OWNER) return;

    const target = options.target();
    if (!target || target.scrollTop > 0) {
      releaseGesture(OWNER);
      axis = null;
      if (pulling) applyLive(0, 0, 0, 0);
      pulling = false;
      return;
    }

    if (deltaY <= 0) {
      if (pulling) applyLive(0, 0, 0, 0);
      pulling = false;
      currentPull = 0;
      return;
    }

    // A short 1:1 knee followed by resistance. The card gets heavier the
    // further it travels, without becoming stuck at the threshold.
    const resisted = deltaY <= DRAG_KNEE
      ? deltaY
      : DRAG_KNEE + (deltaY - DRAG_KNEE) * DRAG_RESISTANCE;
    const pullDistance = Math.min(resisted, maxPull);
    currentPull = pullDistance;
    pulling = true;
    if (event.cancelable) event.preventDefault();

    const progress = Math.min(pullDistance / threshold, 1);
    const offset = pullDistance >= threshold
      ? pullDistance + PEEK_OFFSET
      : progress * (threshold + PEEK_OFFSET);
    applyLive(offset, Math.min(progress + 0.1, 1), progress * 90, progress);
  };

  const onTouchEnd = () => {
    if (startY === null && axis === null) return;
    const wasPulling = pulling;
    const releasedPull = currentPull;
    const releasedAxis = axis;
    startY = null;
    axis = null;
    pulling = false;

    if (releasedAxis === 'vertical') {
      releaseGesture(OWNER);
      completeGesture(OWNER);
    }
    if (!wasPulling) return;

    if (releasedPull >= threshold && !options.isRefreshing() && !triggered) {
      triggered = true;
      navigator.vibrate?.(12);
      parkInLoadingPosition();
      Promise.resolve(options.onRefresh())
        .catch(() => { /* errors are surfaced by the caller */ })
        .finally(() => {
          triggered = false;
          playExitAnimation();
        });
    } else {
      snapBackToHidden(480);
    }
  };

  onMounted(() => {
    document.addEventListener('touchstart', onTouchStart as EventListener, { capture: true, passive: true });
    document.addEventListener('touchmove', onTouchMove as EventListener, { capture: true, passive: false });
    document.addEventListener('touchend', onTouchEnd as EventListener, { capture: true, passive: true });
    document.addEventListener('touchcancel', onTouchEnd as EventListener, { capture: true, passive: true });
  });

  onUnmounted(() => {
    clearStyleResetTimer();
    clearExitTimer();
    document.removeEventListener('touchstart', onTouchStart as EventListener, { capture: true } as EventListenerOptions);
    document.removeEventListener('touchmove', onTouchMove as EventListener, { capture: true } as EventListenerOptions);
    document.removeEventListener('touchend', onTouchEnd as EventListener, { capture: true } as EventListenerOptions);
    document.removeEventListener('touchcancel', onTouchEnd as EventListener, { capture: true } as EventListenerOptions);
  });
}

export { usePullToRefresh };
