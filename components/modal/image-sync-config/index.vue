<script setup lang="ts">
import Eye from '~/assets/svg/eye.svg?component';
import EyeOff from '~/assets/svg/eye-off.svg?component';

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
    class="modal modal-top lg:modal-middle backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg pr-8">{{ $t('app.setting_image_sync_config_title') }}</h3>

      <div class="pt-4 space-y-3">
        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs">{{ $t('app.setting_image_sync_s3_endpoint') }}</span>
          </div>
          <input v-model="s3Config.s3Endpoint" type="text" placeholder="https://s3.amazonaws.com"
            class="input input-sm input-bordered w-full" autocomplete="off" />
        </label>

        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs">{{ $t('app.setting_image_sync_s3_access_key') }}</span>
          </div>
          <div class="join w-full">
            <input v-model="s3Config.s3AccessKey" :type="isAccessKeyVisible ? 'text' : 'password'"
              placeholder="AKIAIOSFODNN7EXAMPLE" class="input input-sm input-bordered w-full join-item"
              autocomplete="off" />
            <button type="button" class="btn btn-sm btn-square join-item border border-base-content/20"
              @click="isAccessKeyVisible = !isAccessKeyVisible">
              <EyeOff v-if="isAccessKeyVisible" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </label>

        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs">{{ $t('app.setting_image_sync_s3_secret_key') }}</span>
          </div>
          <div class="join w-full">
            <input v-model="s3Config.s3SecretKey" :type="isSecretKeyVisible ? 'text' : 'password'"
              placeholder="••••••••" class="input input-sm input-bordered w-full join-item" autocomplete="off" />
            <button type="button" class="btn btn-sm btn-square join-item border border-base-content/20"
              @click="isSecretKeyVisible = !isSecretKeyVisible">
              <EyeOff v-if="isSecretKeyVisible" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </label>

        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs">{{ $t('app.setting_image_sync_s3_bucket') }}</span>
          </div>
          <input v-model="s3Config.s3Bucket" type="text" placeholder="my-bucket"
            class="input input-sm input-bordered w-full" autocomplete="off" />
        </label>

        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs">{{ $t('app.setting_image_sync_worker_url') }}</span>
            <span class="label-text-alt text-xs">{{ $t('app.setting_image_sync_worker_url_optional') }}</span>
          </div>
          <input v-model="s3Config.workerUrl" type="text"
            :placeholder="$t('app.setting_image_sync_worker_url_placeholder')"
            class="input input-sm input-bordered w-full" autocomplete="off" />
        </label>

        <button class="btn btn-sm w-full !text-sm" :class="{
          'btn-success': testStatus === 'success',
          'btn-error': testStatus === 'failed',
          'btn-outline': testStatus === 'idle'
        }" :disabled="testStatus === 'testing' || !isComplete" @click="emit('test')">
          <span v-if="testStatus === 'idle'">{{ $t('app.setting_image_sync_test_connection') }}</span>
          <span v-else-if="testStatus === 'testing'" class="loading loading-spinner loading-sm"></span>
          <span v-else-if="testStatus === 'success'">{{ $t('app.setting_image_sync_connected') }}</span>
          <span v-else-if="testStatus === 'failed'">{{ $t('app.setting_image_sync_failed') }}</span>
        </button>

        <p class="text-xs text-base-content/60">
          {{ $t('app.setting_image_sync_hint') }}
        </p>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm mr-2" @click="handleClickClose">
              {{ $t('app.modal_image_sync_config_cancel') }}
            </button>
            <button class="btn btn-sm btn-primary" :disabled="!isDirty" @click="emit('save')">
              {{ $t('app.setting_image_sync_save') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
