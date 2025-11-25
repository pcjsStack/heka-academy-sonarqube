<script setup lang="ts">
import { BasePopupModal, BaseButton, BaseText } from '@/components/common'
import success from '@/assets/gif/success.gif'
import { t } from '@/utils/i18n'

const emit = defineEmits<{
  close: []
}>()

const handleDone = () => {
  emit('close')
}
</script>

<template>
  <BasePopupModal
    :title="t('pages.course.publishSuccess.title')"
    size="md"
    :close-button="true"
    :is-header="true"
    @on-close="handleDone"
  >
    <div class="flex flex-col items-center px-6 py-8">
      <div class="mb-6">
        <div class="relative">
          <div class="flex items-center justify-center">
            <img
              :src="success"
              alt="Success"
              class="mx-auto w-[96px] h-[96px] sm:mb-[40px] mb-[22px]"
            />
          </div>
        </div>
      </div>

      <BaseText
        :text="t('pages.course.publishSuccess.message')"
        color="neutral"
        :tone="600"
        font="regular"
        type="p-md"
        class="text-center mb-8 leading-relaxed"
      />

      <!-- Done Button -->
      <BaseButton
        :text="t('pages.course.publishSuccess.done')"
        color="primary"
        variant="default"
        size="md"
        @on-click="handleDone"
        class="px-8"
      />
    </div>
  </BasePopupModal>
</template>

<style scoped>
@keyframes success-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.animate-pulse {
  animation: success-pulse 2s ease-in-out infinite;
}

@keyframes success-ping {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  75%,
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ping {
  animation: success-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
