<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Popper from 'vue3-popper'
import { useRouter, useRoute } from 'vue-router'
import { BaseText, BaseCourseItemCard, BaseTab } from '@/components/common'
import ActionButtonWithTooltip from '@/components/common/ActionButtonWithTooltip.vue'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import ProgressTable from '@/components/progress/ProgressTable.vue'
import CreateLessonModal from '@/components/lessonCreation/CreateLessonModal.vue'
import HeaderView from '@/components/layouts/HeaderView.vue'
import EditFileModal from '@/components/common/modals/EditFileModal.vue'
import FileViewerModal from '@/components/modal/FileViewerModal.vue'
import CourseParticipantsProgress from '@/components/courseDetails/CourseParticipantsProgress.vue'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import { lessonTabs as tabs } from '@/mock/lessonsData'
import { t } from '@/utils/i18n'
import {
  VisibilityType,
  CourseActionType,
  CourseContentType,
  VisibilityStatus,
  CourseExecutionType,
} from '@/types/Course'
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
const lessonsStore = useLessonsStore()
const uploadFilesStore = useUploadFilesStore()
const isFileViewerOpen = ref(false)
const currentFile = ref<Media | null>(null)
// State
const activeTab = ref('content')
const isShowLessonCreationModal = ref(false)
const showDeleteLessonModal = ref(false)
const showEditModal = ref(false)
const selectedLessonId = ref<number | null>(null)
const file = ref<Media | null>(null)
const showDeleteFileModal = ref(false)
const showProgressTable = ref(false)
const selectedContentType = ref<CourseExecutionType | null>(null)
const selectedProgressId = ref<number | null>(null)
const selectedLessonVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)
const selectedAssignations = ref<Assignation | null>(null)
const selectedAssignationsType = ref<VisibilityType | null>(null)

// Computed property for initial tab
const currentTab = computed(() => {
  return activeTab.value === 'participants' || activeTab.value === 'progress'
    ? (activeTab.value as 'participants' | 'progress')
    : 'participants'
})

const fetchLessonDetails = async () => {
  await lessonsStore.fetchLessonById(Number(route.params.id), true)
}

onMounted(async () => {
  await fetchLessonDetails()
})

// Watch for route parameter changes to refetch lesson details
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchLessonDetails()
    }
  },
)

const isDisabled = computed(() => {
  return (
    lessonsStore.getLessonDetails?.visibility !== VisibilityStatus.MAINTENANCE &&
    lessonsStore.getLessonDetails?.visibility !== VisibilityStatus.HIDE
  )
})

const actionButtons = computed<ActionButtonConfig[]>(() => [
  {
    id: 'delete',
    text: t('pages.lessonDetails.delete'),
    variant: 'default',
    color: 'error',
    leftIcon: 'delete',
    tooltipText: t('pages.common.cannotDeleteNotDraft'),
    onClick: handleDeleteLesson,
    disabled: isDisabled.value,
  },
  {
    id: 'edit',
    text: t('pages.lessonDetails.edit'),
    variant: 'outline',
    color: 'primary',
    leftIcon: 'edit',
    tooltipText: t('pages.common.cannotEditNotDraft'),
    onClick: handleEditLesson,
  },
])

