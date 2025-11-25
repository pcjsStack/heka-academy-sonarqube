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
import { useItemActions } from '@/composables/useItemActions'
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
import type { ActionButtonConfig } from '@/types/GlobalTypes'
import type { CategoryItem } from '@/types/Category'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const route = useRoute()
const lessonsStore = useLessonsStore()

// Use item actions composable
const itemActions = useItemActions({
  isAdmin: props.isAdmin,
  onRefresh: async () => {
    await lessonsStore.fetchLessonById(Number(route.params.id), true)
  },
  getAssignations: () => lessonsStore.getLessonDetails?.assignations,
})

// State
const activeTab = ref('content')
const selectedLessonId = ref<number | null>(null)
const selectedLessonVisibility = ref<VisibilityStatus | null>(null)
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

const lessonItems = computed((): (CategoryItem & { assignation: Assignation })[] => {
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
            (assignation.model as { customFileName?: string; fileName?: string })
              .customFileName ||
            (assignation.model as { customFileName?: string; fileName?: string }).fileName ||
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
          visibility: (assignation.model.visibility || VisibilityStatus.SHOW) as VisibilityStatus,
          relatedId: assignation.relatedId,
          isExpired: false, // Lesson items don't have expiration
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
    itemActions.isShowLessonCreationModal.value = true
    await lessonsStore.fetchLessonById(Number(route.params.id), true)
    return
  }
  selectedLessonVisibility.value = visibility as VisibilityStatus
  selectedLessonId.value = Number(route.params.id)
  selectedAssignationsType.value = VisibilityType.LESSONS
  itemActions.selectedItemId.value = Number(route.params.id)
  itemActions.selectedCategoryVisibility.value = visibility as VisibilityStatus
  itemActions.selectedItemType.value = CourseActionType.LESSONS
  itemActions.showVisibilityChangeModal.value = true
}

// Handle lesson-level visibility change (for the lesson itself, not items)
const handleVisibilityChangeSaveLesson = async () => {
  await itemActions.handleVisibilityChangeSave()
  selectedLessonId.value = null
  selectedLessonVisibility.value = null
  selectedAssignationsType.value = null
}

const handleVisibilityChangeEditLesson = async () => {
  await itemActions.handleVisibilityChangeEdit()
  selectedLessonVisibility.value = null
}

// Item handlers now use composable
const handleEdit = async (item: CategoryItem & { assignation: Assignation }) => {
  await itemActions.handleEdit(item)
}

const handleDelete = (item: CategoryItem & { assignation: Assignation }) => {
  itemActions.handleDelete(item)
}

const handleDeleteLesson = () => {
  selectedLessonId.value = Number(route.params.id)
  itemActions.selectedItemId.value = Number(route.params.id)
  itemActions.selectedItemType.value = CourseActionType.LESSONS
  itemActions.showDeleteModal.value = true
}

// Override handleConfirmDelete to handle lesson deletion with navigation
const handleConfirmDelete = async () => {
  const isDeletingCurrentLesson =
    itemActions.selectedItemId.value === Number(route.params.id) &&
    itemActions.selectedItemType.value === CourseActionType.LESSONS

  await itemActions.handleConfirmDelete()

  // If deleting the current lesson, navigate back
  if (isDeletingCurrentLesson) {
    router.back()
  }
}

const handleProgressLesson = (item: CategoryItem & { assignation: Assignation }) => {
  itemActions.handleProgress(item)
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
    <div class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6">
      <div class="">
        <div v-if="activeTab === 'content'" class="space-y-2">
          <BaseCourseItemCard
            v-for="item in lessonItems"
            :key="item.id"
            :title="item.title"
            :visibility="item.visibility"
            :content-type="item.contentType as CourseContentType"
            :status="item.status"
            :action-type="item.actionType as CourseActionType"
            :percentage="item.percentage"
            @edit="handleEdit(item)"
            @progress="handleProgressLesson(item)"
            @delete="handleDelete(item)"
            @click="itemActions.handleItemClick(item)"
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
      v-if="itemActions.showEditModal.value && itemActions.currentFile.value"
      :file="itemActions.currentFile.value"
      :isOpen="itemActions.showEditModal.value"
      @onClose="itemActions.showEditModal.value = false"
      @onSuccess="itemActions.handleEditSuccess"
    />
    <CreateLessonModal
      v-if="itemActions.isShowLessonCreationModal.value && isAdmin"
      :show="itemActions.isShowLessonCreationModal.value"
      :edit-lesson="itemActions.lessonsStore.getLessonDetails"
      @close="itemActions.handleCloseLessonCreationModal"
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
        (itemActions.selectedItemType.value as CourseExecutionType) || CourseExecutionType.LESSON
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
      @onSave="handleVisibilityChangeSaveLesson"
      :type="itemActions.renderVisibilityType()"
      @onEdit="handleVisibilityChangeEditLesson"
    />
  </div>
</template>
