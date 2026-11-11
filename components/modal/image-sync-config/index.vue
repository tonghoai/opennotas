<script setup lang="ts">
import { Eye } from '~/utils/icons';
import { X } from '~/utils/icons';
import { EyeOff } from '~/utils/icons';

defineProps<{
  s3Config: {
    s3Endpoint: string;
    s3AccessKey: string;
    s3SecretKey: string;
    s3Bucket: string;
    workerUrl: string;
  };
  isDirty: boolean;
  isComplete: boolean;
  testStatus: 'idle' | 'testing' | 'success' | 'failed';
}>();

const emit = defineEmits(['save', 'test', 'close']);

const handleClickClose = () => emit('close');

const isAccessKeyVisible = ref(false);
const isSecretKeyVisible = ref(false);
</script>

<template>
  <dialog id="modal-image-sync-config"
    class="ui-modal ui-modal-top">
    <div class="ui-modal-box mx-auto p-5 lg:p-6 w-5/6 lg:w-96 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">{{ $t('app.setting_image_sync_config_title') }}</h3>

      <div class="pt-4 space-y-3">
        <label class="ui-form-control w-full">
          <div class="ui-label py-1">
            <span class="ui-label-text text-xs">{{ $t('app.setting_image_sync_s3_endpoint') }}</span>
          </div>
          <input v-model="s3Config.s3Endpoint" type="text" placeholder="https://s3.amazonaws.com"
            class="ui-input ui-input-sm ui-input-bordered w-full" autocomplete="off" />
        </label>

        <label class="ui-form-control w-full">
          <div class="ui-label py-1">
            <span class="ui-label-text text-xs">{{ $t('app.setting_image_sync_s3_access_key') }}</span>
          </div>
          <div class="ui-join w-full">
            <input v-model="s3Config.s3AccessKey" :type="isAccessKeyVisible ? 'text' : 'password'"
              placeholder="AKIAIOSFODNN7EXAMPLE" class="ui-input ui-input-sm ui-input-bordered w-full ui-join-item"
              autocomplete="off" />
            <button type="button" class="ui-btn ui-btn-sm ui-btn-square ui-join-item border border-border"
              @click="isAccessKeyVisible = !isAccessKeyVisible">
              <EyeOff v-if="isAccessKeyVisible" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </label>

        <label class="ui-form-control w-full">
          <div class="ui-label py-1">
            <span class="ui-label-text text-xs">{{ $t('app.setting_image_sync_s3_secret_key') }}</span>
          </div>
          <div class="ui-join w-full">
            <input v-model="s3Config.s3SecretKey" :type="isSecretKeyVisible ? 'text' : 'password'"
              placeholder="••••••••" class="ui-input ui-input-sm ui-input-bordered w-full ui-join-item" autocomplete="off" />
            <button type="button" class="ui-btn ui-btn-sm ui-btn-square ui-join-item border border-border"
              @click="isSecretKeyVisible = !isSecretKeyVisible">
              <EyeOff v-if="isSecretKeyVisible" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </label>

        <label class="ui-form-control w-full">
          <div class="ui-label py-1">
            <span class="ui-label-text text-xs">{{ $t('app.setting_image_sync_s3_bucket') }}</span>
          </div>
          <input v-model="s3Config.s3Bucket" type="text" placeholder="my-bucket"
            class="ui-input ui-input-sm ui-input-bordered w-full" autocomplete="off" />
        </label>

        <label class="ui-form-control w-full">
          <div class="ui-label py-1">
            <span class="ui-label-text text-xs">{{ $t('app.setting_image_sync_worker_url') }}</span>
            <span class="ui-label-text-alt text-xs">{{ $t('app.setting_image_sync_worker_url_optional') }}</span>
          </div>
          <input v-model="s3Config.workerUrl" type="text"
            :placeholder="$t('app.setting_image_sync_worker_url_placeholder')"
            class="ui-input ui-input-sm ui-input-bordered w-full" autocomplete="off" />
        </label>

        <button class="ui-btn ui-btn-sm w-full !text-sm" :class="{
          'ui-btn-success': testStatus === 'success',
          'ui-btn-danger': testStatus === 'failed',
          'ui-btn-outline': testStatus === 'idle'
        }" :disabled="testStatus === 'testing' || !isComplete" @click="emit('test')">
          <span v-if="testStatus === 'idle'">{{ $t('app.setting_image_sync_test_connection') }}</span>
          <span v-else-if="testStatus === 'testing'" class="ui-loading ui-loading-spinner ui-loading-sm"></span>
          <span v-else-if="testStatus === 'success'">{{ $t('app.setting_image_sync_connected') }}</span>
          <span v-else-if="testStatus === 'failed'">{{ $t('app.setting_image_sync_failed') }}</span>
        </button>

        <p class="text-xs text-muted-foreground">
          {{ $t('app.setting_image_sync_hint') }}
        </p>

        <div class="ui-modal-action">
          <form method="dialog">
            <button class="ui-btn ui-btn-sm mr-2" @click="handleClickClose">
              {{ $t('app.modal_image_sync_config_cancel') }}
            </button>
            <button class="ui-btn ui-btn-sm ui-btn-primary" :disabled="!isDirty" @click="emit('save')">
              {{ $t('app.setting_image_sync_save') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
