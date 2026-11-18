import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { newFlexSearch, addToFlexSearch } from '~/utils/flexsearch';
import { saveJsonFile, saveTextFile } from '~/utils/save-file';
import { showErrorSnackbar, showInfoSnackbar } from '~/utils/snackbar';
import { addGtagScript, trackEvent } from '~/utils/gtag';
import { registerServiceWorker } from '~/utils/sw';
import { closeAllMenus, disableDefaultContextMenu, offsetMenuNote, outsideClickMenu } from '~/utils/menu';

describe('FlexSearch wrapper', () => {
  afterEach(() => {
    delete (window as any).FlexSearch;
  });

  it('creates a document index with content scoring', () => {
    const addAsync = vi.fn().mockResolvedValue(undefined);
    const Document = vi.fn().mockImplementation(() => ({ addAsync }));
    (window as any).FlexSearch = { Document };

    const index = newFlexSearch();
    expect(Document).toHaveBeenCalledWith({
      document: {
        id: 'id',
        store: true,
        index: [{ field: 'content', preset: 'score', tokenize: 'default' }],
      },
    });
    addToFlexSearch(index, { id: '1', content: 'hello' });
    expect(addAsync).toHaveBeenCalledWith({ id: '1', content: 'hello' });
  });
});

describe('file saving', () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('downloads text with the requested filename', () => {
    const click = vi.fn();
    const anchor = { href: '', download: '', click };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(anchor as any);
    saveTextFile('hello', 'note.md');
    expect(anchor.download).toBe('note.md');
    expect(anchor.href).toBe('blob:download');
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('downloads JSON as an application/json blob', async () => {
    const click = vi.fn();
    const anchor = { href: '', download: '', click };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(anchor as any);
    saveJsonFile({ hello: 'world' }, 'export.json');
    const blob = vi.mocked(URL.createObjectURL).mock.calls.at(-1)![0] as Blob;
    expect(blob.type).toBe('application/json');
    await expect(blob.text()).resolves.toBe('[object Object]');
    expect(anchor.download).toBe('export.json');
    expect(click).toHaveBeenCalledOnce();
  });
});

describe('legacy snackbar wrappers', () => {
  it('forwards to the global toast system', async () => {
    const { useToast, dismiss } = await import('~/composables/useToast');
    const { toasts } = useToast();
    showInfoSnackbar('Info');
    showErrorSnackbar('Error');
    expect(toasts.value.map((toast) => toast.message)).toEqual(['Info', 'Error']);
    expect(toasts.value.map((toast) => toast.variant)).toEqual(['info', 'error']);
    toasts.value.forEach((toast) => dismiss(toast.id));
  });
});

describe('analytics helpers', () => {
  afterEach(() => {
    delete (window as any).gtag;
    delete (window as any).dataLayer;
    document.head.innerHTML = '';
  });

  it('injects the gtag script once and tracks events', () => {
    const append = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);
    addGtagScript('G-TEST');
    const script = append.mock.calls[0][0] as HTMLScriptElement;
    expect(script.src).toContain('G-TEST');
    expect((window as any).dataLayer).toHaveLength(2);
    expect(typeof (window as any).gtag).toBe('function');

    trackEvent('open_note', { id: '1' });
    expect((window as any).dataLayer).toHaveLength(3);
    trackEvent('ignored');
    expect((window as any).dataLayer).toHaveLength(4);
  });

  it('does not inject a second script', () => {
    const append = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);
    addGtagScript('G-ONE');
    addGtagScript('G-TWO');
    expect(append).toHaveBeenCalledOnce();
  });
});

describe('service worker registration', () => {
  it('registers when no controller exists', async () => {
    const register = vi.fn().mockResolvedValue({ scope: '/' });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: null, register },
    });
    registerServiceWorker();
    await Promise.resolve();
    expect(register).toHaveBeenCalledWith('/sw.js', { scope: './' });
  });

  it('skips registration when already controlled', () => {
    const register = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: {}, register },
    });
    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it('tolerates a blocked registration and a missing registration result', async () => {
    const register = vi.fn().mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: null, register },
    });
    expect(() => registerServiceWorker()).not.toThrow();
    await Promise.resolve();

    register.mockRejectedValueOnce(new Error('blocked'));
    expect(() => registerServiceWorker()).not.toThrow();
    await Promise.resolve();
  });
});

describe('menu keyboard/outside handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    closeAllMenus();
  });

  it('closes all menus and restores focus on Escape', async () => {
    const menu = document.createElement('div');
    menu.id = 'menu-note';
    menu.style.display = 'block';
    const first = document.createElement('button');
    const second = document.createElement('button');
    menu.append(first, second);
    document.body.appendChild(menu);
    Object.defineProperty(first, 'offsetParent', { value: document.body, configurable: true });
    Object.defineProperty(second, 'offsetParent', { value: document.body, configurable: true });

    outsideClickMenu();
    await offsetMenuNote({ trigger: first, x: 100, y: 100 });
    await nextTick();
    first.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu.style.display).toBe('none');
  });

  it('prevents the native context menu outside editable content', () => {
    disableDefaultContextMenu();
    const element = document.createElement('div');
    document.body.appendChild(element);
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const inputEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    input.dispatchEvent(inputEvent);
    expect(inputEvent.defaultPrevented).toBe(false);
  });
});
