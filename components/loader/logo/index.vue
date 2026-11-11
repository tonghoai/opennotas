<template>
  <div class="flex flex-col items-center gap-3">
    <img class="logo-mark" :src="'/logo-icon.png'" height="96" width="96" alt="OpenNotas">
    <UiSpinner size="lg" :label="$t('app.loading')" />
  </div>
</template>

<style lang="scss">
.logo-mark {
  opacity: 0.92;
}
</style>
