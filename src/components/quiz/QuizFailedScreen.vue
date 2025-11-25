<template>
  <div class="min-h-[calc(100vh-200px)] bg-white flex justify-center px-4 py-8 sm:py-12">
    <div class="max-w-2xl w-full text-center space-y-6 sm:space-y-8">
      <!-- Main Heading -->
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-700">
        {{ t('pages.quiz.failed.heading') }}
      </h1>

      <!-- Sad Face Emoji -->
      <div class="flex justify-center">
        <BaseIcon name="sad" size="4xl" color="error" />
      </div>

      <!-- Score Section -->
      <div class="space-y-4 sm:space-y-5">
        <p class="text-base sm:text-lg text-neutral-600 font-medium">
          {{ t('pages.quiz.completion.yourScore') }}
        </p>
        <div class="flex justify-center items-center py-2">
          <div class="scale-[1.67] sm:scale-[2.22] md:scale-[2.5] origin-center">
            <BaseCircularProgress :value="scorePercentage" :max="100" size="sm" color="error" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseCircularProgress, BaseIcon } from '@/components/common'
import { t } from '@/utils/i18n'
import type { QuizInfo } from '@/types/Quiz'

interface Props {
  quizData: QuizInfo
}

const props = defineProps<Props>()

const scorePercentage = computed(() => {
  return Math.round(props.quizData.execution?.percentage ?? 0)
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
