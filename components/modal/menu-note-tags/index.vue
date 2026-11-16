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

const fallbackTagColor = '#94a3b8';

const normalizeHex = (color?: string) => {
  const value = (color || '').trim();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallbackTagColor;
};

const isAssigned = (tagId: string) => props.noteTagIds.includes(tagId);

// The circular indicator is the state: filled with the tag colour when
// assigned, hollow with just the tag-colour border when not.
const tagDotStyle = (tag: any) => {
  const color = normalizeHex(tag.color);
  return {
    backgroundColor: isAssigned(tag.id) ? color : 'transparent',
    borderColor: color,
  };
};
</script>

<template>
  <dialog id="modal-menu-note-tags" class="ui-modal ui-modal-bottom" @cancel.prevent="close">
    <div class="ui-modal-box p-0">
      <div class="px-3.5 pb-2 pt-3 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        {{ $t('app.menu_note_add_to_tag') }}
      </div>

      <ul class="ui-menu max-h-[52vh] w-full overflow-y-auto">
        <li v-if="!props.listTags.length" class="px-3 py-2 text-[14px] text-muted-foreground">
          {{ $t('app.menu_note_tags_empty') }}
        </li>

        <li v-for="tag in props.listTags" :key="tag.id" data-ga-event="note_tag_toggle"
          @click.stop="handleToggle(tag.id)">
          <button type="button" class="tag-choice min-h-10 transition-colors"
            :aria-pressed="isAssigned(tag.id)">
            <span class="h-4 w-4 shrink-0 rounded-full border-2" :style="tagDotStyle(tag)"
              aria-hidden="true"></span>
            <span class="min-w-0 flex-1 truncate text-left" :title="tag.name">{{ tag.name }}</span>
          </button>
        </li>
      </ul>

      <form class="mt-2">
        <button type="button"
          class="ui-btn ui-btn-primary ui-btn-block min-h-11 text-[14px] font-medium"
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
