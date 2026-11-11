function _toggleModal(modalId: string, isOpen: boolean, state: Ref<boolean>) {
  if (isOpen) {
    if (state) state.value = true;
    requestAnimationFrame(() => {
      const dialog = document.getElementById(modalId) as any;
      if (!dialog?.showModal) return;
      if (!dialog.open) dialog.showModal();
      if (!dialog.querySelector('[autofocus]')) {
        if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
        dialog.focus?.({ preventScroll: true });
      }
    });
    return;
  }

  const dialog = document.getElementById(modalId) as any;
  if (dialog?.open) dialog.close();
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

function toggleModalConfirmSampleData(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-confirm-sample-data", isOpen, state);
}

function toggleModalMenuNote(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-menu-note", isOpen, state);
}

function toggleModalMenuMoveNote(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-menu-move-note", isOpen, state);
}

function toggleModalMenuTag(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-menu-tag", isOpen, state);
}

function toggleModalTagForm(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-tag-form", isOpen, state);
}

function toggleModalTagColorCustom(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-tag-color-custom", isOpen, state);
}

function toggleModalMenuNoteTags(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-menu-note-tags", isOpen, state);
}

function toggleModalSortNote(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-sort-note", isOpen, state);
}

function toggleModalMenuSidebar(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-menu-sidebar", isOpen, state);
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

function toggleModalNoteHistory(isOpen: boolean, state: Ref) {
  _toggleModal("modal-note-history", isOpen, state);
}

function toggleModalNoteHistoryDiff(isOpen: boolean, state: Ref) {
  _toggleModal("modal-note-history-diff", isOpen, state);
}

function toggleModalConfirmRestoreNoteHistory(isOpen: boolean, state: Ref) {
  _toggleModal("modal-confirm-restore-note-history", isOpen, state);
}

function toggleModalConfirmDeleteNoteHistory(isOpen: boolean, state: Ref) {
  _toggleModal("modal-confirm-delete-note-history", isOpen, state);
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

function toggleModalExportSettingsConfirm(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-export-settings-confirm", isOpen, state);
}

function toggleModalImportSettings(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-import-settings", isOpen, state);
}

function toggleModalConfirmImportImageSyncChange(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-confirm-import-image-sync-change", isOpen, state);
}

function toggleModalSettings(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-settings", isOpen, state);
}

function toggleModalSetPassword(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-set-password", isOpen, state);
}

function toggleModalInsertLink(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-insert-link", isOpen, state);
}

function toggleModalInsertImage(isOpen: boolean, state: Ref<boolean>) {
  _toggleModal("modal-insert-image", isOpen, state);
}

export {
  toggleModalMenuFolder,
  toggleModalChangeFolderName,
  toggleModalConfirmDeleteFolder,
  toggleModalConfirmSampleData,
  toggleModalMenuNote,
  toggleModalMenuMoveNote,
  toggleModalMenuTag,
  toggleModalTagForm,
  toggleModalTagColorCustom,
  toggleModalMenuNoteTags,
  toggleModalSortNote,
  toggleModalMenuSidebar,
  toggleModalUnlockNotes,
  toggleModalAlertSetPassword,
  toggleModalNotesDetail,
  toggleModalNoteHistory,
  toggleModalNoteHistoryDiff,
  toggleModalConfirmRestoreNoteHistory,
  toggleModalConfirmDeleteNoteHistory,
  toggleModalConfirmChangeAdapter,
  toggleModalConfirmE2eeKey,
  toggleModalExportNotesConfirm,
  toggleModalImportNotes,
  toggleModalExportSettingsConfirm,
  toggleModalImportSettings,
  toggleModalConfirmImportImageSyncChange,
  toggleModalSettings,
  toggleModalSetPassword,
  toggleModalInsertLink,
  toggleModalInsertImage,
};
