<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { BaseButton, BaseCard, BasePagination } from '@/components/common'
import ProgressTable from '@/components/progress/ProgressTable.vue'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import { CourseCreationModal } from '@/components/courseCreation'
import HeaderView from '@/components/layouts/HeaderView.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import CourseFilter from '@/components/sections/CourseFilter.vue'
import { t } from '@/utils/i18n'
import { useCourseStore } from '@/stores/courseStore'
import {
  CourseExecutionType,
  type CourseDetails,
  type GetCoursesParams,
  VisibilityStatus,
  VisibilityType,
} from '@/types/Course'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const courseStore = useCourseStore()
const router = useRouter()

const isShowCourseCreationModal = ref(false)
const totalPages = computed(() => courseStore.coursesTotalPages)
const showDeleteCourseModal = ref(false)
const selectedCourseVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)
const selectedCourseId = ref<number | null>(null)
const currentPage = ref(0)
const isShowFilter = ref(false)
const showProgressTable = ref(false)
const filters = ref<GetCoursesParams>({
  published: false,
  date: undefined,
  startDate: undefined,
  endDate: undefined,
  visibility: [],
  executionStatus: null,
  search: '',
})
const perPage = 8

const handleBack = () => {
  if (props.isAdmin) {
    router.push('/admin')
  } else {
    router.push('/')
  }
}

const goToAddCourse = () => {
  courseStore.clearCourseDetails()
  isShowCourseCreationModal.value = true
}

onMounted(async () => {
  loadCourses()
})

const loadCourses = async () => {
  const params: GetCoursesParams = {
    page: currentPage.value,
    perPage,
    search: filters.value.search,
  }

  if (props.isAdmin) {
    if (filters.value.published) {
      params.published = filters.value.published
    }
  } else {
    if (filters.value.executionStatus) {
      params.executionStatus = filters.value.executionStatus
    }
  }

  // Handle date range - prefer startDate/endDate over date string
  if (filters.value.startDate && filters.value.endDate) {
    params.startDate = filters.value.startDate
    params.endDate = filters.value.endDate
  } else if (filters.value.date) {
    params.date = filters.value.date
  }

  if (
    filters.value.visibility &&
    filters.value.visibility.length > 0 &&
    !filters.value.visibility.includes('all')
  ) {
    params.visibility = filters.value.visibility
  }

  await courseStore.fetchCourses({ ...params, isAdmin: props.isAdmin })
}
const handleCardClick = (courseId: number) => {
  if (props.isAdmin) {
    router.push({ name: 'course-admin-details', params: { id: courseId } })
  } else {
    router.push({ name: 'course-details', params: { id: courseId } })
  }
}
const handlePageChange = (page: number) => {
  currentPage.value = page - 1
  loadCourses()
}

const toggleFilter = () => {
  // Use nextTick to ensure DOM updates are complete before changing state
  nextTick(() => {
    isShowFilter.value = !isShowFilter.value
  })
}

const handleApplyFilters = async (appliedFilters: GetCoursesParams) => {
  try {
    filters.value = { ...appliedFilters }
    currentPage.value = 0
    await loadCourses()
    toggleFilter()
  } catch (error) {
    console.error('Error applying filters:', error)
  }
}

const updateFilters = (newFilters: GetCoursesParams) => {
  filters.value = { ...newFilters }
}

const clearAllFilters = async () => {
  try {
    filters.value = {
      published: false,
      date: undefined,
      startDate: undefined,
      endDate: undefined,
      visibility: [],
      executionStatus: null,
      search: '',
    }
    currentPage.value = 0
    await loadCourses()
    toggleFilter()
  } catch (error) {
    console.error('Error clearing filters:', error)
  }
}

const handleInputChange = (event: Event) => {
  const searchValue = (event.target as HTMLInputElement).value
  filters.value.search = searchValue
  debouncedSearch()
}

const debouncedSearch = debounce(() => {
  currentPage.value = 0
  loadCourses()
}, 500)

const handleDeleteCourse = (courseId: number) => {
  selectedCourseId.value = courseId
  showDeleteCourseModal.value = true
}
const handleCancelCourseModal = () => {
  showDeleteCourseModal.value = false
}
const handleDeleteConfirmCourseModal = async () => {
  if (selectedCourseId.value) {
    await courseStore.deleteCourse([selectedCourseId.value], 'soft')
    showDeleteCourseModal.value = false
    selectedCourseId.value = null
  }
}
const handleEditCourse = async (courseId: number, visibility: VisibilityStatus) => {
  if (!props.isAdmin) {
    return
  }
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    selectedCourseId.value = courseId
    await courseStore.fetchCourseById(selectedCourseId.value as number, true)
    clearFilters()
    isShowCourseCreationModal.value = true
    return
  }
  selectedCourseVisibility.value = visibility
  selectedCourseId.value = courseId
  showVisibilityChangeModal.value = true
}
const handleProgressCourse = (courseId: number) => {
  selectedCourseId.value = courseId
  showProgressTable.value = true
}
const handleCloseProgressTable = () => {
  showProgressTable.value = false
  selectedCourseId.value = null
}

