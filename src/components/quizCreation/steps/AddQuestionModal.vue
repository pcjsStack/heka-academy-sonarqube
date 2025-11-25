<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import {
  BaseSideModal,
  BaseInput,
  BaseButton,
  BaseRichText,
  BaseSelect,
  BaseToggle,
  BaseRadioButton,
  BaseDragAndDropFiles,
  BaseText,
} from '@/components/common'
import QuestionOptionsInput from './QuestionOptionsInput.vue'
import { t } from '@/utils/i18n'
import type { Media } from '@/types/Media'
import type { QuestionOption } from '@/types/QuizCreation'

interface Props {
  show: boolean
  categoryId: string
  categoryTotalWeight?: number
  categoryCurrentWeight?: number
  editQuestion?: {
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
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  categoryTotalWeight: 0,
  categoryCurrentWeight: 0,
  editQuestion: null,
})

const emit = defineEmits<{
  close: []
  confirm: [
    data: {
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
    },
  ]
}>()

// Form fields
const question = ref<string>('')
const answerType = ref<string>('open')
const required = ref<boolean>(false)
const photoRequired = ref<string>('no')
const comment = ref<string>('no')
const attachments = ref<Media[]>([])
const weightInput = ref<string>('')
const correctAnswer = ref<string>('')
const options = ref<QuestionOption[]>([{ text: '', value: 0 }])

// Track original attachments for edit mode to calculate removed files
const originalAttachments = ref<Media[]>([])

// Validation states
const touchedFields = ref({
  question: false,
  weight: false,
  correctAnswer: false,
  options: false,
})

// Flag to track if we're populating form data (to prevent watchers from interfering)
const isPopulatingForm = ref(false)

const answerTypeOptions = [
  { value: 'open', label: t('pages.quizCreation.addQuestion.answerTypes.open') },
  { value: 'rating', label: t('pages.quizCreation.addQuestion.answerTypes.rating') },
  { value: 'yes_no', label: t('pages.quizCreation.addQuestion.answerTypes.yesNo') },
  { value: 'select_single', label: t('pages.quizCreation.addQuestion.answerTypes.selectSingle') },
  {
    value: 'select_multiple',
    label: t('pages.quizCreation.addQuestion.answerTypes.selectMultiple'),
  },
  { value: 'photo', label: t('pages.quizCreation.addQuestion.answerTypes.photo') },
]

// Computed properties
const availableWeight = computed(() => props.categoryTotalWeight - props.categoryCurrentWeight)

const hasWeight = computed(() =>
  ['rating', 'yes_no', 'select_single', 'select_multiple'].includes(answerType.value),
)

const needsCorrectAnswer = computed(() => answerType.value === 'yes_no')

const needsOptions = computed(() => ['select_single', 'select_multiple'].includes(answerType.value))

// Check if photo required field should be shown (hide when answerType is 'photo')
const showPhotoRequired = computed(() => answerType.value !== 'photo')

// For select types, calculate weight from option values
const isWeightAutoCalculated = computed(() =>
  ['select_single', 'select_multiple'].includes(answerType.value),
)

const calculatedWeightFromOptions = computed(() => {
  if (!isWeightAutoCalculated.value) return 0

  // For select-single, use max value; for select-multiple, use sum
  if (answerType.value === 'select_single') {
    const values = options.value.map((opt) => {
      return typeof opt.value === 'number' ? opt.value : parseFloat(String(opt.value)) || 0
    })
    return values.length > 0 ? Math.max(...values) : 0
  } else {
    // select-multiple: sum all values
    return options.value.reduce((sum, opt) => {
      const value = typeof opt.value === 'number' ? opt.value : parseFloat(String(opt.value)) || 0
      return sum + value
    }, 0)
  }
})

// Validations
const weightError = computed(() => {
  if (!hasWeight.value || !touchedFields.value.weight) return ''

  // For auto-calculated weights, validate the calculated value
  const weightToValidate = isWeightAutoCalculated.value
    ? calculatedWeightFromOptions.value
    : parseFloat(weightInput.value)

  if (isWeightAutoCalculated.value) {
    // For select types, validate calculated weight
    if (weightToValidate <= 0) {
      return t('pages.quizCreation.addQuestion.errors.weightGreaterThanZero')
    }
    if (weightToValidate > availableWeight.value) {
      return t('pages.quizCreation.addQuestion.errors.weightExceedsAvailable', {
        available: availableWeight.value,
      })
    }
  } else {
    // For manual weight input
    if (weightInput.value.trim() === '') {
      return t('pages.quizCreation.addQuestion.errors.weightRequired')
    }

    if (isNaN(weightToValidate) || !isFinite(weightToValidate)) {
      return t('pages.quizCreation.addQuestion.errors.weightInvalid')
    }

    if (weightToValidate <= 0) {
      return t('pages.quizCreation.addQuestion.errors.weightGreaterThanZero')
    }

    if (weightToValidate > availableWeight.value) {
      return t('pages.quizCreation.addQuestion.errors.weightExceedsAvailable', {
        available: availableWeight.value,
      })
    }
  }

  return ''
})

