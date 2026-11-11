<script setup lang="ts">
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/core";
import { undoCommand, redoCommand } from "@milkdown/plugin-history";
import { splitListItemCommand } from "@milkdown/preset-commonmark";
import { replaceAll, getMarkdown, $prose } from '@milkdown/utils'
import { insert } from '@milkdown/kit/utils'
import { TextSelection, Plugin } from '@milkdown/prose/state'
import type { Node } from '@milkdown/prose/model'
import * as Diff from 'diff'
import { createSearchPlugin, setSearchState, stepMatch, clearSearchState } from '~/utils/editor-search'
import type { SearchCounts } from '~/utils/editor-search'

import "@milkdown/crepe/theme/common/style.css";
import "../../../assets/css/crepe.css";
import {
  saveImage,
  resolveImageUrl,
  isOpenNotasImageUrl,
  parseImageUrl,
  getImageMeta,
} from '~/services/image';
import { syncImages, isImageSyncing } from '~/utils/image-sync';
import { ensureCursorBottomMargin } from '~/utils/editor-scroll';
import cloudUploadSvgRaw from '~/assets/svg/cloud-upload.svg?raw';
import alertSquareSvgRaw from '~/assets/svg/alert-square-rounded.svg?raw';
import photoUpSvgRaw from '~/assets/svg/photo-up.svg?raw';
import subtitlesSvgRaw from '~/assets/svg/subtitles.svg?raw';

const { $i18n } = useNuxtApp();

const props = defineProps([
  'value',
  'isDeleted',
  'settings',
  'isShowFormatToolbar',
  'noteId',
]);

const emit = defineEmits([
  'changeContent',
  'alertMessage',
  'insertImage',
]);

const isLoading = ref(true);

// Tabler icon strings injected into Crepe's link-tooltip config.
const tablerIcon = (paths: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${paths}
  </svg>
`;

const LINK_TOOLTIP_ICONS = {
  link: tablerIcon(`
    <path d="M9 15l6 -6" />
    <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
    <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
  `),
  edit: tablerIcon(`
    <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
    <path d="M13.5 6.5l4 4" />
  `),
  remove: tablerIcon(`
    <path d="M4 7l16 0" />
    <path d="M10 11l0 6" />
    <path d="M14 11l0 6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  `),
  confirm: tablerIcon(`<path d="M5 12l5 5l10 -10" />`),
};

let editor: Crepe;

const blobUrlToImageId = new Map<string, string>();
const imageBadgeMap = new Map<string, HTMLElement>();
let domObserver: MutationObserver | null = null;
let linkEditObserver: MutationObserver | null = null;
let linkEditScrollSnapshot: { editor: HTMLElement | null; top: number; x: number; y: number } | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let isRefreshingBadges = false;
let imagePasteHandler: ((e: Event) => void) | null = null;
let imageResizeHandler: ((e: PointerEvent) => void) | null = null;
let imageEditMouseDownHandler: ((e: MouseEvent) => void) | null = null;
let imageEditClickSwallowHandler: ((e: MouseEvent) => void) | null = null;
let isReplacingAll = false;

// Crepe updates the toolbar on every transaction; wait until the pointer is released.
const SELECTION_TOOLBAR_DELAY = 220;
let selectionToolbarTimer: ReturnType<typeof setTimeout> | null = null;

const clearSelectionToolbarTimer = () => {
  if (selectionToolbarTimer) {
    clearTimeout(selectionToolbarTimer);
    selectionToolbarTimer = null;
  }
};

const hideSelectionToolbarDuringPointer = (event: PointerEvent) => {
  const target = event.target as Element | null;
  if (!target?.closest('.ProseMirror')) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;

  clearSelectionToolbarTimer();
  document.body.classList.add('crepe-selecting');
};

const revealSelectionToolbarAfterPointer = () => {
  if (!document.body.classList.contains('crepe-selecting')) return;

  clearSelectionToolbarTimer();
  selectionToolbarTimer = setTimeout(() => {
    document.body.classList.remove('crepe-selecting');
    selectionToolbarTimer = null;
  }, SELECTION_TOOLBAR_DELAY);
};

const cancelSelectionToolbarDelay = () => {
  clearSelectionToolbarTimer();
  document.body.classList.remove('crepe-selecting');
};

