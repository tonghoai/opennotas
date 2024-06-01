<template>
  <img class="logo-loading" :src="'/logo-icon.png'" height="96" width="96" alt="Loading...">
</template>

<style lang="scss">
.logo-loading {
  opacity: 0.5;
  transform: scale(1);
  animation: logo-scale 500ms infinite alternate;
}

@keyframes logo-scale {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }

  100% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
