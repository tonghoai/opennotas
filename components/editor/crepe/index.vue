<script setup lang="ts">
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/core";
import { undoCommand, redoCommand } from "@milkdown/plugin-history";
import { replaceAll, getMarkdown, $prose } from '@milkdown/utils'
import { TextSelection, Plugin } from '@milkdown/prose/state'
import * as Diff from 'diff'

const { $i18n } = useNuxtApp();

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
]);

const isLoading = ref(true);

let editor: Crepe;

// Track resolved blob URLs → imageId for badge lookup
const blobUrlToImageId = new Map<string, string>();
// Track injected badge elements per imageId
const imageBadgeMap = new Map<string, HTMLElement>();
let domObserver: MutationObserver | null = null;
let linkEditObserver: MutationObserver | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let isRefreshingBadges = false;
let imagePasteHandler: ((e: Event) => void) | null = null;
let imageResizeHandler: ((e: PointerEvent) => void) | null = null;
let imageEditMouseDownHandler: ((e: MouseEvent) => void) | null = null;
let imageEditClickSwallowHandler: ((e: MouseEvent) => void) | null = null;
let isReplacingAll = false;

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
  return src;
};

const createBadgeSvg = (type: 'upload' | 'warning' | 'spinner'): string => {
  if (type === 'upload') return cloudUploadSvgRaw;
  if (type === 'warning') return alertSquareSvgRaw;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
};

const handleManualSync = async () => {
  // Mark all visible pending/failed badges as syncing
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

  // Disconnect observer to prevent re-entrant mutations from badge DOM changes
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

    // Remove stale badges for images no longer in the editor
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
    // Reconnect observer after DOM changes are done
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

// syncImages() also runs from the app's general background sync (utils/sync.ts, via
// pullPush/idleSync) — not just from handleManualSync's own badge click. Watching the
// shared isImageSyncing flag lets badges show the loading spinner for that path too,
// instead of sitting static on the upload icon for the whole background sync.
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

// Milkdown's link-edit popup focuses its input via requestAnimationFrame right when it
// opens, which can race with the popup's own `data-show` flip and silently no-op if the
// element is still `display:none` at that instant. Force-focus it ourselves whenever it
// becomes visible so the popup never opens without focus landing in the input.
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
        input.focus();
      }
    }
  });
  linkEditObserver.observe(editorEl, {
    attributes: true,
    attributeFilter: ['data-show'],
    subtree: true,
  });
};

