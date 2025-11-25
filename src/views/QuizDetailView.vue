<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BaseButton, BaseIcon, BaseText, BaseTimer } from '@/components/common'
import ActionButtonWithTooltip from '@/components/common/ActionButtonWithTooltip.vue'
import { QuizCreationModal } from '@/components/quizCreation'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import { t } from '@/utils/i18n'
import { useQuizStore } from '@/stores/QuizStore'
import {
  QuizStepper,
  QuizQuestion,
  QuizEndConfirmationModal,
  QuizRetakeConfirmationModal,
  QuizCompletionScreen,
  QuizFailedScreen,
} from '@/components/quiz'
import TimerService from '@/services/timerService'
import { buildQuizCategoryPayload } from '@/utils/quizPayloadBuilder'
import type { QuizInfo, QuizInfoQuestion, QuizAnswerValue, QuizStep } from '@/types/Quiz'
import { CourseExecutionType } from '@/types/Course'
import type { TimerItem } from '@/types/timer'
import { PublishStatus, ExecutionStatus, type ActionButtonConfig } from '@/types/GlobalTypes'
const props = defineProps<{
  isAdmin: boolean
}>()

const router = useRouter()
const route = useRoute()
const quizStore = useQuizStore()

const quizId = computed(() => route.params.id)

const quizData = ref<QuizInfo | null>(null)
const isLoading = ref(true)
const answers = ref<Record<number, QuizAnswerValue>>({})
const currentStep = ref(1)
const timerRef = ref<InstanceType<typeof BaseTimer> | null>(null)
const isTimerStopped = ref(true)
const timerDetails = ref<TimerItem | null>(null)
const isInitializingTimer = ref(false)
const submittedCategories = ref<Set<number>>(new Set())
const showEndQuizModal = ref(false)
const showRetakeQuizModal = ref(false)
const showDeleteModal = ref(false)
const showQuizCreationModal = ref(false)

const steps = computed((): QuizStep[] => {
  if (!quizData.value) return []

  return quizData.value.categories.map((category, index) => {
    const stepNumber = index + 1
    const hasExecution = category.execution !== null && category.execution !== undefined
    const isSubmitted = submittedCategories.value.has(category.id)

    return {
      id: stepNumber,
      title: category.title,
      isActive: stepNumber === currentStep.value,
      // Category is completed if: already has execution data OR has been submitted in this session OR user has passed it
      isCompleted: hasExecution || isSubmitted || stepNumber < currentStep.value,
    }
  })
})

const currentCategory = computed(() => {
  if (!quizData.value || !quizData.value.categories) return null
  return quizData.value.categories[currentStep.value - 1] || null
})

const currentCategoryQuestions = computed((): QuizInfoQuestion[] => {
  if (!currentCategory.value) return []
  return [...currentCategory.value.questions].sort((a, b) => a.sequence - b.sequence)
})

const questionOffset = computed(() => {
  if (!quizData.value) return 0
  let offset = 0
  for (let i = 0; i < currentStep.value - 1; i++) {
    offset += quizData.value.categories[i]?.questions.length || 0
  }
  return offset
})

const isQuizCompleted = computed(() => {
  return (
    (quizData.value?.execution?.status === ExecutionStatus.COMPLETED ||
      quizData.value?.execution?.status === ExecutionStatus.FAILED) &&
    !props.isAdmin
  )
})

const showCompletionScreen = computed(() => {
  return quizData.value?.execution?.status === ExecutionStatus.COMPLETED
})

const showFailedScreen = computed(() => {
  return quizData.value?.execution?.status === ExecutionStatus.FAILED
})

const isRetakeDisabled = computed(() => {
  if (!quizData.value || !quizData.value.execution) return false
  const attempts = quizData.value.execution.attempts ?? 0
  const maxAttempts = quizData.value.maxAttempts ?? 0
  return attempts >= maxAttempts
})

const retakeButtonConfig = computed(() => ({
  id: 'retake-quiz',
  text: t('pages.quiz.buttons.retakeQuiz'),
  variant: 'default' as const,
  color: 'primary' as const,
  size: 'sm' as const,
  tooltipText: t('pages.quiz.maxAttemptsReached'),
  onClick: handleRetakeQuiz,
  buttonClass: '!min-w-[150px] !font-medium !text-xs sm:!text-sm',
}))

