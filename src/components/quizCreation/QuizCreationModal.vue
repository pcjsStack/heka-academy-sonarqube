<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { BasePopupModal, BaseStepper, BaseButton } from '@/components/common'
import { useQuizStore } from '@/stores/QuizStore'
import { useToaster } from '@/composables/useToaster'
import { t } from '@/utils/i18n'
import { QuizSettingsStep, QuizQuestionsStep, QuizParticipantsStep, QuizPublishStep } from './'
import type {
  QuizStepExpose,
  QuizSettingsData,
  QuizParticipantsExpose,
  ParticipantItem,
  QuizPublishExpose,
  QuizPublishData,
  QuizQuestionsExpose,
  QuizQuestionsData,
  QuizCategory,
} from '@/types/QuizCreation'
import type { QuizInfo } from '@/types/Quiz'
import type { CourseParticipants } from '@/types/Course'
import { QuizStatus } from '@/types/QuizPayload'
import { PublishStatus } from '@/types/GlobalTypes'
import { buildQuizFormData } from '@/utils/quizPayload'
import type { Media } from '@/types/Media'

interface ExistingParticipant {
  index: number
  id: string | number
  type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles'
  name?: string
  fullName?: string
  email?: string
  surname?: string
  title?: string
}

interface Props {
  show: boolean
  quizId?: number | null
  isDashboard?: boolean
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
  isDashboard: false,
})

const isDashboard = computed(() => props.isDashboard || false)

const emit = defineEmits<{
  close: []
  success: []
}>()
const quizStore = useQuizStore()
const { showToast } = useToaster()
const currentStep = ref<number>(1)
const totalSteps = 4
const settingsRef = ref<QuizStepExpose | null>(null)
const questionsRef = ref<QuizQuestionsExpose | null>(null)
const participantsRef = ref<QuizParticipantsExpose | null>(null)
const publishRef = ref<QuizPublishExpose | null>(null)

// Persisted step data
const settingsData = ref<Partial<QuizSettingsData>>({})
const questionsData = ref<Partial<QuizQuestionsData>>({})
const participantsData = ref<ParticipantItem[]>([])
const publishData = ref<Partial<QuizPublishData>>({})

// Existing participants for edit mode
const existingParticipants = ref<ExistingParticipant[]>([])

// Key to force participant step re-render
const participantsKey = ref<number>(0)

// Store created/edited quiz ID for subsequent updates
const currentQuizId = ref<number | null>(null)

// Store isEditable flag from API for edit mode
const isQuizEditable = ref<boolean>(false)

// Store quiz status from API for edit mode
const quizStatus = ref<PublishStatus | null>(null)

// Validation state tracker - updated whenever form changes
const validationTrigger = ref<number>(0)

const steps = computed(() => [
  { label: t('pages.quizCreation.steps.settings') },
  { label: t('pages.quizCreation.steps.questions') },
  { label: t('pages.quizCreation.steps.participants') },
  { label: t('pages.quizCreation.steps.publish') },
])

const isFirstStep = computed(() => currentStep.value === 1)
const isLastStep = computed(() => currentStep.value === totalSteps)

// Force re-evaluation of validation
const updateValidation = () => {
  validationTrigger.value++
}

// Validation for next button
const canProceedToNext = computed(() => {
  if (currentStep.value === 1) {
    const settings = settingsRef.value?.getSettings?.()
    return settings?.isValid ?? false
  }

  if (currentStep.value === 2) {
    const questions = questionsRef.value?.getQuestions?.()
    return questions?.isValid ?? false
  }

  return true
})

// Validation for save draft button - requires at least settings step to be valid
const canSaveDraft = computed(() => {
  // Trigger re-evaluation when validation changes
  void validationTrigger.value

  const settings = settingsRef.value?.getSettings?.()
  return settings?.isValid ?? false
})

// Save current step data before navigating
const saveCurrentStepData = () => {
  if (currentStep.value === 1 && settingsRef.value?.getSettings) {
    const settings = settingsRef.value.getSettings()
    settingsData.value = {
      title: settings.title,
      language: settings.language,
      maxAttempts: settings.maxAttempts,
      showFeedback: settings.showFeedback,
      description: settings.description,
      image: settings.image,
    }
  }

  if (currentStep.value === 2 && questionsRef.value?.getQuestions) {
    const questions = questionsRef.value.getQuestions()
    questionsData.value = {
      categoriesWeightTotal: questions.categoriesWeightTotal,
      categoriesWeightCurrent: questions.categoriesWeightCurrent,
      minimumWeightToPass: questions.minimumWeightToPass,
      minimumWeightRules: questions.minimumWeightRules,
      categories: questions.categories,
    }
  }

  if (currentStep.value === 3 && participantsRef.value?.getParticipants) {
    const participants = participantsRef.value.getParticipants()
    participantsData.value = participants.participants
  }

  if (currentStep.value === 4 && publishRef.value?.getPublishData) {
    const publish = publishRef.value.getPublishData()
    publishData.value = {
      startDate: publish.startDate,
      endDate: publish.endDate,
    }
  }
}