const toolbarPos = ref<{ x: number; y: number } | null>(null);
const toolbarWrapRef = ref<HTMLElement | null>(null);

const handleImageUpload = async (file: File): Promise<string> => {
  if (!props.noteId) {
    emit('alertMessage', $i18n.t('app.message_image_sync_failed'));
    return URL.createObjectURL(file);
  }

  try {
    const imageUrl = await saveImage(props.noteId, file);
    if (!props.settings?.imageSync?.enabled) {
      emit('alertMessage', $i18n.t('app.message_image_sync_disabled'));
    }

    return imageUrl;
  } catch (error) {
    console.error('Failed to save image:', error);
    emit('alertMessage', $i18n.t('app.message_image_sync_failed'));
    return URL.createObjectURL(file);
  }
};

const ALLOWED_IMAGE_SRC_SCHEMES = ['http:', 'https:', 'data:', 'blob:'];
const isAllowedImageSrc = (src: string): boolean => {
  try {
    return ALLOWED_IMAGE_SRC_SCHEMES.includes(new URL(src, window.location.href).protocol);
  } catch {
    return false;
  }
};

const handleProxyDomURL = async (src: string): Promise<string> => {
  if (isOpenNotasImageUrl(src)) {
    try {
      const imageId = parseImageUrl(src);
      const resolved = await resolveImageUrl(src, props.settings);
      if (imageId && resolved.startsWith('blob:')) {
        blobUrlToImageId.set(resolved, imageId);
      }
      return resolved;
    } catch (error) {
      console.error('Failed to resolve image URL:', error);
      return src;
    }
  }
  return isAllowedImageSrc(src) ? src : '';
};

const createBadgeSvg = (type: 'upload' | 'warning' | 'spinner'): string => {
  if (type === 'upload') return cloudUploadSvgRaw;
  if (type === 'warning') return alertSquareSvgRaw;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
};

const handleManualSync = async () => {
  imageBadgeMap.forEach((badge) => {
    if (!badge.classList.contains('image-sync-badge--syncing')) {
      badge.className = 'image-sync-badge image-sync-badge--syncing';
      badge.innerHTML = createBadgeSvg('spinner');
      badge.title = $i18n.t('app.image_sync_badge_syncing');
    }
  });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 15_000)
  );

  try {
    const result = await Promise.race([syncImages(props.settings), timeout]);
    await refreshSyncBadges();
    if (result.synced > 0) {
      showSuccess($i18n.t('app.message_image_sync_success') as string);
    } else if (result.failed > 0) {
      showError($i18n.t('app.message_image_sync_failed') as string);
    }
  } catch {
    await refreshSyncBadges();
    showError($i18n.t('app.message_image_sync_retry') as string);
  }
};

const refreshSyncBadges = async () => {
  if (isRefreshingBadges) return;
  isRefreshingBadges = true;

  domObserver?.disconnect();

  try {
    if (!props.settings?.imageSync?.enabled) {
      imageBadgeMap.forEach((badge) => badge.remove());
      imageBadgeMap.clear();
      stopRefreshInterval();
      return;
    }

    const editorEl = document.querySelector('#crepe-editor');
    if (!editorEl) return;

    const imgs = editorEl.querySelectorAll<HTMLImageElement>('img');
    const activeImageIds = new Set<string>();
    let hasPendingOrFailed = false;

    for (const img of imgs) {
      const imageId = blobUrlToImageId.get(img.src);
      if (!imageId) continue;
      activeImageIds.add(imageId);

      const meta = await getImageMeta(imageId);
      if (!meta || meta.syncStatus === 'synced') {
        const existing = imageBadgeMap.get(imageId);
        if (existing) {
          existing.remove();
          imageBadgeMap.delete(imageId);
        }
        continue;
      }

      hasPendingOrFailed = true;
      const status = meta.syncStatus;
      let badge = imageBadgeMap.get(imageId);

      if (!badge) {
        badge = document.createElement('button');
        badge.className = `image-sync-badge image-sync-badge--${status}`;
        badge.innerHTML = createBadgeSvg(status === 'failed' ? 'warning' : 'upload');
        badge.title = $i18n.t(status === 'failed' ? 'app.image_sync_badge_failed' : 'app.image_sync_badge_pending');
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          handleManualSync();
        });

        const container = img.closest<HTMLElement>('.milkdown-image-block') ?? img.parentElement;
        if (container) {
          container.appendChild(badge);
          imageBadgeMap.set(imageId, badge);
        }
      } else if (!badge.classList.contains('image-sync-badge--syncing')) {
        badge.className = `image-sync-badge image-sync-badge--${status}`;
        badge.innerHTML = createBadgeSvg(status === 'failed' ? 'warning' : 'upload');
        badge.title = $i18n.t(status === 'failed' ? 'app.image_sync_badge_failed' : 'app.image_sync_badge_pending');
      }
    }

    for (const [imageId, badge] of imageBadgeMap) {
      if (!activeImageIds.has(imageId)) {
        badge.remove();
        imageBadgeMap.delete(imageId);
      }
    }

    if (hasPendingOrFailed) {
      startRefreshInterval();
    } else {
      stopRefreshInterval();
    }
  } finally {
    isRefreshingBadges = false;
    const el = document.querySelector('#crepe-editor');
    if (el && domObserver) {
      domObserver.observe(el, { childList: true, subtree: true });
    }
  }
};

