<script setup lang="ts">
import { Check, ChevronDown } from '~/utils/icons';
import type { ButtonSize } from '~/utils/ui/types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    options: { label: string; value: string | number }[];
    size?: Extract<ButtonSize, 'sm' | 'md' | 'lg'>;
    disabled?: boolean;
    invalid?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    size: 'md',
    disabled: false,
    invalid: false,
    placeholder: 'Select…',
  },
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const listboxId = useId();
const triggerRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const open = ref(false);
const activeIndex = ref(-1);
const panelStyle = ref<Record<string, string>>({});
const openEventName = 'ui-select-open';
let ownerDialog: HTMLDialogElement | null = null;
// A manual popover teleported to <body> is visually above a modal <dialog>,
// but browser hit-testing/inert rules can still route pointer events to the
// dialog behind it. Render inside the owning dialog so options remain clickable.
const panelTarget = ref<HTMLElement | string>('body');

const selectedLabel = computed(() => {
  const selected = props.options.find((option) => option.value === props.modelValue);
  return selected?.label || props.placeholder;
});

const triggerClasses = computed(() => {
  const value = ['ui-select-trigger'];
  if (props.size !== 'md') value.push(`ui-select-trigger-${props.size}`);
  if (props.invalid) value.push('ui-input-error');
  return value;
});

const updatePosition = () => {
  const trigger = triggerRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const width = Math.max(rect.width, 160);
  const maxHeight = 260;
  const estimatedHeight = Math.min(props.options.length * 28 + 8, maxHeight);
  const openUp = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
  panelStyle.value = {
    left: `${left}px`,
    top: openUp ? `${rect.top - estimatedHeight - 4}px` : `${rect.bottom + 4}px`,
    width: `${width}px`,
    maxHeight: `${maxHeight}px`,
  };
};

const show = async () => {
  if (props.disabled || open.value) return;
  // Only one select menu can be open at a time. This also cleans up a panel
  // left open when its owner dialog was closed programmatically.
  document.dispatchEvent(new CustomEvent(openEventName, { detail: listboxId }));
  open.value = true;
  const selectedIndex = props.options.findIndex((option) => option.value === props.modelValue);
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0;
  await nextTick();
  updatePosition();
  panelRef.value?.showPopover?.();
};

const hide = () => {
  open.value = false;
  activeIndex.value = -1;
  if (panelRef.value?.matches(':popover-open')) panelRef.value.hidePopover();
};

const toggle = () => {
  if (open.value) hide();
  else show();
};

const select = (option: { label: string; value: string | number }) => {
  emit('update:modelValue', String(option.value));
  hide();
  triggerRef.value?.focus();
};

const move = (delta: number) => {
  if (!open.value) {
    show();
    return;
  }
  const count = props.options.length;
  if (!count) return;
  activeIndex.value = (activeIndex.value + delta + count) % count;
  nextTick(() => {
    const option = document.getElementById(`${listboxId}-option-${activeIndex.value}`);
    option?.scrollIntoView({ block: 'nearest' });
  });
};

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      move(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      move(-1);
      break;
    case 'Home':
      if (open.value) {
        event.preventDefault();
        activeIndex.value = 0;
      }
      break;
    case 'End':
      if (open.value) {
        event.preventDefault();
        activeIndex.value = props.options.length - 1;
      }
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (open.value && props.options[activeIndex.value]) select(props.options[activeIndex.value]);
      else show();
      break;
    case 'Escape':
      if (open.value) {
        event.preventDefault();
        hide();
      }
      break;
    case 'Tab':
      hide();
      break;
  }
};

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (!open.value) return;
  const target = event.target as Node;
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return;
  hide();
};

const handleViewportChange = () => {
  if (open.value) updatePosition();
};

const handleNativeToggle = (event: Event) => {
  const state = (event as ToggleEvent).newState;
  if (state === 'closed' && open.value) {
    open.value = false;
    activeIndex.value = -1;
  }
};

const handleOtherSelectOpen = (event: Event) => {
  if ((event as CustomEvent).detail !== listboxId) hide();
};

const handleOwnerDialogClose = () => hide();

watch(() => props.disabled, (disabled) => { if (disabled) hide(); });

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  document.addEventListener(openEventName, handleOtherSelectOpen);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('scroll', handleViewportChange, true);

  // A manual popover is not automatically dismissed when its parent <dialog>
  // closes, which would leave a floating panel over the next screen.
  ownerDialog = triggerRef.value?.closest('dialog') ?? null;
  panelTarget.value = ownerDialog || 'body';
  ownerDialog?.addEventListener('close', handleOwnerDialogClose);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
  document.removeEventListener(openEventName, handleOtherSelectOpen);
  window.removeEventListener('resize', handleViewportChange);
  window.removeEventListener('scroll', handleViewportChange, true);
  ownerDialog?.removeEventListener('close', handleOwnerDialogClose);
});
</script>

<template>
  <div class="ui-select-root">
    <button ref="triggerRef" v-bind="$attrs" type="button" :class="triggerClasses" :disabled="disabled"
      :aria-expanded="open ? 'true' : 'false'" :aria-controls="listboxId" aria-haspopup="listbox"
      :aria-activedescendant="open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined"
      @click="toggle" @keydown="handleKeydown">
      <span class="truncate">{{ selectedLabel }}</span>
      <ChevronDown class="h-3.5 w-3.5 shrink-0 opacity-60 transition-transform"
        :class="{ 'rotate-180': open }" aria-hidden="true" />
    </button>

    <Teleport :to="panelTarget">
      <div :id="listboxId" ref="panelRef" popover="manual" role="listbox" class="ui-select-panel"
        :style="panelStyle" @click.stop @toggle="handleNativeToggle">
        <button v-for="(option, index) in options" :id="`${listboxId}-option-${index}`" :key="option.value"
          type="button" role="option" class="ui-select-option" :data-active="index === activeIndex"
          :aria-selected="option.value === modelValue" @click="select(option)">
          <Check v-if="option.value === modelValue" class="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span v-else class="w-[13px] shrink-0" aria-hidden="true"></span>
          <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
        </button>
        <p v-if="!options.length" class="px-2 py-1.5 text-xs text-muted-foreground">No options</p>
      </div>
    </Teleport>
  </div>
</template>
