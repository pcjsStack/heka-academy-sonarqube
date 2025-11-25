<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { BaseButton, BaseCard, BasePagination } from '@/components/common'
import ProgressTable from '@/components/progress/ProgressTable.vue'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import { CreateLessonModal } from '@/components/lessonCreation'
import HeaderView from '@/components/layouts/HeaderView.vue'
import LessonFilter from '@/components/sections/LessonFilter.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import { useLessonsStore } from '@/stores/lessonsStore'
import { t } from '@/utils/i18n'
import type { GetLessonsParams } from '@/types/Lessons'
import { CourseExecutionType, VisibilityStatus, VisibilityType } from '@/types/Course'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const showCreateLessonModal = ref(false)
const showDeleteLessonModal = ref(false)
const selectedLessonId = ref<number | null>(null)
const selectedCourseVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)
const showProgressTable = ref(false)
const isShowFilter = ref(false)
const lessonsStore = useLessonsStore()
const filters = ref<GetLessonsParams>({
  search: '',
  page: 0 as number,
  perPage: 12,
  order: 'asc',
  orderColumn: 'name',
})
onMounted(async () => {
  await loadLessons()
})
const handleCreateLesson = () => {
  showCreateLessonModal.value = true
}

const handleBack = () => {
  if (props.isAdmin) {
    router.push('/admin')
  } else {
    router.push('/')
  }
}

const loadLessons = async () => {
  await lessonsStore.fetchLessons({ ...filters.value, isAdmin: props.isAdmin })
}
const handleInputChange = (event: Event) => {
  const searchValue = (event.target as HTMLInputElement).value
  filters.value.search = searchValue
  debouncedSearch()
}

const debouncedSearch = debounce(() => {
  filters.value.page = 0
  loadLessons()
}, 500)

const handleCloseLesson = () => {
  showCreateLessonModal.value = false
}
const handlePageChange = (page: number) => {
  filters.value.page = page - 1
  loadLessons()
}
const handleCardClick = (lessonId: string) => {
  if (props.isAdmin) {
    router.push({
      name: 'lesson-admin-details',
      params: { id: lessonId },
    })
  } else {
    router.push({
      name: 'lesson-details',
      params: { id: lessonId },
    })
  }
}
const handleDeleteLesson = (lessonId: number) => {
  selectedLessonId.value = lessonId
  showDeleteLessonModal.value = true
}
const handleCancelLesson = () => {
  showDeleteLessonModal.value = false
  selectedLessonId.value = null
}
const handleDeleteConfirmLesson = async () => {
  if (selectedLessonId.value) {
    await lessonsStore.deleteLesson([selectedLessonId.value])
    showDeleteLessonModal.value = false
    selectedLessonId.value = null
  }
}
const toggleFilter = () => {
  isShowFilter.value = !isShowFilter.value
}
const handleApplyFilters = (filterParams: GetLessonsParams) => {
  filters.value = { ...filters.value, ...filterParams, page: 0 }
  loadLessons()
  isShowFilter.value = false
}
const handleClearFilters = () => {
  filters.value = {
    ...filters.value,
    visibility: [],
    date: undefined,
    startDate: undefined,
    endDate: undefined,
    perPage: 12,
    page: 0,
  }
  if (props.isAdmin) {
    delete filters.value.status
  } else {
    delete filters.value.executionStatus
  }
  delete filters.value.date
  delete filters.value.startDate
  delete filters.value.endDate
  isShowFilter.value = false
  loadLessons()
}
const handleUpdateFilters = (filterParams: GetLessonsParams) => {
  filters.value = { ...filters.value, ...filterParams }
}
const handleEditLesson = async (lessonId: number, visibility: VisibilityStatus) => {
  if (!props.isAdmin) {
    return
  }
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    selectedLessonId.value = lessonId
    await lessonsStore.fetchLessonById(selectedLessonId.value as number, true)
    showCreateLessonModal.value = true
    return
  }
  selectedCourseVisibility.value = visibility
  selectedLessonId.value = lessonId
  showVisibilityChangeModal.value = true
}
const handleProgressLesson = (lessonId: number) => {
  selectedLessonId.value = lessonId
  showProgressTable.value = true
}
const handleCloseProgressTable = () => {
  showProgressTable.value = false
  selectedLessonId.value = null
}
const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  selectedLessonId.value = null
  selectedCourseVisibility.value = null
  loadLessons()
}