const startRefreshInterval = () => {
  if (refreshInterval) return;
  refreshInterval = setInterval(refreshSyncBadges, 10_000);
};

// Background syncs also update badges, not just handleManualSync's badge click.
watch(isImageSyncing, (syncing) => {
  if (syncing) {
    imageBadgeMap.forEach((badge) => {
      if (!badge.classList.contains('image-sync-badge--syncing')) {
        badge.className = 'image-sync-badge image-sync-badge--syncing';
        badge.innerHTML = createBadgeSvg('spinner');
        badge.title = $i18n.t('app.image_sync_badge_syncing');
      }
    });
  } else {
    refreshSyncBadges();
  }
});

const stopRefreshInterval = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const setupDomObserver = () => {
  const editorEl = document.querySelector('#crepe-editor');
  if (!editorEl) return;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  domObserver = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshSyncBadges, 300);
  });
  domObserver.observe(editorEl, { childList: true, subtree: true });
};

const captureLinkEditScroll = (event: PointerEvent) => {
  const target = event.target as Element | null;
  if (!target?.closest('.link-edit-button')) return;

  const editor = document.querySelector<HTMLElement>('#form-editors');
  linkEditScrollSnapshot = {
    editor,
    top: editor?.scrollTop ?? 0,
    x: window.scrollX,
    y: window.scrollY,
  };
};

const restoreLinkEditScroll = () => {
  const snapshot = linkEditScrollSnapshot;
  if (!snapshot) return;
  linkEditScrollSnapshot = null;

  const restore = () => {
    if (snapshot.editor?.isConnected) snapshot.editor.scrollTop = snapshot.top;
    window.scrollTo(snapshot.x, snapshot.y);
  };

  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
};

// Focus after data-show is applied: Crepe's own rAF focus can land too early.
const setupLinkEditFocusObserver = () => {
  const editorEl = document.querySelector('#crepe-editor');
  if (!editorEl) return;

  linkEditObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as HTMLElement;
      if (!target.classList?.contains('milkdown-link-edit')) continue;
      if (target.getAttribute('data-show') !== 'true') continue;

      const input = target.querySelector<HTMLInputElement>('.link-edit input.input-area');
      if (input && document.activeElement !== input) {
        input.focus({ preventScroll: true });
      }
      restoreLinkEditScroll();
    }
  });
  linkEditObserver.observe(editorEl, {
    attributes: true,
    attributeFilter: ['data-show'],
    subtree: true,
  });
};

