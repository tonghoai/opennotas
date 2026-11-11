<script setup lang="ts">
import { Notes } from '~/utils/icons';
import { Tag } from '~/utils/icons';
import { Trash } from '~/utils/icons';
import { Settings } from '~/utils/icons';
import { Refresh } from '~/utils/icons';
import { Search } from '~/utils/icons';
import { Plus } from '~/utils/icons';
import { ChevronRight } from '~/utils/icons';
import { ArrowLeft } from '~/utils/icons';
import { PanelLeft } from '~/utils/icons';
import { hasNewVersion } from '~/utils/check-app-version';

const props = defineProps([
  'listFolders',
  'listTags',
  'activeFolderId',
  'activeTagId',
  'actionObjectKeys',
  'isSyncing',
  'folderCounts',
  'tagCounts',
  'trashCount',
]);

const emit = defineEmits([
  'clickFolderName',
  'rightClickFolderName',
  'renameFolderName',
  'reorderFolderName',
  'clickTagName',
  'rightClickTagName',
  'clickAddFolder',
  'clickAddTag',
  'clickTrash',
  'clickSettings',
  'clickSync',
  'openSearch',
  'clickTags',
  'close',
]);

const refreshRef = ref<HTMLElement | null>(null);
const refreshRefMobile = ref<HTMLElement | null>(null);
watch(() => props.isSyncing, (value) => {
  for (const element of [refreshRef.value, refreshRefMobile.value]) {
    if (!element) continue;
    element.classList.toggle('spin', value);
  }
});

const isTagsMode = computed(() => props.activeFolderId === 'bottombar-tags');
const isTagsOverview = computed(() => isTagsMode.value && !props.activeTagId);
const isTrashMode = computed(() => props.activeFolderId === 'bottombar-trash');
const isAllNotes = computed(() => !isTagsMode.value && !isTrashMode.value && !props.activeFolderId);

// The synthetic "All Notes" row is rendered first, so the Folders section only
// lists user-created folders.
const realFolders = computed(() => props.listFolders.filter((folder: any) => folder.id !== ''));
const totalCount = computed(() => props.folderCounts?.[''] ?? 0);
const tagCount = computed(() => props.listTags.length);

// Render the platform-appropriate shortcut hint.
const shortcutLabel = ref('⌘K');
onMounted(() => {
  shortcutLabel.value = /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K';
});

const handleClickFolder = (folderId: string) => {
  emit('clickFolderName', folderId);
  emit('close');
};

const handleClickTag = (tagId: string) => {
  emit('clickTagName', tagId);
  emit('close');
};

const handleTrash = () => {
  emit('clickTrash');
  emit('close');
};

const handleAllNotes = () => {
  emit('clickFolderName', '');
  emit('close');
};

const toggleFolders = () => {
  isFoldersOpen.value = !isFoldersOpen.value;
};
const toggleTags = () => {
  isTagsOpen.value = !isTagsOpen.value;
};

const isFoldersOpen = ref(true);
const isTagsOpen = ref(true);

// The mobile drawer mounts its own AppSidebar, so this desktop rail state is local.
const isSidebarCollapsed = ref(false);
const toggleSidebarCollapsed = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
</script>

