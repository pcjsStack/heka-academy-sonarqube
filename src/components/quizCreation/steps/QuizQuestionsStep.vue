<script setup lang="ts">
import { ref, computed } from 'vue'
import { BaseInput, BaseCheckbox, BaseText, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import AddCategoryModal from './AddCategoryModal.vue'
import AddQuestionModal from './AddQuestionModal.vue'
import QuizCategoryList from './QuizCategoryList.vue'
import type { Media } from '@/types/Media'
import type {
  QuizCategory,
  MinimumWeightRule,
  QuizQuestionsData,
  QuizQuestionsExpose,
  StepValidationState,
  QuestionOption,
} from '@/types/QuizCreation'

interface Props {
  isReadOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isReadOnly: false,
})

const emit = defineEmits<{
  'validation-changed': []
}>()

// Categories weight
const categoriesWeightTotal = ref<string>('100')
const categoriesWeightCurrent = ref<number>(0)
const isEditingWeight = ref<boolean>(false)
const weightInput = ref<string>('100')

// Minimum weight to pass
const minimumWeightToPass = ref<boolean>(false)
const minimumWeightRules = ref<MinimumWeightRule[]>([])

// Categories list
const categories = ref<QuizCategory[]>([])

// Modal state
const showAddCategoryModal = ref(false)
const editingCategory = ref<{ id: string; title: string; weight: string } | null>(null)
const showAddQuestionModal = ref(false)
const addingQuestionToCategoryId = ref<string>('')
const editingQuestion = ref<{
  id: string
  categoryId: string
  question: string
  answerType: string
  required: boolean
  photoRequired: string
  comment: string
  attachments: Media[]
  weight: number
  correctAnswer?: string
  options?: QuestionOption[]
} | null>(null)

const handleEditWeight = () => {
  isEditingWeight.value = true
  weightInput.value = categoriesWeightTotal.value
}

const handleConfirmWeight = () => {
  if (props.isReadOnly) return
  categoriesWeightTotal.value = weightInput.value
  isEditingWeight.value = false
  emit('validation-changed')
}

const handleToggleMinimumWeight = () => {
  if (minimumWeightToPass.value && minimumWeightRules.value.length === 0) {
    addMinimumWeightRule()
  }
}

const addMinimumWeightRule = () => {
  if (props.isReadOnly) return
  minimumWeightRules.value.push({
    id: `rule-${Date.now()}-${Math.random()}`,
    weight: '0',
    message: '',
  })
}

const handleAddCategory = () => {
  if (props.isReadOnly) return
  showAddCategoryModal.value = true
}

const handleCategoryConfirm = (data: { id?: string; title: string; weight: string }) => {
  if (props.isReadOnly) return
  if (data.id) {
    // Edit existing category
    const category = categories.value.find((c) => c.id === data.id)
    if (category) {
      category.title = data.title
      category.weight = data.weight
    }
  } else {
    // Add new category
    categories.value.push({
      id: `category-${Date.now()}-${Math.random()}`,
      title: data.title,
      weight: data.weight,
      expanded: false,
      questions: [],
    })
  }

  showAddCategoryModal.value = false
  editingCategory.value = null
  updateCategoriesWeight()
  emit('validation-changed')
}

const handleQuestionConfirm = (data: {
  id?: string
  categoryId: string
  question: string
  answerType: string
  required: boolean
  photoRequired: string
  comment: string
  attachments: Media[]
  weight: number
  correctAnswer?: string
  options?: QuestionOption[]
  fileKeys?: string[]
  removeFileIds?: number[]
}) => {
  if (props.isReadOnly) return
  const category = categories.value.find((c) => c.id === data.categoryId)
  if (category) {
    const questionData = {
      title: data.question,
      weight: String(data.weight),
      type: data.answerType,
      required: data.required,
      photoRequired: data.photoRequired,
      comment: data.comment,
      attachments: data.attachments,
      correctAnswer: data.correctAnswer,
      options: data.options,
      fileKeys: data.fileKeys,
      removeFileIds: data.removeFileIds,
    }

    if (data.id) {
      // Edit existing question using the ID from the data
      const questionIndex = category.questions.findIndex((q) => q.id === data.id)
      if (questionIndex !== -1 && category.questions[questionIndex]) {
        category.questions[questionIndex] = {
          id: category.questions[questionIndex].id,
          ...questionData,
        }
      }
    } else {
      // Add new question
      category.questions.push({
        id: `question-${Date.now()}-${Math.random()}`,
        ...questionData,
      })
    }
    updateCategoriesWeight()
    emit('validation-changed')
  }
}