onMounted(() => {
  const editorEl = document.querySelector('#crepe-editor');
  editorEl?.addEventListener('pointerdown', hideSelectionToolbarDuringPointer as EventListener, true);
  editorEl?.addEventListener('pointerdown', captureLinkEditScroll as EventListener, true);
  window.addEventListener('pointerup', revealSelectionToolbarAfterPointer, true);
  window.addEventListener('pointercancel', revealSelectionToolbarAfterPointer, true);
  window.addEventListener('blur', cancelSelectionToolbarDelay);

  editor = new Crepe({
    root: document.querySelector("#crepe-editor")!,
    features: {
      [Crepe.Feature.Toolbar]: true,
      [Crepe.Feature.Latex]: false,
    },
    featureConfigs: {
      [Crepe.Feature.LinkTooltip]: {
        linkIcon: LINK_TOOLTIP_ICONS.link,
        editButton: LINK_TOOLTIP_ICONS.edit,
        removeButton: LINK_TOOLTIP_ICONS.remove,
        confirmButton: LINK_TOOLTIP_ICONS.confirm,
      },
      [Crepe.Feature.Cursor]: {
        // Virtual cursor duplicates lines with mobile IME input.
        virtual: false,
      },
      [Crepe.Feature.BlockEdit]: {
        textGroup: {
          label: 'Text Blocks',
          text: {
            label: 'Normal Text',
          },
          h1: {
            label: 'Heading 1',
          },
          h2: {
            label: 'Heading 2',
          },
          h3: {
            label: 'Heading 3',
          },
          h4: null,
          h5: null,
          h6: null,
          quote: null,
          divider: null,
        },
      },
      [Crepe.Feature.ImageBlock]: {
        onUpload: handleImageUpload,
        proxyDomURL: handleProxyDomURL,
        blockImageIcon: photoUpSvgRaw,
        blockCaptionIcon: subtitlesSvgRaw,
      },
    },
    defaultValue: props.value,
  });

  setTimeout(async () => {
    if (props.isDeleted) {
      editor.setReadonly(true);
    }

    editor.editor.use(
      $prose(() => new Plugin({
        appendTransaction(transactions, oldState, newState) {
          if (isReplacingAll) return null;
          if (!transactions.some(t => t.docChanged)) return null;

          const oldSrcs = new Set<string>();
          oldState.doc.descendants((node) => {
            if (node.type.name === 'image-block') oldSrcs.add(node.attrs.src);
          });

          let tr = newState.tr;
          let changed = false;
          newState.doc.descendants((node, pos) => {
            if (
              node.type.name === 'image-block' &&
              node.attrs.ratio === 1 &&
              !oldSrcs.has(node.attrs.src)
            ) {
              tr = tr.setNodeMarkup(pos, null, { ...node.attrs, ratio: 0.7 });
              changed = true;
            }
          });
          return changed ? tr : null;
        },
      }))
    );

    // splitListItem + plugin-trailing can leave two empty paragraphs at the end.
    editor.editor.use(
      $prose(() => new Plugin({
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some(t => t.docChanged)) return null;

          const { doc } = newState;
          if (doc.childCount < 2) return null;

          const isEmptyParagraph = (node: Node) =>
            node.type.name === 'paragraph' && node.content.size === 0;

          const last = doc.child(doc.childCount - 1);
          const secondLast = doc.child(doc.childCount - 2);
          if (!isEmptyParagraph(last) || !isEmptyParagraph(secondLast)) return null;

          const from = doc.content.size - last.nodeSize;
          const to = doc.content.size;
          return newState.tr.delete(from, to);
        },
      }))
    );

    // Let ensureCursorBottomMargin own scrolling; ProseMirror's default fights it.
    editor.editor.use(
      $prose(() => new Plugin({
        props: {
          handleScrollToSelection: () => true,
        },
      }))
    );

    // Mobile IME Enter bypasses the list keymap; handle beforeinput before the
    // native contenteditable split reaches the NodeView's DOM diffing.
    editor.editor.use(
      $prose(() => new Plugin({
        props: {
          handleDOMEvents: {
            beforeinput: (view, event) => {
              if (event.inputType !== 'insertParagraph') return false;

              const { $from } = view.state.selection;
              let inListItem = false;
              for (let d = $from.depth; d > 0; d--) {
                if ($from.node(d).type.name === 'list_item') {
                  inListItem = true;
                  break;
                }
              }
              if (!inListItem) return false;

              event.preventDefault();
              splitListItemCommand.run();
              return true;
            },
          },
        },
      }))
    );

    editor.editor.use($prose(() => createSearchPlugin()));

    await editor.create();

    // Intercept image paste before ProseMirror (capture phase runs first)
    imagePasteHandler = (e: Event) => {
      const event = e as ClipboardEvent;
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItem = items.find(
        (item) => item.kind === 'file' && item.type.startsWith('image/')
      );
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      e.stopPropagation();
      e.preventDefault();

      let insertPos = -1;
      editor.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        try {
          insertPos = view.state.selection.$from.after(1);
        } catch (_) {
          insertPos = view.state.doc.content.size;
        }
      });

      handleImageUpload(file).then((url) => {
        editor.editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          const schema = view.state.schema;
          const imageBlockType = Object.entries(schema.nodes).find(
            ([name, t]) => name.toLowerCase().includes('image') && !t.spec.inline && (t.spec as any).atom
          )?.[1];
          if (!imageBlockType) return;

          const imageNode = imageBlockType.create({ src: url });
          const pos = insertPos >= 0 ? insertPos : view.state.doc.content.size;
          view.dispatch(view.state.tr.insert(pos, imageNode));
        });
      });
    };

    document.querySelector('#crepe-editor')
      ?.addEventListener('paste', imagePasteHandler, true);

    // Intercept placeholder mousedown before ProseMirror shows NodeSelection.
    imageEditMouseDownHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement) return;
      if (target.closest('.confirm')) return;

      const editEl = target.closest<HTMLElement>(
        '.milkdown-image-block .image-edit, .milkdown-image-inline .empty-image-inline'
      );
      if (!editEl) return;

      const uploader = target.closest<HTMLLabelElement>('.uploader');
      if (uploader) {
        e.preventDefault();
        e.stopPropagation();
        const inputId = uploader.getAttribute('for');
        const input = inputId ? document.getElementById(inputId) as HTMLInputElement | null : null;
        input?.click();
        return;
      }

      const linkInput = editEl.querySelector<HTMLInputElement>('.link-input-area');
      if (linkInput) {
        e.preventDefault();
        e.stopPropagation();
        linkInput.focus();
      }
    };
    document.querySelector('#crepe-editor')
      ?.addEventListener('mousedown', imageEditMouseDownHandler, true);
    // ProseMirror's click handler would steal focus; swallow it without re-running
    // the upload branch (which would open the picker twice).
    imageEditClickSwallowHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement) return;
      if (target.closest('.confirm')) return;
      const editEl = target.closest<HTMLElement>(
        '.milkdown-image-block .image-edit, .milkdown-image-inline .empty-image-inline'
      );
      if (!editEl) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.querySelector('#crepe-editor')
      ?.addEventListener('click', imageEditClickSwallowHandler, true);

    const RESIZE_DAMPING = 0.4;
    imageResizeHandler = (e: PointerEvent) => {
      const handle = (e.target as Element).closest<HTMLElement>('.image-resize-handle');
      if (!handle) return;

      const imgEl = handle.closest('.milkdown-image-block')?.querySelector<HTMLImageElement>('img');
      if (!imgEl) return;

      e.preventDefault();
      e.stopPropagation();

      const startY = e.clientY;
      const startHeight = imgEl.getBoundingClientRect().height;
      let lastHeight = startHeight;

      const onMove = (me: PointerEvent) => {
        me.stopPropagation();
        me.preventDefault();
        const newHeight = Math.max(100, startHeight + (me.clientY - startY) * RESIZE_DAMPING);
        lastHeight = newHeight;
        imgEl.dataset.height = newHeight.toFixed(2);
        imgEl.style.height = `${newHeight}px`;
      };

      const onUp = (ue: PointerEvent) => {
        ue.stopPropagation();
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);

        const originHeight = parseFloat(imgEl.dataset.origin ?? '0');
        if (!originHeight) return;

        const ratio = parseFloat((lastHeight / originHeight).toFixed(2));
        if (isNaN(ratio)) return;

        editor.editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          let targetPos = -1;
          view.state.doc.descendants((node, pos) => {
            if (targetPos !== -1) return false;
            if (node.isAtom && node.attrs?.src !== undefined) {
              const domNode = view.nodeDOM(pos);
              if (domNode instanceof Element && domNode.contains(imgEl)) {
                targetPos = pos;
              }
            }
            return targetPos === -1;
          });
          if (targetPos === -1) return;
          const node = view.state.doc.nodeAt(targetPos);
          if (!node) return;
          view.dispatch(view.state.tr.setNodeMarkup(targetPos, null, { ...node.attrs, ratio }));
        });
      };

      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
    };

    document.querySelector('#crepe-editor')
      ?.addEventListener('pointerdown', imageResizeHandler as EventListener, true);

    setupDomObserver();
    setupLinkEditFocusObserver();
    setTimeout(() => {
      focus();
    }, 100);
    isLoading.value = false;

    editor.on((listener) => {
      listener.updated((ctx) => {
        if (silent.value) return;

        emit('changeContent', editor.getMarkdown());

        const view = ctx.get(editorViewCtx);
        if (view) ensureCursorBottomMargin(() => view.coordsAtPos(view.state.selection.head));
      });

      listener.selectionUpdated((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (view) ensureCursorBottomMargin(() => view.coordsAtPos(view.state.selection.head));
      });
    });
  }, 250);
});

