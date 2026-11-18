import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

if (!window.crypto?.subtle) {
  Object.defineProperty(window, 'crypto', { value: globalThis.crypto, configurable: true });
}

// happy-dom does not implement the native dialog methods used by the app.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
    document.body.appendChild(this);
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
if (!HTMLDialogElement.prototype.showPopover) {
  HTMLDialogElement.prototype.showPopover = function showPopover() {
    this.setAttribute('popover-open', '');
  };
}
if (!HTMLDialogElement.prototype.hidePopover) {
  HTMLDialogElement.prototype.hidePopover = function hidePopover() {
    this.removeAttribute('popover-open');
  };
}
const nativeDialogMatches = HTMLDialogElement.prototype.matches;
HTMLDialogElement.prototype.matches = function matches(selector: string) {
  if (selector === ':popover-open') return this.hasAttribute('popover-open');
  return nativeDialogMatches.call(this, selector);
};

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:test';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});
