import { showInfo, showError } from '~/composables/useToast';

// Legacy wrappers kept for backward compatibility.
// The `elm` parameter (modal-scoped positioning) is intentionally ignored —
// the global toast positioned bottom-right is visible in all contexts.
function showInfoSnackbar(message: string, _elm?: HTMLElement) {
  showInfo(message);
}

function showErrorSnackbar(message: string, _elm?: HTMLElement) {
  showError(message);
}

export {
  showInfoSnackbar,
  showErrorSnackbar,
};