const correctAnswerError = computed(() => {
  if (!needsCorrectAnswer.value || !touchedFields.value.correctAnswer) return ''
  return correctAnswer.value.trim() === ''
    ? t('pages.quizCreation.addQuestion.errors.correctAnswerRequired')
    : ''
})

const optionsError = computed(() => {
  if (!needsOptions.value || !touchedFields.value.options) return ''
  const validOptions = options.value.filter((opt) => opt.text.trim() !== '')
  return validOptions.length < 2 ? t('pages.quizCreation.addQuestion.errors.optionsRequired') : ''
})

const isFormValid = computed(() => {
  const questionValid = question.value.trim() !== ''

  // For auto-calculated weights, check if calculated value is valid
  const weightValid =
    !hasWeight.value ||
    (isWeightAutoCalculated.value
      ? weightError.value === '' && calculatedWeightFromOptions.value > 0
      : weightError.value === '' && weightInput.value.trim() !== '')

  const correctAnswerValid = !needsCorrectAnswer.value || correctAnswer.value.trim() !== ''
  const optionsValid =
    !needsOptions.value || options.value.filter((opt) => opt.text.trim() !== '').length >= 2
  return questionValid && weightValid && correctAnswerValid && optionsValid
})

// Methods
const addOption = () => options.value.push({ text: '', value: 0 })

const removeOption = (index: number) => {
  if (options.value.length > 1) options.value.splice(index, 1)
}

const populateFormWithEditData = () => {
  if (props.editQuestion) {
    isPopulatingForm.value = true
    nextTick(() => {
      question.value = props.editQuestion?.question || ''
      answerType.value = props.editQuestion?.answerType || 'open'
      required.value = props.editQuestion?.required || false
      photoRequired.value = props.editQuestion?.photoRequired || 'no'
      comment.value = props.editQuestion?.comment || 'no'
      // Deep copy attachments to ensure reactivity and ensure all required fields are present
      const editAttachments = props.editQuestion?.attachments
        ? props.editQuestion.attachments.map((att) => ({
            ...att,
            // Ensure name field is always set (fallback to fileName or customFileName)
            name: att.name || att.fileName || att.customFileName || '',
            // Ensure fileName is set if missing
            fileName: att.fileName || att.name || att.customFileName || '',
            // Ensure size is a number
            size: att.size || 0,
            // Ensure mimeType is set
            mimeType: att.mimeType || '',
            // Ensure url is set
            url: att.url || '',
          }))
        : []
      attachments.value = editAttachments
      // Store original attachments for comparison when editing
      originalAttachments.value = JSON.parse(JSON.stringify(editAttachments))
      correctAnswer.value = props.editQuestion?.correctAnswer?.toLocaleLowerCase() || ''
      options.value = props.editQuestion?.options || [{ text: '', value: 0 }]

      // Set weight after options are populated (for auto-calculated weights)
      // Use setTimeout to ensure options watcher has updated the calculated weight
      setTimeout(() => {
        const isSelectType = ['select_single', 'select_multiple'].includes(
          props.editQuestion?.answerType || '',
        )
        if (isSelectType) {
          // For select types, use calculated weight from options
          weightInput.value = String(calculatedWeightFromOptions.value)
        } else {
          // For other types, use the stored weight
          weightInput.value = props.editQuestion?.weight ? String(props.editQuestion.weight) : ''
        }
      }, 10)

      // Don't mark fields as touched when populating
      touchedFields.value = { question: false, weight: false, correctAnswer: false, options: false }
      // Reset the flag after a slight delay to ensure all watchers have processed
      setTimeout(() => {
        isPopulatingForm.value = false
      }, 50)
    })
  }
}

