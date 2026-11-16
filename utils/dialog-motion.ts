function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const DIALOG_CLOSE_DURATION = 220;

function getDialogCloseDuration() {
  return prefersReducedMotion() ? 0 : DIALOG_CLOSE_DURATION;
}

// Native <dialog> closes instantly. Mobile sheets need to finish their slide
// before the top-layer element disappears; this helper keeps the dialog open
// for one exit transition, then lets the native close path proceed.
function closeDialogAnimated(dialog: HTMLDialogElement | null, duration = getDialogCloseDuration()) {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;

  dialog.classList.add('is-closing');

  const finish = () => {
    dialog.classList.remove('is-closing');
    if (dialog.open) dialog.close();
  };

  if (duration === 0) {
    finish();
    return;
  }

  window.setTimeout(finish, duration);
}

// Parent state usually controls `v-if` for a dialog component. Keep that state
// true until the exit transition has visibly finished.
function closeDialogStateAnimated(
  dialog: HTMLDialogElement | null,
  state: { value: boolean },
  duration = getDialogCloseDuration(),
) {
  if (!dialog?.open) {
    state.value = false;
    return;
  }

  closeDialogAnimated(dialog, duration);

  if (duration === 0) {
    state.value = false;
    return;
  }

  window.setTimeout(() => {
    state.value = false;
  }, duration);
}

export {
  DIALOG_CLOSE_DURATION,
  getDialogCloseDuration,
  closeDialogAnimated,
  closeDialogStateAnimated,
};
