<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import moment from 'moment'
import { useRouter, useRoute } from 'vue-router'
import { BaseText, BaseIcon, BaseButton, BaseCourseItemCard } from '@/components/common'
import { QuizCreationModal } from '@/components/quizCreation'
import ProgressTable from '@/components/progress/ProgressTable.vue'
import { CourseVisibilityChangeModal, AddCategoryModal } from '@/components/courseManagement'
import FileViewerModal from '@/components/modal/FileViewerModal.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import CourseCreationModal from '@/components/courseCreation/CourseCreationModal.vue'
import CreateLessonModal from '@/components/lessonCreation/CreateLessonModal.vue'
import EditFileModal from '@/components/common/modals/EditFileModal.vue'
import HeaderView from '@/components/layouts/HeaderView.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useItemActions } from '@/composables/useItemActions'
import { t } from '@/utils/i18n'
import type { Assignation } from '@/types/Lessons'
import type { CategoryItem } from '@/types/Category'
import {
  CourseContentType,
  CourseActionType,
  VisibilityStatus,
  CourseExecutionType,
} from '@/types/Course'
import { getContentTypeFromFile } from '@/utils/utils'
import type { Media } from '@/types/Media'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const categoryStore = useCategoryStore()
const router = useRouter()
const route = useRoute()

// Use item actions composable
const itemActions = useItemActions({
  isAdmin: props.isAdmin,
  categoryId: Number(route.params.id),
  onRefresh: async () => {
    await categoryStore.fetchCategoryDetail(Number(route.params.id))
  },
})

// Category name computed from store
const categoryName = computed(() => {
  return categoryStore.selectedCategoryDetail?.name || ''
})

// Category short name computed from store
const categoryShortName = computed(() => {
  return categoryStore.selectedCategoryDetail?.shortName || ''
})

// Category ID number computed from store
const categoryIdNumber = computed(() => {
  return categoryStore.selectedCategoryDetail?.idNumber || ''
})

// Check if item is expired based on endDate
const isItemExpired = (endDate: string | null | undefined): boolean => {
  if (!endDate) return false
  const end = moment(endDate)
  const now = moment()
  return now.isAfter(end)
}

// Get title from assignation model based on type
const getAssignationTitle = (assignation: Assignation): string => {
  const { relatedType, model } = assignation

  if (relatedType === CourseActionType.FILE_ASSET) {
    const fileModel = model as Media
    return fileModel.fileName || fileModel.customFileName || ''
  }

  if (relatedType === CourseActionType.QUIZ) {
    const quizModel = model as { title?: string; name?: string }
    return quizModel.title || quizModel.name || ''
  }

  // For CATEGORY, COURSE, LESSONS
  const namedModel = model as { name?: string }
  return namedModel.name || ''
}

// Get content type from assignation
const getContentType = (assignation: Assignation): CourseContentType => {
  const { relatedType, model } = assignation

  // If it's not a FILE_ASSET, return the relatedType as content type
  if (relatedType !== CourseActionType.FILE_ASSET) {
    if (relatedType === CourseActionType.QUIZ) {
      return CourseContentType.QUIZ
    }
    if (relatedType === CourseActionType.CATEGORY) {
      return CourseContentType.DOCUMENT
    }
    if (relatedType === CourseActionType.COURSE) {
      return CourseContentType.DOCUMENT
    }
    if (relatedType === CourseActionType.LESSONS) {
      return CourseContentType.DOCUMENT
    }
    return CourseContentType.DOCUMENT
  }

  // For FILE_ASSET, use the utility function to determine the content type
  return getContentTypeFromFile(model as Media)
}

// Get visibility from model
const getVisibility = (assignation: Assignation): VisibilityStatus => {
  const model = assignation.model as { visibility?: string | VisibilityStatus }
  if (!model.visibility) return VisibilityStatus.SHOW

  const visibility = model.visibility.toString().toLowerCase()
  if (visibility === 'maintenance') return VisibilityStatus.MAINTENANCE
  if (visibility === 'hide') return VisibilityStatus.HIDE
  return VisibilityStatus.SHOW
}

// Get status from model
const getStatus = (assignation: Assignation): 'done' | 'todo' => {
  const model = assignation.model as { status?: string }
  return model.status === 'published' ? 'done' : 'todo'
}

// Get end date from model
const getEndDate = (assignation: Assignation): string | null => {
  const model = assignation.model as { endDate?: string | null }
  return model.endDate || null
}

