<script setup lang="ts">
import { AlertTriangle, CircleCheck, CircleX, Info, X } from '~/utils/icons';
type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

const props = withDefaults(
  defineProps<{
    variant?: NotificationVariant;
    message: string;
    dismissLabel?: string;
    closable?: boolean;
    actionLabel?: string;
  }>(),
  {
    variant: 'info',
    dismissLabel: '',
    closable: true,
    actionLabel: '',
  },
);

const emit = defineEmits<{ (e: 'dismiss'): void; (e: 'action'): void }>();

const { t } = useI18n();

const iconClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'error':
      return 'text-danger';
    default:
      return 'text-info';
  }
});

const label = computed(() => props.dismissLabel || t('app.action_close'));
</script>

<template>
  <div
    class="app-toast pointer-events-auto flex min-w-56 max-w-72 items-center gap-2 rounded-xl border border-neutral-foreground/10 bg-neutral py-2 pl-3 pr-1.5 shadow-md"
    role="alert">
    <CircleCheck v-if="variant === 'success'" class="h-4 w-4 shrink-0" :class="iconClass" aria-hidden="true" />
    <CircleX v-else-if="variant === 'error'" class="h-4 w-4 shrink-0" :class="iconClass" aria-hidden="true" />
    <AlertTriangle v-else-if="variant === 'warning'" class="h-4 w-4 shrink-0" :class="iconClass" aria-hidden="true" />
    <Info v-else class="h-4 w-4 shrink-0" :class="iconClass" aria-hidden="true" />

    <span class="flex-1 text-sm leading-snug text-neutral-foreground">{{ message }}</span>

    <button v-if="actionLabel" type="button"
      class="shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold text-neutral-foreground hover:bg-neutral-foreground/10"
      @click="emit('action')">
      {{ actionLabel }}
    </button>

    <UiButton v-if="closable" variant="ghost" size="xs" circle
      class="text-neutral-foreground opacity-40 hover:opacity-100" :aria-label="label" @click="emit('dismiss')">
      <X class="h-3 w-3" aria-hidden="true" />
    </UiButton>
  </div>
</template>