const resetForm = () => {
  question.value = ''
  answerType.value = 'open'
  required.value = false
  photoRequired.value = 'no'
  comment.value = 'no'
  attachments.value = []
  originalAttachments.value = []
  weightInput.value = ''
  correctAnswer.value = ''
  options.value = [{ text: '', value: 0 }]
  touchedFields.value = { question: false, weight: false, correctAnswer: false, options: false }
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleConfirm = () => {
  touchedFields.value = { question: true, weight: true, correctAnswer: true, options: true }

  if (isFormValid.value) {
    // Use calculated weight for select types, otherwise use manual input
    const weightValue = hasWeight.value
      ? isWeightAutoCalculated.value
        ? calculatedWeightFromOptions.value
        : parseFloat(weightInput.value)
      : 0

    // Calculate fileKeys and removeFileIds for edit mode
    let fileKeys: string[] = []
    let removeFileIds: number[] = []

    if (props.editQuestion) {
      // Edit mode: calculate removed and new files
      const currentIds = new Set(
        attachments.value
          .filter((att) => att.id && typeof att.id === 'number')
          .map((att) => att.id as number),
      )

      // Find removed files (in original but not in current)
      removeFileIds = originalAttachments.value
        .filter((att) => att.id && typeof att.id === 'number' && !currentIds.has(att.id))
        .map((att) => att.id as number)

      // Find new files (File objects or Media without id)
      const newFiles = attachments.value.filter(
        (att) => att instanceof File || att.id === undefined || att.id === null,
      )
      fileKeys = newFiles
        .map((att) => {
          if (att instanceof File) {
            return att.name
          }
          return att.fileName || att.name || ''
        })
        .filter((key) => key !== '')
    } else {
      // Create mode: all attachments are new files
      const newFiles = attachments.value.filter(
        (att) => att instanceof File || att.id === undefined || att.id === null,
      )
      fileKeys = newFiles
        .map((att) => {
          if (att instanceof File) {
            return att.name
          }
          return att.fileName || att.name || ''
        })
        .filter((key) => key !== '')
    }

    emit('confirm', {
      id: props.editQuestion?.id,
      categoryId: props.categoryId,
      question: question.value.trim(),
      answerType: answerType.value,
      required: required.value,
      photoRequired: photoRequired.value,
      comment: comment.value,
      attachments: attachments.value,
      weight: weightValue,
      correctAnswer: needsCorrectAnswer.value ? correctAnswer.value : undefined,
      options: needsOptions.value ? options.value : undefined,
      fileKeys: fileKeys.length > 0 ? fileKeys : undefined,
      removeFileIds: removeFileIds.length > 0 ? removeFileIds : undefined,
    })
    handleClose()
  }
}

// Watchers
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.editQuestion) {
        // Pre-fill form with edit data
        populateFormWithEditData()
      } else {
        // Reset form for new question
        resetForm()
      }
    }
  },
)

// Watch for changes to editQuestion prop even when modal is open
watch(
  () => props.editQuestion,
  (newVal) => {
    if (props.show && newVal) {
      populateFormWithEditData()
    }
  },
  { deep: true },
)

watch(weightInput, () => {
  if (weightInput.value !== '') {
    touchedFields.value.weight = true
  }
})

watch(correctAnswer, () => {
  if (correctAnswer.value !== '') {
    touchedFields.value.correctAnswer = true
  }
})

watch(
  options,
  () => {
    if (options.value.some((opt) => opt.text !== '')) {
      touchedFields.value.options = true
    }

    // Auto-update weightInput when options change for select types
    if (isWeightAutoCalculated.value && !isPopulatingForm.value) {
      weightInput.value = String(calculatedWeightFromOptions.value)
      touchedFields.value.weight = true
    }
  },
  { deep: true },
)

watch(answerType, (newVal, oldVal) => {
  // Only reset if answer type actually changed, we're not populating initial data, and not in edit mode
  if (oldVal && newVal !== oldVal && !isPopulatingForm.value) {
    // For select types, calculate weight from options; for others, clear it
    const isNewTypeSelect = ['select_single', 'select_multiple'].includes(newVal)
    weightInput.value = isNewTypeSelect ? String(calculatedWeightFromOptions.value) : ''

    correctAnswer.value = ''
    options.value = [{ text: '', value: 0 }]
    touchedFields.value.weight = false
    touchedFields.value.correctAnswer = false
    touchedFields.value.options = false
  }
})
</script>