const focus = () => {
  try {
    if (editor) {
      editor?.editor?.action((ctx) => {
        const view = ctx?.get(editorViewCtx);
        if (view && !view.hasFocus()) {
          view.focus();
        }
      });
    }
  } catch (_) { }
}
const readonly = () => {
  editor.setReadonly(true);
}
const undo = () => {
  undoCommand.run();
}
const redo = () => {
  redoCommand.run();
}
const focusState = () => {
  editor.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    view.focus();
  });
}

const search = (query: string): SearchCounts =>
  editor.editor.action((ctx) => setSearchState(ctx.get(editorViewCtx), query));
const findNext = (): SearchCounts =>
  editor.editor.action((ctx) => stepMatch(ctx.get(editorViewCtx), 1));
const findPrev = (): SearchCounts =>
  editor.editor.action((ctx) => stepMatch(ctx.get(editorViewCtx), -1));
const clearSearch = (): void =>
  editor.editor.action((ctx) => clearSearchState(ctx.get(editorViewCtx)));

onUnmounted(() => {
  domObserver?.disconnect();
  linkEditObserver?.disconnect();
  stopRefreshInterval();
  imageBadgeMap.clear();
  blobUrlToImageId.clear();
  if (imagePasteHandler) {
    document.querySelector('#crepe-editor')
      ?.removeEventListener('paste', imagePasteHandler, true);
    imagePasteHandler = null;
  }
  if (imageResizeHandler) {
    document.querySelector('#crepe-editor')
      ?.removeEventListener('pointerdown', imageResizeHandler as EventListener, true);
    imageResizeHandler = null;
  }
  if (imageEditMouseDownHandler || imageEditClickSwallowHandler) {
    const editorEl = document.querySelector('#crepe-editor');
    if (imageEditMouseDownHandler) editorEl?.removeEventListener('mousedown', imageEditMouseDownHandler, true);
    if (imageEditClickSwallowHandler) editorEl?.removeEventListener('click', imageEditClickSwallowHandler, true);
    imageEditMouseDownHandler = null;
    imageEditClickSwallowHandler = null;
  }
  const editorEl = document.querySelector('#crepe-editor');
  editorEl?.removeEventListener('pointerdown', hideSelectionToolbarDuringPointer as EventListener, true);
  window.removeEventListener('pointerup', revealSelectionToolbarAfterPointer, true);
  window.removeEventListener('pointercancel', revealSelectionToolbarAfterPointer, true);
  window.removeEventListener('blur', cancelSelectionToolbarDelay);
  cancelSelectionToolbarDelay();
  editor.destroy();
});

