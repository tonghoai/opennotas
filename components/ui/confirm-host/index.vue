<script setup lang="ts">
const { current, isOpen, approve, cancel } = useConfirmHost();
</script>

<template>
  <UiDialog v-if="current" v-model:open="isOpen" width="26rem" :title="current.title" :description="current.message"
    :ok-text="current.okText" :cancel-text="current.cancelText" :ok-variant="current.okVariant || 'primary'"
    @ok="approve" @close="cancel" />
</template>
