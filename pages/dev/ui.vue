<script setup lang="ts">
useHead({
  title: 'UI Kit · OpenNotas',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const { showInfo, showSuccess, showWarning, showError } = useToast();
const { confirm } = useConfirm();

const dialogOpen = ref(false);
const inputValue = ref('OpenNotas');
const selectValue = ref('system');
const switchValue = ref(true);
const checkboxValue = ref(true);
const textareaValue = ref('A calm place to think.');

const selectOptions = [
  { label: 'System', value: 'system' },
  { label: 'OpenNotas Light', value: 'light' },
  { label: 'OpenNotas Dark', value: 'dark' },
];

const askConfirm = async () => {
  const ok = await confirm({
    title: 'Delete this note?',
    message: 'This is a demo confirmation. Nothing will actually be deleted.',
    okText: 'Delete',
    cancelText: 'Cancel',
    okVariant: 'danger',
  });
  if (ok) showSuccess('Confirmed');
  else showInfo('Cancelled');
};

const colors = [
  'background', 'foreground', 'card', 'muted', 'muted-foreground',
  'border', 'primary', 'primary-foreground', 'secondary', 'accent',
  'selected', 'danger', 'warning', 'success', 'info', 'ring',
];
</script>

<template>
  <div class="min-h-screen bg-background p-6 text-foreground lg:p-10">
    <div class="mx-auto max-w-5xl space-y-10">
      <header class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-widest text-muted-foreground">OpenNotas</p>
        <h1 class="text-2xl font-semibold tracking-tight">UI Kit</h1>
        <p class="text-sm text-muted-foreground">
          Gallery cho các primitive và Vue component port từ GPUI Kit. Chỉ dùng để phát triển.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Colors</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="name in colors" :key="name" class="rounded-ui border border-border bg-card p-3">
            <div class="mb-2 h-10 rounded-ui border border-border"
              :style="{ backgroundColor: `rgb(var(--ui-${name}))` }"></div>
            <p class="text-xs font-medium">{{ name }}</p>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Buttons</h2>
        <div class="flex flex-wrap items-center gap-2">
          <UiButton>Default</UiButton>
          <UiButton variant="primary">Primary</UiButton>
          <UiButton variant="secondary">Secondary</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
          <UiButton variant="outline">Outline</UiButton>
          <UiButton variant="danger">Danger</UiButton>
          <UiButton variant="warning">Warning</UiButton>
          <UiButton variant="success">Success</UiButton>
          <UiButton variant="info">Info</UiButton>
          <UiButton variant="link">Link</UiButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UiButton size="xs">XS</UiButton>
          <UiButton size="sm">Small</UiButton>
          <UiButton>Medium</UiButton>
          <UiButton size="lg">Large</UiButton>
          <UiButton variant="primary" loading>Loading</UiButton>
          <UiButton variant="primary" disabled>Disabled</UiButton>
          <UiButton variant="ghost" circle aria-label="Close">✕</UiButton>
          <UiButton variant="primary" outline>Outline primary</UiButton>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Form controls</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <UiFormField label="Note title" required description="Used in the note list.">
            <UiInput v-model="inputValue" />
          </UiFormField>
          <UiFormField label="Theme">
            <UiSelect v-model="selectValue" :options="selectOptions" />
          </UiFormField>
          <UiFormField label="Textarea">
            <UiTextarea v-model="textareaValue" :rows="3" />
          </UiFormField>
          <div class="space-y-3">
            <label class="flex items-center justify-between gap-4">
              <span class="ui-label-text">Switch</span>
              <UiSwitch v-model="switchValue" />
            </label>
            <label class="flex items-center justify-between gap-4">
              <span class="ui-label-text">Checkbox</span>
              <UiCheckbox v-model="checkboxValue" />
            </label>
            <div class="flex items-center gap-2">
              <UiSpinner size="xs" />
              <UiSpinner size="sm" />
              <UiSpinner />
              <UiSpinner size="lg" />
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Feedback</h2>
        <div class="flex flex-wrap gap-2">
          <UiBadge>Default</UiBadge>
          <UiBadge variant="primary">Primary</UiBadge>
          <UiBadge variant="danger">Danger</UiBadge>
          <UiBadge variant="success">Success</UiBadge>
          <UiBadge variant="warning">Warning</UiBadge>
          <UiBadge variant="info">Info</UiBadge>
        </div>
        <UiAlert variant="info" title="Info">This is an informational alert.</UiAlert>
        <UiAlert variant="warning" title="Warning">Check your sync configuration.</UiAlert>
        <UiAlert variant="danger" title="Error">Something went wrong.</UiAlert>
        <div class="flex flex-wrap gap-2">
          <UiButton size="sm" @click="showInfo('Info toast')">Info toast</UiButton>
          <UiButton size="sm" @click="showSuccess('Success toast')">Success toast</UiButton>
          <UiButton size="sm" @click="showWarning('Warning toast')">Warning toast</UiButton>
          <UiButton size="sm" @click="showError('Error toast')">Error toast</UiButton>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Overlays</h2>
        <div class="flex flex-wrap gap-2">
          <UiButton variant="primary" @click="dialogOpen = true">Open dialog</UiButton>
          <UiButton variant="danger" @click="askConfirm">useConfirm()</UiButton>
        </div>
      </section>
    </div>

    <UiDialog v-model:open="dialogOpen" title="Dialog title" description="A native dialog with focus trap."
      width="28rem" ok-text="Save" cancel-text="Cancel" @ok="dialogOpen = false" @close="dialogOpen = false">
      <UiFormField label="Something">
        <UiInput v-model="inputValue" />
      </UiFormField>
    </UiDialog>
  </div>
</template>