const silent = ref<boolean>(false);

// Replace content without emitting a change event or moving the cursor.
const slientUpdateValue = async (value: string) => {
  if (!editor) return
  silent.value = true
  isReplacingAll = true

  try {
    await editor.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)

      const sel = view.state.selection
      const prevPos = sel.empty ? sel.from : sel.to
      const oldPlainBefore = view.state.doc.textBetween(0, prevPos, '', '')
      const oldPlain = view.state.doc.textBetween(0, view.state.doc.content.size, '', '')
      const oldOffset = oldPlainBefore.length

      replaceAll(value, true)(ctx)

      const newPlain = view.state.doc.textBetween(0, view.state.doc.content.size, '', '')
      const parts = Diff.diffChars(oldPlain, newPlain)
      let oldPos = 0
      let newPos = 0
      let newOffset = 0
      let found = false
      for (const p of parts) {
        const len = p.value.length
        if (p.added) {
          newPos += len
          continue
        }
        if (p.removed) {
          if (!found && oldOffset <= oldPos + len) {
            newOffset = newPos
            found = true
            break
          }
          oldPos += len
          continue
        }
        if (!found && oldOffset <= oldPos + len) {
          newOffset = newPos + (oldOffset - oldPos)
          found = true
          break
        }
        oldPos += len
        newPos += len
      }
      if (!found) newOffset = newPos

      const doc = view.state.doc
      const totalPlain = newPlain.length
      const target = Math.max(0, Math.min(newOffset, totalPlain))

      let acc = 0
      let pmPos: number | null = null
      doc.descendants((node, pos) => {
        if (pmPos != null) return false
        if (node.isText && node.text) {
          const len = node.text.length
          if (acc + len >= target) {
            const within = target - acc
            pmPos = pos + within
            return false
          }
          acc += len
        }
        return true
      })

      const finalPos = pmPos == null ? doc.content.size : Math.max(0, Math.min(pmPos, doc.content.size))
      const tr = view.state.tr.setSelection(
        finalPos >= doc.content.size ? TextSelection.atEnd(doc) : TextSelection.create(doc, finalPos)
      )
      view.dispatch(tr)
      view.focus()
    })
  } catch (_) { }

  isReplacingAll = false
  silent.value = false
}