const clearFilters = () => {
  filters.value = {
    published: false,
    date: undefined,
    startDate: undefined,
    endDate: undefined,
    visibility: [],
    executionStatus: null,
    search: '',
  }
  currentPage.value = 0
}
const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  selectedCourseId.value = null
  selectedCourseVisibility.value = null
  clearFilters()
  await loadCourses()
}

const handleVisibilityChangeEdit = async () => {
  // Proceed to edit course modal
  await courseStore.fetchCourseById(selectedCourseId.value as number, true)
  isShowCourseCreationModal.value = true
  clearFilters()
  showVisibilityChangeModal.value = false
  selectedCourseId.value = null
  selectedCourseVisibility.value = null
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-full mx-auto">
      <HeaderView
        :title="t('pages.courses.title')"
        :isBack="true"
        @back="handleBack"
        :isFilter="true"
        :hasActiveFilters="
          Boolean(
            (props.isAdmin
              ? (filters.visibility &&
                  filters.visibility.length > 0 &&
                  !filters.visibility.includes('all')) ||
                filters.published
              : (Array.isArray(filters.executionStatus) && filters.executionStatus.length > 0) ||
                (filters.executionStatus !== null && filters.executionStatus !== undefined)) ||
              filters.date ||
              (filters.startDate && filters.endDate),
          )
        "
        :searchText="filters.search"
        @inputChange="handleInputChange"
        @toggleFilter="toggleFilter"
        custom_actions
      >
        <template #custom_actions>
          <BaseButton
            v-if="isAdmin"
            :text="t('pages.course.view.addCourse')"
            variant="default"
            color="primary"
            @click="goToAddCourse"
            class="!min-w-[100px]"
          />
        </template>
      </HeaderView>
      <div
        class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6"
        v-if="courseStore.courses.length > 0"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3 md:gap-2.5 lg:gap-3"
        >
          <div v-for="item in courseStore.courses" :key="item.id">
            <BaseCard
              :title="item.name"
              :category="item.category?.name || ''"
              :categoryColor="'blue'"
              :mentor="(item.user?.firstName || '') + ' ' + (item.user?.surname || '')"
              :mentorAvatar="(item.user?.firstName || '') + ' ' + (item.user?.surname || '')"
              :progress="item.execution?.percentage || 0"
              :thumbnail="item.imageUrl || undefined"
              :visibility="item.visibility"
              :start-date="item.startDate"
              :end-date="item.endDate"
              :total-assignations="item.totalAssignations"
              @click="() => handleCardClick(item.id)"
              :isEditable="isAdmin"
              @progress="handleProgressCourse(item.id)"
              @delete="handleDeleteCourse(item.id)"
              @edit="handleEditCourse(item.id, item.visibility)"
              :isAdmin="isAdmin"
            />
          </div>
        </div>
        <div class="flex mt-6 md:mt-5 lg:mt-6 justify-center max-w-full">
          <BasePagination
            :currentPage="currentPage + 1"
            :totalPages="totalPages"
            @update:current-page="handlePageChange"
          />
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-12 md:py-10 lg:py-12">
        <div
          class="text-gray-400 text-lg md:text-base lg:text-lg font-medium mb-2 md:mb-1.5 lg:mb-2"
        >
          {{ t('pages.courses.noCourses') }}
        </div>
        <div class="text-gray-500 text-sm md:text-xs lg:text-sm">
          {{ t('pages.courses.uploadYourFirstCourseToGetStarted') }}
        </div>
      </div>
    </div>
  </div>
  <CourseFilter
    v-if="isShowFilter"
    :filters="filters"
    :isAdmin="isAdmin"
    @close="toggleFilter"
    @update:filters="updateFilters"
    @applyFilters="handleApplyFilters"
    @clear="clearAllFilters"
  />
  <CourseCreationModal
    :title="t('pages.courses.createCourse')"
    v-if="isShowCourseCreationModal && isAdmin"
    :editCourse="courseStore.courseDetails as CourseDetails"
    @close="isShowCourseCreationModal = false"
  />
  <BaseDeleteModal
    v-if="showDeleteCourseModal && isAdmin"
    :text="t('pages.baseDeleteModal.deleteCourse')"
    :description="t('pages.baseDeleteModal.deleteCourseDescription')"
    @onCancel="handleCancelCourseModal"
    @onDelete="handleDeleteConfirmCourseModal"
  />
  <ProgressTable
    v-if="showProgressTable"
    :isOpen="showProgressTable"
    @onClose="handleCloseProgressTable"
    :id="selectedCourseId as number"
    :type="CourseExecutionType.COURSE"
  />
  <CourseVisibilityChangeModal
    v-if="showVisibilityChangeModal && isAdmin"
    :isOpen="showVisibilityChangeModal"
    :itemId="selectedCourseId as number"
    :currentVisibility="selectedCourseVisibility as VisibilityStatus"
    @onClose="showVisibilityChangeModal = false"
    @onSave="handleVisibilityChangeSave"
    :type="VisibilityType.COURSE"
    @onEdit="handleVisibilityChangeEdit"
  />
</template>
