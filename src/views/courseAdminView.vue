<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Popper from 'vue3-popper'
import { useRouter, useRoute } from 'vue-router'
import { BaseText, BaseCourseItemCard, BaseTab } from '@/components/common'
import ActionButtonWithTooltip from '@/components/common/ActionButtonWithTooltip.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import ProgressTable from '@/components/progress/ProgressTable.vue'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import { CourseParticipationReport } from '@/components/reports'
import { CourseParticipantsProgress } from '@/components/courseDetails'
import CourseCreationModal from '@/components/courseCreation/CourseCreationModal.vue'
import HeaderView from '@/components/layouts/HeaderView.vue'
import EditFileModal from '@/components/common/modals/EditFileModal.vue'
import FileViewerModal from '@/components/modal/FileViewerModal.vue'
import { useCourseStore } from '@/stores/courseStore'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import { tabs } from '@/mock/coursesData'
import { t } from '@/utils/i18n'
import {
  VisibilityType,
  CourseActionType,
  CourseContentType,
  VisibilityStatus,
  CourseExecutionType,
} from '@/types/Course'
import type { CourseAssignations, CourseDetails } from '@/types/Course'
import type { Assignation } from '@/types/Lessons'
import { getContentTypeFromFile } from '@/utils/utils'
import type { Media } from '@/types/Media'
import type { UpdateFileParams } from '@/types/uploadFiles'
import type { ActionButtonConfig } from '@/types/GlobalTypes'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()
const uploadFilesStore = useUploadFilesStore()
const isFileViewerOpen = ref(false)
const currentFile = ref<Media | null>(null)
// State
const activeTab = ref('course')
const isShowCourseCreationModal = ref(false)
const showDeleteCourseModal = ref(false)
const showEditModal = ref(false)
const selectedCourseId = ref<number | null>(null)
const file = ref<Media | null>(null)
const showDeleteFileModal = ref(false)
const showProgressTable = ref(false)
const selectedCourseVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)
const selectedAssignations = ref<Assignation | null>(null)
const selectedAssignationsType = ref<VisibilityType | null>(null)
const selectedContentType = ref<CourseExecutionType | null>(null)
// Computed property for initial tab
const currentTab = computed(() => {
  return activeTab.value === 'participants' || activeTab.value === 'progress'
    ? (activeTab.value as 'participants' | 'progress')
    : 'participants'
})

const fetchCourseDetails = async () => {
  await courseStore.fetchCourseById(Number(route.params.id), true)
}

onMounted(async () => {
  await fetchCourseDetails()
})

// Watch for route parameter changes to refetch course details
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchCourseDetails()
    }
  },
)

const isDisabled = computed(() => {
  return (
    courseStore.courseDetails?.visibility !== VisibilityStatus.MAINTENANCE &&
    courseStore.courseDetails?.visibility !== VisibilityStatus.HIDE
  )
})

const actionButtons = computed<ActionButtonConfig[]>(() => [
  {
    id: 'delete',
    text: t('pages.courseDetails.delete'),
    variant: 'default',
    color: 'error',
    leftIcon: 'delete',
    tooltipText: t('pages.common.cannotDeleteNotDraft'),
    onClick: handleDeleteCourse,
    disabled: isDisabled.value,
  },
  {
    id: 'edit',
    text: t('pages.courseDetails.edit'),
    variant: 'outline',
    color: 'primary',
    leftIcon: 'edit',
    tooltipText: t('pages.common.cannotEditNotDraft'),
    onClick: handleEditCourse,
  },
])
const courseItems = computed(() => {
  if (!courseStore.courseDetails?.assignations) {
    return []
  }
  return courseStore.courseDetails.assignations.map((assignation) => {
    // Get title with fallback
    let title = ''
    if (assignation.relatedType === CourseActionType.FILE_ASSET) {
      title =
        (assignation.model as Media).customFileName ||
        (assignation.model as Media).fileName ||
        'Untitled File'
    } else if (assignation.relatedType === CourseActionType.QUIZ) {
      // Quiz uses 'title' field instead of 'name'
      title = (assignation.model as { title?: string }).title || ''
    } else {
      title = (assignation.model as { name?: string }).name || 'Untitled'
    }
    return {
      id: assignation.id,
      title,
      contentType: getContentType(assignation),
      status: (assignation.model.status === 'published' ? 'done' : 'todo') as 'done' | 'todo',
      actionType: assignation.relatedType as CourseActionType | undefined,
      percentage: assignation.execution?.percentage || 0,
      assignation: assignation, // Keep reference to original assignation
      visible: assignation.model.visible || VisibilityStatus.SHOW,
    }
  })
})