const isViewOnly = computed(() => {
  return props.isAdmin || isTimerStopped.value || isQuizCompleted.value
})

const isNextButtonDisabled = computed(() => {
  // Always enabled for admins and completed quizzes (view-only navigation)
  if (props.isAdmin || isQuizCompleted.value || isViewOnly.value) {
    return false
  }

  // Disable Next button on the last step (user should use End Quiz button instead)
  if (currentStep.value >= steps.value.length) {
    return true
  }

  // Disable if validation fails for non-admin users
  return !validateCurrentStep()
})

const handleTimerStart = async (fromEvent: boolean = true) => {
  isTimerStopped.value = false

  // Only start the timer component if this is a programmatic call (not from timer's own event)
  if (!fromEvent && timerRef.value) {
    timerRef.value.start()
  }

  // Only call API if not initializing and timerId exists
  if (!isInitializingTimer.value && quizData.value?.execution?.timerId) {
    try {
      await TimerService.startTimer(quizData.value.execution.timerId)
      if (timerDetails.value) {
        timerDetails.value.running = true
      }
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }
}

const handleTimerStop = async (fromEvent: boolean = true) => {
  // If timer is already stopped or not running, skip everything
  if (isTimerStopped.value || !timerDetails.value?.running) {
    return
  }

  isTimerStopped.value = true

  // Only stop the timer component if this is a programmatic call (not from timer's own event)
  if (!fromEvent && timerRef.value) {
    timerRef.value.stop()
  }

  // Only call API if not initializing and timerId exists
  if (!isInitializingTimer.value && quizData.value?.execution?.timerId) {
    try {
      await TimerService.stopTimer(quizData.value.execution.timerId)
      if (timerDetails.value) {
        timerDetails.value.running = false
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }
}

// Handle page reload/close when timer is running
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  // Check if timer is running (not stopped)
  if (!isTimerStopped.value && timerDetails.value?.running) {
    // Standard way to show confirmation dialog
    event.preventDefault()
    event.returnValue = t('pages.quiz.warning.unsavedChanges')

    // Stop the timer when user leaves the page using the service
    if (quizData.value?.execution?.timerId) {
      // Use special unload method that ensures delivery even after page closes
      TimerService.stopTimerOnUnload(quizData.value.execution.timerId)

      // Update local state
      isTimerStopped.value = true
      if (timerDetails.value) {
        timerDetails.value.running = false
      }
    }

    // Return message for older browsers
    return t('pages.quiz.warning.unsavedChanges')
  }
}

onMounted(async () => {
  await loadQuiz()

  // Only initialize timer if not admin and quiz is not completed
  if (!props.isAdmin && quizData.value?.execution?.timerId) {
    // Wait for the template to fully render (including BaseTimer component)
    await nextTick()
    await nextTick() // Extra tick to ensure BaseTimer is fully mounted

    // Now initialize the timer
    await initializeTimer()

    // Add beforeunload event listener to warn about unsaved changes
    window.addEventListener('beforeunload', handleBeforeUnload)
  }
})

const loadQuiz = async () => {
  try {
    isLoading.value = true
    const quiz = await quizStore.fetchQuizInfo(Number(quizId.value), props.isAdmin)
    quizData.value = quiz

    // Populate answers from execution data if available
    populateAnswersFromExecution()
  } catch (error) {
    console.error('Failed to load quiz:', error)
  } finally {
    isLoading.value = false
  }
}

const populateAnswersFromExecution = (categoryId?: number) => {
  if (!quizData.value) return

  // If categoryId is specified, only populate that category
  const categoriesToProcess = categoryId
    ? quizData.value.categories.filter((cat) => cat.id === categoryId)
    : quizData.value.categories

  // Iterate through specified categories and questions
  categoriesToProcess.forEach((category) => {
    category.questions.forEach((question) => {
      // Only populate if question doesn't already have an answer in current session
      if (question.execution && !answers.value[question.id]) {
        const exec = question.execution
        const answer: QuizAnswerValue = {}

        // Map execution data to answer format based on question type
        const questionType = question.type.toUpperCase()

        // Handle value field (for text, rating, yes_no)
        if (exec.value !== null && exec.value !== undefined) {
          if (questionType === 'RATING') {
            // Rating should be numeric
            answer.rating =
              typeof exec.value === 'number' ? exec.value : parseInt(exec.value as string, 10)
          } else if (questionType === 'YES_NO') {
            // Map "yes"/"no" back to radio value (1/0)
            answer.radio = exec.value === 'yes' ? 1 : 0
          } else if (questionType === 'OPEN') {
            // Text answer
            answer.text = exec.value as string
          }
        }

        // Handle optionIds (for select_single, select_multiple)
        if (exec.optionIds && exec.optionIds.length > 0) {
          if (questionType === 'SELECT_SINGLE') {
            answer.radio = exec.optionIds[0]
          } else if (questionType === 'SELECT_MULTIPLE') {
            answer.checkbox = exec.optionIds
          }
        }

        // Handle comment
        if (exec.comment) {
          answer.comment = exec.comment
        }

        // Handle attachment URL (photo)
        if (exec.attachmentUrl) {
          // Extract filename from URL
          const urlParts = exec.attachmentUrl.split('/')
          const fileNameWithQuery = urlParts[urlParts.length - 1] || 'uploaded-photo.jpg'
          const fileName = fileNameWithQuery.split('?')[0] || fileNameWithQuery // Remove query params

          answer.photo = [fileName]
        }

        // Store the populated answer
        if (Object.keys(answer).length > 0) {
          answers.value[question.id] = answer
        }
      }
    })
  })
}

const initializeTimer = async () => {
  // Fetch timer details if timerId exists
  if (quizData.value?.execution?.timerId) {
    try {
      isInitializingTimer.value = true // Set flag to prevent API calls during initialization

      const timerResponse = await TimerService.getTimer(quizData.value.execution.timerId)
      const timer = timerResponse.data
      timerDetails.value = timer

      // Set the timer to the existing elapsed time
      await nextTick()

      if (timerRef.value) {
        timerRef.value.reset(timer.seconds)

        // If timer was running, start it
        if (timer.running) {
          timerRef.value.start()
        }
      }

      // Clear initialization flag after a short delay to allow events to settle
      await nextTick()
      isInitializingTimer.value = false
    } catch (error) {
      console.error('Error fetching timer details:', error)
      isInitializingTimer.value = false
      // If timer fetch fails, start with default time
      await nextTick()
      if (timerRef.value) {
        timerRef.value.start()
      }
    }
  } else {
    // No timerId, start timer from 0
    await nextTick()
    timerRef.value?.start()
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  timerRef.value?.stop()
})

const handleBack = async () => {
  // Check if timer is running and stop it before leaving (skip if admin)
  if (!props.isAdmin && !isTimerStopped.value && timerDetails.value?.running) {
    await handleTimerStop(false) // programmatic call
  }
  router.back()
}

const handleEndQuiz = () => {
  showEndQuizModal.value = true
}

const handleCloseEndQuizModal = () => {
  showEndQuizModal.value = false
}

const handleConfirmEndQuiz = async () => {
  try {
    showEndQuizModal.value = false
    // First, ALWAYS submit current category before ending quiz
    if (currentCategory.value && quizData.value) {
      const categoryId = currentCategory.value.id

      const formDataPayload = buildQuizCategoryPayload(
        quizData.value.id,
        currentCategory.value,
        answers.value,
      )

      // Submit category answers first - this must complete before ending quiz
      await quizStore.submitCategoryAnswers(formDataPayload)

      // Mark category as submitted
      submittedCategories.value.add(categoryId)
    }

    // Then, end quiz execution (only after category submission is complete)
    await quizStore.endQuizExecution({
      ownerId: Number(quizId.value),
      ownerType: CourseExecutionType.QUIZ,
    })

    // Stop timer if running
    if (!isTimerStopped.value && timerDetails.value?.running) {
      await handleTimerStop(false) // programmatic call
    }

    // Close the modal
    showEndQuizModal.value = false

    // Reload quiz info to get updated status (completed/failed)
    await loadQuiz()
    await initializeTimer()
  } catch (error) {
    console.error('Error ending quiz:', error)
  }
}

const handleRetakeQuiz = () => {
  if (isRetakeDisabled.value) return
  showRetakeQuizModal.value = true
}

const handleCloseRetakeQuizModal = () => {
  showRetakeQuizModal.value = false
}

const handleConfirmRetakeQuiz = async () => {
  showRetakeQuizModal.value = false

  try {
    // Stop current timer if running
    if (timerRef.value) {
      timerRef.value.stop()
    }

    // Call API to retake/reset quiz execution
    await quizStore.retakeQuiz({
      ownerId: Number(quizId.value),
      ownerType: CourseExecutionType.QUIZ,
    })

    // Clear all existing answers
    answers.value = {}

    // Clear submitted categories
    submittedCategories.value.clear()

    // Reset timer state
    isTimerStopped.value = true
    timerDetails.value = null

    // Reload quiz data (will have fresh execution status)
    isLoading.value = true
    const quiz = await quizStore.fetchQuizInfo(Number(quizId.value), props.isAdmin)
    quizData.value = quiz

    // Populate any existing execution data
    populateAnswersFromExecution()
    isLoading.value = false

    // Reset to first step
    currentStep.value = 1

    // Re-initialize and start timer
    if (!props.isAdmin) {
      await nextTick()

      // Initialize timer from fresh state
      if (quizData.value?.execution?.timerId) {
        isInitializingTimer.value = true

        const timerResponse = await TimerService.getTimer(quizData.value.execution.timerId)
        const timer = timerResponse.data
        timerDetails.value = timer

        await nextTick()

        if (timerRef.value) {
          timerRef.value.reset(timer.seconds || 0)
          if (timer.running) {
            timerRef.value.start()
          }
        }

        // Clear initialization flag before starting
        await nextTick()
        isInitializingTimer.value = false
      }
    }
  } catch (error) {
    console.error('Error retaking quiz:', error)
    isLoading.value = false
  }
}

const handleCancel = async () => {
  // Check if timer is running and stop it before cancelling (skip if admin)
  if (!props.isAdmin && !isTimerStopped.value && timerDetails.value?.running) {
    await handleTimerStop(false) // programmatic call
  }
  if (props.isAdmin) {
    router.push({ name: 'admin-quizzes-view' })
  } else {
    router.push({ name: 'quizzes-view' })
  }
}

const handlePrevious = () => {
  if (currentStep.value > 1) {
    // Just move to previous step - answers are already in memory
    currentStep.value--
  }
}

const checkIfCategoryHasAnswers = (): boolean => {
  const questions = currentCategoryQuestions.value

  for (const question of questions) {
    const answer = answers.value[question.id]

    // Check if this question has any answer data
    if (answer) {
      const hasData =
        answer.text ||
        answer.rating !== undefined ||
        answer.radio !== undefined ||
        (answer.checkbox && answer.checkbox.length > 0) ||
        (answer.photo && answer.photo.length > 0) ||
        (answer.photoFiles && answer.photoFiles.length > 0) ||
        answer.comment

      if (hasData) return true
    }
  }

  return false
}

const handleEditQuiz = () => {
  showQuizCreationModal.value = true
}
const handleDeleteClick = () => {
  showDeleteModal.value = true
}

const handleCancelDelete = () => {
  showDeleteModal.value = false
}

const handleConfirmDelete = async () => {
  showDeleteModal.value = false
  await quizStore.deleteQuiz([Number(quizId.value)], 'soft')
  router.push({ name: 'admin-quizzes-view' })
}

const handleCloseQuizCreationModal = async () => {
  showQuizCreationModal.value = false
  await loadQuiz()
}

const validateCurrentStep = (): boolean => {
  const questions = currentCategoryQuestions.value
  for (const question of questions) {
    const answer = answers.value[question.id]

    if (question.isRequired) {
      if (!answer) return false

      const hasMainAnswer =
        answer.text ||
        answer.rating !== undefined ||
        answer.radio !== undefined ||
        (answer.checkbox && answer.checkbox.length > 0) ||
        (answer.photo && answer.photo.length > 0)

      if (!hasMainAnswer) return false
    }

    if (question.photoRequired && (!answer?.photo || answer.photo.length === 0)) {
      return false
    }

    if (question.commentRequired && !answer?.comment) {
      return false
    }
  }

  return true
}

const handleNext = async () => {
  // If quiz is completed, only allow navigation (no validation or submission)
  if (isQuizCompleted.value) {
    if (currentStep.value < steps.value.length) {
      currentStep.value++
    }
    return
  }

  // In view-only mode, only allow navigation (no validation or submission)
  if (isViewOnly.value) {
    if (currentStep.value < steps.value.length) {
      currentStep.value++
    }
    return
  }

  // Validation check (button should be disabled if this fails, but double-check)
  if (!validateCurrentStep()) {
    return
  }

  // Build and submit FormData payload for current category
  if (currentCategory.value && quizData.value) {
    const categoryId = currentCategory.value.id
    const hasAnswersToSubmit = checkIfCategoryHasAnswers()

    // Only submit if there are answers to submit
    if (hasAnswersToSubmit) {
      const formDataPayload = buildQuizCategoryPayload(
        quizData.value.id,
        currentCategory.value,
        answers.value,
      )

      try {
        await quizStore.submitCategoryAnswers(formDataPayload)

        // Mark category as submitted
        submittedCategories.value.add(categoryId)
      } catch (error) {
        console.error('Error submitting category answers:', error)
        return // Don't proceed if submission fails
      }
    }
  }

  // Move to next step
  if (currentStep.value < steps.value.length) {
    // Just move to next step - answers stay in memory
    currentStep.value++
  }
  // Note: On last step, Next button is disabled, user should use End Quiz button
}

const actionButtons = computed<ActionButtonConfig[]>(() => [
  {
    id: 'delete',
    text: t('pages.quiz.buttons.delete'),
    variant: 'default',
    color: 'error',
    leftIcon: 'delete',
    tooltipText: t('pages.quiz.buttons.cannotDeleteNotDraft'), // Cannot delete if not in Draft status
    onClick: handleDeleteClick,
    disabled: quizData.value?.status === PublishStatus.PUBLISHED,
  },
  {
    id: 'edit',
    text: t('pages.quiz.buttons.edit'),
    variant: 'outline',
    color: 'primary',
    leftIcon: 'edit',
    tooltipText: t('pages.quiz.buttons.cannotEditNotDraft'),
    onClick: handleEditQuiz,
    disabled: false,
  },
])
</script>
<template>
  <div v-if="!isLoading" class="min-h-screen bg-white">
    <header class="sticky top-0 z-50 !bg-white !border-b !border-gray-200">
      <div
        class="flex flex-col sm:flex-row sm:items-center px-4 sm:px-4 md:px-3 lg:px-8 pt-4 sm:pt-4 md:pt-3 lg:pt-6 pb-3 sm:pb-2.5 md:pb-2 lg:pb-[12px] sm:justify-between gap-3 sm:gap-2 md:gap-2 lg:gap-3 !bg-white !border-b !border-gray-200"
      >
        <div class="flex items-center gap-x-3 sm:gap-x-3 md:gap-x-2.5 lg:gap-x-4 min-w-0">
          <BaseIcon
            name="chevron-left"
            size="sm"
            color="neutral"
            :tone="500"
            class="flex-shrink-0 cursor-pointer hover:opacity-80"
            @click="handleBack"
          />
          <BaseText
            :text="quizData?.title || ''"
            :tone="700"
            color="neutral"
            font="semibold"
            class="!text-lg sm:!text-[20px] md:!text-[20px] lg:!text-[24px] tracking-[-0.032px] !text-neutral-700 truncate"
          />
        </div>

        <div class="flex items-center gap-2 md:gap-1.5 lg:gap-2 flex-wrap sm:flex-nowrap">
          <!-- Retake Quiz Button (shown when quiz is completed) -->
          <ActionButtonWithTooltip
            v-if="!props.isAdmin && isQuizCompleted"
            :button-config="retakeButtonConfig"
            :is-disabled="isRetakeDisabled"
          />
          <!-- Cancel Button (always shown) -->
          <BaseButton
            :text="t('pages.quiz.buttons.cancel')"
            variant="default"
            color="primary"
            size="sm"
            class="!min-w-[80px] sm:!min-w-[95px] !font-medium !bg-transparent !text-[14px] !leading-[20px] !tracking-normal !text-primary-600"
            @onClick="handleCancel"
          />
          <div class="flex items-center gap-2" v-if="props.isAdmin">
            <ActionButtonWithTooltip
              v-for="button in actionButtons"
              :key="button.id"
              :button-config="button"
              :is-disabled="button.disabled || false"
            />
          </div>

          <!-- Previous Button -->
          <BaseButton
            v-if="currentStep > 1 && !isQuizCompleted"
            :text="t('pages.quiz.buttons.previous')"
            variant="default"
            color="neutral"
            size="xs"
            class="!min-w-[85px] sm:!min-w-[106px] !font-medium !text-xs sm:!text-sm"
            @onClick="handlePrevious"
          />

          <!-- Next/Submit Button -->
          <BaseButton
            v-if="
              !showCompletionScreen &&
              !showFailedScreen &&
              currentStep !== steps.length &&
              (currentStep < steps.length || (!isViewOnly && !isQuizCompleted))
            "
            :text="
              currentStep < steps.length
                ? t('pages.quiz.buttons.next')
                : t('pages.quiz.buttons.submit')
            "
            variant="default"
            color="primary"
            size="xs"
            class="!min-w-[60px] sm:!min-w-[70px] !font-medium !text-xs sm:!text-sm"
            :disabled="isNextButtonDisabled"
            @onClick="handleNext"
          />

          <!-- End Quiz Button (hidden when completed or admin) -->
          <BaseButton
            v-if="!props.isAdmin && !isQuizCompleted"
            :text="t('pages.quiz.buttons.endQuiz')"
            variant="default"
            color="primary"
            size="xs"
            class="!min-w-[80px] sm:!min-w-[95px] !font-medium whitespace-nowrap !text-xs sm:!text-sm"
            @onClick="handleEndQuiz"
          />
        </div>
      </div>

      <div
        v-if="!props.isAdmin"
        class="px-4 sm:px-4 md:px-3 lg:px-8 py-3 sm:py-2.5 md:py-2 lg:py-3 border-b border-gray-200"
      >
        <BaseTimer
          ref="timerRef"
          :defaultTime="0"
          :autoStart="false"
          :timerRunning="timerDetails?.running"
          :hideButton="showCompletionScreen || showFailedScreen"
          @start="handleTimerStart"
          @stop="handleTimerStop"
        />
      </div>

      <QuizStepper v-if="!showCompletionScreen && !showFailedScreen" :steps="steps" />
    </header>

    <!-- Completion Screen -->
    <QuizCompletionScreen v-if="showCompletionScreen && quizData" :quiz-data="quizData" />

    <!-- Failed Screen -->
    <QuizFailedScreen v-if="showFailedScreen && quizData" :quiz-data="quizData" />

    <!-- Regular Quiz View -->
    <template v-if="!showCompletionScreen && !showFailedScreen">
      <main
        class="px-4 sm:px-4 md:px-3 lg:px-8 py-4 sm:py-5 md:py-4 lg:py-8 bg-white flex justify-center"
      >
        <div class="max-w-4xl w-full mx-auto">
          <Transition name="fade" mode="out-in">
            <div :key="currentStep" class="space-y-6 sm:space-y-7 md:space-y-6 lg:space-y-[40px]">
              <div v-for="(question, index) in currentCategoryQuestions" :key="question.id">
                <QuizQuestion
                  :question="question"
                  :question-number="questionOffset + index + 1"
                  :disabled="isViewOnly"
                  v-model="answers[question.id]"
                />
              </div>
            </div>
          </Transition>
        </div>
      </main>

      <!-- End Quiz Confirmation Modal -->
    </template>
    <QuizEndConfirmationModal
      v-if="showEndQuizModal"
      :show="showEndQuizModal"
      @close="handleCloseEndQuizModal"
      @confirm="handleConfirmEndQuiz"
    />

    <!-- Retake Quiz Confirmation Modal -->
    <QuizRetakeConfirmationModal
      :show="showRetakeQuizModal"
      @close="handleCloseRetakeQuizModal"
      @confirm="handleConfirmRetakeQuiz"
    />
    <BaseDeleteModal
      v-if="showDeleteModal"
      :text="t('pages.quizzes.deleteModal.title')"
      :description="t('pages.quizzes.deleteModal.description')"
      @onCancel="handleCancelDelete"
      @onDelete="handleConfirmDelete"
    />

    <QuizCreationModal
      v-if="showQuizCreationModal"
      :show="showQuizCreationModal"
      :quiz-id="Number(quizId)"
      :isAdmin="props.isAdmin"
      @close="handleCloseQuizCreationModal"
    />
  </div>

  <div v-else-if="isLoading" class="min-h-screen bg-white flex items-center justify-center">
    <BaseText :text="t('pages.quiz.loading')" color="neutral" :tone="500" class="text-lg" />
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