// Restore step data when entering a step
const restoreStepData = async () => {
  await nextTick()

  if (currentStep.value === 1 && settingsRef.value?.setSettings) {
    settingsRef.value.setSettings(settingsData.value)
  }

  if (currentStep.value === 2 && questionsRef.value?.setQuestions) {
    questionsRef.value.setQuestions(questionsData.value)
  }

  // For participants step, don't call setParticipants if we have existingParticipants
  // The component's watcher will handle the initial population from existingParticipants prop
  if (currentStep.value === 3 && participantsRef.value?.setParticipants) {
    // Only restore if we have manually saved data AND no existing participants from edit mode
    if (participantsData.value.length > 0 && !currentQuizId.value) {
      participantsRef.value.setParticipants(participantsData.value)
    }
  }

  if (currentStep.value === 4 && publishRef.value?.setPublishData) {
    publishRef.value.setPublishData(publishData.value)
  }
}

// Transform QuizInfo from API to QuizCreationModal format
const transformQuizInfoToFormData = (quizInfo: QuizInfo): void => {
  // Transform settings data
  const attachment: Media[] = quizInfo.attachment
    ? [
        {
          id: quizInfo.attachment.id,
          uuid: '',
          fileName: quizInfo.attachment.fileName,
          name: quizInfo.attachment.customFileName,
          collectionName: '',
          mimeType: quizInfo.attachment.mimeType,
          size: quizInfo.attachment.size,
          url: quizInfo.attachment.url,
        },
      ]
    : []

  settingsData.value = {
    title: quizInfo.title,
    language: quizInfo.language,
    maxAttempts: quizInfo.maxAttempts.toString(),
    showFeedback: quizInfo.showFeedback,
    description: quizInfo.description,
    image: attachment,
  }

  // Transform categories and questions data
  const transformedCategories: QuizCategory[] = quizInfo.categories.map((cat) => ({
    id: cat.id.toString(),
    title: cat.title,
    weight: cat.weight.toString(),
    expanded: false,
    questions: cat.questions.map((q) => ({
      id: q.id.toString(),
      title: q.title,
      weight: q.weight.toString(),
      type: q.type.toLowerCase(),
      required: q.isRequired,
      photoRequired: q.photoRequired ? 'yes' : 'no',
      comment: q.commentRequired ? 'yes' : 'no',
      attachments: q.attachments.map((att) => ({
        id: att.id,
        uuid: '', // Not available in QuizAttachment, set to empty string
        fileName: att.fileName || att.customFileName || '',
        name: att.customFileName || att.fileName || '',
        collectionName: '', // Not available in QuizAttachment, set to empty string
        mimeType: att.mimeType || '',
        size: att.size || 0,
        url: att.url || '',
        customFileName: att.customFileName || att.fileName || '',
      })),
      correctAnswer: q.correctAnswer || undefined,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.title,
        value: opt.weight,
      })),
    })),
  }))

  // Calculate total categories weight
  const totalWeight = quizInfo.categories.reduce((sum, cat) => sum + cat.weight, 0)

  questionsData.value = {
    categoriesWeightTotal: totalWeight.toString(),
    categoriesWeightCurrent: totalWeight,
    minimumWeightToPass: quizInfo.minWeight !== null,
    minimumWeightRules:
      quizInfo.minWeight !== null
        ? [
            {
              id: 'rule-1',
              weight: quizInfo.minWeight.toString(),
              message: quizInfo.minWeightMessage || '',
            },
          ]
        : [],
    categories: transformedCategories,
  }

  // Transform participants data
  // Map participants with their view data
  const transformedParticipants: ExistingParticipant[] = quizInfo.participants.map((p) => {
    // Find the corresponding participant data from participantsView
    const viewData: CourseParticipants | undefined = quizInfo.participantsView?.data?.find(
      (v) => v.id === p.relatedId,
    )

    // Convert relatedType to lowercase format expected by the component
    const type = p.relatedType.toLowerCase() as 'users' | 'groups' | 'stores' | 'clusters' | 'roles'

    return {
      index: p.order || 0,
      id: p.relatedId,
      type: type,
      name: viewData?.firstName,
      surname: viewData?.surname,
      fullName: viewData?.fullName || undefined,
      email: viewData?.email || undefined,
    }
  })

  existingParticipants.value = transformedParticipants

  // Increment key to force component re-render
  participantsKey.value++

  // Store isEditable flag
  isQuizEditable.value = quizInfo.isEditable || false

  // Store quiz status
  quizStatus.value = quizInfo.status

  // Transform publish data
  publishData.value = {
    startDate: quizInfo.startDate,
    endDate: quizInfo.endDate,
  }
}