const getContentType = (assignation: Assignation): CourseContentType => {
  // If it's not a FILE_ASSET, return the relatedType as content type
  if (assignation.relatedType !== CourseActionType.FILE_ASSET) {
    return assignation.relatedType as CourseContentType
  }

  // For FILE_ASSET, use the utility function to determine the content type
  return getContentTypeFromFile(assignation.model)
}

// Methods
const handleBack = () => {
  courseStore.clearCourseDetails()
  router.back()
}

const handleEditCourse = async () => {
  if (!props.isAdmin) {
    return
  }
  const visibility = courseStore.courseDetails?.visibility
  const courseId = courseStore.courseDetails?.id
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    selectedCourseId.value = Number(courseId)
    await courseStore.fetchCourseById(selectedCourseId.value as number, true)
    isShowCourseCreationModal.value = true
    return
  }
  selectedCourseVisibility.value = visibility as VisibilityStatus
  selectedCourseId.value = Number(courseId)
  selectedAssignationsType.value = VisibilityType.COURSE
  showVisibilityChangeModal.value = true
}

const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  selectedCourseId.value = null
  selectedCourseVisibility.value = null
  selectedAssignations.value = null
  selectedAssignationsType.value = null
  await courseStore.fetchCourseById(Number(route.params.id), true)
}
const handleVisibilityChangeEdit = async () => {
  await courseStore.fetchCourseById(selectedCourseId.value as number, true)
  isShowCourseCreationModal.value = true
  showVisibilityChangeModal.value = false
  selectedCourseVisibility.value = null
}

const handleEdit = async (item: Assignation) => {
  if (props.isAdmin && item.relatedType === CourseActionType.FILE_ASSET) {
    showEditModal.value = true
    file.value = item.model
  } else if (props.isAdmin && item.relatedType === CourseActionType.COURSE) {
    await courseStore.fetchCourseById(item.model.id)
    isShowCourseCreationModal.value = true
  }
}

const handleDelete = (item: Assignation) => {
  if (props.isAdmin && item.relatedType === CourseActionType.FILE_ASSET) {
    file.value = item.model
    showDeleteFileModal.value = true
  } else if (props.isAdmin && item.relatedType === CourseActionType.COURSE) {
    selectedCourseId.value = item.model.id
    showDeleteCourseModal.value = true
  }
}
const handleDeleteCourse = () => {
  showDeleteCourseModal.value = true
}
const handleCancelFileModal = () => {
  showDeleteFileModal.value = false
  selectedCourseId.value = null
}
const handleDeleteConfirmFileModal = async () => {
  if (file.value) {
    await uploadFilesStore.deleteFile([file.value.id.toString()], 'soft')
  }
  showDeleteFileModal.value = false
  await courseStore.fetchCourseById(Number(route.params.id), true)
}
const handleEditSuccess = async (data: UpdateFileParams) => {
  await uploadFilesStore.updateFileDetails(data)
  showEditModal.value = false
  file.value = null
  await courseStore.fetchCourseById(Number(route.params.id), true)
}

