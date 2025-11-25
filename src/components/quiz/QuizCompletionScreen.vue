<template>
  <div class="min-h-[calc(100vh-200px)] bg-white flex justify-center px-4 py-8 sm:py-12">
    <div class="max-w-2xl w-full text-center space-y-6 sm:space-y-8">
      <!-- Main Heading -->
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-700">
        {{ headingText }}
      </h1>

      <!-- Success GIF Icon -->
      <div class="flex justify-center">
        <img :src="success" alt="Success" class="w-[96px] h-[96px] sm:w-[120px] sm:h-[120px]" />
      </div>

      <!-- Score Section -->
      <div class="space-y-4 sm:space-y-5">
        <p class="text-base sm:text-lg text-neutral-600 font-medium">
          {{ t('pages.quiz.completion.yourScore') }}
        </p>
        <div class="flex justify-center items-center py-2">
          <div class="scale-[1.67] sm:scale-[2.22] md:scale-[2.5] origin-center">
            <BaseCircularProgress
              :value="scorePercentage"
              :max="100"
              size="sm"
              :color="isPassed ? 'success' : 'error'"
            />
          </div>
        </div>
      </div>

      <!-- Message Section -->
      <div>
        <p
          v-if="displayMessage"
          class="text-base sm:text-lg md:text-xl text-neutral-700 font-semibold px-4"
        >
          {{ displayMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseCircularProgress } from '@/components/common'
import { t } from '@/utils/i18n'
import success from '@/assets/gif/success.gif'
import type { QuizInfo } from '@/types/Quiz'

interface Props {
  quizData: QuizInfo
}

const props = defineProps<Props>()

const scorePercentage = computed(() => {
  return Math.round(props.quizData.execution?.percentage ?? 0)
})

const isPassed = computed(() => {
  // If minWeight is set, check if score meets the requirement
  if (props.quizData.minWeight !== null && props.quizData.minWeight !== undefined) {
    return scorePercentage.value >= props.quizData.minWeight
  }

  // If no minWeight, consider COMPLETED as passed
  return true
})

const headingText = computed(() => {
  // If passed, show congratulations
  if (isPassed.value) {
    return t('pages.quiz.completion.congratulations')
  }

  // If not passed but completed, show better luck
  return t('pages.quiz.completion.betterLuck')
})

const displayMessage = computed(() => {
  // Show minWeightMessage if it exists (for both pass and fail)
  if (props.quizData.minWeightMessage) {
    return props.quizData.minWeightMessage
  }
  return null
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
