<template>
  <BasePopupModal
    v-if="show"
    :title="t('pages.editQuiz.title')"
    :fullscreen="true"
    :close-button="false"
    :enable-scroll="true"
    @onClose="handleClose"
  >
    <template #header-actions>
      <div class="flex items-center gap-2">
        <BaseButton
          :text="t('pages.quizCreation.buttons.cancel')"
          variant="link"
          size="sm"
          class="!min-w-[94px] !font-medium"
          @onClick="handleClose"
        />
        <BaseButton
          v-if="!isFirstStep"
          :text="t('pages.quizCreation.buttons.previous')"
          variant="default"
          color="neutral"
          size="sm"
          class="!min-w-[106px] !font-medium"
          @onClick="handlePrevious"
        />
        <BaseButton
          v-if="!isLastStep"
          :text="t('pages.quizCreation.buttons.next')"
          variant="default"
          color="primary"
          size="sm"
          class="!min-w-[80px] !font-medium"
          @onClick="handleNext"
        />
        <BaseButton
          v-else
          :text="t('pages.editQuiz.buttons.update')"
          variant="default"
          color="primary"
          size="sm"
          class="!min-w-[97px] !font-medium"
          @onClick="handleUpdate"
        />
      </div>
    </template>

    <div class="p-8">
      <BaseStepper :steps="steps" :current-step="currentStep" />
      <div class="mt-[48px]">
        <QuizSettingsStep v-show="currentStep === 1" ref="settingsRef" />
        <QuizQuestionsStep v-show="currentStep === 2" />
        <QuizParticipantsStep v-show="currentStep === 3" :is-edit="true" />
        <div v-show="currentStep === 4" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseDatepicker
              v-model="validFrom"
              :label="t('pages.quizCreation.publish.validFrom')"
              :placeholder="t('pages.quizCreation.publish.validFrom')"
              format="MMMM dd, yyyy - hh:mm a"
              :enable-time-picker="true"
            />
            <BaseDatepicker
              v-model="validTo"
              :label="t('pages.quizCreation.publish.validTo')"
              :placeholder="t('pages.quizCreation.publish.validTo')"
              format="MMMM dd, yyyy - hh:mm a"
              :enable-time-picker="true"
            />
          </div>
        </div>
      </div>
    </div>
  </BasePopupModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { BasePopupModal, BaseStepper, BaseButton, BaseDatepicker } from '@/components/common'
import { t } from '@/utils/i18n'
import { QuizSettingsStep, QuizQuestionsStep, QuizParticipantsStep } from './'
import type { QuizCreationData } from '@/types/QuizCreation'
import { QuizCreationQuestionType } from '@/types/QuizCreation'

interface Props {
  show: boolean
  quizId?: number
  quizData?: Partial<QuizCreationData>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  update: [quizId: number, quizData: QuizCreationData]
}>()

const currentStep = ref(1)
const totalSteps = 4
type SettingsExpose = { getSettings?: () => Record<string, unknown> }
const settingsRef = ref<SettingsExpose | null>(null)

// Date fields for publish step
const validFrom = ref('')
const validTo = ref('')

const steps = computed(() => [
  { label: t('pages.quizCreation.steps.settings') },
  { label: t('pages.quizCreation.steps.questions') },
  { label: t('pages.quizCreation.steps.participants') },
  { label: t('pages.quizCreation.steps.publish') },
])

const isFirstStep = computed(() => currentStep.value === 1)
const isLastStep = computed(() => currentStep.value === totalSteps)

// Initialize quiz data with existing data or defaults
const quizEditData = reactive<QuizCreationData>({
  id: props.quizData?.id || `quiz-${Date.now()}`,
  title: props.quizData?.title || 'Quiz Title',
  questions: props.quizData?.questions || [
    {
      id: `question-${Date.now()}-1`,
      question: '',
      type: QuizCreationQuestionType.YES_NO,
      options: [
        { id: 'yes-1', text: t('pages.quizCreation.placeholders.yesOption'), order: 1 },
        { id: 'no-1', text: t('pages.quizCreation.placeholders.noOption'), order: 2 },
      ],
    },
  ],
  hasGlobalMedia: props.quizData?.hasGlobalMedia || false,
})

// Watch for prop changes to update data
watch(
  () => props.quizData,
  (newData) => {
    if (newData) {
      Object.assign(quizEditData, {
        id: newData.id || quizEditData.id,
        title: newData.title || quizEditData.title,
        questions: newData.questions || quizEditData.questions,
        hasGlobalMedia: newData.hasGlobalMedia || quizEditData.hasGlobalMedia,
      })
    }
  },
  { deep: true, immediate: true },
)

const handleClose = () => {
  emit('close')
}

const handleNext = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const handlePrevious = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleUpdate = () => {
  if (props.quizId) {
    emit('update', props.quizId, { ...quizEditData })
  }
  emit('close')
}
</script>
