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
  <ul role="menu"
    class="ui-menu bg-popover text-popover-foreground rounded-ui w-56 border border-border max-h-72 flex-nowrap overflow-y-auto">
    <li v-if="!props.listTags.length" class="ui-menu-title">
      <span>{{ $t('app.menu_note_tags_empty') }}</span>
    </li>

    <li v-for="tag in props.listTags" :key="tag.id" data-ga-event="note_tag_toggle" @click.stop="handleToggle(tag.id)">
      <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
        <input type="checkbox" class="ui-checkbox ui-checkbox-sm" :checked="props.noteTagIds.includes(tag.id)"
          @click.stop="handleToggle(tag.id)" />
        <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
        <span class="flex items-center justify-center truncate">{{ tag.name }}</span>
      </a>
    </li>
  </ul>
</template>
