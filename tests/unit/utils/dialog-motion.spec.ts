import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DIALOG_CLOSE_DURATION,
  closeDialogAnimated,
  closeDialogStateAnimated,
  getDialogCloseDuration,
} from '~/utils/dialog-motion';

function createDialog() {
  const dialog = document.createElement('dialog');
  dialog.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  dialog.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
  document.body.appendChild(dialog);
  dialog.showModal();
  return dialog;
}

describe('dialog motion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses a 220ms close duration unless reduced motion is requested', () => {
    expect(DIALOG_CLOSE_DURATION).toBe(220);
    expect(getDialogCloseDuration()).toBe(220);
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(getDialogCloseDuration()).toBe(0);
  });

  it('marks a dialog closing, waits, then closes it', () => {
    const dialog = createDialog();
    closeDialogAnimated(dialog);

    expect(dialog.classList.contains('is-closing')).toBe(true);
    expect(dialog.open).toBe(true);
    vi.advanceTimersByTime(219);
    expect(dialog.close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(dialog.classList.contains('is-closing')).toBe(false);
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('is idempotent and handles a missing dialog', () => {
    const dialog = createDialog();
    closeDialogAnimated(dialog);
    closeDialogAnimated(dialog);
    vi.advanceTimersByTime(220);
    expect(dialog.close).toHaveBeenCalledOnce();
    expect(() => closeDialogAnimated(null)).not.toThrow();
  });

  it('closes immediately when duration is zero', () => {
    const dialog = createDialog();
    closeDialogAnimated(dialog, 0);
    expect(dialog.classList.contains('is-closing')).toBe(false);
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('delays parent state until the exit animation finishes', () => {
    const dialog = createDialog();
    const state = { value: true };
    closeDialogStateAnimated(dialog, state);

    expect(state.value).toBe(true);
    vi.advanceTimersByTime(219);
    expect(state.value).toBe(true);
    vi.advanceTimersByTime(1);
    expect(state.value).toBe(false);
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('sets state false immediately if the dialog is not open', () => {
    const state = { value: true };
    const dialog = document.createElement('dialog');
    closeDialogStateAnimated(dialog, state);
    expect(state.value).toBe(false);
  });

  it('sets state false immediately when reduced motion is active', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const dialog = createDialog();
    const state = { value: true };
    closeDialogStateAnimated(dialog, state);
    expect(state.value).toBe(false);
    expect(dialog.close).toHaveBeenCalledOnce();
  });
});