// Get current weight used by questions in a category
const getCategoryCurrentQuestionWeight = (categoryId: string): number => {
  const category = categories.value.find((c) => c.id === categoryId)
  if (!category) return 0

  return category.questions.reduce((sum, question) => {
    // Exclude the weight of the question being edited
    if (editingQuestion.value && question.id === editingQuestion.value.id) {
      return sum
    }
    return sum + parseInt(question.weight || '0', 10)
  }, 0)
}

// Get category's total weight
const getCategoryTotalWeight = (categoryId: string): number => {
  const category = categories.value.find((c) => c.id === categoryId)
  if (!category) return 0

  return parseInt(category.weight || '0', 10)
}

const toggleCategory = (categoryId: string) => {
  const category = categories.value.find((cat) => cat.id === categoryId)
  if (category) {
    category.expanded = !category.expanded
  }
}

const handleEditCategory = (categoryId: string) => {
  if (props.isReadOnly) return
  const category = categories.value.find((c) => c.id === categoryId)
  if (category) {
    editingCategory.value = {
      id: category.id,
      title: category.title,
      weight: category.weight,
    }
    showAddCategoryModal.value = true
  }
}

const handleDeleteCategory = (categoryId: string) => {
  if (props.isReadOnly) return
  categories.value = categories.value.filter((cat) => cat.id !== categoryId)
  updateCategoriesWeight()
  emit('validation-changed')
}

const handleAddQuestion = (categoryId: string) => {
  addingQuestionToCategoryId.value = categoryId
  editingQuestion.value = null
  showAddQuestionModal.value = true
}

const handleEditQuestion = (categoryId: string, questionId: string) => {
  const category = categories.value.find((c) => c.id === categoryId)
  if (category) {
    const question = category.questions.find((q) => q.id === questionId)
    if (question) {
      editingQuestion.value = {
        id: question.id,
        categoryId: categoryId,
        question: question.title,
        answerType: question.type,
        required: question.required,
        photoRequired: question.photoRequired,
        comment: question.comment,
        attachments: question.attachments,
        weight: parseInt(question.weight || '0', 10),
        correctAnswer: question.correctAnswer,
        options: question.options,
      }
      addingQuestionToCategoryId.value = categoryId
      showAddQuestionModal.value = true
    }
  }
}

const handleDeleteQuestion = (categoryId: string, questionId: string) => {
  const cat = categories.value.find((c) => c.id === categoryId)
  if (cat) {
    cat.questions = cat.questions.filter((q) => q.id !== questionId)
    updateCategoriesWeight()
    emit('validation-changed')
  }
}

const updateCategoriesWeight = () => {
  categoriesWeightCurrent.value = categories.value.reduce(
    (sum, cat) => sum + parseInt(cat.weight || '0', 10),
    0,
  )
  emit('validation-changed')
}

const weightDisplay = computed(() => {
  const current = categoriesWeightCurrent.value
  const total = parseInt(categoriesWeightTotal.value || '100', 10)
  return `${current}/${total}`
})

const isWeightValid = computed(() => {
  const current = categoriesWeightCurrent.value
  const total = parseInt(categoriesWeightTotal.value || '100', 10)
  return current === total
})

const weightColorClass = computed(() => {
  if (categoriesWeightCurrent.value === 0) return 'bg-[rgba(239,68,68,0.1)] text-error-500'
  if (isWeightValid.value) return 'bg-[rgba(34,197,94,0.1)] text-success-500'
  return 'bg-[rgba(239,68,68,0.1)] text-error-500'
})

