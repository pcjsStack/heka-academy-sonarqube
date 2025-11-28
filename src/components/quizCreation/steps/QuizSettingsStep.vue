<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  BaseInput,
  BaseSelect,
  BaseRichText,
  BaseText,
  BaseDragAndDropFiles,
  BaseCheckbox,
  BaseButtonIcon,
} from '@/components/common'
import { useLanguageStore } from '@/stores/Language'
import { t } from '@/utils/i18n'
import type { Media } from '@/types/Media'
import type { QuizSettingsData, StepValidationState, QuizStepExpose } from '@/types/QuizCreation'
import { getFileUrl, getFileType, fileSizeConvert } from '@/utils/generalUtils'
import { VisibilityStatus } from '@/types/Course'
import { visibilityOptions } from '@/utils/defaultOption'

const emit = defineEmits<{
  'validation-changed': []
}>()

// Form data
const quizTitle = ref<string>('')
const quizLanguage = ref<string>('')
const quizVisibility = ref<string>(VisibilityStatus.SHOW)
const maxAttempts = ref<number>(0)
const showFeedback = ref<boolean>(false)
const description = ref<string>('')
const quizImage = ref<Media[]>([])
const languageStore = useLanguageStore()

onMounted(async () => {
  if (languageStore.languages.length === 0) {
    await languageStore.fetchAllLanguages()
  }
})

// Validation computed properties
const isQuizTitleValid = computed(() => {
  return quizTitle.value.trim() !== ''
})

const isQuizLanguageValid = computed(() => {
  return quizLanguage.value.trim() !== ''
})

const validateSettings = (): StepValidationState => {
  const errors: string[] = []

  if (!isQuizTitleValid.value) {
    errors.push('Title is required')
  }

  if (!isQuizLanguageValid.value) {
    errors.push('Language is required')
  }

  return {
    isValid: isQuizTitleValid.value && isQuizLanguageValid.value,
    errors,
  }
}

watch(
  [quizTitle, quizLanguage],
  () => {
    validateSettings()
    emit('validation-changed')
  },
  { immediate: true },
)

// Watch maxAttempts to prevent negative values
watch(maxAttempts, (newValue) => {
  if (newValue < 0) {
    maxAttempts.value = 0
  }
})

const removeImage = (index: number) => {
  quizImage.value.splice(index, 1)
}

const handleMaxAttemptsInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const inputValue = target.value.trim()

  // Allow empty input for deletion
  if (inputValue === '') {
    return
  }

  // Parse the value
  const numValue = parseInt(inputValue, 10)

  // If invalid number or negative, prevent the input and reset to 0
  if (isNaN(numValue) || numValue < 0) {
    // Prevent negative or invalid input
    if (inputValue.startsWith('-') || isNaN(numValue)) {
      target.value = maxAttempts.value.toString()
      return
    }
    maxAttempts.value = 0
    target.value = '0'
  }
}

// Expose getter/setter to parent component
defineExpose<QuizStepExpose>({
  getSettings: () => {
    const validation = validateSettings()
    return {
      title: quizTitle.value,
      language: quizLanguage.value,
      visibility: quizVisibility.value,
      maxAttempts: maxAttempts.value.toString(),
      showFeedback: showFeedback.value,
      description: description.value,
      image: quizImage.value,
      ...validation,
    }
  },
  setSettings: (vals: Partial<QuizSettingsData>) => {
    if (!vals) return
    if (vals.title !== undefined) quizTitle.value = vals.title
    if (vals.language !== undefined) quizLanguage.value = vals.language
    if (vals.visibility !== undefined) quizVisibility.value = vals.visibility
    if (vals.maxAttempts !== undefined) {
      const attempts = parseInt(vals.maxAttempts)
      maxAttempts.value = isNaN(attempts) || attempts < 0 ? 0 : attempts
    }
    if (vals.showFeedback !== undefined) showFeedback.value = vals.showFeedback
    if (vals.description !== undefined) description.value = vals.description
    if (vals.image !== undefined) quizImage.value = vals.image
  },
})
</script>

