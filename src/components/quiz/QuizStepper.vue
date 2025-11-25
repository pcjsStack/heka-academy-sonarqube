<template>
  <div class="w-full py-4 sm:py-4 md:py-3 lg:py-8 border-b border-grey-150 overflow-x-auto">
    <div class="flex items-center justify-center px-4 sm:px-4 md:px-3 lg:px-8 min-w-max">
      <div class="flex items-center gap-4 sm:gap-4 md:gap-5 lg:gap-12 relative">
        <div v-for="(step, index) in steps" :key="step.id" class="flex items-center flex-shrink-0">
          <!-- Step Circle and Labels -->
          <div class="flex flex-col items-center bg-white z-10 relative">
            <!-- Circular Indicator -->
            <div
              :class="[
                'w-8 h-8 sm:w-9 sm:h-9 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs sm:text-xs md:text-xs lg:text-sm font-semibold mb-2 sm:mb-2 md:mb-2 lg:mb-3',
                step.isCompleted
                  ? 'bg-success-500 text-white'
                  : step.isActive
                    ? 'bg-primary-550-10 text-primary-550'
                    : 'bg-grey-50 text-neutral-500',
              ]"
            >
              <svg
                v-if="step.isCompleted"
                class="w-4 h-4 sm:w-4 sm:h-4 md:w-4 md:h-4 lg:w-5 lg:h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span v-else>{{ step.id }}</span>
            </div>

            <!-- Step Labels -->
            <div class="flex flex-col items-center gap-0.5 sm:gap-0.5 md:gap-0.5 lg:gap-1">
              <BaseText
                :text="getStepCategory(step)"
                type="p-sm"
                font="medium"
                class="whitespace-nowrap !text-neutral-500 !text-[10px] sm:!text-[11px] md:!text-[11px] lg:!text-xs"
              />
              <BaseText
                :text="getStepCategoryTitle(step)"
                type="p-sm"
                font="semibold"
                :class="[
                  'whitespace-nowrap !text-xs sm:!text-[13px] md:!text-[13px] lg:!text-sm',
                  step.isCompleted
                    ? '!text-neutral-700'
                    : step.isActive
                      ? '!text-primary-550'
                      : '!text-neutral-500',
                ]"
              />
            </div>
          </div>

          <!-- Connecting Dashed Line -->
          <div
            v-if="index < steps.length - 1"
            :class="[
              'w-12 sm:w-14 md:w-16 lg:w-32 border-t-2 border-dashed mx-2 sm:mx-2.5 md:mx-3 lg:mx-8 flex-shrink-0',
              step.isCompleted ? 'border-success-500' : 'border-grey-300',
            ]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseText } from '@/components/common'
import { t } from '@/utils/i18n'
import type { QuizStep } from '@/types/Quiz'

interface Props {
  steps: QuizStep[]
}

defineProps<Props>()

const getStepCategory = (step: QuizStep): string => {
  return t('pages.quiz.steps.categoryLabel', { number: step.id })
}

const getStepCategoryTitle = (step: QuizStep): string => {
  return step.title
}
</script>
