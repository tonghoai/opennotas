import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  claimGesture,
  completeGesture,
  getGestureAxis,
  getGestureOwner,
  releaseGesture,
  resetGesture,
  wasGestureJustCompleted,
} from '~/utils/gesture';

describe('gesture arbiter', () => {
  beforeEach(() => {
    resetGesture();
    vi.restoreAllMocks();
  });

  it('allows one owner at a time', () => {
    expect(claimGesture('swipe', 'horizontal')).toBe(true);
    expect(claimGesture('drawer', 'horizontal')).toBe(false);
    expect(getGestureOwner()).toBe('swipe');
    expect(getGestureAxis()).toBe('horizontal');

    expect(claimGesture('swipe', 'vertical')).toBe(true);
    expect(getGestureAxis()).toBe('vertical');
  });

  it('releases only the current owner', () => {
    claimGesture('swipe', 'horizontal');
    releaseGesture('drawer');
    expect(getGestureOwner()).toBe('swipe');
    releaseGesture('swipe');
    expect(getGestureOwner()).toBeNull();
    expect(getGestureAxis()).toBeNull();
  });

  it('marks a completed gesture for a short window', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
    completeGesture('pull-to-refresh');
    expect(wasGestureJustCompleted('pull-to-refresh')).toBe(true);
    expect(wasGestureJustCompleted('swipe')).toBe(false);

    now.mockReturnValue(1500);
    expect(wasGestureJustCompleted('pull-to-refresh')).toBe(false);
    now.mockReturnValue(1100);
    expect(wasGestureJustCompleted('pull-to-refresh', 50)).toBe(false);
  });
});
