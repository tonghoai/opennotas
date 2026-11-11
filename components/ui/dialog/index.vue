<script setup lang="ts">
import { X } from '~/utils/icons';
import type { DialogVariant } from '~/utils/ui/types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    open?: boolean;
    id?: string;
    title?: string;
    description?: string;
    width?: string;
    boxClass?: string;
    top?: boolean;
    overlayClosable?: boolean;
    showClose?: boolean;
    showCancel?: boolean;
    showOk?: boolean;
    okText?: string;
    cancelText?: string;
    okVariant?: DialogVariant;
    cancelVariant?: DialogVariant;
    okOutline?: boolean;
    loading?: boolean;
    closeOnOk?: boolean;
  }>(),
  {
    open: false,
    title: '',
    description: '',
    width: '',
    boxClass: '',
    top: false,
    overlayClosable: true,
    showClose: true,
    showCancel: true,
    showOk: true,
    okVariant: 'primary',
    cancelVariant: 'default',
    okOutline: false,
    loading: false,
    closeOnOk: false,
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'ok'): void;
  (e: 'cancel'): void;
  (e: 'close'): void;
  (e: 'after-close'): void;
}>();

const { t } = useI18n();
const dialogRef = ref<HTMLDialogElement | null>(null);
const titleId = useId();
const descriptionId = useId();

const isClosing = ref(false);
const pendingCancel = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const clearCloseTimer = () => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const closeLabel = computed(() => t('app.action_close'));
const okLabel = computed(() => props.okText || t('app.action_ok'));
const cancelLabel = computed(() => props.cancelText || t('app.action_cancel'));

const boxStyle = computed(() => (props.width ? { maxWidth: props.width } : undefined));

const syncOpen = () => {
  const dialog = dialogRef.value;
  if (!dialog) return;
  if (props.open && !dialog.open) {
    dialog.showModal();
    // Keep focus on the dialog itself so no button paints a focus ring on
    // open; explicit [autofocus] fields (e.g. rename inputs) still win.
    if (!dialog.querySelector('[autofocus]')) {
      dialog.setAttribute('tabindex', '-1');
      dialog.focus();
    }
  }
  if (!props.open && dialog.open) close();
};

watch(() => props.open, syncOpen, { flush: 'post' });
onMounted(syncOpen);

const close = (withCancel = false) => {
  const dialog = dialogRef.value;
  if (!dialog?.open) {
    if (withCancel) emit('cancel');
    emit('after-close');
    emit('update:open', false);
    emit('close');
    return;
  }

  if (isClosing.value) return;
  if (withCancel) pendingCancel.value = true;
  isClosing.value = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = reduceMotion ? 0 : 220;
  closeTimer = setTimeout(() => {
    closeTimer = null;
    if (pendingCancel.value) {
      pendingCancel.value = false;
      emit('cancel');
    }
    if (dialog.open) dialog.close();
    isClosing.value = false;
  }, delay);
};

const handleNativeClose = () => {
  clearCloseTimer();
  isClosing.value = false;
  pendingCancel.value = false;
  // Let a parent finish the action that initiated the close while this
  // component is still mounted (e.g. command palette selecting a note).
  emit('after-close');
  emit('update:open', false);
  emit('close');
};

const handleNativeCancel = (event: Event) => {
  event.preventDefault();
  if (props.loading) return;
  close(true);
};

onBeforeUnmount(clearCloseTimer);

const handleToggle = () => {
  if (dialogRef.value?.open && !props.open) emit('update:open', true);
};

const handleDialogClick = (event: MouseEvent) => {
  if (event.target !== dialogRef.value) return;
  if (!props.overlayClosable || props.loading) return;
  close(true);
};

const handleOk = () => {
  if (props.loading) return;
  emit('ok');
  if (props.closeOnOk) close();
};

defineExpose({ close });
</script>

<template>
  <dialog ref="dialogRef" v-bind="$attrs" :id="id" class="ui-modal" :class="{ 'ui-modal-top': top, 'is-closing': isClosing }"
    :aria-labelledby="title ? titleId : undefined" :aria-describedby="description ? descriptionId : undefined"
    :aria-busy="loading ? 'true' : undefined" @close="handleNativeClose" @cancel="handleNativeCancel"
    @toggle="handleToggle" @click="handleDialogClick">
    <div class="ui-modal-box ui-modal-panel" :class="boxClass" :style="boxStyle" @click.stop>
      <div v-if="title || description || showClose" class="ui-modal-header">
        <div class="min-w-0 flex-1">
          <h3 v-if="title" :id="titleId" class="ui-modal-title">{{ title }}</h3>
          <p v-if="description" :id="descriptionId" class="ui-modal-description">{{ description }}</p>
        </div>

        <UiButton v-if="showClose" type="button" variant="ghost" size="sm" circle :disabled="loading"
          class="ui-modal-close" :aria-label="closeLabel" @click="close">
          <X class="h-4 w-4" />
        </UiButton>
      </div>

      <div v-if="$slots.default" class="ui-modal-body">
        <slot />
      </div>

      <div v-if="showCancel || showOk || $slots.footer" class="ui-modal-footer">
        <slot name="footer">
          <UiButton v-if="showCancel" :variant="cancelVariant" size="sm" :disabled="loading" @click="handleNativeCancel">
            {{ cancelLabel }}
          </UiButton>
          <UiButton v-if="showOk" :variant="okVariant" size="sm" :outline="okOutline" :loading="loading"
            @click="handleOk">
            {{ okLabel }}
          </UiButton>
        </slot>
      </div>
    </div>
  </dialog>
</template>