onMounted(() => {
  editor = new Crepe({
    root: document.querySelector("#crepe-editor")!,
    features: {
      [Crepe.Feature.Toolbar]: true,
      [Crepe.Feature.Latex]: false,
    },
    featureConfigs: {
      [Crepe.Feature.Cursor]: {
        // prosemirror-virtual-cursor races with the list-item NodeView's own
        // requestAnimationFrame-deferred selection fix on every Enter inside a
        // list, suspected to cause duplicated lines on real mobile
        // soft-keyboard input (not reproducible via synthetic keydown
        // testing). Keep the feature enabled (still get the drag/drop
        // indicator) but disable just the virtual caret.
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

    // ProseMirror scrolls the selection into view (with no margin) on every
    // local edit by default, which fights our own eased scroll in
    // ensureCursorBottomMargin and produces a jump-then-smooth double motion.
    // Suppressing it here makes our animation the only one that runs.
    editor.editor.use(
      $prose(() => new Plugin({
        props: {
          handleScrollToSelection: () => true,
        },
      }))
    );

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

      // Capture insert position synchronously before async upload
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

    // Milkdown's image-block NodeView only claims (stopEvent) clicks landing directly on a
    // real <input> — a click anywhere else in the empty-state placeholder (the upload
    // label, the "or paste link" text, the surrounding empty space) is left unclaimed.
    // ProseMirror sets its NodeSelection (flashing the "selected" overlay) on MOUSEDOWN,
    // before any 'click' handler ever runs — intercepting only 'click' (as an earlier
    // version of this did) is always too late: the overlay has already flashed on by the
    // time 'click' fires. Intercept at 'mousedown' instead, in the capture phase, so
    // ProseMirror never sees the event at all: open the file picker directly on the
    // upload label, and just focus the link input for everything else in the placeholder.
    imageEditMouseDownHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Bail out for a mousedown landing directly on a real <input> — Milkdown's own
      // NodeView already stopEvent's these correctly. This also guards against
      // re-entrancy: the input?.click() call below dispatches a real, bubbling click
      // event (not 'mousedown', so it can't loop back into this same listener).
      if (target instanceof HTMLInputElement) return;
      // Let the Confirm button (shown once the link input has a value) work natively too —
      // it isn't part of the empty-state placeholder this handler exists to fix, and
      // intercepting it here would eat the click Milkdown needs to actually insert the image.
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
    // The mousedown handler above already did the real work (focus the link input, or open
    // the file picker) and stopped the mousedown from reaching ProseMirror. The 'click' that
    // naturally follows the same physical click still reaches ProseMirror separately, and
    // its own click handling steals focus back to the editor root — so it also needs
    // blocking. This must NOT re-run the branch logic above though: for a real click on the
    // upload label (as opposed to the synthetic one our own input.click() call dispatches,
    // whose target is the input and already gets skipped by the HTMLInputElement guard), the
    // target is still the label, so re-running that branch would call input.click() a SECOND
    // time and open the file picker twice. Just swallow the event instead.
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

    // Dampen image resize speed — Milkdown uses absolute 1:1 position, we use delta × damping
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
  editor.destroy();
});

const silent = ref<boolean>(false);

// slient update value
// use to update value without trigger change event
// to keep the cursor position
const slientUpdateValue = async (value: string) => {
  if (!editor) return
  silent.value = true
  isReplacingAll = true

  // try catch to avoid error
  try {
    await editor.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)

      // 1) Get cursor position by plain text (without block separators)
      const sel = view.state.selection
      const prevPos = sel.empty ? sel.from : sel.to
      const oldPlainBefore = view.state.doc.textBetween(0, prevPos, '', '')
      const oldPlain = view.state.doc.textBetween(0, view.state.doc.content.size, '', '')
      const oldOffset = oldPlainBefore.length

      // 2) Replace all content
      replaceAll(value, true)(ctx)

      // 3) Tính offset mới bằng diff
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
          // nếu caret nằm trong phần bị xoá -> snap về vị trí newPos tại điểm đó
          if (!found && oldOffset <= oldPos + len) {
            newOffset = newPos
            found = true
            break
          }
          oldPos += len
          continue
        }
        // unchanged
        if (!found && oldOffset <= oldPos + len) {
          newOffset = newPos + (oldOffset - oldPos)
          found = true
          break
        }
        oldPos += len
        newPos += len
      }
      if (!found) newOffset = newPos

      // 4) Convert plain-text offset -> ProseMirror position
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

      // 5) Set cursor position
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

defineExpose({
  focus,
  readonly,
  undo,
  redo,
  slientUpdateValue,
  focusState,
});
</script>

<template>
  <div v-show="isLoading"
    class="w-full mx-auto outline-none px-2 lg:px-8 py-6 min-h-[calc(100vh_/_2)] animate-fade-right animate-duration-100 flex flex-col items-center justify-end"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }">
    <div class="loader"></div>
  </div>

  <div v-show="!isLoading" id="crepe-editor"
    class="w-full mx-auto outline-none px-2 lg:px-8 pt-6 pb-40 min-h-[calc(100vh_-_160px)] animate-fade-right animate-duration-100"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }">

  </div>

  <div v-if="props.isShowFormatToolbar" ref="toolbarWrapRef"
    :class="!toolbarPos ? 'sticky bottom-4 left-0 w-fit max-w-screen-md mx-auto' : 'w-fit'" :style="toolbarStyle"
    style="cursor: grab; touch-action: none; user-select: none;" @pointerdown="startToolbarDrag">
    <ToolbarFormNotesFormat :editorType="'crepe'" :editor="editor?.editor" />
  </div>
</template>
