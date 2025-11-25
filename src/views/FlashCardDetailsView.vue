<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BaseButton, BaseIcon, BaseText, BaseInput } from '@/components/common'
import HeaderView from '@/components/layouts/HeaderView.vue'
import { t } from '@/utils/i18n'
import { generateMockFlashCards } from '@/mock/flashCardQuestions'
import type { FlashCardQuestion } from '@/types/FlashCardQuestion'
import type { LessonItem } from '@/types/Lesson'
import { lessonsData } from '@/mock/lessonsData'

const router = useRouter()
const route = useRoute()

const flashCardId = route.params.id
const flashCard = ref<LessonItem | null>(null)
const pdfFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const errorMessage = ref<string>('')
const isGenerating = ref<boolean>(false)
const generatedQuestions = ref<FlashCardQuestion[]>([])
const showForm = ref<boolean>(false)

onMounted(() => {
  if (flashCardId) {
    flashCard.value = lessonsData.find((lesson) => lesson.id === flashCardId) as LessonItem | null
  }
})

// Computed property to check if generate button should be disabled
const isGenerateDisabled = computed(() => !pdfFile.value || isGenerating.value)

// Methods
const handleAddFlashCard = () => {
  // Trigger file input click
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  errorMessage.value = ''

  if (file) {
    // Validate file type
    if (file.type !== 'application/pdf') {
      errorMessage.value = 'Only PDF files are accepted'
      pdfFile.value = null
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      errorMessage.value = `File size exceeds maximum of 50 MB. File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
      pdfFile.value = null
      return
    }

    pdfFile.value = file
  }
}

const handleRemoveFile = () => {
  pdfFile.value = null
  errorMessage.value = ''
  showForm.value = false
  generatedQuestions.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleGenerateClick = async () => {
  if (pdfFile.value) {
    isGenerating.value = true
    console.log('Generating flash card with PDF:', pdfFile.value.name)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate mock flash cards
    const response = generateMockFlashCards(pdfFile.value.name)
    generatedQuestions.value = response.questions
    showForm.value = true
    isGenerating.value = false
  }
}

const handleSaveFlashCards = () => {
  console.log('Saving flash cards:', generatedQuestions.value)
  // TODO: Implement save logic
}

const handleRegenerateFlashCards = async () => {
  if (pdfFile.value) {
    isGenerating.value = true
    showForm.value = false

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate mock flash cards
    const response = generateMockFlashCards(pdfFile.value.name)
    generatedQuestions.value = response.questions
    showForm.value = true
    isGenerating.value = false
  }
}

const updateQuestion = (index: number, value: string) => {
  if (generatedQuestions.value[index]) {
    generatedQuestions.value[index].question = value
  }
}

const updateTrueAnswer = (index: number, value: string) => {
  if (generatedQuestions.value[index]) {
    generatedQuestions.value[index].trueAnswer = value
  }
}

const updateFalseAnswer = (index: number, value: string) => {
  if (generatedQuestions.value[index]) {
    generatedQuestions.value[index].falseAnswer = value
  }
}

const updateNumericValue = (index: number, value: string) => {
  if (generatedQuestions.value[index]) {
    generatedQuestions.value[index].numericValue = value
  }
}

const fileSizeConvert = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const handleBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <HeaderView :title="flashCard?.title || ''" :isSearch="false" is-back @back="handleBack" />
    <div class="px-8 py-6">
      <div class="flex justify-between items-center gap-3">
        <div class="flex-1 space-y-3">
          <div
            class="border-2 w-full border-dashed border-blue-400 rounded-lg p-1 bg-blue-50/30 hover:bg-blue-50/50 transition-colors cursor-pointer"
            @click="handleAddFlashCard"
          >
            <div class="flex gap-3 items-center justify-center">
              <BaseIcon name="add" size="lg" color="default" />
              <BaseText
                :text="t('pages.flashcard.pdf.title')"
                type="p-lg"
                color="primary"
                :tone="600"
                font="semibold"
                class="!mt-0"
              />
            </div>
          </div>

          <!-- Hidden file input -->
          <input
            ref="fileInputRef"
            type="file"
            accept=".pdf,application/pdf"
            class="hidden"
            @change="handleFileChange"
          />

          <!-- Error Message -->
        </div>

        <BaseButton
          :text="
            isGenerating
              ? t('pages.flashcard.form.generating')
              : t('pages.flashcard.buttons.generate')
          "
          variant="default"
          size="md"
          :disabled="isGenerateDisabled"
          @onClick="handleGenerateClick"
          :class="[
            '!w-[330px]',
            isGenerateDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ]"
        />
      </div>
      <div v-if="pdfFile || showForm" class="w-full mt-4 bg-white rounded-lg p-4">
        <div v-if="errorMessage" class="mt-2">
          <BaseText :text="errorMessage" type="p-xs" color="error" :tone="600" font="medium" />
        </div>

        <!-- Selected File Display -->
        <div
          v-if="pdfFile"
          class="bg-grey-50 flex rounded-[12px] items-center gap-[16px] py-[16px] px-[20px]"
        >
          <div>
            <BaseIcon name="file" size="md" color="error" />
          </div>
          <div class="w-full">
            <BaseText
              :text="pdfFile.name"
              color="neutral"
              tailwind-css="mb-[2px] !text-[14px] leading-[17px] !font-medium tracking-[-0.016px] text-neutral-700"
            />
            <BaseText
              :text="fileSizeConvert(pdfFile.size)"
              :tone="500"
              color="neutral"
              tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] text-grey-700"
            />
          </div>
          <div class="text-error-600 cursor-pointer">
            <div @click="handleRemoveFile">
              <BaseIcon name="clear" color="error" size="sm" variant="outline" />
            </div>
          </div>
        </div>

        <!-- Generated Flash Cards Form -->
        <div v-if="showForm && generatedQuestions.length > 0" class="mt-6">
          <div class="mb-6">
            <BaseText
              :text="t('pages.flashcard.form.title')"
              type="h5"
              color="neutral"
              :tone="900"
              font="bold"
              class="mb-2"
            />
            <BaseText
              :text="t('pages.flashcard.form.subtitle')"
              type="p-sm"
              color="neutral"
              :tone="600"
              font="regular"
            />
            <div class="mt-2 flex items-center gap-2">
              <BaseText
                :text="t('pages.flashcard.form.generatedFrom')"
                type="p-sm"
                color="neutral"
                :tone="700"
                font="medium"
              />
              <BaseText
                :text="pdfFile?.name || ''"
                type="p-sm"
                color="primary"
                :tone="600"
                font="medium"
              />
            </div>
          </div>

          <!-- Questions and Answers Form -->
          <div
            class="border border-gray-200 rounded-lg p-6 bg-gray-50 flex gap-2 w-full justify-between flex-col"
          >
            <div
              v-for="(question, index) in generatedQuestions"
              :key="question.id"
              class="flex gap-2 w-full justify-between"
            >
              <div class="flex gap-2 items-center w-full justify-between mt-3">
                <BaseText
                  :text="'Q' + `${index + 1}.`"
                  type="p-sm"
                  color="neutral"
                  :tone="700"
                  font="medium"
                />
                <BaseInput
                  :model-value="question.question"
                  @update:model-value="(value: string) => updateQuestion(index, value)"
                  type="text"
                  :placeholder="t('pages.flashcard.form.questionPlaceholder')"
                  :input-rows="2"
                  class="w-full"
                />
              </div>
              <div class="flex gap-2 justify-between">
                <BaseInput
                  :label="t('pages.flashcard.form.answerLabel')"
                  :model-value="question.trueAnswer"
                  @update:model-value="(value: string) => updateTrueAnswer(index, value)"
                  type="text"
                  :placeholder="t('pages.flashcard.form.answerPlaceholder')"
                  labelClass="leading-5 font-semibold !text-xs-custom text-custom-label-text"
                  custom-input-styles="!border-2 !border-green-500 focus:!border-green-600"
                  class="w-full"
                />
                <BaseInput
                  :label="t('pages.flashcard.form.answerLabel')"
                  :model-value="question.falseAnswer"
                  @update:model-value="(value: string) => updateFalseAnswer(index, value)"
                  type="text"
                  :placeholder="t('pages.flashcard.form.answerPlaceholder')"
                  labelClass="leading-5 font-semibold !text-xs-custom text-custom-label-text"
                  custom-input-styles="!border-2 !border-red-500 focus:!border-red-600"
                  class="w-full"
                />
                <BaseInput
                  :label="t('pages.flashcard.form.scoreValueLabel')"
                  :model-value="question.numericValue"
                  @update:model-value="(value: string) => updateNumericValue(index, value)"
                  type="number"
                  :placeholder="t('pages.flashcard.form.scoreValuePlaceholder')"
                  labelClass="leading-5 font-semibold !text-xs-custom text-custom-label-text"
                  class="!w-[180px]"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 mt-6">
            <BaseButton
              :text="t('pages.flashcard.buttons.regenerate')"
              variant="outline"
              size="md"
              @onClick="handleRegenerateFlashCards"
              class="!w-auto !px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            />
            <BaseButton
              :text="t('pages.flashcard.buttons.save')"
              variant="default"
              size="md"
              @onClick="handleSaveFlashCards"
              class="!w-auto !px-6 bg-blue-600 text-white hover:bg-blue-700"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
