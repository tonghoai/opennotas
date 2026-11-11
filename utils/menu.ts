import { nextTick } from 'vue';

const MENU_IDS = ['menu-folder', 'menu-note', 'menu-move-note', 'menu-tag', 'menu-note-tags'] as const;
const VIEWPORT_MARGIN = 8;

let activeMenu: HTMLElement | null = null;
let activeTrigger: HTMLElement | null = null;

function getMenu(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function getMenuItems(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
    .filter((item) => item.offsetParent !== null);
}

function focusMenu(menu: HTMLElement) {
  const items = getMenuItems(menu);
  items[0]?.focus({ preventScroll: true });
}

function restoreTriggerFocus() {
  if (activeTrigger?.isConnected) {
    activeTrigger.focus({ preventScroll: true });
  }
}

function hideMenuElement(menu: HTMLElement | null, restoreFocus = false) {
  if (!menu) return;
  menu.style.display = 'none';
  if (activeMenu === menu) {
    activeMenu = null;
    if (restoreFocus) restoreTriggerFocus();
    activeTrigger = null;
  }
}

function closeAllMenus(restoreFocus = false) {
  for (const id of MENU_IDS) hideMenuElement(getMenu(id), restoreFocus);
}

async function placeMenu(menu: HTMLElement, data: any, options: { align?: 'start' | 'end'; flipX?: boolean } = {}) {
  menu.style.display = 'block';
  menu.style.visibility = 'hidden';
  menu.style.left = '0px';
  menu.style.top = '0px';
  activeMenu = menu;
  activeTrigger = data.trigger || data.triggerElement || null;

  await nextTick();

  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  const rect = data.rect as DOMRect | undefined;
  const anchorRight = rect ? rect.right : Number(data.x) || 0;
  const anchorLeft = rect ? rect.left : Number(data.x) || 0;
  const anchorTop = rect ? rect.top : Number(data.y) || 0;
  const anchorBottom = rect ? rect.bottom : Number(data.y) || 0;

  let left = options.align === 'start' ? anchorLeft : anchorRight + 2;
  let top = anchorBottom + 4;

  if (options.flipX) {
    left = anchorRight + 2;
  }

  if (left + width > window.innerWidth - VIEWPORT_MARGIN) {
    left = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  }
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

  if (top + height > window.innerHeight - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, anchorTop - height - 4);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.visibility = '';
  focusMenu(menu);
}

function offsetMenuFolder(data: any) {
  const menu = getMenu('menu-folder');
  if (menu) void placeMenu(menu, data, { align: 'start' });
}

function offsetMenuNote(data: any) {
  const menu = getMenu('menu-note');
  if (menu) void placeMenu(menu, data, { align: 'end' });
}

const MOVE_MENU_WIDTH = 190;
async function offsetMenuMoveNote(data: any) {
  const menu = getMenu('menu-move-note');
  if (!menu) return;
  menu.style.display = 'block';
  activeMenu = menu;
  activeTrigger = data.trigger || null;
  await nextTick();

  const width = menu.offsetWidth || MOVE_MENU_WIDTH;
  const height = menu.offsetHeight;
  const openLeft = (data.rect?.right || data.right || 0) + width > window.innerWidth;
  let left = openLeft
    ? (data.rect?.left || data.left || 0) - width - 2
    : (data.rect?.right || data.right || 0) + 2;
  left = Math.min(Math.max(VIEWPORT_MARGIN, left), window.innerWidth - width - VIEWPORT_MARGIN);
  let top = data.rect?.top ?? data.top ?? 0;
  if (top + height > window.innerHeight - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  focusMenu(menu);
}

function offsetMenuTag(data: any) {
  const menu = getMenu('menu-tag');
  if (menu) void placeMenu(menu, data, { align: 'start' });
}

const NOTE_TAGS_MENU_WIDTH = 220;
async function offsetMenuNoteTags(data: any) {
  const menu = getMenu('menu-note-tags');
  if (!menu) return;
  menu.style.display = 'block';
  activeMenu = menu;
  activeTrigger = data.trigger || null;
  await nextTick();

  const width = menu.offsetWidth || NOTE_TAGS_MENU_WIDTH;
  const height = menu.offsetHeight;
  const openLeft = (data.rect?.right || data.right || 0) + width > window.innerWidth;
  let left = openLeft
    ? (data.rect?.left || data.left || 0) - width - 2
    : (data.rect?.right || data.right || 0) + 2;
  left = Math.min(Math.max(VIEWPORT_MARGIN, left), window.innerWidth - width - VIEWPORT_MARGIN);
  let top = data.rect?.top ?? data.top ?? 0;
  if (top + height > window.innerHeight - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  focusMenu(menu);
}

function handleMenuKeydown(event: KeyboardEvent) {
  if (!activeMenu) return;
  const items = getMenuItems(activeMenu);
  const index = items.indexOf(document.activeElement as HTMLElement);

  if (event.key === 'Escape') {
    event.preventDefault();
    closeAllMenus(true);
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (!items.length) return;
    event.preventDefault();
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = index < 0
      ? (delta > 0 ? 0 : items.length - 1)
      : (index + delta + items.length) % items.length;
    items[nextIndex]?.focus({ preventScroll: true });
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    if (!items.length) return;
    event.preventDefault();
    items[event.key === 'Home' ? 0 : items.length - 1]?.focus({ preventScroll: true });
  }
}

function outsideClickMenu() {
  document.addEventListener('click', (event) => {
    if (!activeMenu) return;
    // Submenu actions keep the parent menu mounted; all others close it.
    const target = event.target as HTMLElement;
    if (target?.closest?.('[data-menu-keep-open]')) return;
    closeAllMenus(!!activeMenu?.contains(target));
  });
  document.addEventListener('keydown', handleMenuKeydown);
}

function hideMenuFolder() { hideMenuElement(getMenu('menu-folder')); }
function hideMenuNote() { hideMenuElement(getMenu('menu-note')); }
function hideMenuMoveNote() { hideMenuElement(getMenu('menu-move-note')); }
function hideMenuTag() { hideMenuElement(getMenu('menu-tag')); }
function hideMenuNoteTags() { hideMenuElement(getMenu('menu-note-tags')); }

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
  closeAllMenus,
  disableDefaultContextMenu,
};