// Load quiz data when editing
watch(
  [() => props.show, () => props.quizId],
  async ([newShow, newQuizId]) => {
    if (newShow && newQuizId) {
      // Edit mode - load quiz data
      currentQuizId.value = newQuizId
      await quizStore.fetchQuizInfo(newQuizId, true)
      if (quizStore.quizInfo) {
        transformQuizInfoToFormData(quizStore.quizInfo)
        // Restore data to all steps
        await nextTick()
        await restoreStepData()
      }
    } else if (newShow && !newQuizId) {
      // Create mode - reset to empty
      currentQuizId.value = null
      isQuizEditable.value = false
      quizStatus.value = null
      settingsData.value = {}
      questionsData.value = {}
      participantsData.value = []
      publishData.value = {}
      existingParticipants.value = []
      participantsKey.value++
      currentStep.value = 1
    }
  },
  { immediate: true },
)

// Watch for step changes to restore data
watch(currentStep, async () => {
  await restoreStepData()
})

const handleClose = async () => {
  if (isDashboard.value) {
    await quizStore.fetchQuizzes({
      page: 0,
      perPage: 8,
      order: 'asc',
      orderColumn: 'title',
      isAdmin: props.isAdmin,
    })
  }
  emit('close')
}

const handleNext = () => {
  // Validate current step before proceeding
  if (!canProceedToNext.value) {
    return
  }

  // Save current step data
  saveCurrentStepData()

  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const handlePrevious = () => {
  // Save current step data before going back
  saveCurrentStepData()

  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleSaveDraft = async () => {
  // For draft, only settings is required
  const settings = settingsRef.value?.getSettings?.()

  if (!settings) {
    showToast({
      tone: 'error',
      message: t('pages.quizCreation.errors.invalidSettings'),
    })
    return
  }

  // Collect optional step data (questions, participants, publish)
  const questions = questionsRef.value?.getQuestions?.() || {
    categoriesWeightTotal: '100',
    categoriesWeightCurrent: 0,
    minimumWeightToPass: false,
    minimumWeightRules: [],
    categories: [],
    isValid: true,
    errors: [],
  }

  const participants = participantsRef.value?.getParticipants?.() || {
    participants: [],
  }

  const publish = publishRef.value?.getPublishData?.() || {
    startDate: '',
    endDate: '',
  }

  try {
    // Build FormData with draft status
    const formData = buildQuizFormData(settings, questions, participants, publish, QuizStatus.DRAFT)

    // Call appropriate API based on whether we have a quiz ID
    if (currentQuizId.value !== null) {
      // Update existing quiz
      await quizStore.updateQuiz(currentQuizId.value, formData)
      showToast({
        tone: 'success',
        message: t('pages.quizCreation.messages.draftUpdated'),
      })
    } else {
      // Create new quiz and store the returned ID
      const response = await quizStore.createQuiz(formData)
      if (response && response.id) {
        currentQuizId.value = response.id
      }
      showToast({
        tone: 'success',
        message: t('pages.quizCreation.messages.draftSaved'),
      })
    }

    // Keep modal open - user can continue editing
  } catch {
    // Error toast is handled in the store
  }
}

const handlePublish = async () => {
  // Save current step data first to ensure everything is captured
  saveCurrentStepData()

  // Collect all step data
  const settings = settingsRef.value?.getSettings?.()
  const questions = questionsRef.value?.getQuestions?.()

  // For participants, prioritize saved data since component might be unmounted
  const participants = participantsRef.value?.getParticipants?.() || {
    participants: participantsData.value,
  }

  const publish = publishRef.value?.getPublishData?.()

  if (!settings || !questions || !publish) {
    showToast({
      tone: 'error',
      message: t('pages.quizCreation.errors.missingData'),
    })
    return
  }

  // Validate all steps before publishing
  if (!settings.isValid) {
    showToast({
      tone: 'error',
      message: t('pages.quizCreation.errors.invalidSettings'),
    })
    return
  }

  if (!questions.isValid) {
    showToast({
      tone: 'error',
      message: t('pages.quizCreation.errors.invalidQuestions'),
    })
    return
  }

  try {
    // Build FormData with published status
    const formData = buildQuizFormData(
      settings,
      questions,
      participants,
      publish,
      QuizStatus.PUBLISHED,
    )
    console.log('formData: QuizCreationModal', formData)

    // Call appropriate API based on whether we have a quiz ID
    const quizId = currentQuizId.value
    if (quizId !== null) {
      // Update existing quiz
      await quizStore.updateQuiz(quizId, formData)
      showToast({
        tone: 'success',
        message: t('pages.quizCreation.messages.quizUpdated'),
      })
    } else {
      // Create and publish new quiz
      const response = await quizStore.createQuiz(formData)
      if (response && response.id) {
        currentQuizId.value = response.id
      }
      showToast({
        tone: 'success',
        message: t('pages.quizCreation.messages.quizPublished'),
      })
    }

    // Close modal after successful publish
    if (isDashboard.value) {
      await quizStore.fetchQuizzes({
        page: 0,
        perPage: 8,
        order: 'asc',
        orderColumn: 'title',
        isAdmin: props.isAdmin,
      })
    }
    emit('close')
  } catch {
    // Error toast is handled in the store
  }
}
</script>
<template>
  <BasePopupModal
    v-if="show"
    :title="quizId ? t('pages.quizCreation.editTitle') : t('pages.quizCreation.title')"
    :fullscreen="true"
    :close-button="false"
    :enable-scroll="true"
    @onClose="handleClose"
  >
    <template #header-actions>
      <div class="flex items-center gap-2 md:gap-1.5 lg:gap-2">
        <BaseButton
          :text="t('pages.quizCreation.buttons.cancel')"
          variant="link"
          size="sm"
          class="!min-w-[94px] md:!min-w-[85px] lg:!min-w-[94px] !font-medium whitespace-nowrap"
          @onClick="handleClose"
        />
        <BaseButton
          v-if="!isFirstStep"
          :text="t('pages.quizCreation.buttons.previous')"
          variant="default"
          color="neutral"
          size="sm"
          class="!min-w-[106px] md:!min-w-[95px] lg:!min-w-[106px] !font-medium whitespace-nowrap"
          @onClick="handlePrevious"
        />
        <BaseButton
          v-if="!quizId || quizStatus === PublishStatus.DRAFT"
          :text="t('pages.quizCreation.buttons.saveDraft')"
          variant="default"
          color="neutral"
          size="sm"
          class="!min-w-[110px] md:!min-w-[100px] lg:!min-w-[110px] !font-medium whitespace-nowrap"
          :disabled="!canSaveDraft"
          @onClick="handleSaveDraft"
        />
        <BaseButton
          v-if="!isLastStep"
          :text="t('pages.quizCreation.buttons.next')"
          variant="default"
          color="primary"
          size="sm"
          class="!min-w-[80px] md:!min-w-[70px] lg:!min-w-[80px] !font-medium whitespace-nowrap"
          :disabled="!canProceedToNext"
          @onClick="handleNext"
        />
        <BaseButton
          v-else
          :text="
            quizStatus === PublishStatus.PUBLISHED
              ? t('pages.quizCreation.buttons.update')
              : t('pages.quizCreation.buttons.publish')
          "
          variant="default"
          color="primary"
          size="sm"
          class="!min-w-[97px] md:!min-w-[87px] lg:!min-w-[97px] !font-medium whitespace-nowrap"
          @onClick="handlePublish"
        />
      </div>
    </template>

    <div class="p-8 md:p-4 lg:p-8">
      <BaseStepper :steps="steps" :current-step="currentStep" />
      <div class="mt-[48px] md:mt-8 lg:mt-[48px]">
        <QuizSettingsStep
          v-show="currentStep === 1"
          ref="settingsRef"
          @validation-changed="updateValidation"
        />
        <QuizQuestionsStep
          v-show="currentStep === 2"
          ref="questionsRef"
          :is-read-only="isQuizEditable"
          @validation-changed="updateValidation"
        />
        <QuizParticipantsStep
          v-if="currentStep === 3"
          ref="participantsRef"
          :key="participantsKey"
          :is-edit="false"
          :existing-participants="existingParticipants"
        />
        <QuizPublishStep v-show="currentStep === 4" ref="publishRef" />
      </div>
    </div>
  </BasePopupModal>
</template>