<template>
  <div class="max-w-[816px] mx-auto">
    <div class="space-y-[24px] md:space-y-5 lg:space-y-[24px]">
      <!-- Image Upload Section -->
      <div>
        <BaseText
          :text="t('pages.quizCreation.settings.image')"
          class="!text-[12px] md:!text-[11px] lg:!text-[12px] !leading-[15px] mb-[6px] md:mb-1 lg:mb-[6px] !text-neutral-700 !font-medium"
        />
        <BaseDragAndDropFiles
          :text="t('pages.quizCreation.settings.image.dragDropText')"
          accept=".jpg,.jpeg,.png,.svg"
          :multiple="false"
          :show-history="false"
          :model-value="quizImage"
          :custom_actions="true"
          @update:model-value="(files) => (quizImage = files as Media[])"
        >
          <template #customActions>
            <div class="flex justify-between mt-2">
              <BaseText
                :text="t('pages.quizCreation.settings.image.supportedFormats')"
                :tone="500"
                color="neutral"
                type="p-xs"
                class="!font-medium"
              />
              <BaseText
                :text="t('pages.quizCreation.settings.image.maxSize')"
                :tone="500"
                color="neutral"
                type="p-xs"
                class="!font-medium"
              />
            </div>
            <div
              class="mt-6 md:mt-5 lg:mt-6 flex flex-col gap-2 md:gap-1.5 lg:gap-2"
              v-if="quizImage && quizImage.length"
            >
              <div
                v-for="(file, i) in quizImage"
                :key="file.id || i"
                class="bg-grey-50 flex rounded-[16px] items-center gap-[16px] md:gap-3 lg:gap-[16px] py-[14px] md:py-3 lg:py-[14px] px-[14px] md:px-3 lg:px-[14px]"
              >
                <div>
                  <img
                    v-if="getFileType(file).startsWith('image/')"
                    :src="getFileUrl(file)"
                    class="w-8 h-8 md:w-7 md:h-7 lg:w-8 lg:h-8 min-w-[32px] md:min-w-[28px] lg:min-w-[32px] object-cover rounded-[8px]"
                  />
                </div>
                <div class="w-full min-w-0">
                  <BaseText
                    :text="(file as any).fileName || file.name"
                    color="neutral"
                    tailwind-css="block mb-[2px] !text-[14px] md:!text-[13px] lg:!text-[14px] leading-[17px] !font-medium tracking-[-0.016px] text-neutral-700 max-w-[420px] whitespace-nowrap overflow-hidden text-ellipsis"
                  />
                  <BaseText
                    :text="fileSizeConvert(file.size)"
                    :tone="500"
                    color="neutral"
                    tailwind-css="!text-[12px] md:!text-[11px] lg:!text-[12px] leading-[15px] tracking-[-0.016px] text-grey-700"
                  />
                </div>
                <div class="text-error-600 cursor-pointer">
                  <div @click="removeImage(i)">
                    <BaseButtonIcon
                      icon="delete-outline"
                      iconClass="!text-pink !w-[12px]"
                      size="sm"
                      variant="default"
                      class="!bg-pink/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </BaseDragAndDropFiles>
      </div>

      <!-- Title and Language - Two Column Layout -->
      <div class="grid grid-cols-2 gap-6 md:gap-5 lg:gap-6">
        <!-- Title -->
        <BaseInput
          v-model="quizTitle"
          :label="t('pages.quizCreation.settings.title')"
          :placeholder="t('pages.quizCreation.settings.titlePlaceholder')"
          required
          type="text"
        />

        <!-- Language -->
        <BaseSelect
          v-model="quizLanguage"
          :label="t('pages.quizCreation.settings.language')"
          :placeholder="t('pages.quizCreation.settings.languagePlaceholder')"
          :options="languageStore.getLanguageOptions"
          required
        />
      </div>

      <!-- Quiz Visibility -->
      <BaseSelect
        v-model="quizVisibility"
        :label="t('pages.course.settings.general.visibility')"
        :placeholder="t('pages.course.settings.general.visibilityPlaceholder')"
        :options="visibilityOptions"
      />

      <!-- Max Attempts -->
      <BaseInput
        v-model="maxAttempts"
        :label="t('pages.quizCreation.settings.maxAttempts')"
        :placeholder="t('pages.quizCreation.settings.maxAttemptsPlaceholder')"
        type="number"
        @onInput="handleMaxAttemptsInput"
      />

      <!-- Show Feedback Checkbox -->
      <div>
        <BaseCheckbox
          v-model="showFeedback"
          :label="t('pages.quizCreation.settings.showFeedback')"
          labelClass="!text-[14px] md:!text-[13px] lg:!text-[14px] !leading-[17px] !text-black/85"
        />
      </div>

      <!-- Description -->
      <div>
        <BaseText
          :text="t('pages.quizCreation.settings.description')"
          class="!text-[12px] md:!text-[11px] lg:!text-[12px] !leading-[15px] mb-[6px] md:mb-1 lg:mb-[6px] !text-neutral-700 !font-medium"
        />
        <BaseRichText
          v-model="description"
          :placeholder="t('pages.quizCreation.settings.descriptionPlaceholder')"
        />
      </div>
    </div>
  </div>
</template>
