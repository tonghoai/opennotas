function _toggleModal(modalId: string, isOpen: boolean, state: Ref<boolean>) {
  if (isOpen) {
    if (state) state.value = true;
    setTimeout(() => {
      (document.getElementById(modalId) as any)?.showModal();
    }, 100);
    return;
  }

  (document.getElementById(modalId) as any)?.close();
  if (state) state.value = false;
}

function toggleModalMenuFolder(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-menu-folder", isOpen, state);
}

function toggleModalChangeFolderName(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-change-folder-name", isOpen, state);
}

function toggleModalConfirmDeleteFolder(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-confirm-delete-folder", isOpen, state);
}

function toggleModalMenuNote(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-menu-note", isOpen, state);
}

function toggleModalUnlockNotes(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-unlock-notes", isOpen, state);
}

function toggleModalAlertSetPassword(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-alert-set-password", isOpen, state);
}

function toggleModalNotesDetail(isOpen: boolean, state: Ref) {
  _toggleModal("modal-notes-detail", isOpen, state);
}

function toggleModalConfirmChangeAdapter(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-confirm-change-adapter", isOpen, state);
}

function toggleModalConfirmE2eeKey(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-confirm-e2ee-key", isOpen, state);
}

function toggleModalExportNotesConfirm(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-export-notes-confirm", isOpen, state);
}

function toggleModalImportNotes(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-import-notes", isOpen, state);
}

function toggleModalSettings(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-settings", isOpen, state);
}

function toggleModalSetPassword(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-set-password", isOpen, state);
}

export {
  toggleModalMenuFolder,
  toggleModalChangeFolderName,
  toggleModalConfirmDeleteFolder,
  toggleModalMenuNote,
  toggleModalUnlockNotes,
  toggleModalAlertSetPassword,
  toggleModalNotesDetail,
  toggleModalConfirmChangeAdapter,
  toggleModalConfirmE2eeKey,
  toggleModalExportNotesConfirm,
  toggleModalImportNotes,
  toggleModalSettings,
  toggleModalSetPassword,
};
