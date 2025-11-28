<template>
  <BaseSideModal
    :size="'md'"
    :title="t('pages.lessonCompleted.title')"
    :close-button="true"
    custom-class="left-0 lg:left-auto lg:right-0"
    :z-index="9999999"
    @on-close="handleClose"
    @on-background-click="handleClose"
    class="lesson-completed-modal"
  >
    <!-- Main Content Area -->
    <div class="flex flex-col h-full">
      <!-- Content Area - takes up available space -->
      <div class="flex flex-col items-center justify-center px-4 lg:px-6 flex-1">
        <!-- Achievement Section -->
        <img
          :src="success"
          alt="Success"
          class="mx-auto w-[100px] h-[100px] sm:mb-[40px] mb-[22px]"
        />
        <!-- Congratulatory Messages -->
        <div class="text-center space-y-2 lg:space-y-3 max-w-[330px]">
          <p class="text-base font-medium text-black leading-6 tracking-[-0.02em]">
            {{ t('pages.lessonCompleted.congratulations') }} 🏆
          </p>
          <p class="text-sm font-medium !text-[#637083] leading-[175%] tracking-[-0.02em]">
            {{ t('pages.lessonCompleted.message1').replace('leaderboard!', '')
            }}<span>leaderboard!</span>
          </p>
          <p class="text-sm font-medium !text-[#637083] leading-[175%] tracking-[-0.02em]">
            {{ t('pages.lessonCompleted.message2') }} 🎉
          </p>
        </div>
      </div>

      <!-- Footer Actions - positioned at bottom -->
      <div
        class="flex justify-end space-x-3 pt-6 pb-6 px-4 lg:px-6 border-t border-gray-200 mt-auto"
      >
        <BaseButton
          :text="t('pages.lessonCompleted.returnHome')"
          variant="blank"
          size="sm"
          :full-size="false"
          tailwind-css="!w-auto whitespace-nowrap"
          @onClick="handleReturnHome"
        />
        <BaseButton
          :text="t('pages.lessonCompleted.seeLeaderboard')"
          color="primary"
          variant="default"
          size="sm"
          :full-size="false"
          tailwind-css="!w-auto whitespace-nowrap"
          @onClick="handleSeeLeaderboard"
        />
      </div>
    </div>
  </BaseSideModal>
</template>

<script setup lang="ts">
import { BaseSideModal, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import success from '@/assets/gif/success.gif'

interface LessonCompletedModalProps {
  userName?: string
  position?: number
}

withDefaults(defineProps<LessonCompletedModalProps>(), {
  userName: 'Jenny Wilson',
  position: 1,
})

const emit = defineEmits<{
  close: []
  returnHome: []
  seeLeaderboard: []
}>()

const handleClose = () => {
  emit('close')
}

const handleReturnHome = () => {
  emit('returnHome')
}

const handleSeeLeaderboard = () => {
  emit('seeLeaderboard')
}
</script>

<style scoped>
.lesson-completed-modal {
  z-index: 60;
}

/* Ensure the modal content uses full height and proper flex layout */
.lesson-completed-modal :deep(.base-side-modal-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.lesson-completed-modal :deep(.base-side-modal-body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* Ensure the main content area takes full height */
.lesson-completed-modal :deep(.base-side-modal-body) > div:first-child {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