const handleCloseCourseCreationModal = async () => {
  isShowCourseCreationModal.value = false
  await courseStore.fetchCourseById(Number(route.params.id), true)
}
const handleCancelCourseModal = () => {
  showDeleteCourseModal.value = false
}
const handleDeleteConfirmCourseModal = async () => {
  if (selectedCourseId.value) {
    const courseId = selectedCourseId.value
    await courseStore.deleteCourse([courseId], 'soft')
    await courseStore.fetchCourseById(Number(route.params.id), true)
    showDeleteCourseModal.value = false
    selectedCourseId.value = null
  } else {
    await courseStore.deleteCourse([Number(route.params.id)], 'soft')
    showDeleteCourseModal.value = false
    selectedCourseId.value = null
    router.back()
  }
}
const handleProgressCourse = (item: CourseAssignations) => {
  if (item.actionType === CourseActionType.COURSE || item.actionType === CourseActionType.LESSONS) {
    selectedContentType.value = item.actionType as unknown as CourseExecutionType
    selectedCourseId.value = item.id
    showProgressTable.value = true
  }
}
const handleCloseProgressTable = () => {
  showProgressTable.value = false
  selectedCourseId.value = null
  selectedContentType.value = null
}
const handleItemClick = (item: CourseAssignations) => {
  const existingAssignation = courseStore.courseDetails?.assignations.find((a) => a.id === item.id)
  if (!existingAssignation) {
    return
  }

  if (item.actionType === CourseActionType.FILE_ASSET) {
    const file = existingAssignation.model as Media
    if (file) {
      isFileViewerOpen.value = true
      currentFile.value = file
    }
  } else if (item.actionType === CourseActionType.COURSE) {
    // Navigate to course admin detail page
    const courseId = (existingAssignation.model as { id: number }).id
    if (courseId) {
      router.push({
        name: 'course-admin-details',
        params: { id: courseId.toString() },
      })
    }
  } else if (item.actionType === CourseActionType.LESSONS) {
    // Navigate to lesson admin detail page
    const lessonId = (existingAssignation.model as { id: number }).id
    if (lessonId) {
      router.push({
        name: 'lesson-admin-details',
        params: { id: lessonId.toString() },
      })
    }
  } else if (item.actionType === CourseActionType.QUIZ) {
    // Navigate to quiz admin detail page
    const quizId = (existingAssignation.model as { id: number }).id
    if (quizId) {
      router.push({
        name: 'admin-quiz-detail',
        params: { id: quizId.toString() },
      })
    }
  }
}
const handleCloseFileViewer = () => {
  isFileViewerOpen.value = false
  currentFile.value = null
}
</script>
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <HeaderView
      title="Course Details"
      :isSearch="false"
      custom_actions
      :isBack="true"
      @back="handleBack"
    >
      <template #custom_actions>
        <div class="flex items-center gap-2">
          <ActionButtonWithTooltip
            v-for="button in actionButtons"
            :key="button.id"
            :button-config="button"
            :is-disabled="button.disabled || false"
          />
        </div>
      </template>
    </HeaderView>
    <div class="bg-white border-b-2 border-grey-150">
      <div class="px-4 sm:px-6 md:px-4 lg:px-8 pt-4 sm:pt-4 md:pt-3 lg:pt-4">
        <!-- Bottom Row: Breadcrumb, Tabs, and Progress -->
        <div class="flex justify-between items-center">
          <!-- Left Side: Breadcrumb and Tabs -->
          <div class="flex flex-col gap-8 md:gap-6 lg:gap-8">
            <!-- Breadcrumb -->
            <div
              class="flex items-start gap-4 md:gap-3 lg:gap-4 flex-1"
              v-if="courseStore.courseDetails"
            >
              <!-- Course Image -->
              <div
                class="w-24 h-24 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden flex-shrink-0 border border-gray-200"
              >
                <img
                  v-if="courseStore.courseDetails?.attachment?.url"
                  :src="courseStore.courseDetails?.attachment?.url"
                  alt="Course Image"
                  class="w-full h-full object-cover"
                />
              </div>

              <!-- Course Info -->
              <div class="flex flex-col gap-1.5 md:gap-1 lg:gap-1.5 flex-1 min-w-0">
                <!-- Title -->
                <BaseText
                  :text="courseStore.courseDetails?.name || ''"
                  class="!text-[20px] md:!text-[18px] lg:!text-[20px] !leading-[24px] !text-black/85 !font-semibold"
                />

                <!-- Category -->
                <BaseText
                  :text="t('pages.courseDetails.course')"
                  type="p-sm"
                  color="primary"
                  :tone="600"
                  class="!text-primary-600"
                />

                <!-- Description with Tooltip -->
                <div v-if="courseStore.courseDetails?.description" class="flex items-start gap-1.5">
                  <popper hover placement="right" arrow class="popper-description light">
                    <div
                      v-safe-html="courseStore.courseDetails.description"
                      class="!text-[14px] md:!text-[13px] lg:!text-[14px] !leading-[20px] !text-black/85 !font-regular line-clamp-2 cursor-pointer"
                    />
                    <template #content>
                      <div
                        v-safe-html="courseStore.courseDetails.description"
                        class="max-w-xs text-black/85 text-sm"
                      />
                    </template>
                  </popper>
                </div>
              </div>
            </div>

            <!-- Tab Navigation -->
            <BaseTab
              :tabs="tabs"
              :model-value="activeTab"
              @update:model-value="activeTab = $event"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6">
      <!-- Tab Content -->
      <div class="">
        <!-- Course Tab Content -->
        <div v-if="activeTab === 'course'" class="space-y-2">
          <BaseCourseItemCard
            v-for="item in courseItems"
            :key="item.id"
            :title="item.title"
            :visibility="item.visible"
            :content-type="item.contentType as CourseContentType"
            :status="item.status"
            :action-type="item.actionType as CourseActionType"
            :percentage="item.percentage"
            @edit="handleEdit(item.assignation)"
            @progress="handleProgressCourse(item)"
            @delete="handleDelete(item.assignation)"
            @click="handleItemClick(item as CourseAssignations)"
            :isAdmin="true"
          />
        </div>

        <!-- Participants & Progress Tab Content -->
        <div v-else-if="activeTab === 'participants' || activeTab === 'progress'">
          <CourseParticipantsProgress
            :course-id="Number(route.params.id)"
            :initial-tab="currentTab"
          />
        </div>

        <!-- Reports Tab Content -->
        <div v-else-if="activeTab === 'reports'">
          <CourseParticipationReport />
        </div>
      </div>
    </div>
    <EditFileModal
      v-if="showEditModal && file"
      :file="file"
      :isOpen="showEditModal"
      @onClose="showEditModal = false"
      @onSuccess="handleEditSuccess"
    />
    <CourseCreationModal
      :title="t('pages.courses.createCourse')"
      v-if="isShowCourseCreationModal && isAdmin"
      :editCourse="courseStore.courseDetails as CourseDetails"
      @close="handleCloseCourseCreationModal"
    />
    <BaseDeleteModal
      v-if="showDeleteCourseModal && isAdmin"
      :text="t('pages.baseDeleteModal.deleteCourse')"
      :description="t('pages.baseDeleteModal.deleteCourseDescription')"
      @onCancel="handleCancelCourseModal"
      @onDelete="handleDeleteConfirmCourseModal"
    />
    <BaseDeleteModal
      v-if="showDeleteFileModal && isAdmin"
      :text="t('pages.baseDeleteModal.deleteFile')"
      :description="t('pages.baseDeleteModal.deleteFileDescription')"
      @onCancel="handleCancelFileModal"
      @onDelete="handleDeleteConfirmFileModal"
    />
    <FileViewerModal
      v-if="isFileViewerOpen"
      :isOpen="isFileViewerOpen"
      :file="currentFile"
      @close="handleCloseFileViewer"
    />
    <ProgressTable
      v-if="showProgressTable"
      :isOpen="showProgressTable"
      @onClose="handleCloseProgressTable"
      :id="selectedCourseId as number"
      :type="selectedContentType as CourseExecutionType"
    />
    <CourseVisibilityChangeModal
      v-if="showVisibilityChangeModal && isAdmin"
      :isOpen="showVisibilityChangeModal"
      :itemId="selectedCourseId as number"
      :currentVisibility="selectedCourseVisibility as VisibilityStatus"
      @onClose="showVisibilityChangeModal = false"
      @onSave="handleVisibilityChangeSave"
      :type="selectedAssignationsType as VisibilityType"
      @onEdit="handleVisibilityChangeEdit"
    />
  </div>
</template>
