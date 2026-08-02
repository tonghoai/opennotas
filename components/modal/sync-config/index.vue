<script setup lang="ts">
const props = defineProps<{ value: string }>();
const emit = defineEmits<{ (e: 'confirm', value: string): void; (e: 'close'): void }>();

const draft = ref(props.value);
watch(() => props.value, (v) => { draft.value = v; });

const handleConfirm = () => emit('confirm', draft.value);
const handleClickClose = () => {
  draft.value = props.value;
  emit('close');
};
</script>

<template>
  <dialog id="modal-sync-config" class="modal modal-top lg:modal-middle backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg pr-8">{{ $t('app.setting_sync_config_title') }}</h3>
      <div class="pt-4">
        <textarea v-model="draft" rows="8" class="textarea textarea-bordered w-full font-mono text-sm"></textarea>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm mr-2" @click="handleClickClose">
              {{ $t('app.modal_sync_config_cancel') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleConfirm">
              {{ $t('app.setting_sync_adapter_save') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
