import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import { useQuizStore } from '@/stores/QuizStore'
import {
  CourseActionType,
  CourseExecutionType,
  VisibilityStatus,
  VisibilityType,
} from '@/types/Course'
import type { Media } from '@/types/Media'
import type { Assignation } from '@/types/Lessons'
import type { CategoryItem } from '@/types/Category'

export interface ItemActionsConfig {
  isAdmin?: boolean
  categoryId?: number
  onRefresh?: () => Promise<void>
  onNavigateBack?: () => void
}

export const useItemActions = (config: ItemActionsConfig = {}) => {
  const router = useRouter()
  const courseStore = useCourseStore()
  const lessonsStore = useLessonsStore()
  const categoryStore = useCategoryStore()
  const uploadFilesStore = useUploadFilesStore()
  const quizStore = useQuizStore()

  const { isAdmin = false, categoryId, onRefresh } = config

  // State
  const showDeleteModal = ref(false)
  const showProgressTable = ref(false)
  const showVisibilityChangeModal = ref(false)
  const showEditModal = ref(false)
  const isFileViewerOpen = ref(false)
  const isShowCourseCreationModal = ref(false)
  const isShowLessonCreationModal = ref(false)
  const showQuizCreationModal = ref(false)

  const selectedItemId = ref<number | null>(null)
  const selectedItemType = ref<CourseActionType | CourseExecutionType | null>(null)
  const selectedCategoryVisibility = ref<VisibilityStatus | null>(null)
  const currentFile = ref<Media | null>(null)
  const selectedAssignation = ref<Assignation | null>(null)

  // Map CourseActionType to CourseExecutionType
  const executionTypeMap: Record<CourseActionType, CourseExecutionType | null> = {
    [CourseActionType.COURSE]: CourseExecutionType.COURSE,
    [CourseActionType.LESSONS]: CourseExecutionType.LESSON,
    [CourseActionType.QUIZ]: CourseExecutionType.QUIZ,
    [CourseActionType.CATEGORY]: CourseExecutionType.CATEGORY,
    [CourseActionType.FILE_ASSET]: null,
    [CourseActionType.NEW_FILE]: null,
  }

  // Handle item click
  const handleItemClick = (item: CategoryItem) => {
    if (item.isExpired && !isAdmin) return

    const { actionType, relatedId } = item

    switch (actionType) {
      case CourseActionType.CATEGORY:
        router.push({
          name: isAdmin ? 'admin-category-detail' : 'category-detail',
          params: { id: relatedId.toString() },
        })
        break
      case CourseActionType.COURSE:
        router.push({
          name: isAdmin ? 'course-admin-details' : 'course-details',
          params: { id: relatedId.toString() },
        })
        break
      case CourseActionType.LESSONS:
        router.push({
          name: isAdmin ? 'lesson-admin-details' : 'lesson-details',
          params: { id: relatedId.toString() },
        })
        break
      case CourseActionType.QUIZ:
        router.push({
          name: isAdmin ? 'admin-quiz-detail' : 'quiz-detail',
          params: { id: relatedId.toString() },
        })
        break
      case CourseActionType.FILE_ASSET:
        // Find the assignation from selectedCategoryDetail
        const existingAssignation = categoryStore.selectedCategoryDetail?.assignations.find(
          (a) => a.id === item.id,
        )
        if (existingAssignation) {
          const file = existingAssignation.model as Media
          if (file) {
            currentFile.value = file
            isFileViewerOpen.value = true
          }
        }
        break
      default:
        break
    }
  }

  // Handle progress
  const handleProgress = (item: CategoryItem) => {
    const executionType = executionTypeMap[item.actionType || CourseActionType.FILE_ASSET]

    if (executionType && item.relatedId) {
      selectedItemId.value = item.relatedId
      selectedItemType.value = executionType
      showProgressTable.value = true
    }
  }

  // Handle edit
  const handleEdit = async (item: CategoryItem) => {
    if (!isAdmin) return

    if (item.actionType === CourseActionType.QUIZ) {
      selectedItemId.value = item.relatedId
      showQuizCreationModal.value = true
      return
    }

    if (
      item.visibility === VisibilityStatus.MAINTENANCE ||
      item.visibility === VisibilityStatus.HIDE
    ) {
      selectedItemId.value = item.relatedId
      await handleEditModal(item.actionType as CourseActionType, item.relatedId)
      return
    }

    selectedItemId.value = item.relatedId
    showVisibilityChangeModal.value = true
    selectedCategoryVisibility.value = item.visibility
    selectedItemType.value = item.actionType as CourseActionType | CourseExecutionType | null
  }

  // Handle edit modal
  const handleEditModal = async (actionType: CourseActionType, id: number) => {
    if (actionType === CourseActionType.COURSE) {
      selectedItemId.value = id
      await courseStore.fetchCourseById(selectedItemId.value as number, true)
      isShowCourseCreationModal.value = true
    } else if (actionType === CourseActionType.LESSONS) {
      selectedItemId.value = id
      isShowLessonCreationModal.value = true
      await lessonsStore.fetchLessonById(selectedItemId.value as number, true)
    } else if (actionType === CourseActionType.FILE_ASSET) {
      selectedItemId.value = id
      const existingAssignation = categoryStore.selectedCategoryDetail?.assignations.find(
        (a) => a.relatedId === selectedItemId.value,
      )
      if (existingAssignation) {
        const file = existingAssignation.model as Media
        if (file) {
          currentFile.value = file
          showEditModal.value = true
        }
      }
    }
  }

  // Handle delete
  const handleDelete = (item: CategoryItem) => {
    if (!isAdmin) return

    selectedItemId.value = item.relatedId
    selectedItemType.value = item.actionType || null
    selectedAssignation.value =
      categoryStore.selectedCategoryDetail?.assignations.find((a) => a.id === item.id) || null
    showDeleteModal.value = true
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedItemId.value || !selectedItemType.value) return

    const actionType = selectedItemType.value as CourseActionType

    try {
      switch (actionType) {
        case CourseActionType.COURSE:
          await courseStore.deleteCourse([selectedItemId.value], 'soft')
          break
        case CourseActionType.LESSONS:
          await lessonsStore.deleteLesson([selectedItemId.value])
          break
        case CourseActionType.QUIZ:
          await quizStore.deleteQuiz([selectedItemId.value], 'soft')
          break
        case CourseActionType.CATEGORY:
          await categoryStore.handleDeleteCategory([selectedItemId.value], 'soft')
          break
        case CourseActionType.FILE_ASSET:
          if (selectedAssignation.value) {
            const file = selectedAssignation.value.model as Media
            if (file) {
              await uploadFilesStore.deleteFile([file.id.toString()], 'soft')
            }
          }
          break
        default:
          break
      }

      showDeleteModal.value = false
      selectedItemId.value = null
      selectedItemType.value = null
      selectedAssignation.value = null

      // Refresh data
      if (onRefresh) {
        await onRefresh()
      } else if (categoryId) {
        await categoryStore.fetchCategoryDetail(categoryId)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  // Cancel delete
  const handleCancelDelete = () => {
    showDeleteModal.value = false
    selectedItemId.value = null
    selectedItemType.value = null
    selectedAssignation.value = null
  }

  // Close progress table
  const handleCloseProgressTable = () => {
    showProgressTable.value = false
    selectedItemId.value = null
    selectedItemType.value = null
  }

  // Handle visibility change save
  const handleVisibilityChangeSave = async () => {
    showVisibilityChangeModal.value = false
    selectedItemId.value = null
    selectedCategoryVisibility.value = null

    if (onRefresh) {
      await onRefresh()
    } else if (categoryId) {
      await categoryStore.fetchCategoryDetail(categoryId)
    }
  }

  // Handle visibility change edit
  const handleVisibilityChangeEdit = async () => {
    showVisibilityChangeModal.value = false
    if (selectedItemId.value && selectedItemType.value) {
      await handleEditModal(selectedItemType.value as CourseActionType, selectedItemId.value)
    }
  }

  // Close visibility change modal
  const handleCloseVisibilityChangeModal = () => {
    showVisibilityChangeModal.value = false
    selectedItemId.value = null
    selectedCategoryVisibility.value = null
  }

  // Close file viewer
  const handleCloseFileViewer = () => {
    isFileViewerOpen.value = false
    currentFile.value = null
  }

  // Handle edit success
  const handleEditSuccess = async (data?: unknown) => {
    if (data) {
      await uploadFilesStore.updateFileDetails(data as { id: string; [key: string]: unknown })
    }
    showEditModal.value = false
    currentFile.value = null

    if (onRefresh) {
      await onRefresh()
    } else if (categoryId) {
      await categoryStore.fetchCategoryDetail(categoryId)
    }
  }

  // Close course creation modal
  const handleCloseCourseCreationModal = async () => {
    isShowCourseCreationModal.value = false
    if (onRefresh) {
      await onRefresh()
    } else if (categoryId) {
      await categoryStore.fetchCategoryDetail(categoryId)
    }
  }

  // Close lesson creation modal
  const handleCloseLessonCreationModal = async () => {
    isShowLessonCreationModal.value = false
    if (onRefresh) {
      await onRefresh()
    } else if (categoryId) {
      await categoryStore.fetchCategoryDetail(categoryId)
    }
  }

  // Close quiz creation modal
  const handleCloseQuizCreationModal = async () => {
    showQuizCreationModal.value = false
    selectedItemId.value = null
    if (onRefresh) {
      await onRefresh()
    } else if (categoryId) {
      await categoryStore.fetchCategoryDetail(categoryId)
    }
  }

  // Render visibility type
  const renderVisibilityType = (): VisibilityType => {
    if (selectedItemType.value === CourseActionType.COURSE) {
      return VisibilityType.COURSE
    }
    if (selectedItemType.value === CourseActionType.LESSONS) {
      return VisibilityType.LESSONS
    }
    if (selectedItemType.value === CourseActionType.QUIZ) {
      return VisibilityType.QUIZ
    }
    if (selectedItemType.value === CourseActionType.CATEGORY) {
      return VisibilityType.CATEGORY
    }
    return VisibilityType.FILES
  }

  // Get delete modal text
  const deleteModalText = computed(() => {
    if (!selectedItemType.value) return ''

    const actionType = selectedItemType.value as CourseActionType

    switch (actionType) {
      case CourseActionType.COURSE:
        return 'pages.baseDeleteModal.deleteCourse'
      case CourseActionType.LESSONS:
        return 'pages.baseDeleteModal.deleteLesson'
      case CourseActionType.QUIZ:
        return 'pages.quizzes.deleteModal.title'
      case CourseActionType.CATEGORY:
        return 'pages.categories.deleteModal.title'
      case CourseActionType.FILE_ASSET:
        return 'pages.baseDeleteModal.deleteFile'
      default:
        return ''
    }
  })

  // Get delete modal description
  const deleteModalDescription = computed(() => {
    if (!selectedItemType.value) return ''

    const actionType = selectedItemType.value as CourseActionType

    switch (actionType) {
      case CourseActionType.COURSE:
        return 'pages.baseDeleteModal.deleteCourseDescription'
      case CourseActionType.LESSONS:
        return 'pages.baseDeleteModal.deleteLessonDescription'
      case CourseActionType.QUIZ:
        return 'pages.quizzes.deleteModal.description'
      case CourseActionType.CATEGORY:
        return 'pages.categories.deleteModal.description'
      case CourseActionType.FILE_ASSET:
        return 'pages.baseDeleteModal.deleteFileDescription'
      default:
        return ''
    }
  })

  return {
    // State
    showDeleteModal,
    showProgressTable,
    showVisibilityChangeModal,
    showEditModal,
    isFileViewerOpen,
    isShowCourseCreationModal,
    isShowLessonCreationModal,
    showQuizCreationModal,
    selectedItemId,
    selectedItemType,
    selectedCategoryVisibility,
    currentFile,
    deleteModalText,
    deleteModalDescription,

    // Stores (exposed for template access)
    courseStore,
    lessonsStore,

    // Actions
    handleItemClick,
    handleProgress,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleCloseProgressTable,
    handleVisibilityChangeSave,
    handleVisibilityChangeEdit,
    handleCloseVisibilityChangeModal,
    handleCloseFileViewer,
    handleEditSuccess,
    handleCloseCourseCreationModal,
    handleCloseLessonCreationModal,
    handleCloseQuizCreationModal,
    renderVisibilityType,
  }
}
