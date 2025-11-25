<template>
  <div
    v-if="isLoading"
    class="fixed inset-0 z-[99999999] flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="flex flex-col items-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-550"
      ></div>
      <p v-if="message" class="mt-4 text-white text-sm font-medium">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  isLoading: boolean
  message?: string
}>()
</script>
