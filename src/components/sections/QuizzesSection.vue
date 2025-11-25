<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, BaseText, BaseIcon } from '@/components/common'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import { QuizExecutionStatus, QuizStatusBadge } from '@/components/quiz'
import { QuizCreationModal } from '@/components/quizCreation'
import { useQuizStore } from '@/stores/QuizStore'
import type { MenuItem } from '@/components/ThreeDotMenu.vue'
import type { quizItem } from '@/types/Quiz'
import { t } from '@/utils/i18n'
import ThumbnailImage from '@/assets/images/thumbnail-image.png'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const quizStore = useQuizStore()
const showDeleteModal = ref(false)
const selectedQuizId = ref<number | null>(null)
const showQuizCreationModal = ref(false)
const editingQuizId = ref<number | null>(null)

onMounted(async () => {
  await quizStore.fetchQuizzes({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'title',
    isAdmin: props.isAdmin,
  })
})

const handleQuizzesViewAll = () => {
  if (props.isAdmin) {
    router.push({ name: 'admin-quizzes-view' })
  } else {
    router.push({ name: 'quizzes-view' })
  }
}

const handleDeleteClick = (quizId: number) => {
  selectedQuizId.value = quizId
  showDeleteModal.value = true
}

const handleCancelDelete = () => {
  showDeleteModal.value = false
}

const handleConfirmDelete = async () => {
  showDeleteModal.value = false
  if (selectedQuizId.value) {
    await quizStore.deleteQuiz([selectedQuizId.value], 'soft')
    await quizStore.fetchQuizzes({
      page: 0,
      perPage: 8,
      order: 'asc',
      orderColumn: 'title',
      isAdmin: props.isAdmin,
    })
  }
  selectedQuizId.value = null
}
const handleCloseQuizCreationModal = async () => {
  showQuizCreationModal.value = false
  editingQuizId.value = null
  await quizStore.fetchQuizzes({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'title',
    isAdmin: props.isAdmin,
  })
}

const getMenuItems = (quizId: number): MenuItem[] => {
  const quiz = quizStore.getQuizzesList.find((quiz) => quiz.id === quizId.toString())
  const isDraft = quiz?.status === 'Draft'

  // Disable edit and delete if not in Draft status
  const isDisabled = !isDraft
  const disabledTooltip = isDisabled ? t('pages.quiz.buttons.cannotDeleteNotDraft') : undefined

  return [
    {
      label: t('pages.common.progress'),
      icon: 'eye',
      action: () => console.log('Progress clicked for quiz:', quizId),
    },
    {
      label: t('pages.common.edit'),
      icon: 'edit',
      action: () => handleEditQuiz(quizId),
    },
    {
      label: t('pages.common.delete'),
      icon: 'delete',
      danger: true,
      disabled: isDisabled,
      tooltip: disabledTooltip,
      action: () => handleDeleteClick(quizId),
    },
  ]
}

const handleEditQuiz = (quizId: number) => {
  editingQuizId.value = quizId
  showQuizCreationModal.value = true
}

const handleQuizClick = (quizId: number) => {
  if (props.isAdmin) {
    router.push({ name: 'admin-quiz-detail', params: { id: quizId } })
  } else {
    router.push({ name: 'quiz-detail', params: { id: quizId } })
  }
}
// Type for quiz from getter (id is string, status is string, execution is preserved)
type QuizFromGetter = Omit<quizItem, 'id' | 'status'> & {
  id: string
  imageUrl: string
  status: string
}

const shouldShowExecutionStatus = (quiz: QuizFromGetter): boolean => {
  return !props.isAdmin && quiz.execution !== null && quiz.execution !== undefined
}

const hasNoQuizzes = computed(() => quizStore.getQuizzesList.length === 0)
</script>