// Map assignations to category items
const categoryItems = computed((): CategoryItem[] => {
  if (!categoryStore.selectedCategoryDetail?.assignations) {
    return []
  }

  return categoryStore.selectedCategoryDetail.assignations.map((assignation) => {
    const endDate = getEndDate(assignation)
    const isExpired = isItemExpired(endDate)

    return {
      id: assignation.id,
      title: getAssignationTitle(assignation),
      contentType: getContentType(assignation),
      status: getStatus(assignation),
      actionType: assignation.relatedType as CourseActionType,
      visibility: getVisibility(assignation),
      percentage: assignation.execution?.percentage || 0,
      isExpired,
      relatedId: assignation.relatedId,
    }
  })
})

// Fetch category details
onMounted(async () => {
  if (route.params.id) {
    await categoryStore.fetchCategoryDetail(Number(route.params.id))
  }
})

// Watch for route changes
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      await categoryStore.fetchCategoryDetail(Number(newId))
    }
  },
)

// Methods
const handleBack = () => {
  if (props.isAdmin) {
    router.push('/admin')
  } else {
    router.back()
  }
}

// Category edit modal state
const showCategoryCreationModal = ref(false)
const editingCategoryId = ref<number | null>(null)

const handleEditCategory = async () => {
  if (!props.isAdmin) return

  const categoryId = Number(route.params.id)
  if (!categoryId) return

  // Fetch category details if not already loaded
  if (
    !categoryStore.selectedCategoryDetail ||
    categoryStore.selectedCategoryDetail.id !== categoryId
  ) {
    await categoryStore.fetchCategoryDetail(categoryId)
  }

  const visibility = categoryStore.selectedCategoryDetail?.visibility as VisibilityStatus

  // If visibility is HIDE or MAINTENANCE, allow direct editing
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    editingCategoryId.value = categoryId
    showCategoryCreationModal.value = true
  } else if (visibility === VisibilityStatus.SHOW) {
    // If visibility is SHOW, open visibility change modal
    itemActions.selectedItemId.value = categoryId
    itemActions.selectedCategoryVisibility.value = visibility
    itemActions.selectedItemType.value = CourseActionType.CATEGORY
    itemActions.showVisibilityChangeModal.value = true
  }
}

const handleCloseCategoryCreationModal = async () => {
  showCategoryCreationModal.value = false
  editingCategoryId.value = null
  // Refresh category details after edit
  if (route.params.id) {
    await categoryStore.fetchCategoryDetail(Number(route.params.id))
  }
}

