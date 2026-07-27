<script setup lang="ts">
const props = defineProps([
  'listTags',
  'noteTagIds',
]);

const emit = defineEmits(['toggleTag']);

const handleToggle = (tagId: string) => {
  emit('toggleTag', tagId);
};
</script>

<template>
  <dialog id="modal-menu-note-tags" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-0 w-5/6 border border-base-content/15">
      <div class="bg-base-100 shadow-sm rounded">
        <div class="text-center text-xs opacity-60 pt-3 pb-1">{{ $t('app.menu_note_add_to_tag') }}</div>

        <ul
          class="menu bg-base-100 rounded-box w-full animate-fade-down animate-duration-100 gap-1 max-h-[60vh] overflow-y-auto">
          <li v-if="!props.listTags.length" class="w-full text-center py-2 opacity-60">
            {{ $t('app.menu_note_tags_empty') }}
          </li>

          <li v-for="tag in props.listTags" :key="tag.id" class="w-full" @click.stop="handleToggle(tag.id)">
            <a class="w-full flex flex-row items-center justify-start gap-3">
              <input type="checkbox" class="checkbox checkbox-sm" :checked="props.noteTagIds.includes(tag.id)"
                @click.stop="handleToggle(tag.id)" />
              <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
              <span class="truncate">{{ tag.name }}</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
