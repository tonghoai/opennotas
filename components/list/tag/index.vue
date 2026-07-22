<script setup lang="ts">
import MoreHorizontal from '~/assets/svg/more-horizontal.svg?component';
import Plus from '~/assets/svg/plus.svg?component';

const props = defineProps([
  'listTags',
  'activeTagId',
  'actionObjectKeys',
  'isCollapseFolder',
]);

const emit = defineEmits(['clickTagName', 'rightClickTagName', 'clickAddTag']);
const handleClickTagName = (event: Event, tagId: string) => {
  event.preventDefault();
  emit('clickTagName', tagId);
};
const handleRightClickTagName = (e: any, tagId: string) => {
  e.preventDefault();

  const x = e.clientX;
  const y = e.clientY;
  emit('rightClickTagName', { tagId, x, y });
};
</script>

<template>
  <ul class="menu block w-full p-2 transition-all h-[calc(100vh_-_254px)] overflow-auto lg:h-full lg:overflow-auto">
    <li v-if="!props.listTags.length" class="menu-items w-full py-0.5 cursor-pointer"
      @click="emit('clickAddTag')">
      <div class="flex flex-row justify-between rounded-xl w-full">
        <div class="flex items-center gap-4 w-5/6">
          <span
            class="w-6 h-6 rounded-full shrink-0 border-2 border-dashed border-base-content/30 flex items-center justify-center">
            <Plus class="w-3 h-3 text-base-content/50" />
          </span>
          <span v-if="!isCollapseFolder" class="truncate overflow-hidden text-base-content/50">
            {{ $t('app.list_tag_empty') }}
          </span>
        </div>
      </div>
    </li>

    <li v-for="tag in props.listTags" :key="tag.id" class="menu-items w-full py-0.5 animate-fade-right animate-duration-100"
      @contextmenu="handleRightClickTagName($event, tag.id)" @click="handleClickTagName($event, tag.id)">
      <div class="flex flex-row justify-between rounded-xl w-full active:!bg-neutral active:!text-neutral-content"
        :class="{ 'bg-primary text-primary-content hover:bg-primary': activeTagId === tag.id }" :id="'tag-' + tag.id">
        <div class="flex items-center gap-4 w-5/6">
          <span class="w-6 h-6 rounded-full shrink-0" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
          <span v-if="!isCollapseFolder" class="truncate overflow-hidden tag-name"
            :class="{ 'text-warning-sync': props.actionObjectKeys?.includes(tag.id) }" :tagId="tag.id">
            {{ tag.name }}
          </span>
        </div>
        <div v-if="!isCollapseFolder" class="more-tools" @click.stop="handleRightClickTagName($event, tag.id)">
          <MoreHorizontal class="press w-3 h-3 opacity-80" />
        </div>
      </div>
    </li>
  </ul>
</template>
<style lang="scss" scoped>
.menu-items:hover .more-tools {
  display: block;
}
</style>
