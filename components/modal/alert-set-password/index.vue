<template>
  <dialog id="modal-alert-set-password" class="modal modal-top lg:modal-middle">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_alert_set_password_title') }}</h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_alert_set_password_content') }}</div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm lg:btn-md btn-primary">
              {{ $t('app.modal_alert_set_password_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