// Validation
const validateQuestions = (): StepValidationState => {
  const errors: string[] = []

  // At least one category is required
  if (categories.value.length === 0) {
    errors.push('At least one category is required')
  }

  // Check if category weights are valid (current must equal total)
  if (!isWeightValid.value) {
    errors.push('Category weights must equal the total weight')
  }

  // Validate each category
  categories.value.forEach((category) => {
    // Each category must have at least one question
    if (category.questions.length === 0) {
      errors.push(`Category "${category.title}" must have at least one question`)
    }

    // Sum of question weights in a category must equal the category weight
    const categoryWeight = parseInt(category.weight || '0', 10)
    const questionsWeightSum = category.questions.reduce((sum, question) => {
      return sum + parseInt(question.weight || '0', 10)
    }, 0)

    if (questionsWeightSum !== categoryWeight) {
      errors.push(
        `Category "${category.title}" question weights (${questionsWeightSum}) must equal category weight (${categoryWeight})`,
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Expose getter/setter to parent component
defineExpose<QuizQuestionsExpose>({
  getQuestions: () => {
    const validation = validateQuestions()
    return {
      categoriesWeightTotal: categoriesWeightTotal.value,
      categoriesWeightCurrent: categoriesWeightCurrent.value,
      minimumWeightToPass: minimumWeightToPass.value,
      minimumWeightRules: minimumWeightRules.value,
      categories: categories.value,
      ...validation,
    }
  },
  setQuestions: (values: Partial<QuizQuestionsData>) => {
    if (!values) return
    if (values.categoriesWeightTotal !== undefined)
      categoriesWeightTotal.value = values.categoriesWeightTotal
    if (values.categoriesWeightCurrent !== undefined)
      categoriesWeightCurrent.value = values.categoriesWeightCurrent
    if (values.minimumWeightToPass !== undefined)
      minimumWeightToPass.value = values.minimumWeightToPass
    if (values.minimumWeightRules !== undefined)
      minimumWeightRules.value = values.minimumWeightRules
    if (values.categories !== undefined) categories.value = values.categories
  },
})
</script>

<template>
  <div class="max-w-[816px] mx-auto">
    <!-- Categories Weight Section -->
    <div class="flex items-center gap-3 md:gap-2.5 lg:gap-3 mb-6 md:mb-5 lg:mb-6 w-full">
      <div
        class="flex items-center gap-3 md:gap-2.5 lg:gap-3 w-full min-h-[52px] md:min-h-[48px] lg:min-h-[52px]"
      >
        <span
          :class="[
            'px-3 md:px-2.5 lg:px-3 py-1 rounded-full text-sm md:text-xs lg:text-sm font-medium whitespace-nowrap',
            weightColorClass,
          ]"
        >
          {{ t('pages.quizCreation.questions.categoriesWeight') }}: {{ weightDisplay }}
        </span>
        <button
          v-if="!isEditingWeight && !isReadOnly"
          @click="handleEditWeight"
          class="text-primary-550 text-sm md:text-xs lg:text-sm font-medium hover:underline"
        >
          {{ t('pages.quizCreation.questions.categoriesWeightEdit') }}
        </button>
        <template v-else-if="isEditingWeight">
          <BaseInput
            v-model="weightInput"
            type="text"
            class="!w-[180px] md:!w-[160px] lg:!w-[180px]"
            :class="{ '!border-pink': !isWeightValid }"
          />
          <BaseButton
            :text="t('pages.quizCreation.questions.categoriesWeightConfirm')"
            variant="default"
            color="primary"
            size="sm"
            @onClick="handleConfirmWeight"
            class="!min-w-[80px] md:!min-w-[70px] lg:!min-w-[80px] !max-w-[108px] md:!max-w-[98px] lg:!max-w-[108px] !font-medium whitespace-nowrap"
          />
        </template>
      </div>
    </div>

    <!-- Minimum Weight to Pass Section -->
    <div class="mb-6 md:mb-5 lg:mb-6">
      <div class="flex items-center min-h-[28px] md:min-h-[26px] lg:min-h-[28px]">
        <BaseCheckbox
          v-model="minimumWeightToPass"
          :disabled="isReadOnly"
          @update:model-value="handleToggleMinimumWeight"
          labelClass="!text-[14px] md:!text-[13px] lg:!text-[14px] !leading-[17px] !text-black/85"
        />
        <BaseText
          :text="t('pages.quizCreation.questions.minimumWeightToPass')"
          class="!text-[14px] md:!text-[13px] lg:!text-[14px] !leading-[17px] !text-black/85"
        />
        <span
          v-if="minimumWeightToPass"
          class="ml-3 md:ml-2.5 lg:ml-3 px-3 md:px-2.5 lg:px-3 py-1 rounded-full text-sm md:text-xs lg:text-sm font-medium bg-success-50 text-success-500"
        >
          {{ t('pages.quizCreation.questions.weight') }}: {{ minimumWeightRules[0]?.weight || '0' }}
        </span>
      </div>

      <div
        v-if="minimumWeightToPass && !isReadOnly"
        class="w-full mt-4 md:mt-3 lg:mt-4 space-y-4 md:space-y-3 lg:space-y-4 border rounded-lg border-grey-200 p-4 md:p-3 lg:p-4"
      >
        <div
          v-for="rule in minimumWeightRules"
          :key="rule.id"
          class="flex items-start gap-3 md:gap-2.5 lg:gap-3"
        >
          <div class="flex-1 grid grid-cols-2 gap-3 md:gap-2.5 lg:gap-3">
            <div>
              <BaseInput v-model="rule.weight" type="number" class="!w-full" />
            </div>
            <div>
              <BaseInput
                v-model="rule.message"
                type="text"
                :placeholder="t('pages.quizCreation.questions.insertMessage')"
                class="!w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories List -->
    <div v-if="categories.length > 0" class="space-y-4 md:space-y-3 lg:space-y-4">
      <!-- Add Category Button (Top Right) -->
      <div v-if="!isReadOnly" class="flex justify-end mb-4 md:mb-3 lg:mb-4">
        <BaseButton
          :text="t('pages.quizCreation.questions.addCategory')"
          variant="link"
          color="primary"
          size="sm"
          @onClick="handleAddCategory"
          class="!font-medium !justify-end whitespace-nowrap"
        />
      </div>

      <!-- Categories Component -->
      <QuizCategoryList
        :categories="categories"
        :is-read-only="isReadOnly"
        @toggle-category="toggleCategory"
        @add-question="handleAddQuestion"
        @edit-category="handleEditCategory"
        @delete-category="handleDeleteCategory"
        @edit-question="handleEditQuestion"
        @delete-question="handleDeleteQuestion"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 md:py-10 lg:py-12">
      <div class="flex flex-col items-center gap-6 md:gap-5 lg:gap-6 justify-center">
        <BaseText
          :text="t('pages.quizCreation.questions.emptyState')"
          class="!text-neutral-700 !text-[14px] md:!text-[13px] lg:!text-[14px] !leading-[17px]"
        />
        <BaseButton
          v-if="!isReadOnly"
          :text="t('pages.quizCreation.questions.add')"
          variant="default"
          color="primary"
          size="sm"
          @onClick="handleAddCategory"
          class="!w-[95px] md:!w-[85px] lg:!w-[95px] whitespace-nowrap"
        />
      </div>
    </div>

    <!-- Add Category Modal -->
    <AddCategoryModal
      v-if="showAddCategoryModal"
      :show="showAddCategoryModal"
      :edit-category="editingCategory"
      :current-weight="categoriesWeightCurrent"
      :total-weight="parseInt(categoriesWeightTotal || '100', 10)"
      @close="
        () => {
          showAddCategoryModal = false
          editingCategory = null
        }
      "
      @confirm="handleCategoryConfirm"
    />

    <!-- Add Question Modal -->
    <AddQuestionModal
      :show="showAddQuestionModal"
      :category-id="addingQuestionToCategoryId"
      :category-total-weight="getCategoryTotalWeight(addingQuestionToCategoryId)"
      :category-current-weight="getCategoryCurrentQuestionWeight(addingQuestionToCategoryId)"
      :edit-question="editingQuestion"
      @close="
        () => {
          showAddQuestionModal = false
          addingQuestionToCategoryId = ''
          editingQuestion = null
        }
      "
      @confirm="handleQuestionConfirm"
    />
  </div>
</template>
