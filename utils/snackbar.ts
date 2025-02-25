function showInfoSnackbar(message: string, elm?: HTMLElement) {
  const snackbar = document.createElement('div');
  snackbar.classList.add('fixed', 'bottom-8', 'left-1/2', 'transform', '-translate-x-1/2', 'text-sm', 'bg-base-content', 'text-base-200', 'px-2.5', 'py-1.5', 'rounded', 'z-1000', 'text-center', 'w-max');
  snackbar.innerText = message;
  elm ? elm.appendChild(snackbar) : document.body.appendChild(snackbar);

  setTimeout(() => {
    snackbar.remove();
  }, 5000);
}

function showErrorSnackbar(message: string, elm?: HTMLElement) {
  const snackbar = document.createElement('div');
  snackbar.classList.add('fixed', 'bottom-8', 'left-1/2', 'transform', '-translate-x-1/2', 'text-sm', 'bg-error', 'text-base-100', 'px-2.5', 'py-1.5', 'rounded', 'z-1000', 'text-center', 'w-max');
  snackbar.innerText = message;
  elm ? elm.appendChild(snackbar) : document.body.appendChild(snackbar);

  setTimeout(() => {
    snackbar.remove();
  }, 5000);
}

export {
  showInfoSnackbar,
  showErrorSnackbar,
};