<template>
  <section class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6 w-full">
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center mb-6 md:mb-5 lg:mb-6">
        <h3 class="text-xl md:text-lg lg:text-xl font-bold text-gray-900">
          {{ t('pages.quizzes.title') }}
        </h3>
        <div class="flex items-center gap-3 md:gap-2.5 lg:gap-3">
          <BaseButton
            :text="t('pages.uploadedFiles.viewAll')"
            variant="blank"
            size="xs"
            right-icon="chevron-right"
            rightIconSize="xs"
            class="!w-[auto] !p-[0] !font-medium !bg-[transparent]"
            iconTextGapClass="!gap-[2px]"
            @click="handleQuizzesViewAll"
          />
        </div>
      </div>

      <!-- Horizontal Scroll Container -->
      <div v-if="!hasNoQuizzes" class="flex gap-6 md:gap-5 lg:gap-6 overflow-x-auto pb-2">
        <div
          v-for="quiz in quizStore.getQuizzesList"
          :key="quiz.id"
          class="flex-shrink-0 w-[320px] sm:w-[360px] md:w-[340px] lg:w-[360px] bg-white rounded-[20px] border border-gray-200 cursor-pointer"
          @click="handleQuizClick(Number(quiz.id))"
        >
          <div class="flex items-center p-4 md:p-3 lg:p-4 relative">
            <!-- Thumbnail with Status Icon -->
            <div class="flex-shrink-0 mr-4 md:mr-2.5 lg:mr-4 relative">
              <img
                v-if="quiz.imageUrl"
                :src="quiz.imageUrl"
                :alt="quiz.title"
                class="w-32 md:w-28 md:h-[48px] lg:w-32 lg:h-[52px] h-[52px] object-cover rounded-lg"
              />
              <img
                v-else
                :src="ThumbnailImage"
                alt="Thumbnail"
                class="w-32 md:w-28 md:h-[48px] lg:w-32 lg:h-[52px] h-[52px] object-contain rounded-lg"
              />
              <!-- Execution Status Thumbnail Icon -->
              <QuizExecutionStatus
                v-if="shouldShowExecutionStatus(quiz)"
                :execution="quiz.execution"
                :show-thumbnail-icon="true"
              />
            </div>

            <!-- Title and Status -->
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 text-sm md:text-xs lg:text-sm mb-2 md:mb-1 lg:mb-2 truncate"
              >
                {{ quiz.title }}
              </h3>
              <!-- Admin Status Badge with Date Logic -->
              <QuizStatusBadge
                v-if="isAdmin"
                :status="quiz.status"
                :start-date="quiz.startDate"
                :end-date="quiz.endDate"
                :is-admin="true"
              />
              <!-- Execution Status Badge and Progress Bar for non-admin -->
              <QuizExecutionStatus
                v-if="shouldShowExecutionStatus(quiz)"
                :execution="quiz.execution"
                :show-badge="!isAdmin"
                :show-progress-bar="true"
              />
            </div>

            <!-- Percentage Circle or Three Dot Menu -->
            <div
              class="flex-shrink-0 ml-2 md:ml-1.5 lg:ml-2 flex items-center gap-2 md:gap-1.5 lg:gap-2"
              @click.stop
            >
              <!-- Execution Status Percentage Circle -->
              <QuizExecutionStatus
                v-if="shouldShowExecutionStatus(quiz)"
                :execution="quiz.execution"
                :show-percentage-circle="true"
              />
              <!-- Three Dot Menu for admin -->
              <ThreeDotMenu v-if="isAdmin" :items="getMenuItems(Number(quiz.id))" />
            </div>
          </div>
        </div>
      </div>

      <!-- No Data Message -->
      <div v-if="hasNoQuizzes" class="py-8 text-center">
        <div class="flex flex-col items-center justify-center gap-3">
          <BaseIcon name="inbox" size="lg" color="neutral" :tone="300" />
          <BaseText :text="t('pages.quizzes.noQuizzes')" :tone="500" color="neutral" type="p-sm" />
        </div>
      </div>
    </div>
  </section>

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
    :quiz-id="editingQuizId"
    :isDashboard="true"
    :isAdmin="isAdmin"
    @close="handleCloseQuizCreationModal"
  />
</template>
