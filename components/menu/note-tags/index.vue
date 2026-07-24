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
  <ul class="menu bg-base-100 rounded-box w-56 border border-neutral animate-fade-down animate-duration-100 max-h-72 flex-nowrap overflow-y-auto">
    <li v-if="!props.listTags.length" class="menu-title">
      <span>{{ $t('app.menu_note_tags_empty') }}</span>
    </li>

    <li v-for="tag in props.listTags" :key="tag.id" @click.stop="handleToggle(tag.id)">
      <a class="flex flex-row items-center gap-3">
        <input type="checkbox" class="checkbox checkbox-sm" :checked="props.noteTagIds.includes(tag.id)"
          @click.stop="handleToggle(tag.id)" />
        <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
        <span class="flex items-center justify-center truncate">{{ tag.name }}</span>
      </a>
    </li>
  </ul>
</template>
