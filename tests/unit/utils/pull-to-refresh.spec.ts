import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { usePullToRefresh } from '~/utils/pull-to-refresh';
import { getGestureOwner, resetGesture } from '~/utils/gesture';

function touchEvent(type: string, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: type === 'touchend' || type === 'touchcancel' ? [] : [{ clientX: x, clientY: y }],
  });
  return event;
}

function createHarness(options: { refresh?: () => Promise<void>; enabled?: () => boolean; isRefreshing?: () => boolean; threshold?: number; maxPull?: number } = {}) {
  const target = ref<HTMLElement | null>(null);
  const indicator = ref<HTMLElement | null>(null);
  const icon = ref<HTMLElement | null>(null);
  const refresh = options.refresh || vi.fn().mockResolvedValue(undefined);

  const Host = defineComponent({
    setup() {
      usePullToRefresh({
        target: () => target.value,
        indicator: () => indicator.value,
        iconEl: () => icon.value,
        onRefresh: refresh,
        isRefreshing: options.isRefreshing || (() => false),
        enabled: options.enabled,
        threshold: options.threshold,
        maxPull: options.maxPull,
      });
      return { target, indicator, icon };
    },
    template: `
      <div>
        <div ref="target" style="height: 200px">
          <div ref="indicator"></div>
          <div ref="icon"></div>
        </div>
      </div>
    `,
  });

  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, target, indicator, icon, refresh };
}

describe('usePullToRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGesture();
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
    resetGesture();
    document.body.innerHTML = '';
  });

  it('ignores pulls when disabled, already refreshing or scrolled', async () => {
    const disabledRefresh = vi.fn().mockResolvedValue(undefined);
    const disabled = createHarness({ refresh: disabledRefresh, enabled: () => false });
    disabled.target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    disabled.target.value!.dispatchEvent(touchEvent('touchmove', 0, 200));
    disabled.target.value!.dispatchEvent(touchEvent('touchend', 0, 200));
    expect(disabledRefresh).not.toHaveBeenCalled();
    disabled.wrapper.unmount();

    const refreshingRefresh = vi.fn().mockResolvedValue(undefined);
    const refreshing = createHarness({ refresh: refreshingRefresh, isRefreshing: () => true });
    refreshing.target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    refreshing.target.value!.dispatchEvent(touchEvent('touchmove', 0, 200));
    refreshing.target.value!.dispatchEvent(touchEvent('touchend', 0, 200));
    expect(refreshingRefresh).not.toHaveBeenCalled();
    refreshing.wrapper.unmount();

    const scrolledRefresh = vi.fn().mockResolvedValue(undefined);
    const scrolled = createHarness({ refresh: scrolledRefresh });
    scrolled.target.value!.scrollTop = 10;
    scrolled.target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    scrolled.target.value!.dispatchEvent(touchEvent('touchmove', 0, 200));
    scrolled.target.value!.dispatchEvent(touchEvent('touchend', 0, 200));
    expect(scrolledRefresh).not.toHaveBeenCalled();
    scrolled.wrapper.unmount();
  });

  it('does not trigger for horizontal gestures or upward movement', async () => {
    const { wrapper, target, refresh } = createHarness();
    target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    target.value!.dispatchEvent(touchEvent('touchmove', 80, 110));
    target.value!.dispatchEvent(touchEvent('touchend', 80, 110));
    expect(refresh).not.toHaveBeenCalled();

    target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    target.value!.dispatchEvent(touchEvent('touchmove', 0, 50));
    target.value!.dispatchEvent(touchEvent('touchend', 0, 50));
    expect(refresh).not.toHaveBeenCalled();
    expect(getGestureOwner()).toBeNull();
    wrapper.unmount();
  });

  it('applies progressive resistance and triggers refresh after the threshold', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { wrapper, target, indicator, icon } = createHarness({ refresh });

    target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    target.value!.dispatchEvent(touchEvent('touchmove', 0, 150));
    await nextTick();
    expect(getGestureOwner()).toBe('pull-to-refresh');
    expect(indicator.value!.style.transform).toContain('translateY');
    expect(Number(indicator.value!.style.getPropertyValue('--ptr-progress'))).toBeCloseTo((42 + 8 * 0.68) / 70, 2);
    expect(icon.value!.style.transform).toContain('rotate');

    target.value!.dispatchEvent(touchEvent('touchmove', 0, 220));
    target.value!.dispatchEvent(touchEvent('touchend', 0, 220));
    expect(refresh).toHaveBeenCalledOnce();
    expect(navigator.vibrate).toHaveBeenCalledWith(12);
    expect(indicator.value!.style.opacity).toBe('1');
    expect(indicator.value!.style.transform).toContain('translateY(28px)');

    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(120);
    vi.advanceTimersByTime(600);
    expect(indicator.value!.style.opacity).toBe('0');
    wrapper.unmount();
  });

  it('snaps back without refreshing below the threshold and caps the pull distance', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { wrapper, target, indicator } = createHarness({ refresh, threshold: 70, maxPull: 100 });

    target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    target.value!.dispatchEvent(touchEvent('touchmove', 0, 140));
    target.value!.dispatchEvent(touchEvent('touchend', 0, 140));
    expect(refresh).not.toHaveBeenCalled();
    expect(indicator.value!.style.opacity).toBe('0');
    vi.advanceTimersByTime(600);

    target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    target.value!.dispatchEvent(touchEvent('touchmove', 0, 1000));
    await nextTick();
    expect(Number(indicator.value!.style.getPropertyValue('--ptr-progress'))).toBe(1);
    expect(indicator.value!.style.transform).toContain('translateY(108px)');
    target.value!.dispatchEvent(touchEvent('touchend', 0, 1000));
    expect(refresh).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it('releases ownership if the list scrolls while pulling', async () => {
    const { wrapper, target, refresh } = createHarness();
    target.value!.dispatchEvent(touchEvent('touchstart', 0, 100));
    target.value!.dispatchEvent(touchEvent('touchmove', 0, 150));
    target.value!.scrollTop = 20;
    target.value!.dispatchEvent(touchEvent('touchmove', 0, 180));
    expect(getGestureOwner()).toBeNull();
    target.value!.dispatchEvent(touchEvent('touchend', 0, 180));
    expect(refresh).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('removes listeners when unmounted', () => {
    const { wrapper, target, refresh } = createHarness();
    const element = target.value!;
    wrapper.unmount();
    element.dispatchEvent(touchEvent('touchstart', 0, 100));
    element.dispatchEvent(touchEvent('touchmove', 0, 200));
    element.dispatchEvent(touchEvent('touchend', 0, 200));
    expect(refresh).not.toHaveBeenCalled();
  });
});