<template>
  <BaseSideModal
    v-if="show"
    :title="
      editQuestion
        ? t('pages.quizCreation.addQuestion.editTitle')
        : t('pages.quizCreation.addQuestion.title')
    "
    size="md"
    :close-button="true"
    custom-class="left-0"
    :z-index="9999999"
    @onClose="handleClose"
  >
    <div class="lg:px-6 px-4 pt-8 pb-[48px] h-[calc(100svh-140px)] overflow-y-auto">
      <!-- Question Field -->
      <div class="mb-6">
        <BaseRichText
          v-model="question"
          :label="t('pages.quizCreation.addQuestion.questionLabel')"
          required
        />
      </div>

      <!-- Answer Type Field -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1">
            <BaseSelect
              v-model="answerType"
              :label="t('pages.quizCreation.addQuestion.answerTypeLabel')"
              :options="answerTypeOptions"
              required
            />
          </div>
          <div class="mt-6">
            <BaseToggle v-model="required" :label="t('pages.quizCreation.addQuestion.required')" />
          </div>
        </div>

        <!-- Correct answer for yes-no -->
        <div v-if="needsCorrectAnswer">
          <BaseSelect
            v-model="correctAnswer"
            :label="t('pages.quizCreation.addQuestion.correctAnswerLabel')"
            :options="[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]"
            required
            :status="correctAnswerError ? 'error' : 'default'"
            :hint-message="correctAnswerError"
          />
        </div>

        <!-- Options for select-single and select-multiple -->
        <QuestionOptionsInput
          v-if="needsOptions"
          v-model:options="options"
          :error="optionsError"
          @add-option="addOption"
          @remove-option="removeOption"
        />

        <!-- Weight field -->
        <div v-if="hasWeight" class="mt-6">
          <BaseInput
            v-model="weightInput"
            :label="t('pages.quizCreation.addQuestion.weightLabel')"
            :placeholder="
              isWeightAutoCalculated
                ? answerType === 'select_single'
                  ? 'Max value from options'
                  : 'Sum of all options'
                : `Available: ${availableWeight}`
            "
            type="number"
            required
            :disabled="isWeightAutoCalculated"
            :status="weightError ? 'error' : 'default'"
            :hint-message="weightError"
          />
        </div>

        <!-- No weight message -->
        <div v-if="!hasWeight" class="bg-grey-100 rounded-lg py-3 px-4 mt-6">
          <BaseText
            :text="t('pages.quizCreation.addQuestion.noWeight')"
            class="!text-neutral-400 !text-[14px] !leading-[17px] text-start"
          />
        </div>
      </div>

      <!-- Photo Required (hidden when answerType is 'photo') -->
      <div v-if="showPhotoRequired" class="mb-6">
        <BaseText
          :text="t('pages.quizCreation.addQuestion.photoRequiredLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-sm"
          class="mb-2"
        />
        <div class="flex items-center gap-6">
          <BaseRadioButton
            v-model="photoRequired"
            value="yes"
            :label="t('pages.quizCreation.addQuestion.yes')"
            :name="`photo-required-${categoryId}`"
          />
          <BaseRadioButton
            v-model="photoRequired"
            value="no"
            :label="t('pages.quizCreation.addQuestion.no')"
            :name="`photo-required-${categoryId}`"
          />
        </div>
      </div>

      <!-- Comment -->
      <div class="mb-6">
        <BaseText
          :text="t('pages.quizCreation.addQuestion.commentLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-sm"
          class="mb-2"
        />
        <div class="flex items-center gap-6">
          <BaseRadioButton
            v-model="comment"
            value="yes"
            :label="t('pages.quizCreation.addQuestion.yes')"
            :name="`comment-${categoryId}`"
          />
          <BaseRadioButton
            v-model="comment"
            value="no"
            :label="t('pages.quizCreation.addQuestion.no')"
            :name="`comment-${categoryId}`"
          />
        </div>
      </div>

      <!-- Attachments -->
      <div class="mb-6">
        <BaseText
          :text="t('pages.quizCreation.addQuestion.attachmentsLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-sm"
          class="mb-2"
        />
        <BaseDragAndDropFiles
          :text="t('pages.quizCreation.addQuestion.attachmentsDragDrop')"
          accept=".jpg,.jpeg,.png,.svg,.pdf,.mp4,.mov,.avi,.webm,.mkv,.flv,.wmv,.m4v,.3gp"
          :multiple="true"
          :show-history="true"
          :hide-search-text="true"
          :model-value="attachments"
          @update:model-value="(files) => (attachments = files as Media[])"
        />
        <BaseText
          :text="t('pages.quizCreation.addQuestion.attachmentsMaxSize')"
          class="!text-neutral-500 !text-[12px] !leading-[15px] mt-2"
        />
      </div>
    </div>

    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :text="t('pages.quizCreation.buttons.cancel')"
          variant="link"
          size="sm"
          @onClick="handleClose"
          class="!min-w-[95px] !max-w-[95px] !font-medium"
        />
        <BaseButton
          :text="t('pages.quizCreation.addQuestion.confirm')"
          variant="default"
          color="primary"
          size="sm"
          :disabled="!isFormValid"
          @onClick="handleConfirm"
          class="max-w-[108px] !font-medium"
        />
      </div>
    </div>
  </BaseSideModal>
</template>
