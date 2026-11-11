<script setup lang="ts">
const props = defineProps([
  'tagId',
  'tagName',
  'tagColor',
]);

const emit = defineEmits([
  'confirm',
  'close',
]);

const presetColors = [
  '#c97a86',
  '#d99a5f',
  '#c9a45b',
  '#7aa88b',
  '#5fa3a0',
  '#6f8fc4',
  '#8583c2',
  '#9a85c9',
  '#c47aa6',
];

const { t } = useI18n();
const modalTagFormKey = ref(0);
const newTagName = ref<string>(props.tagName || '');
const selectedColor = ref<string>(props.tagColor || presetColors[0]);
watch(() => [props.tagName, props.tagColor], ([newName, newColor]) => {
  modalTagFormKey.value++;
  newTagName.value = newName || '';
  selectedColor.value = newColor || presetColors[0];
});

const isCustomColor = computed(() => !presetColors.includes(selectedColor.value));
const isValidate = computed(() => newTagName.value.length > 0);
const isEditMode = computed(() => !!props.tagId);
const dialogTitle = computed(() => isEditMode.value
  ? t('app.modal_tag_form_title_edit')
  : t('app.modal_tag_form_title_create'));

const handleClickPresetColor = (color: string) => {
  selectedColor.value = color;
};

const isShowModalTagColorCustom = ref<boolean>(false);
const handleClickCustomColor = () => {
  toggleModalTagColorCustom(true, isShowModalTagColorCustom);
};
const handleCloseModalTagColorCustom = () => {
  toggleModalTagColorCustom(false, isShowModalTagColorCustom);
};
const handleConfirmCustomColor = (hex: string) => {
  selectedColor.value = hex;
  toggleModalTagColorCustom(false, isShowModalTagColorCustom);
};

const handleConfirmTagForm = (e: Event) => {
  if (!isValidate.value) {
    e.preventDefault();
    return;
  }

  e.preventDefault();

  emit('confirm', {
    tagId: props.tagId,
    name: newTagName.value,
    color: selectedColor.value,
  });
};

const reset = () => {
  newTagName.value = props.tagName || '';
  selectedColor.value = props.tagColor || presetColors[0];
}

defineExpose({
  reset,
});

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <UiDialog :key="modalTagFormKey" id="modal-tag-form" top width="24rem" :title="dialogTitle" :show-cancel="false"
    :show-ok="false" @close="handleClickClose">
    <UiFormField :label="$t('app.modal_tag_form_input_name')">
      <UiInput v-model="newTagName" size="sm" :data-ga-event="isEditMode ? 'tag_edit' : 'tag_create'"
        @keydown.enter="handleConfirmTagForm" autocomplete="off" autofocus />
    </UiFormField>

    <div class="mt-4">
      <div class="ui-label">
        <span class="font-semibold ui-label-text">{{ $t('app.modal_tag_form_input_color') }}</span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="color in presetColors" :key="color" type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          :class="{ 'ring-2 ring-foreground ring-offset-2 ring-offset-card': selectedColor === color }"
          :style="{ backgroundColor: color }" @click="handleClickPresetColor(color)"></button>

        <button type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border"
          :class="{ 'border-solid ring-2 ring-foreground ring-offset-2 ring-offset-card': isCustomColor }"
          :style="isCustomColor ? { backgroundColor: selectedColor, borderStyle: 'solid' } : {}"
          :title="$t('app.modal_tag_form_custom_color')" @click="handleClickCustomColor">
          <span v-if="!isCustomColor" class="text-xs">+</span>
        </button>
      </div>
    </div>

    <template #footer>
      <UiButton variant="default" size="sm" @click="handleClickClose">
        {{ $t('app.modal_tag_form_cancel') }}
      </UiButton>
      <UiButton variant="primary" size="sm" :disabled="!isValidate"
        :data-ga-event="isEditMode ? 'tag_edit' : 'tag_create'" @click="handleConfirmTagForm">
        {{ $t('app.modal_tag_form_ok') }}
      </UiButton>
    </template>
  </UiDialog>

  <ModalTagColorCustom v-if="isShowModalTagColorCustom" @confirm="handleConfirmCustomColor"
    @close="handleCloseModalTagColorCustom" />
</template>
