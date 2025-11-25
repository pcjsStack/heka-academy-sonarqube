<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BaseSideModal, BaseInput, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'

interface Props {
  show: boolean
  editCategory?: { id: string; title: string; weight: string } | null
  currentWeight?: number
  totalWeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentWeight: 0,
  totalWeight: 100,
})

const emit = defineEmits<{
  close: []
  confirm: [data: { id?: string; title: string; weight: string }]
}>()

const categoryTitle = ref<string>('')
const categoryWeight = ref<string>('0')

// Validation states
const titleError = ref<string>('')
const weightError = ref<string>('')
const touchedTitle = ref<boolean>(false)
const touchedWeight = ref<boolean>(false)

// Calculate available weight
const availableWeight = computed(() => {
  if (props.editCategory) {
    // When editing, add back the category's current weight to available
    const currentCategoryWeight = parseInt(props.editCategory.weight || '0', 10)
    return props.totalWeight - props.currentWeight + currentCategoryWeight
  }
  // When adding new, calculate remaining weight
  return props.totalWeight - props.currentWeight
})

// Computed validation
const isTitleValid = computed(() => {
  if (!touchedTitle.value) return true
  return categoryTitle.value.trim() !== ''
})

const isWeightValid = computed(() => {
  if (!touchedWeight.value) return true
  if (!categoryWeight.value || categoryWeight.value.trim() === '') return false

  const num = Number(categoryWeight.value)
  if (isNaN(num) || !isFinite(num)) return false

  // Check if weight exceeds available weight
  if (num > availableWeight.value) return false

  return true
})

const isFormValid = computed(() => {
  const num = Number(categoryWeight.value)
  return (
    categoryTitle.value.trim() !== '' &&
    categoryWeight.value.trim() !== '' &&
    isWeightValid.value &&
    num > 0
  )
})

const titleStatus = computed(() => {
  if (!touchedTitle.value || isTitleValid.value) return 'default'
  return 'error'
})

const weightStatus = computed(() => {
  if (!touchedWeight.value || isWeightValid.value) return 'default'
  return 'error'
})

const validateTitle = () => {
  touchedTitle.value = true
  if (categoryTitle.value.trim() === '') {
    titleError.value = t('pages.quizCreation.addCategory.errors.titleRequired')
  } else {
    titleError.value = ''
  }
}

const validateWeight = () => {
  touchedWeight.value = true
  if (!categoryWeight.value || categoryWeight.value.trim() === '') {
    weightError.value = t('pages.quizCreation.addCategory.errors.weightRequired')
  } else {
    const num = Number(categoryWeight.value)
    if (isNaN(num) || !isFinite(num)) {
      weightError.value = t('pages.quizCreation.addCategory.errors.weightInvalid')
    } else if (num > availableWeight.value) {
      weightError.value = t('pages.quizCreation.addCategory.errors.weightExceedsAvailable', {
        available: availableWeight.value,
        total: props.totalWeight,
      })
    } else {
      weightError.value = ''
    }
  }
}

const handleClose = () => {
  categoryTitle.value = ''
  categoryWeight.value = '0'
  titleError.value = ''
  weightError.value = ''
  touchedTitle.value = false
  touchedWeight.value = false
  emit('close')
}

const handleConfirm = () => {
  validateTitle()
  validateWeight()

  if (isFormValid.value) {
    emit('confirm', {
      ...(props.editCategory ? { id: props.editCategory.id } : {}),
      title: categoryTitle.value.trim(),
      weight: categoryWeight.value.trim(),
    })
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.editCategory) {
      console.log('props.editCategory', props.editCategory)
      // Pre-fill form with edit category data
      categoryTitle.value = props.editCategory.title
      categoryWeight.value = props.editCategory.weight
    } else if (!newVal) {
      categoryTitle.value = ''
      categoryWeight.value = '0'
      titleError.value = ''
      weightError.value = ''
      touchedTitle.value = false
      touchedWeight.value = false
    }
  },
  { immediate: true },
)

watch(categoryTitle, () => {
  touchedTitle.value = true
  validateTitle()
})

watch(categoryWeight, () => {
  touchedWeight.value = true
  validateWeight()
})
</script>

<template>
  <BaseSideModal
    v-if="show"
    :title="
      props.editCategory
        ? t('pages.quizCreation.addCategory.editTitle')
        : t('pages.quizCreation.addCategory.title')
    "
    size="md"
    :close-button="true"
    custom-class="left-0"
    :z-index="9999999"
    @onClose="handleClose"
  >
    <div class="lg:px-6 px-4 pt-8 pb-[48px] h-[calc(100svh-140px)] overflow-y-auto">
      <!-- Title Input -->
      <div class="mb-6">
        <BaseInput
          v-model="categoryTitle"
          :label="t('pages.quizCreation.addCategory.titleLabel')"
          :placeholder="t('pages.quizCreation.addCategory.titlePlaceholder')"
          required
          type="text"
          :status="titleStatus"
          :hint-message="titleError"
        />
      </div>

      <!-- Weight Input -->
      <div class="mb-6">
        <BaseInput
          v-model="categoryWeight"
          :label="t('pages.quizCreation.addCategory.weightLabel')"
          :placeholder="`Available: ${availableWeight}`"
          required
          type="text"
          :status="weightStatus"
          :hint-message="weightError"
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
          :text="t('pages.quizCreation.addCategory.confirm')"
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
