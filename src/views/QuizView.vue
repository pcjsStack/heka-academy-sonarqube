<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { BaseButton, BasePagination } from '@/components/common'
import HeaderView from '@/components/layouts/HeaderView.vue'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import QuizFilter from '@/components/sections/QuizFilter.vue'
import { QuizCreationModal } from '@/components/quizCreation'
import { QuizExecutionStatus, QuizStatusBadge } from '@/components/quiz'
import { useQuizStore } from '@/stores/QuizStore'
import type { MenuItem } from '@/components/ThreeDotMenu.vue'
import { t } from '@/utils/i18n'
import type { GetQuizzesParams, quizItem } from '@/types/Quiz'
import ThumbnailImage from '@/assets/images/thumbnail-image.png'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const filters = ref<GetQuizzesParams>({
  search: '',
  page: 0,
  perPage: 12,
  order: 'asc',
  orderColumn: 'title',
  status: null,
  executionStatus: null,
})
const router = useRouter()
const quizStore = useQuizStore()
const showDeleteModal = ref(false)
const showQuizCreationModal = ref(false)
const showQuizModal = ref(false)
const selectedQuizId = ref<number | null>(null)
const editingQuizId = ref<number | null>(null)
const showFilterModal = ref(false)

const handleBack = () => {
  if (props.isAdmin) {
    router.push('/admin')
  } else {
    router.push('/')
  }
}

onMounted(async () => {
  await loadQuizzes()
})

const loadQuizzes = async () => {
  await quizStore.fetchQuizzes({ ...filters.value, isAdmin: props.isAdmin })
}

const hasActiveFilters = computed(() => {
  if (props.isAdmin) {
    return Boolean(filters.value.status)
  } else {
    return (
      (Array.isArray(filters.value.executionStatus) && filters.value.executionStatus.length > 0) ||
      (filters.value.executionStatus !== null && filters.value.executionStatus !== undefined)
    )
  }
})

const handleInputChange = (event: Event) => {
  const searchValue = (event.target as HTMLInputElement).value
  filters.value.search = searchValue
  debouncedSearch()
}

const debouncedSearch = debounce(() => {
  filters.value.page = 0
  loadQuizzes()
}, 500)

const toggleFilter = () => {
  showFilterModal.value = !showFilterModal.value
}

const handleApplyFilters = (filterParams: GetQuizzesParams) => {
  filters.value = { ...filters.value, ...filterParams, page: 0 }
  loadQuizzes()
}

const handleClearFilters = () => {
  filters.value = {
    search: filters.value.search,
    page: 0,
    perPage: 12,
    order: 'asc',
    orderColumn: 'title',
    status: null,
    executionStatus: null,
  }
  showFilterModal.value = false
  loadQuizzes()
}

const handleUpdateFilters = (filterParams: GetQuizzesParams) => {
  filters.value = { ...filters.value, ...filterParams }
}

const handleDeleteClick = (quizId: number) => {
  selectedQuizId.value = quizId
  showDeleteModal.value = true
}

const handleCancelDelete = () => {
  showDeleteModal.value = false
  selectedQuizId.value = null
}

const handleConfirmDelete = async () => {
  showDeleteModal.value = false
  if (selectedQuizId.value) {
    await quizStore.deleteQuiz([selectedQuizId.value], 'soft')
    await loadQuizzes()
  }
  selectedQuizId.value = null
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
    router.push({ name: 'admin-quiz-detail', params: { id: quizId.toString() } })
  } else {
    router.push({ name: 'quiz-detail', params: { id: quizId.toString() } })
  }
  showQuizModal.value = true
}

const handlePageChangeQuiz = async (page: number) => {
  filters.value.page = page - 1
  await loadQuizzes()
}

const handleCreateQuiz = () => {
  editingQuizId.value = null
  showQuizCreationModal.value = true
}

const handleCloseQuizCreationModal = async () => {
  showQuizCreationModal.value = false
  editingQuizId.value = null
  await loadQuizzes()
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
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-full mx-auto">
      <HeaderView
        :title="t('pages.quizzes.title')"
        :isBack="true"
        @back="handleBack"
        :isFilter="true"
        :hasActiveFilters="hasActiveFilters"
        isSearch
        @inputChange="handleInputChange"
        custom_actions
        @toggleFilter="toggleFilter"
      >
        <template #custom_actions>
          <BaseButton
            v-if="isAdmin"
            :text="t('pages.quizzes.createQuiz')"
            variant="default"
            size="md"
            @on-click="handleCreateQuiz"
          />
        </template>
      </HeaderView>
      <div
        class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6"
        v-if="quizStore.getQuizzesList.length > 0"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3 md:gap-2.5 lg:gap-6"
        >
          <div
            v-for="quiz in quizStore.getQuizzesList"
            :key="quiz.id"
            class="bg-white rounded-[20px] border border-gray-200 cursor-pointer overflow-hidden"
            @click="handleQuizClick(Number(quiz.id))"
          >
            <div class="flex items-center p-4 md:p-2.5 lg:p-4 relative">
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
        <div class="flex mt-6 md:mt-5 lg:mt-6 justify-center max-w-full">
          <BasePagination
            :currentPage="quizStore.page + 1"
            :totalPages="quizStore.total"
            @update:current-page="handlePageChangeQuiz"
          />
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12 md:py-10 lg:py-12">
        <div
          class="text-gray-400 text-lg md:text-base lg:text-lg font-medium mb-2 md:mb-1.5 lg:mb-2"
        >
          {{ t('pages.quizzes.noQuizzes') }}
        </div>
        <div class="text-gray-500 text-sm md:text-xs lg:text-sm">
          {{ t('pages.quizzes.createYourFirstQuiz') }}
        </div>
      </div>
    </div>
  </div>

  <BaseDeleteModal
    v-if="showDeleteModal"
    :text="t('pages.quizzes.deleteModal.title')"
    :description="t('pages.quizzes.deleteModal.description')"
    @onCancel="handleCancelDelete"
    @onDelete="handleConfirmDelete"
  />

  <QuizFilter
    v-if="showFilterModal"
    :filters="filters"
    :isAdmin="props.isAdmin"
    @close="toggleFilter"
    @applyFilters="handleApplyFilters"
    @clear="handleClearFilters"
    @update:filters="handleUpdateFilters"
  />
  <QuizCreationModal
    v-if="showQuizCreationModal"
    :show="showQuizCreationModal"
    :quiz-id="editingQuizId"
    :isAdmin="props.isAdmin"
    @close="handleCloseQuizCreationModal"
  />
</template>