<template>
  <aside
    class="sidebar-safe-top sidebar-safe-bottom sidebar-rail flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    :class="{ 'is-collapsed': isSidebarCollapsed }">
    <div class="flex h-12 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4"
      :class="{ 'lg:justify-center lg:px-0': isSidebarCollapsed }">
      <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-circle border border-border bg-card lg:hidden"
        :aria-label="$t('app.action_back')" :title="$t('app.action_back')" @click="emit('close')">
        <ArrowLeft class="h-4 w-4" />
      </button>

      <template v-if="!isSidebarCollapsed">
        <img src="/logo.png" alt="OpenNotas" class="h-6 w-6 shrink-0 rounded" />
        <span class="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">OpenNotas</span>

        <div class="hidden items-center gap-0.5 lg:flex">
          <button type="button" class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square"
            :aria-label="$t('app.modal_menu_sidebar_sync')" :title="$t('app.modal_menu_sidebar_sync')"
            @click="emit('clickSync')">
            <span ref="refreshRef" class="flex">
              <Refresh class="h-4 w-4" />
            </span>
          </button>

          <span class="relative inline-flex">
            <button type="button" class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square"
              :aria-label="$t('app.setting_title')" :title="$t('app.setting_title')" data-ga-event="settings_open"
              @click="emit('clickSettings')">
              <Settings class="h-4 w-4" />
            </button>
            <span v-if="hasNewVersion"
              class="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger"></span>
          </span>
        </div>
      </template>

      <button type="button" class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square hidden lg:inline-flex"
        :aria-label="isSidebarCollapsed ? $t('app.sidebar_expand') : $t('app.sidebar_collapse')"
        :title="isSidebarCollapsed ? $t('app.sidebar_expand') : $t('app.sidebar_collapse')"
        :aria-expanded="!isSidebarCollapsed" @click="toggleSidebarCollapsed">
        <PanelLeft class="h-4 w-4 transition-transform duration-200" :class="{ 'rotate-180': isSidebarCollapsed }" />
      </button>

      <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center lg:hidden" role="status"
        :aria-label="props.isSyncing ? $t('app.status_bar_sync_pending') : $t('app.status_bar_sync_synced')"
        :title="props.isSyncing ? $t('app.status_bar_sync_pending') : $t('app.status_bar_sync_synced')">
        <span class="h-2 w-2 rounded-full" :class="props.isSyncing ? 'bg-warning' : 'bg-success'"></span>
      </span>
    </div>

    <div class="px-3 pb-3 pt-3" :class="{ 'lg:px-2': isSidebarCollapsed }">
      <button type="button"
        class="ui-input flex w-full cursor-pointer items-center gap-2.5 border-transparent bg-muted text-left text-muted-foreground"
        :class="{ 'lg:justify-center lg:px-0': isSidebarCollapsed }"
        :aria-label="isSidebarCollapsed ? $t('app.toolbar_note_search_placeholder') : undefined"
        :title="$t('app.toolbar_note_search_placeholder')" aria-haspopup="dialog" @click="emit('openSearch')">
        <Search class="h-4 w-4 shrink-0" />
        <span v-if="!isSidebarCollapsed" class="min-w-0 flex-1 truncate">{{ $t('app.toolbar_note_search_placeholder') }}</span>
        <kbd v-if="!isSidebarCollapsed" class="hidden shrink-0 rounded border border-border bg-card px-1 text-[9px] leading-4 text-muted-foreground sm:inline">{{ shortcutLabel }}</kbd>
      </button>
    </div>

    <nav class="flex flex-col gap-0.5 px-3" :class="{ 'lg:px-2': isSidebarCollapsed }">
      <button type="button"
        class="flex h-9 items-center gap-2.5 rounded-ui px-2.5 text-[13.5px] transition-colors"
        :class="[isAllNotes ? 'bg-sidebar-active font-medium text-sidebar-active-foreground' : 'hover:bg-sidebar-accent', isSidebarCollapsed ? 'lg:justify-center lg:px-0' : '']"
        :aria-label="isSidebarCollapsed ? $t('app.list_folder_all') : undefined"
        :title="$t('app.list_folder_all')" @click="handleAllNotes">
        <Notes class="h-4 w-4 shrink-0 opacity-80" />
        <span v-if="!isSidebarCollapsed" class="min-w-0 flex-1 truncate text-left">{{ $t('app.list_folder_all') }}</span>
        <span v-if="!isSidebarCollapsed" class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ totalCount }}</span>
      </button>

      <button type="button"
        class="flex h-9 items-center gap-2.5 rounded-ui px-2.5 text-[13.5px] transition-colors"
        :class="[isTagsOverview ? 'bg-sidebar-active font-medium text-sidebar-active-foreground' : 'hover:bg-sidebar-accent', isSidebarCollapsed ? 'lg:justify-center lg:px-0' : '']"
        :aria-label="isSidebarCollapsed ? $t('app.tab_tags') : undefined"
        :title="$t('app.tab_tags')" @click="emit('clickTags')">
        <Tag class="h-4 w-4 shrink-0 opacity-80" />
        <span v-if="!isSidebarCollapsed" class="min-w-0 flex-1 truncate text-left">{{ $t('app.tab_tags') }}</span>
        <span v-if="!isSidebarCollapsed" class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ tagCount }}</span>
      </button>

      <button type="button"
        class="flex h-9 items-center gap-2.5 rounded-ui px-2.5 text-[13.5px] transition-colors"
        :class="[isTrashMode ? 'bg-sidebar-active font-medium text-sidebar-active-foreground' : 'hover:bg-sidebar-accent', isSidebarCollapsed ? 'lg:justify-center lg:px-0' : '']"
        :aria-label="isSidebarCollapsed ? $t('app.bottombar_folder_trash') : undefined"
        :title="$t('app.bottombar_folder_trash')" @click="handleTrash">
        <Trash class="h-4 w-4 shrink-0 opacity-80" />
        <span v-if="!isSidebarCollapsed" class="min-w-0 flex-1 truncate text-left">{{ $t('app.bottombar_folder_trash') }}</span>
        <span v-if="!isSidebarCollapsed" class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ props.trashCount }}</span>
      </button>
    </nav>

    <div v-if="!isSidebarCollapsed" class="mt-5 flex items-center gap-1 px-3">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-1 text-left" @click="toggleFolders">
        <ChevronRight class="h-3 w-3 text-muted-foreground transition-transform"
          :class="{ 'rotate-90': isFoldersOpen }" />
        <span class="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {{ $t('app.sidebar_folders') }}
        </span>
      </button>

      <button type="button" class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square"
        :aria-label="$t('app.toolbar_folder_add_tooltip')" :title="$t('app.toolbar_folder_add_tooltip')"
        data-ga-event="folder_create" @click="emit('clickAddFolder')">
        <Plus class="h-3.5 w-3.5" />
      </button>
    </div>

    <div v-if="isFoldersOpen" class="mt-1.5 min-h-0 overflow-y-auto px-3"
      :class="{ 'lg:mt-3 lg:px-2': isSidebarCollapsed }">
      <button v-if="!realFolders.length" type="button"
        class="flex h-9 w-full items-center gap-2.5 rounded-ui px-2.5 text-[13.5px] text-muted-foreground hover:bg-sidebar-accent"
        :class="{ 'lg:justify-center lg:px-0': isSidebarCollapsed }"
        :aria-label="isSidebarCollapsed ? $t('app.list_folder_empty') : undefined"
        :title="$t('app.list_folder_empty')" @click="emit('clickAddFolder')">
        <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-input">
          <Plus class="h-2.5 w-2.5" />
        </span>
        <span v-if="!isSidebarCollapsed" class="truncate">{{ $t('app.list_folder_empty') }}</span>
      </button>
      <ListFolder :listFolders="realFolders" :activeFolderId="props.activeFolderId"
        :actionObjectKeys="props.actionObjectKeys" :folderCounts="props.folderCounts" :collapsed="isSidebarCollapsed"
        @clickFolderName="handleClickFolder" @rightClickFolderName="emit('rightClickFolderName', $event)"
        @renameFolderName="emit('renameFolderName', $event)" @reorderFolderName="emit('reorderFolderName', $event)" />
    </div>

    <div v-if="isSidebarCollapsed" class="mx-3 mt-3 border-t border-sidebar-border lg:mx-2" aria-hidden="true"></div>

    <div v-if="!isSidebarCollapsed" class="mt-5 flex items-center gap-1 px-3">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-1 text-left" @click="toggleTags">
        <ChevronRight class="h-3 w-3 text-muted-foreground transition-transform"
          :class="{ 'rotate-90': isTagsOpen }" />
        <span class="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {{ $t('app.tab_tags') }}
        </span>
      </button>

      <button type="button" class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square"
        :aria-label="$t('app.toolbar_tag_add_tooltip')" :title="$t('app.toolbar_tag_add_tooltip')"
        @click="emit('clickAddTag')">
        <Plus class="h-3.5 w-3.5" />
      </button>
    </div>

    <div v-if="isTagsOpen" class="mt-1.5 mb-2 min-h-0 flex-1 overflow-y-auto px-3"
      :class="{ 'lg:px-2': isSidebarCollapsed }">
      <ListTag :listTags="props.listTags" :activeTagId="isTagsMode ? props.activeTagId : ''" :tagCounts="props.tagCounts"
        :actionObjectKeys="props.actionObjectKeys" :collapsed="isSidebarCollapsed" @clickTagName="handleClickTag"
        @rightClickTagName="emit('rightClickTagName', $event)" @clickAddTag="emit('clickAddTag')" />
    </div>

    <div class="mt-auto shrink-0 border-t border-sidebar-border px-2 py-2 lg:h-7 lg:px-4 lg:py-0"
      :class="{ 'lg:px-0': isSidebarCollapsed }">
      <div class="flex items-center justify-center gap-1 lg:hidden">
        <button type="button"
          class="flex h-10 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-ui px-2.5 text-[13px] font-medium transition-colors hover:bg-sidebar-accent"
          :aria-label="$t('app.setting_title')" :title="$t('app.setting_title')" data-ga-event="settings_open"
          @click="emit('clickSettings')">
          <span class="relative flex shrink-0">
            <Settings class="h-4 w-4 opacity-80" />
            <span v-if="hasNewVersion"
              class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-danger"></span>
          </span>
          <span class="truncate">{{ $t('app.setting_title') }}</span>
        </button>

        <button type="button"
          class="flex h-10 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-ui px-2.5 text-[13px] font-medium transition-colors hover:bg-sidebar-accent"
          :aria-label="$t('app.modal_menu_sidebar_sync')" :title="$t('app.modal_menu_sidebar_sync')"
          @click="emit('clickSync')">
          <span ref="refreshRefMobile" class="flex shrink-0">
            <Refresh class="h-4 w-4 opacity-80" />
          </span>
          <span class="truncate">{{ $t('app.setting_sync_title') }}</span>
        </button>
      </div>

      <div class="mt-1.5 hidden items-center gap-1.5 px-2.5 text-[10.5px] leading-4 text-muted-foreground lg:mt-0 lg:flex lg:h-full lg:px-0"
        :class="{ 'lg:justify-center': isSidebarCollapsed }">
        <span class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="props.isSyncing ? 'bg-warning' : 'bg-success'"></span>
        <span v-if="!isSidebarCollapsed" class="truncate">
          {{ props.isSyncing ? $t('app.status_bar_sync_pending') : $t('app.status_bar_sync_synced') }}
        </span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.sidebar-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sidebar-rail {
  width: 17rem;
  transition: width 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (min-width: 1024px) {
  .sidebar-safe-top {
    padding-top: 0;
  }

  .sidebar-rail.is-collapsed {
    width: 3.75rem;
  }
}
</style>
