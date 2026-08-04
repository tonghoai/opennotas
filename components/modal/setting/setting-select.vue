<script setup lang="ts">
import ChevronRight from '../assets/svg/chevron-right.svg?component';

const props = defineProps<{
  modelValue: string;
  options: { label: string; value: string }[];
  gaEvent?: string;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const selectedLabel = computed(() => props.options.find(o => o.value === props.modelValue)?.label ?? '');

const handleSelect = (value: string) => {
  emit('update:modelValue', value);
  (document.activeElement as HTMLElement)?.blur();
};
</script>

<template>
  <div class="dropdown dropdown-end min-w-0 max-w-full">
    <div tabindex="0" role="button" class="flex items-center gap-1 cursor-pointer select-none min-w-0">
      <span class="truncate">{{ selectedLabel }}</span>
      <ChevronRight class="h-3.5 w-3.5 rotate-90 text-base-content/50 shrink-0" />
    </div>
    <ul tabindex="0"
      class="dropdown-content menu bg-base-100 rounded-xl z-30 w-52 p-1.5 shadow-lg border border-base-300 mt-2">
      <li v-for="opt in options" :key="opt.value">
        <a class="flex items-center justify-between rounded-lg py-2" :data-ga-event="gaEvent" :data-ga-value="opt.value"
          @click="handleSelect(opt.value)">
          {{ opt.label }}
          <span v-if="opt.value === modelValue" class="text-base-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-check">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12l5 5l10 -10" />
            </svg>
          </span>
        </a>
      </li>
    </ul>
  </div>
</template>
