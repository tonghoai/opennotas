function outsideClickMenu() {
  document.addEventListener('click', () => {
    const menuFolder: any = document.getElementById('menu-folder') || {};
    if (menuFolder.style.display === 'block') {
      menuFolder.style.display = 'none';
    }

    const menuNote: any = document.getElementById('menu-note') || {};
    if (menuNote.style.display === 'block') {
      menuNote.style.display = 'none';
    }

    const menuMoveNote: any = document.getElementById('menu-move-note') || {};
    if (menuMoveNote.style.display === 'block') {
      menuMoveNote.style.display = 'none';
    }

    const menuTag: any = document.getElementById('menu-tag') || {};
    if (menuTag.style.display === 'block') {
      menuTag.style.display = 'none';
    }

    const menuNoteTags: any = document.getElementById('menu-note-tags') || {};
    if (menuNoteTags.style.display === 'block') {
      menuNoteTags.style.display = 'none';
    }
  });
}

function offsetMenuFolder(data: any) {
  const menuFolder: any = document.getElementById('menu-folder') || {};
  menuFolder.style.display = 'block';
  menuFolder.style.left = `${data.x}px`;
  menuFolder.style.top = `${data.y}px`;

  // if data.y is near bottom, then push y up 150px
  if (window.innerHeight - data.y < 200) {
    menuFolder.style.top = `${data.y - 150}px`;
  }
}

function offsetMenuNote(data: any) {
  const menuNote: any = document.getElementById('menu-note') || {};
  menuNote.style.display = 'block';
  menuNote.style.left = `${data.x}px`;
  menuNote.style.top = `${data.y}px`;

  // if data.y is near bottom, then push y up 150px
  if (window.innerHeight - data.y < 200) {
    menuNote.style.top = `${data.y - 150}px`;
  }
}

// submenu opened beside menu-note, so it needs its own width/height estimate
// to decide whether to flip left/up when the note menu is near a viewport edge
const MOVE_MENU_WIDTH = 190;
const MOVE_MENU_MAX_HEIGHT = 300;

function offsetMenuMoveNote(data: any) {
  const menuMoveNote: any = document.getElementById('menu-move-note') || {};
  menuMoveNote.style.display = 'block';

  const openLeft = data.right + MOVE_MENU_WIDTH > window.innerWidth;
  menuMoveNote.style.left = openLeft ? `${data.left - MOVE_MENU_WIDTH}px` : `${data.right}px`;

  let top = data.top;
  if (top + MOVE_MENU_MAX_HEIGHT > window.innerHeight) {
    top = Math.max(8, window.innerHeight - MOVE_MENU_MAX_HEIGHT - 8);
  }
  menuMoveNote.style.top = `${top}px`;
}

function offsetMenuTag(data: any) {
  const menuTag: any = document.getElementById('menu-tag') || {};
  menuTag.style.display = 'block';
  menuTag.style.left = `${data.x}px`;
  menuTag.style.top = `${data.y}px`;

  // if data.y is near bottom, then push y up 150px
  if (window.innerHeight - data.y < 200) {
    menuTag.style.top = `${data.y - 150}px`;
  }
}

// submenu opened beside menu-note, so it needs its own width/height estimate
// to decide whether to flip left/up when the note menu is near a viewport edge
const NOTE_TAGS_MENU_WIDTH = 220;
const NOTE_TAGS_MENU_MAX_HEIGHT = 300;

function offsetMenuNoteTags(data: any) {
  const menuNoteTags: any = document.getElementById('menu-note-tags') || {};
  menuNoteTags.style.display = 'block';

  const openLeft = data.right + NOTE_TAGS_MENU_WIDTH > window.innerWidth;
  menuNoteTags.style.left = openLeft ? `${data.left - NOTE_TAGS_MENU_WIDTH}px` : `${data.right}px`;

  let top = data.top;
  if (top + NOTE_TAGS_MENU_MAX_HEIGHT > window.innerHeight) {
    top = Math.max(8, window.innerHeight - NOTE_TAGS_MENU_MAX_HEIGHT - 8);
  }
  menuNoteTags.style.top = `${top}px`;
}

function hideMenuFolder() {
  const menuFolder: any = document.getElementById('menu-folder') || {};
  menuFolder.style.display = 'none';
}

function hideMenuNote() {
  const menuNote: any = document.getElementById('menu-note') || {};
  menuNote.style.display = 'none';
}

function hideMenuMoveNote() {
  const menuMoveNote: any = document.getElementById('menu-move-note') || {};
  menuMoveNote.style.display = 'none';
}

function hideMenuTag() {
  const menuTag: any = document.getElementById('menu-tag') || {};
  menuTag.style.display = 'none';
}

function hideMenuNoteTags() {
  const menuNoteTags: any = document.getElementById('menu-note-tags') || {};
  menuNoteTags.style.display = 'none';
}

function disableDefaultContextMenu() {
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;

    if (target.matches('input, textarea, select')) return;

    if (target.closest('[contenteditable="true"], .tiptap, .cm-content, .cm-editor, .milkdown')) return;

    if (target.closest('a[href]')) return;

    e.preventDefault();
  });
}

export {
  outsideClickMenu,
  offsetMenuFolder,
  offsetMenuNote,
  offsetMenuMoveNote,
  offsetMenuTag,
  offsetMenuNoteTags,
  hideMenuFolder,
  hideMenuNote,
  hideMenuMoveNote,
  hideMenuTag,
  hideMenuNoteTags,
  disableDefaultContextMenu,
};
