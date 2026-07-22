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
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
];

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
  <dialog id="modal-tag-form" :key="modalTagFormKey"
    class="modal modal-top lg:modal-middle backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">
        {{ isEditMode ? $t('app.modal_tag_form_title_edit') : $t('app.modal_tag_form_title_create') }}
      </h3>
      <div class="pt-4">
        <label class="form-control w-full">
          <div class="label">
            <span class="font-semibold label-text">{{ $t('app.modal_tag_form_input_name') }}</span>
          </div>
          <input v-model="newTagName" type="text" class="input input-sm lg:input-md input-bordered w-full"
            @keydown.enter="handleConfirmTagForm" autocomplete="off" autofocus />
        </label>

        <div class="mt-4">
          <div class="label">
            <span class="font-semibold label-text">{{ $t('app.modal_tag_form_input_color') }}</span>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <button v-for="color in presetColors" :key="color" type="button"
              class="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
              :class="{ 'ring-2 ring-offset-2 ring-base-content ring-offset-base-100': selectedColor === color }"
              :style="{ backgroundColor: color }" @click="handleClickPresetColor(color)"></button>

            <button type="button"
              class="w-7 h-7 rounded-full shrink-0 flex items-center justify-center border-2 border-dashed border-base-content/40"
              :class="{ 'ring-2 ring-offset-2 ring-base-content ring-offset-base-100 border-solid': isCustomColor }"
              :style="isCustomColor ? { backgroundColor: selectedColor, borderStyle: 'solid' } : {}"
              :title="$t('app.modal_tag_form_custom_color')" @click="handleClickCustomColor">
              <span v-if="!isCustomColor" class="text-xs">+</span>
            </button>
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn btn-sm mr-2">{{ $t('app.modal_tag_form_cancel') }}</button>
            <button class="btn btn-sm btn-primary" :disabled="!isValidate" @click="handleConfirmTagForm">{{
              $t('app.modal_tag_form_ok') }}</button>
          </form>
        </div>
      </div>
    </div>
  </dialog>

  <ModalTagColorCustom v-if="isShowModalTagColorCustom" @confirm="handleConfirmCustomColor"
    @close="handleCloseModalTagColorCustom" />
</template>
