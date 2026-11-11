function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Native <dialog> closes instantly. Mobile sheets need to finish their slide
// before the top-layer element disappears; this helper keeps the dialog open
// for one exit transition, then lets the native close path proceed.
function closeDialogAnimated(dialog: HTMLDialogElement | null, duration = 220) {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;

  dialog.classList.add('is-closing');

  const finish = () => {
    dialog.classList.remove('is-closing');
    if (dialog.open) dialog.close();
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  window.setTimeout(finish, duration);
}

export {
  closeDialogAnimated,
};