// Handle visibility change edit for categories
const handleVisibilityChangeEdit = async () => {
  // If editing a category, open the category edit modal
  if (
    itemActions.selectedItemType.value === CourseActionType.CATEGORY &&
    itemActions.selectedItemId.value
  ) {
    itemActions.showVisibilityChangeModal.value = false
    editingCategoryId.value = itemActions.selectedItemId.value
    showCategoryCreationModal.value = true
  } else {
    // For other types, use the default handler
    await itemActions.handleVisibilityChangeEdit()
  }
}
</script>
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <HeaderView
      :title="t('pages.categoryDetail.title')"
      :isBack="true"
      :isSearch="false"
      :custom_actions="true"
      @back="handleBack"
    >
      <template #custom_actions>
        <div class="flex items-center gap-2">
          <BaseButton
            v-if="props.isAdmin"
            :text="t('pages.categorySettings.edit')"
            variant="blank"
            color="neutral"
            size="sm"
            font="medium"
            leftIcon="edit"
            @on-click="handleEditCategory"
            :full-size="false"
            class="w-auto neutral !text-neutral-500 !font-medium"
          />
        </div>
      </template>
    </HeaderView>

    <!-- Category Info Section -->
    <div class="bg-white border-b-2 border-grey-150">
      <div class="px-4 sm:px-6 md:px-4 lg:px-8 py-4 sm:py-4 md:py-3 lg:py-4">
        <div class="flex flex-col gap-1.5 md:gap-1 lg:gap-1.5">
          <!-- Category Name (Main Title) -->
          <BaseText
            :text="categoryName"
            class="!text-[20px] md:!text-[18px] lg:!text-[20px] !leading-[24px] !text-black/85 !font-semibold uppercase"
          />

          <!-- Category Short Name or ID Number -->
          <div class="flex items-center gap-2">
            <BaseText
              v-if="categoryShortName"
              :text="categoryShortName"
              type="p-sm"
              color="primary"
              :tone="600"
              font="medium"
              class="!text-primary-600 uppercase"
            />
            <BaseText
              v-else-if="categoryIdNumber"
              :text="categoryIdNumber"
              type="p-sm"
              color="neutral"
              :tone="600"
              font="medium"
              class="!text-neutral-600"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Body/Content Section -->
    <main class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6">
      <div class="max-w-7xl mx-auto">
        <!-- Items List -->
        <div class="space-y-2">
          <BaseCourseItemCard
            v-for="item in categoryItems"
            :key="item.id"
            :title="item.title"
            :content-type="item.contentType"
            :visibility="item.visibility"
            :status="item.status"
            :action-type="item.actionType"
            :percentage="item.percentage"
            :is-expired="item.isExpired"
            :hideActionButton="item.actionType === CourseActionType.CATEGORY"
            :is-admin="props.isAdmin"
            :disabled="item.visibility === VisibilityStatus.MAINTENANCE"
            @edit="itemActions.handleEdit(item as CategoryItem)"
            @delete="itemActions.handleDelete(item as CategoryItem)"
            :isDisabledAction="!props.isAdmin"
            @progress="itemActions.handleProgress(item)"
            @click="itemActions.handleItemClick(item)"
          />
        </div>

        <!-- Empty State -->
        <div
          v-if="categoryItems.length === 0 && !categoryStore.categoriesIsLoading"
          class="flex flex-col items-center justify-center py-16 md:py-12 lg:py-16 text-center"
        >
          <BaseIcon
            name="inbox"
            size="lg"
            color="neutral"
            :tone="300"
            class="mb-4 md:mb-3 lg:mb-4"
          />
          <BaseText
            :text="t('pages.categoryDetail.noItems')"
            :tone="500"
            color="neutral"
            type="p-sm"
          />
        </div>
      </div>
    </main>
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
      v-if="itemActions.showVisibilityChangeModal.value && props.isAdmin"
      :isOpen="itemActions.showVisibilityChangeModal.value"
      :itemId="(itemActions.selectedItemId.value as number) || 0"
      :currentVisibility="
        (itemActions.selectedCategoryVisibility.value as VisibilityStatus) || VisibilityStatus.SHOW
      "
      @onClose="itemActions.handleCloseVisibilityChangeModal"
      @onSave="itemActions.handleVisibilityChangeSave"
      :type="itemActions.renderVisibilityType()"
      @onEdit="handleVisibilityChangeEdit"
    />
    <QuizCreationModal
      v-if="itemActions.showQuizCreationModal.value"
      :show="itemActions.showQuizCreationModal.value"
      :quiz-id="Number(itemActions.selectedItemId.value) || 0"
      :isAdmin="props.isAdmin"
      @close="itemActions.handleCloseQuizCreationModal"
    />
    <CourseCreationModal
      :title="t('pages.courses.createCourse')"
      v-if="itemActions.isShowCourseCreationModal.value && props.isAdmin"
      :editCourse="itemActions.courseStore.courseDetails || undefined"
      @close="itemActions.handleCloseCourseCreationModal"
    />
    <FileViewerModal
      v-if="itemActions.isFileViewerOpen.value"
      :isOpen="itemActions.isFileViewerOpen.value"
      :file="itemActions.currentFile.value"
      @close="itemActions.handleCloseFileViewer"
    />
    <EditFileModal
      v-if="itemActions.showEditModal.value && itemActions.currentFile.value"
      :file="itemActions.currentFile.value"
      :isOpen="itemActions.showEditModal.value"
      @onClose="
        () => {
          itemActions.showEditModal.value = false
        }
      "
      @onSuccess="itemActions.handleEditSuccess"
    />
    <CreateLessonModal
      v-if="itemActions.isShowLessonCreationModal.value && props.isAdmin"
      :show="itemActions.isShowLessonCreationModal.value"
      :edit-lesson="itemActions.lessonsStore.getLessonDetails || undefined"
      @close="itemActions.handleCloseLessonCreationModal"
    />
    <BaseDeleteModal
      v-if="itemActions.showDeleteModal.value && props.isAdmin"
      :text="t(itemActions.deleteModalText.value)"
      :description="t(itemActions.deleteModalDescription.value)"
      @onCancel="itemActions.handleCancelDelete"
      @onDelete="itemActions.handleConfirmDelete"
    />
    <AddCategoryModal
      v-if="showCategoryCreationModal && props.isAdmin"
      :show="showCategoryCreationModal"
      :category-id="editingCategoryId"
      :is-dashboard="false"
      @close="handleCloseCategoryCreationModal"
    />
  </div>
</template>
