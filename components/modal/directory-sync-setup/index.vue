<script setup lang="ts">
import { Folder } from '~/utils/icons';

const props = defineProps([
  'isLoading',
  'folderName',
  'hasExistingData',
  'baseSize',
  'oplogSize',
]);
const emit = defineEmits(['chooseFolder', 'useFolder', 'seed', 'close']);

const formatSize = (bytes: number) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
</script>

<template>
  <UiDialog id="modal-directory-sync-setup" :open="true" width="28rem" :show-ok="false" :show-cancel="false"
    :title="$t('app.modal_directory_setup_title')" :loading="props.isLoading" @close="emit('close')">
    <div class="flex flex-col gap-4 text-sm text-foreground/80">
      <div class="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <div class="flex items-center gap-2">
          <Folder class="h-4 w-4 shrink-0 opacity-70" />
          <span class="min-w-0 truncate font-medium text-foreground">{{ props.folderName }}</span>
        </div>
        <div class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          <span>{{ $t('app.modal_directory_setup_snapshot') }}: {{ formatSize(props.baseSize) }}</span>
          <span>{{ $t('app.modal_directory_setup_oplog') }}: {{ formatSize(props.oplogSize) }}</span>
        </div>
      </div>

      <template v-if="props.hasExistingData">
        <p>{{ $t('app.modal_directory_setup_existing') }}</p>
        <p class="text-[12px] text-muted-foreground">{{ $t('app.modal_directory_setup_existing_hint') }}</p>
      </template>
      <template v-else>
        <p>{{ $t('app.modal_directory_setup_new') }}</p>
        <p class="text-[12px] text-muted-foreground">{{ $t('app.modal_directory_setup_new_hint') }}</p>
      </template>
    </div>

    <template #footer>
      <button type="button" class="ui-btn ui-btn-sm" :disabled="props.isLoading" @click="emit('close')">
        {{ $t('app.modal_directory_setup_cancel') }}
      </button>
      <button type="button" class="ui-btn ui-btn-sm" :disabled="props.isLoading"
        @click="emit('chooseFolder')">
        {{ $t('app.modal_directory_setup_choose_folder') }}
      </button>
      <template v-if="props.hasExistingData">
        <button type="button" class="ui-btn ui-btn-sm" :disabled="props.isLoading"
          @click="emit('seed')">
          {{ $t('app.modal_directory_setup_overwrite') }}
        </button>
        <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" :disabled="props.isLoading"
          @click="emit('useFolder')">
          {{ $t('app.modal_directory_setup_use_folder') }}
        </button>
      </template>
      <button v-else type="button" class="ui-btn ui-btn-sm ui-btn-primary" :disabled="props.isLoading"
        @click="emit('seed')">
        {{ $t('app.modal_directory_setup_create') }}
      </button>
    </template>
  </UiDialog>
</template>
