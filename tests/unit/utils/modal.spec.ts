import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import {
  toggleModalMenuFolder,
  toggleModalMenuNote,
  toggleModalSettings,
  toggleModalSetPassword,
} from '~/utils/modal';

function createDialog(id: string) {
  const dialog = document.createElement('dialog');
  dialog.id = id;
  dialog.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  dialog.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
  document.body.appendChild(dialog);
  return dialog;
}

describe('modal toggle helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens a dialog and focuses it when no autofocus field exists', () => {
    const dialog = createDialog('modal-settings');
    const state = ref(false);
    toggleModalSettings(true, state);

    expect(state.value).toBe(true);
    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.classList.contains('is-closing')).toBe(false);
    expect(dialog.getAttribute('tabindex')).toBe('-1');
  });

  it('keeps state until the exit animation finishes', () => {
    const dialog = createDialog('modal-menu-note');
    const state = ref(false);
    toggleModalMenuNote(true, state);
    toggleModalMenuNote(false, state);

    expect(state.value).toBe(true);
    expect(dialog.classList.contains('is-closing')).toBe(true);
    vi.advanceTimersByTime(219);
    expect(state.value).toBe(true);
    vi.advanceTimersByTime(1);
    expect(state.value).toBe(false);
    expect(dialog.classList.contains('is-closing')).toBe(false);
  });

  it('cancel a pending close when reopened quickly', () => {
    const dialog = createDialog('modal-menu-folder');
    const state = ref(false);
    toggleModalMenuFolder(true, state);
    toggleModalMenuFolder(false, state);
    toggleModalMenuFolder(true, state);

    expect(dialog.classList.contains('is-closing')).toBe(false);
    vi.advanceTimersByTime(300);
    expect(state.value).toBe(true);
  });

  it('closes immediately when the dialog is not in the DOM', () => {
    const state = ref(true);
    toggleModalSetPassword(false, state);
    expect(state.value).toBe(false);
  });

  it('does not throw when opening a missing dialog but still updates state', () => {
    const state = ref(false);
    toggleModalSetPassword(true, state);
    expect(state.value).toBe(true);
  });
});
