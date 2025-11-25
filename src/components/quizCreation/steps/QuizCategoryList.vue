<script setup lang="ts">
import { BaseText, BaseButton, BaseIcon } from '@/components/common'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import type { MenuItem } from '@/components/ThreeDotMenu.vue'
import { t } from '@/utils/i18n'
import type { QuizCategory } from '@/types/QuizCreation'
import type { Icons } from '@/types/Styles'

interface Props {
  categories: QuizCategory[]
  isReadOnly?: boolean
}

withDefaults(defineProps<Props>(), {
  isReadOnly: false,
})

const emit = defineEmits<{
  toggleCategory: [categoryId: string]
  addQuestion: [categoryId: string]
  editCategory: [categoryId: string]
  deleteCategory: [categoryId: string]
  editQuestion: [categoryId: string, questionId: string]
  deleteQuestion: [categoryId: string, questionId: string]
}>()

const getCategoryQuestionCount = (category: QuizCategory) => {
  return category.questions.length
}

const getCategoryCurrentWeight = (category: QuizCategory) => {
  return category.questions.reduce((sum, q) => sum + parseInt(q.weight || '0', 10), 0)
}

const getCategoryWeightDisplay = (category: QuizCategory) => {
  const current = getCategoryCurrentWeight(category)
  const total = parseInt(category.weight || '0', 10)
  const isValid = current === total
  return { current, total, isValid }
}

const getCategoryMenuItems = (categoryId: string): MenuItem[] => {
  return [
    {
      label: t('pages.quizCreation.questions.edit'),
      icon: 'edit' as Icons,
      action: () => {
        emit('editCategory', categoryId)
      },
    },
    {
      label: t('pages.quizCreation.questions.delete'),
      icon: 'delete' as Icons,
      danger: true,
      action: () => {
        emit('deleteCategory', categoryId)
      },
    },
  ]
}

const getQuestionMenuItems = (categoryId: string, questionId: string): MenuItem[] => {
  return [
    {
      label: t('pages.quizCreation.questions.edit'),
      icon: 'edit' as Icons,
      action: () => emit('editQuestion', categoryId, questionId),
    },
    {
      label: t('pages.quizCreation.questions.delete'),
      icon: 'delete' as Icons,
      danger: true,
      action: () => emit('deleteQuestion', categoryId, questionId),
    },
  ]
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="category in categories"
      :key="category.id"
      class="bg-grey-50 rounded-lg border border-grey-200"
    >
      <!-- Category Header -->
      <div class="flex items-center justify-between p-4">
        <div
          @click="emit('toggleCategory', category.id)"
          class="flex items-center gap-3 flex-1 cursor-pointer"
        >
          <button class="flex-shrink-0">
            <BaseIcon
              :name="category.expanded ? 'chevron-up' : 'chevron-down'"
              size="xs"
              color="neutral"
              class="text-grey-800"
            />
          </button>
          <BaseText
            :text="category.title"
            font="semibold"
            class="!text-[14px] !leading-[17px] !text-black/85"
          />
        </div>

        <div class="flex items-center gap-6">
          <!-- Add Question Button -->
          <BaseButton
            v-if="!isReadOnly"
            :text="t('pages.quizCreation.questions.addQuestion')"
            variant="link"
            color="primary"
            size="sm"
            @onClick="emit('addQuestion', category.id)"
            class="!font-medium"
          />

          <!-- Question Count Icon -->
          <div class="flex items-center gap-2">
            <BaseIcon name="list-view" size="2xs" color="neutral" class="text-grey-800" />
            <BaseText
              :text="getCategoryQuestionCount(category).toString()"
              class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
            />
          </div>

          <!-- Current/Total Weight -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <BaseIcon name="shopping-bag" size="xs" color="neutral" class="text-grey-800" />
              <BaseText
                :text="`${getCategoryWeightDisplay(category).current}/${getCategoryWeightDisplay(category).total}`"
                :class="[
                  '!text-[14px] !leading-[17px] !font-medium',
                  getCategoryWeightDisplay(category).isValid ? '!text-black/85' : '!text-error-500',
                ]"
              />
            </div>
            <!-- Total Weight -->
            <div class="flex items-center gap-2">
              <BaseIcon name="shopping-bag" size="xs" color="neutral" class="text-grey-800" />
              <BaseText
                :text="category.weight"
                class="!text-[14px] !leading-[17px] !text-black/85 !font-medium"
              />
            </div>
          </div>

          <!-- Three Dot Menu -->
          <ThreeDotMenu
            v-if="!isReadOnly"
            :items="getCategoryMenuItems(category.id)"
            iconClass="!z-[999]"
          />
        </div>
      </div>

      <!-- Category Questions (when expanded) -->
      <div v-if="category.expanded" class="px-4 pb-4 pt-2 space-y-3">
        <div v-if="category.questions.length === 0" class="py-6 text-center">
          <BaseText
            :text="t('pages.quizCreation.questions.noQuestionsInCategory')"
            class="!text-neutral-700 !text-[14px] !leading-[17px] mb-0"
          />
        </div>

        <!-- Questions List -->
        <div
          v-for="(question, qIndex) in category.questions"
          :key="question.id"
          class="flex items-center justify-between pl-8 pr-2 py-2 bg-white rounded-lg"
        >
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <!-- Question Number Badge -->
            <span
              class="px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-550 flex-shrink-0"
            >
              {{ qIndex + 1 }}
            </span>
            <div
              class="flex-1 min-w-0 overflow-hidden !text-[14px] !leading-[17px] !text-black/85 !font-medium"
              v-safe-html="question.title"
            />
          </div>

          <div class="flex items-center gap-4">
            <!-- Question Weight -->
            <div class="flex items-center gap-1">
              <BaseIcon name="shopping-bag" size="xs" color="neutral" class="text-grey-800" />
              <BaseText
                :text="question.weight"
                class="!text-[14px] !leading-[17px] !text-black/85 !font-medium"
              />
            </div>

            <!-- Rating Type (if applicable) -->
            <div v-if="question.type" class="flex items-center gap-1">
              <BaseIcon name="stars" size="xs" color="neutral" class="text-grey-800" />
              <BaseText
                :text="question.type"
                class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
              />
            </div>

            <!-- Attachments Count -->
            <div class="flex items-center gap-1">
              <BaseIcon name="attachment" size="xs" color="neutral" class="text-grey-800" />
              <BaseText
                :text="question.attachments.length.toString()"
                class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
              />
            </div>

            <!-- Question Three Dot Menu -->
            <ThreeDotMenu
              v-if="!isReadOnly"
              :items="getQuestionMenuItems(category.id, question.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