const handleVisibilityChangeEdit = async () => {
  // Proceed to edit course modal
  await lessonsStore.fetchLessonById(selectedLessonId.value as number, true)
  showCreateLessonModal.value = true
  showVisibilityChangeModal.value = false
  selectedLessonId.value = null
  selectedCourseVisibility.value = null
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-full mx-auto">
      <HeaderView
        :title="t('pages.lessons.title')"
        isBack
        @back="handleBack"
        isSearch
        isFilter
        custom_actions
        @toggleFilter="toggleFilter"
        :hasActiveFilters="
          Boolean(
            (props.isAdmin
              ? (filters.visibility && filters.visibility.length > 0) ||
                (filters.status && filters.status !== undefined)
              : (Array.isArray(filters.executionStatus) && filters.executionStatus.length > 0) ||
                (filters.executionStatus !== null && filters.executionStatus !== undefined)) ||
              filters.date ||
              (filters.startDate && filters.endDate),
          )
        "
        @inputChange="handleInputChange"
      >
        <template #custom_actions>
          <BaseButton
            v-if="isAdmin"
            :text="t('pages.lessons.createLesson')"
            variant="default"
            color="primary"
            @click="handleCreateLesson"
            class="!min-w-[100px]"
          />
        </template>
      </HeaderView>
      <div
        class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6"
        v-if="lessonsStore.lessons.length > 0"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3 md:gap-2.5 lg:gap-3"
        >
          <div v-for="item in lessonsStore.lessons" :key="item.id">
            <BaseCard
              :title="item.name"
              :category="item.status"
              :categoryColor="'blue'"
              :mentor="`${item.user.firstName} ${item.user.surname}`"
              :mentorAvatar="''"
              :progress="item.execution?.percentage || 0"
              :thumbnail="item.imageUrl"
              :isAdmin="isAdmin"
              :visibility="item.visibility"
              :start-date="item.startDate ?? null"
              :end-date="item.endDate ?? null"
              :total-assignations="item.totalAssignations ?? 0"
              @click="() => handleCardClick(item.id.toString())"
              :isEditable="isAdmin"
              @progress="handleProgressLesson(Number(item.id))"
              @edit="handleEditLesson(Number(item.id), item.visibility)"
              @delete="handleDeleteLesson(item.id)"
            />
          </div>
        </div>
        <div class="flex mt-6 md:mt-5 lg:mt-6 justify-center max-w-full">
          <BasePagination
            :currentPage="(filters?.page || 0) + 1"
            :totalPages="lessonsStore.total"
            @update:current-page="handlePageChange"
          />
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-12 md:py-10 lg:py-12">
        <div
          class="text-gray-400 text-lg md:text-base lg:text-lg font-medium mb-2 md:mb-1.5 lg:mb-2"
        >
          {{ t('pages.lessons.noLessons') }}
        </div>
        <div class="text-gray-500 text-sm md:text-xs lg:text-sm">
          {{ t('pages.lessons.uploadYourFirstLessonToGetStarted') }}
        </div>
      </div>
    </div>
  </div>
  <CreateLessonModal
    v-if="showCreateLessonModal && isAdmin"
    :show="showCreateLessonModal"
    :edit-lesson="lessonsStore.getLessonDetails"
    @close="handleCloseLesson"
  />
  <BaseDeleteModal
    v-if="showDeleteLessonModal && isAdmin"
    :text="t('pages.baseDeleteModal.deleteLesson')"
    :description="t('pages.baseDeleteModal.deleteLessonDescription')"
    @onCancel="handleCancelLesson"
    @onDelete="handleDeleteConfirmLesson"
  />
  <LessonFilter
    v-if="isShowFilter"
    :filters="filters"
    :isAdmin="isAdmin"
    @close="toggleFilter"
    @applyFilters="handleApplyFilters"
    @clear="handleClearFilters"
    @update:filters="handleUpdateFilters"
  />
  <ProgressTable
    v-if="showProgressTable"
    :isOpen="showProgressTable"
    @onClose="handleCloseProgressTable"
    :id="selectedLessonId as number"
    :type="CourseExecutionType.LESSON"
  />
  <CourseVisibilityChangeModal
    v-if="showVisibilityChangeModal && isAdmin"
    :isOpen="showVisibilityChangeModal"
    :itemId="selectedLessonId as number"
    :currentVisibility="selectedCourseVisibility as VisibilityStatus"
    @onClose="showVisibilityChangeModal = false"
    @onSave="handleVisibilityChangeSave"
    :type="VisibilityType.LESSONS"
    @onEdit="handleVisibilityChangeEdit"
  />
</template>
