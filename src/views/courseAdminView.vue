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
import { tabs } from '@/mock/coursesData'
import { t } from '@/utils/i18n'
import {
  VisibilityType,
  CourseActionType,
  CourseContentType,
  VisibilityStatus,
  CourseExecutionType,
} from '@/types/Course'
import type { CourseDetails } from '@/types/Course'
import type { Assignation } from '@/types/Lessons'
import { getContentTypeFromFile } from '@/utils/utils'
import type { Media } from '@/types/Media'
import type { ActionButtonConfig } from '@/types/GlobalTypes'
import { useItemActions } from '@/composables/useItemActions'
import type { CategoryItem } from '@/types/Category'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

// Use item actions composable
const itemActions = useItemActions({
  isAdmin: props.isAdmin,
  onRefresh: async () => {
    await courseStore.fetchCourseById(Number(route.params.id), true)
  },
  getAssignations: () => courseStore.courseDetails?.assignations,
})

// State
const activeTab = ref('course')
const selectedCourseId = ref<number | null>(null)
const selectedCourseVisibility = ref<VisibilityStatus | null>(null)
const selectedAssignationsType = ref<VisibilityType | null>(null)
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

const isDisabled = computed(
  () => courseStore.courseDetails?.visibility !== VisibilityStatus.MAINTENANCE,
)

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
const courseItems = computed((): (CategoryItem & { assignation: Assignation })[] => {
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
      visibility: (assignation.model.visibility || VisibilityStatus.SHOW) as VisibilityStatus,
      relatedId: assignation.relatedId,
      isExpired: false, // Course items don't have expiration
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
    itemActions.isShowCourseCreationModal.value = true
    return
  }
  selectedCourseVisibility.value = visibility as VisibilityStatus
  selectedCourseId.value = Number(courseId)
  selectedAssignationsType.value = VisibilityType.COURSE
  itemActions.selectedItemId.value = Number(courseId)
  itemActions.selectedCategoryVisibility.value = visibility as VisibilityStatus
  itemActions.selectedItemType.value = CourseActionType.COURSE
  itemActions.showVisibilityChangeModal.value = true
}

// Handle course-level visibility change (for the course itself, not items)
const handleVisibilityChangeSave = async () => {
  itemActions.handleVisibilityChangeSave()
  selectedCourseId.value = null
  selectedCourseVisibility.value = null
  selectedAssignationsType.value = null
}

const handleVisibilityChangeEdit = async () => {
  await itemActions.handleVisibilityChangeEdit()
  selectedCourseVisibility.value = null
}

// Item handlers now use composable - keeping for backward compatibility if needed
const handleEdit = async (item: CategoryItem & { assignation: Assignation }) => {
  await itemActions.handleEdit(item)
}

const handleDelete = (item: CategoryItem & { assignation: Assignation }) => {
  itemActions.handleDelete(item)
}
const handleDeleteCourse = () => {
  selectedCourseId.value = Number(route.params.id)
  itemActions.selectedItemId.value = Number(route.params.id)
  itemActions.selectedItemType.value = CourseActionType.COURSE
  itemActions.showDeleteModal.value = true
}

// Override handleConfirmDelete to handle course deletion with navigation
const handleConfirmDelete = async () => {
  const isDeletingCurrentCourse =
    itemActions.selectedItemId.value === Number(route.params.id) &&
    itemActions.selectedItemType.value === CourseActionType.COURSE

  await itemActions.handleConfirmDelete(false)

  // If deleting the current course, navigate back
  if (isDeletingCurrentCourse) {
    router.back()
  }
}

const handleProgressCourse = (item: CategoryItem & { assignation: Assignation }) => {
  itemActions.handleProgress(item)
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
            :visibility="item.visibility"
            :content-type="item.contentType as CourseContentType"
            :status="item.status"
            :action-type="item.actionType as CourseActionType"
            :percentage="item.percentage"
            @edit="handleEdit(item)"
            @progress="handleProgressCourse(item)"
            @delete="handleDelete(item)"
            @click="itemActions.handleItemClick(item)"
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
      v-if="itemActions.showEditModal.value && itemActions.currentFile.value"
      :file="itemActions.currentFile.value"
      :isOpen="itemActions.showEditModal.value"
      @onClose="itemActions.showEditModal.value = false"
      @onSuccess="itemActions.handleEditSuccess"
    />
    <CourseCreationModal
      :title="t('pages.courses.createCourse')"
      v-if="itemActions.isShowCourseCreationModal.value && isAdmin"
      :editCourse="itemActions.courseStore.courseDetails as CourseDetails"
      @close="itemActions.handleCloseCourseCreationModal"
    />
    <BaseDeleteModal
      v-if="itemActions.showDeleteModal.value && isAdmin"
      :text="t(itemActions.deleteModalText.value)"
      :description="t(itemActions.deleteModalDescription.value)"
      @onCancel="itemActions.handleCancelDelete"
      @onDelete="handleConfirmDelete"
    />
    <FileViewerModal
      v-if="itemActions.isFileViewerOpen.value"
      :isOpen="itemActions.isFileViewerOpen.value"
      :file="itemActions.currentFile.value"
      @close="itemActions.handleCloseFileViewer"
    />
    <ProgressTable
      v-if="itemActions.showProgressTable.value"
      :isOpen="itemActions.showProgressTable.value"
      @onClose="itemActions.handleCloseProgressTable"
      :id="(itemActions.selectedItemId.value as number) || 0"
      :type="
        (itemActions.selectedItemType.value as CourseExecutionType) || CourseExecutionType.COURSE
      "
    />
    <CourseVisibilityChangeModal
      v-if="itemActions.showVisibilityChangeModal.value && isAdmin"
      :isOpen="itemActions.showVisibilityChangeModal.value"
      :itemId="(itemActions.selectedItemId.value as number) || 0"
      :currentVisibility="
        (itemActions.selectedCategoryVisibility.value as VisibilityStatus) || VisibilityStatus.SHOW
      "
      @onClose="itemActions.handleCloseVisibilityChangeModal"
      @onSave="handleVisibilityChangeSave"
      :type="itemActions.renderVisibilityType()"
      @onEdit="handleVisibilityChangeEdit"
    />
  </div>
</template>
