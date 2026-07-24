<script lang="ts" setup>
const runtimeConfig = useRuntimeConfig();

onMounted(() => {
  if (runtimeConfig.public.env === 'production') {
    setTimeout(() => {
      addGtagScript(runtimeConfig.public.ga);
    }, 3000);
  }
});
</script>

<template>
  <NuxtPage />
</template>