const lessonItems = computed(() => {
  if (!lessonsStore.getLessonDetails?.assignations) {
    return []
  }
  return (
    lessonsStore.getLessonDetails?.assignations
      .map((assignation) => {
        // Get title with fallback
        let title = ''
        if (assignation.relatedType === CourseActionType.FILE_ASSET) {
          title =
            (assignation.model as Media).customFileName ||
            (assignation.model as Media).fileName ||
            'Untitled File'
        } else if (assignation.relatedType === CourseActionType.QUIZ) {
          // Quiz uses 'title' field instead of 'name'
          title = (assignation.model as { title?: string }).title || 'Untitled Quiz'
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
      .filter((item) => item.title) || []
  )
})

const getContentType = (assignation: Assignation): CourseContentType => {
  if (assignation.relatedType !== CourseActionType.FILE_ASSET) {
    return assignation.relatedType as CourseContentType
  }

  return getContentTypeFromFile(assignation.model)
}

// Methods
const handleBack = () => {
  lessonsStore.clearLessonDetails()
  router.back()
}

const handleEditLesson = async () => {
  if (!props.isAdmin) {
    return
  }
  const visibility = lessonsStore.getLessonDetails?.visibility
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    isShowLessonCreationModal.value = true
    await lessonsStore.fetchLessonById(Number(route.params.id), true)
    return
  }
  selectedLessonVisibility.value = visibility as VisibilityStatus
  selectedLessonId.value = Number(route.params.id)
  selectedAssignationsType.value = VisibilityType.LESSONS
  showVisibilityChangeModal.value = true
}
const handleVisibilityChangeSaveLesson = async () => {
  showVisibilityChangeModal.value = false
  selectedLessonId.value = null
  selectedLessonVisibility.value = null
  selectedAssignations.value = null
  selectedAssignationsType.value = null
  await lessonsStore.fetchLessonById(Number(route.params.id), true)
}
const handleVisibilityChangeEditLesson = async () => {
  await lessonsStore.fetchLessonById(selectedLessonId.value as number, true)
  isShowLessonCreationModal.value = true
  showVisibilityChangeModal.value = false
  selectedLessonVisibility.value = null
}

const handleEdit = async (item: Assignation) => {
  if (props.isAdmin && item.relatedType === CourseActionType.FILE_ASSET) {
    showEditModal.value = true
    file.value = item.model
  } else if (props.isAdmin && item.relatedType === CourseActionType.LESSONS) {
    await lessonsStore.fetchLessonById(item.model.id, true)
    isShowLessonCreationModal.value = true
  }
}

const handleDelete = (item: Assignation) => {
  if (props.isAdmin && item.relatedType === CourseActionType.FILE_ASSET) {
    file.value = item.model
    showDeleteFileModal.value = true
  } else if (props.isAdmin && item.relatedType === CourseActionType.LESSONS) {
    selectedLessonId.value = item.model.id
    showDeleteLessonModal.value = true
  }
}

const handleDeleteLesson = () => {
  showDeleteLessonModal.value = true
}

const handleCancelFileModal = () => {
  showDeleteFileModal.value = false
  selectedLessonId.value = null
}

const handleDeleteConfirmFileModal = async () => {
  if (file.value) {
    await uploadFilesStore.deleteFile([file.value.id.toString()], 'soft')
  }
  showDeleteFileModal.value = false
  await lessonsStore.fetchLessonById(Number(route.params.id), true)
}

const handleEditSuccess = async (data: UpdateFileParams) => {
  await uploadFilesStore.updateFileDetails(data)
  showEditModal.value = false
  file.value = null
  await lessonsStore.fetchLessonById(Number(route.params.id), true)
}

const handleCloseLessonCreationModal = async () => {
  isShowLessonCreationModal.value = false
  await lessonsStore.fetchLessonById(Number(route.params.id), true)
}

const handleCancelLessonModal = () => {
  showDeleteLessonModal.value = false
}

const handleDeleteConfirmLessonModal = async () => {
  if (selectedLessonId.value) {
    const lessonId = selectedLessonId.value
    await lessonsStore.deleteLesson([lessonId])
    await lessonsStore.fetchLessonById(Number(route.params.id), true)
    showDeleteLessonModal.value = false
    selectedLessonId.value = null
  } else {
    await lessonsStore.deleteLesson([Number(route.params.id)])
    showDeleteLessonModal.value = false
    selectedLessonId.value = null
    router.back()
  }
}

const handleProgressLesson = (item: { id: number; actionType?: CourseActionType }) => {
  if (item.actionType === CourseActionType.COURSE || item.actionType === CourseActionType.LESSONS) {
    selectedContentType.value = item.actionType as unknown as CourseExecutionType
    selectedProgressId.value = item.id
    showProgressTable.value = true
  }
}

const handleCloseProgressTable = () => {
  showProgressTable.value = false
  selectedProgressId.value = null
  selectedContentType.value = null
}

const handleItemClick = (item: { id: number; actionType?: CourseActionType }) => {
  const existingAssignation = lessonsStore.getLessonDetails?.assignations.find(
    (a) => a.id === item.id,
  )
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
      :title="t('pages.lessonDetails.title')"
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
              v-if="lessonsStore.getLessonDetails"
            >
              <!-- Lesson Image -->
              <div
                class="w-24 h-24 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden flex-shrink-0 border border-gray-200"
              >
                <img
                  v-if="lessonsStore.getLessonDetails?.attachment?.url"
                  :src="lessonsStore.getLessonDetails?.attachment?.url"
                  alt="Lesson Image"
                  class="w-full h-full object-cover"
                />
              </div>

              <!-- Lesson Info -->
              <div class="flex flex-col gap-1.5 md:gap-1 lg:gap-1.5 flex-1 min-w-0">
                <!-- Title -->
                <BaseText
                  :text="lessonsStore.getLessonDetails?.name || ''"
                  class="!text-[20px] md:!text-[18px] lg:!text-[20px] !leading-[24px] !text-black/85 !font-semibold"
                />

                <!-- Category -->
                <BaseText
                  text="Lesson"
                  type="p-sm"
                  color="primary"
                  :tone="600"
                  class="!text-primary-600"
                />

                <!-- Description with Tooltip -->
                <div
                  v-if="lessonsStore.getLessonDetails?.description"
                  class="flex items-start gap-1.5"
                >
                  <popper hover placement="right" arrow class="popper-description light">
                    <div
                      v-safe-html="lessonsStore.getLessonDetails.description"
                      class="!text-[14px] md:!text-[13px] lg:!text-[14px] !leading-[20px] !text-black/85 !font-regular line-clamp-2 cursor-pointer"
                    />
                    <template #content>
                      <div
                        v-safe-html="lessonsStore.getLessonDetails.description"
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
        <!-- Content Tab -->
        <div v-if="activeTab === 'content'" class="space-y-2">
          <BaseCourseItemCard
            v-for="item in lessonItems"
            :key="item.id"
            :title="item.title"
            :visibility="item.visible"
            :content-type="item.contentType as CourseContentType"
            :status="item.status"
            :action-type="item.actionType as CourseActionType"
            :percentage="item.percentage"
            @edit="handleEdit(item.assignation)"
            @progress="handleProgressLesson(item)"
            @delete="handleDelete(item.assignation)"
            @click="handleItemClick(item)"
            :isAdmin="true"
          />
        </div>

        <div v-else-if="activeTab === 'participants' || activeTab === 'progress'">
          <CourseParticipantsProgress
            :course-id="Number(route.params.id)"
            :initial-tab="currentTab"
            :type="CourseExecutionType.LESSON"
          />
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
    <CreateLessonModal
      v-if="isShowLessonCreationModal && isAdmin"
      :show="isShowLessonCreationModal"
      :edit-lesson="lessonsStore.getLessonDetails"
      @close="handleCloseLessonCreationModal"
    />
    <BaseDeleteModal
      v-if="showDeleteLessonModal && isAdmin"
      :text="t('pages.baseDeleteModal.deleteLesson')"
      :description="t('pages.baseDeleteModal.deleteLessonDescription')"
      @onCancel="handleCancelLessonModal"
      @onDelete="handleDeleteConfirmLessonModal"
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
      :id="selectedProgressId as number"
      :type="selectedContentType as CourseExecutionType"
    />
    <CourseVisibilityChangeModal
      v-if="showVisibilityChangeModal && isAdmin"
      :isOpen="showVisibilityChangeModal"
      :itemId="selectedLessonId as number"
      :currentVisibility="selectedLessonVisibility as VisibilityStatus"
      @onClose="showVisibilityChangeModal = false"
      @onSave="handleVisibilityChangeSaveLesson"
      :type="selectedAssignationsType as VisibilityType"
      @onEdit="handleVisibilityChangeEditLesson"
    />
  </div>
</template>
