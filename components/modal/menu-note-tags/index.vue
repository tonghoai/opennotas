<script setup lang="ts">
import { closeDialogAnimated } from '~/utils/dialog-motion';
const props = defineProps([
  'listTags',
  'noteTagIds',
]);

const emit = defineEmits(['toggleTag']);

const close = () => {
  closeDialogAnimated(document.getElementById('modal-menu-note-tags') as HTMLDialogElement | null);
};

const handleToggle = (tagId: string) => {
  emit('toggleTag', tagId);
};
</script>

<template>
  <dialog id="modal-menu-note-tags" class="ui-modal ui-modal-bottom" @cancel.prevent="close">
    <div class="ui-modal-box p-0">
      <div class="px-3.5 pb-2 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {{ $t('app.menu_note_add_to_tag') }}
      </div>

      <ul class="ui-menu max-h-[52vh] w-full overflow-y-auto">
        <li v-if="!props.listTags.length" class="px-3 py-2 text-[13px] text-muted-foreground">
          {{ $t('app.menu_note_tags_empty') }}
        </li>

        <li v-for="tag in props.listTags" :key="tag.id" data-ga-event="note_tag_toggle"
          @click.stop="handleToggle(tag.id)">
          <button type="button">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center">
              <span v-if="props.noteTagIds.includes(tag.id)" class="h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
            <span class="min-w-0 flex-1 truncate text-left" :title="tag.name">{{ tag.name }}</span>
          </button>
        </li>
      </ul>

      <form class="mt-2">
        <button type="button"
          class="flex min-h-11 w-full items-center justify-center rounded-ui border border-border bg-card text-[13px] font-medium"
          @click="close">
          {{ $t('app.action_done') }}
        </button>
      </form>
    </div>
    <form class="ui-modal-backdrop" @click.prevent="close">
      <button type="button">close</button>
    </form>
  </dialog>
</template>
