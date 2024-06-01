function showInfoSnackbar(message: string, elm?: HTMLElement) {
  const snackbar = document.createElement('div');
  snackbar.classList.add('fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-primary', 'text-primary-content', 'py-2', 'px-4', 'rounded-md', 'shadow-md', 'z-1000', 'text-center', 'w-5/6', 'lg:w-auto');
  snackbar.innerText = message;
  elm ? elm.appendChild(snackbar) : document.body.appendChild(snackbar);

  setTimeout(() => {
    snackbar.remove();
  }, 3000);
}

function showErrorSnackbar(message: string, elm?: HTMLElement) {
  const snackbar = document.createElement('div');
  snackbar.classList.add('fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-error', 'text-base-100', 'py-2', 'px-4', 'rounded-md', 'shadow-md', 'z-1000', 'text-center', 'w-5/6', 'lg:w-auto');
  snackbar.innerText = message;
  elm ? elm.appendChild(snackbar) : document.body.appendChild(snackbar);

  setTimeout(() => {
    snackbar.remove();
  }, 3000);
}

export {
  showInfoSnackbar,
  showErrorSnackbar,
};