watch(() => props.noteId, () => {
  toolbarPos.value = null;
});

const startToolbarDrag = (e: PointerEvent) => {
  const el = toolbarWrapRef.value;
  if (!el) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const initRect = el.getBoundingClientRect();
  const offsetX = startX - initRect.left;
  const offsetY = startY - initRect.top;
  const DRAG_THRESHOLD = 5;
  let dragging = false;

  const onMove = (me: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(me.clientX - startX, me.clientY - startY) < DRAG_THRESHOLD) return;
      dragging = true;
      if (!toolbarPos.value) {
        toolbarPos.value = { x: initRect.left, y: initRect.top };
      }
    }

    me.preventDefault();
    const container = document.querySelector('#form-editors');
    const cr = container?.getBoundingClientRect() ?? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    toolbarPos.value = {
      x: Math.max(cr.left, Math.min(me.clientX - offsetX, cr.right - el.offsetWidth)),
      y: Math.max(cr.top, Math.min(me.clientY - offsetY, cr.bottom - el.offsetHeight)),
    };
  };

  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
};

const toolbarStyle = computed(() => {
  if (!toolbarPos.value) return {};
  return {
    position: 'fixed' as const,
    left: `${toolbarPos.value.x}px`,
    top: `${toolbarPos.value.y}px`,
    bottom: 'auto',
    zIndex: 50,
    margin: 0,
  };
});

const handleInsertImage = (data: { url: string; alt?: string }) => {
  if (!data?.url) return;
  const alt = (data.alt || '').replace(/[[\]]/g, '');
  editor?.action(insert(`![${alt}](${data.url})`));
  focus('end');
};

defineExpose({
  focus,
  readonly,
  undo,
  redo,
  slientUpdateValue,
  focusState,
  search,
  findNext,
  findPrev,
  clearSearch,
  handleInsertImage,
});
</script>

<template>
  <div v-show="isLoading"
    class="mx-auto flex w-full min-h-[calc(100vh_/_2)] flex-col items-center justify-center px-4 py-4 outline-none lg:px-8"
    :class="{ 'max-w-[720px]': props.settings?.general.editorView === 'compact' }">
    <UiSpinner size="lg" :label="$t('app.loading')" />
  </div>

  <div v-show="!isLoading" id="crepe-editor"
    class="mx-auto w-full min-h-[calc(100vh_-_160px)] px-4 pb-40 pt-4 outline-none lg:px-8"
    :class="{ 'max-w-[720px]': props.settings?.general.editorView === 'compact' }">

  </div>

  <div v-if="props.isShowFormatToolbar" ref="toolbarWrapRef"
    :class="!toolbarPos ? 'sticky bottom-4 left-0 w-fit max-w-screen-md mx-auto' : 'w-fit'" :style="toolbarStyle"
    style="cursor: grab; touch-action: none; user-select: none;" @pointerdown="startToolbarDrag">
    <ToolbarFormNotesFormat :editorType="'crepe'" :editor="editor?.editor" @insertImage="emit('insertImage')" />
  </div>
</template>
