<script setup lang="ts">
import { X } from '~/utils/icons';
const emit = defineEmits(['close']);

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-alert-set-password"
    class="ui-modal ui-modal-top">
    <div class="ui-modal-box mx-auto p-5 lg:p-6 w-5/6 lg:w-96 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">{{ $t('app.modal_alert_set_password_title') }}</h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_alert_set_password_content') }}</div>

        <div class="ui-modal-action">
          <form method="dialog">
            <button class="ui-btn ui-btn-sm ui-btn-primary">
              {{ $t('app.modal_alert_set_password_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
