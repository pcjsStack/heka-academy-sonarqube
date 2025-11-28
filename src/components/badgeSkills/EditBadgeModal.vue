<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { debounce } from 'lodash'
import { BaseSideModal, BaseButton } from '@/components/common'
import BadgeForm from './BadgeForm.vue'
import BadgeSkillsSuccessScreen from './BadgeSkillsSuccessScreen.vue'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import { useCourseStore } from '@/stores/courseStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useQuizStore } from '@/stores/QuizStore'
import { useBadgeAndSkillStore } from '@/stores/BadgeAndSkill'
import lessonsService from '@/services/lessons'
import quizService from '@/services/quiz'
import { t } from '@/utils/i18n'
import { createBadgeFormData } from '@/utils/badgeSkillsPayload'
import type { Lesson, Assignation } from '@/types/Lessons'
import type { quizItem } from '@/types/Quiz'
import type {
  BadgeFormData,
  BadgeFormValidation,
  GetBadgesParams,
  StoredAssociations,
  ExtendedBadgeAssociations,
} from '@/types/BadgeAndSkill'

interface Props {
  show: boolean
  badgeId?: number
  initialBadgeData?: Partial<BadgeFormData>
  reloadParams?: GetBadgesParams
}

const props = defineProps<Props>()

const uploadFilesStore = useUploadFilesStore()
const courseStore = useCourseStore()
const lessonsStore = useLessonsStore()
const quizStore = useQuizStore()
const badgeStore = useBadgeAndSkillStore()

// Loading flags to prevent multiple simultaneous calls
const isLoadingLessons = ref(false)
const isLoadingQuizzes = ref(false)

// Search queries for each association type
const searchQueries = ref({
  file: '',
  course: '',
  lessons: '',
  quiz: '',
})

const emit = defineEmits<{
  close: []
  update: [badgeId: number, badgeData: BadgeFormData]
}>()

const showSuccessScreen = ref<boolean>(false)

// Store full association objects from initialBadgeData
const storedAssociations = ref<StoredAssociations>({
  files: [],
  courses: [],
  lessons: [],
  quizzes: [],
})

// Form data
const badgeData = ref<BadgeFormData>({
  name: '',
  image: [],
  imageUrl: undefined,
  associations: {
    fileIds: [],
    courseIds: [],
    lessonIds: [],
    quizIds: [],
  },
})

// Validation states
const badgeValidation = ref<BadgeFormValidation>({
  isNameValid: false,
  isImageValid: false,
  isAssociationValid: true, // Initially true since validation only applies when name and image are filled
  isFormValid: false,
})

// Computed validation
const isSaveEnabled = computed(() => badgeValidation.value.isFormValid)

// Association options - add missing IDs from badgeData.associations
const associationOptions = computed(() => {
  const fileOptions = uploadFilesStore.allFiles
    .filter((file) => file.id && file.fileName)
    .map((file) => ({
      value: String(file.id),
      label: file.customFileName || file.fileName,
    }))

  const courseOptions = courseStore.courses
    .filter((course) => course.id && course.name)
    .map((course) => ({
      value: String(course.id),
      label: course.name,
    }))

  const lessonOptions = lessonsStore.lessons
    .filter((lesson) => lesson.id && lesson.name)
    .map((lesson) => ({
      value: String(lesson.id),
      label: lesson.name,
    }))

  const quizOptions = quizStore.quizzes
    .filter((quiz) => quiz.id && quiz.title)
    .map((quiz) => ({
      value: String(quiz.id),
      label: quiz.title,
    }))

  // Add missing IDs from badgeData.associations using stored full objects
  const selectedFileIds = new Set(badgeData.value.associations.fileIds || [])
  const selectedCourseIds = new Set(badgeData.value.associations.courseIds || [])
  const selectedLessonIds = new Set(badgeData.value.associations.lessonIds || [])
  const selectedQuizIds = new Set(badgeData.value.associations.quizIds || [])

  // Add missing files
  storedAssociations.value.files.forEach((assignation: Assignation) => {
    const id = String(assignation.relatedId)
    if (selectedFileIds.has(id) && !fileOptions.some((opt) => opt.value === id)) {
      const model = assignation.model as unknown as Record<string, unknown>
      fileOptions.push({
        value: id,
        label: (model?.customFileName as string) || (model?.fileName as string) || `File #${id}`,
      })
    }
  })

  // Add missing courses
  storedAssociations.value.courses.forEach((assignation: Assignation) => {
    const id = String(assignation.relatedId)
    if (selectedCourseIds.has(id) && !courseOptions.some((opt) => opt.value === id)) {
      const model = assignation.model as unknown as Record<string, unknown>
      courseOptions.push({
        value: id,
        label: (model?.name as string) || `Course #${id}`,
      })
    }
  })

  // Add missing lessons
  storedAssociations.value.lessons.forEach((assignation: Assignation) => {
    const id = String(assignation.relatedId)
    if (selectedLessonIds.has(id) && !lessonOptions.some((opt) => opt.value === id)) {
      const model = assignation.model as unknown as Record<string, unknown>
      lessonOptions.push({
        value: id,
        label: (model?.name as string) || `Lesson #${id}`,
      })
    }
  })

  // Add missing quizzes
  storedAssociations.value.quizzes.forEach((assignation: Assignation) => {
    const id = String(assignation.relatedId)
    if (selectedQuizIds.has(id) && !quizOptions.some((opt) => opt.value === id)) {
      const model = assignation.model as unknown as Record<string, unknown>
      quizOptions.push({
        value: id,
        label: (model?.title as string) || `Quiz #${id}`,
      })
    }
  })

  return {
    file: fileOptions,
    course: courseOptions,
    lessons: lessonOptions,
    quiz: quizOptions,
  }
})

// Watch for initial data changes and populate form
watch(
  () => props.initialBadgeData,
  async (newData) => {
    if (newData) {
      // Store full association objects if they exist (from editingBadgeData.associations)
      const associations = newData.associations as ExtendedBadgeAssociations | undefined

      if (associations) {
        storedAssociations.value = {
          files: associations.files || [],
          courses: associations.courses || [],
          lessons: associations.lessons || [],
          quizzes: associations.quizzes || [],
        }
      }

      // Extract IDs from full objects or use existing IDs
      const associationIds = {
        fileIds:
          associations?.files?.map((assignation: Assignation) => String(assignation.relatedId)) ||
          associations?.fileIds ||
          [],
        courseIds:
          associations?.courses?.map((assignation: Assignation) => String(assignation.relatedId)) ||
          associations?.courseIds ||
          [],
        lessonIds:
          associations?.lessons?.map((assignation: Assignation) => String(assignation.relatedId)) ||
          associations?.lessonIds ||
          [],
        quizIds:
          associations?.quizzes?.map((assignation: Assignation) => String(assignation.relatedId)) ||
          associations?.quizIds ||
          [],
      }

      await nextTick()

      badgeData.value = {
        name: newData.name || '',
        image: newData.image || [],
        imageUrl: newData.imageUrl || undefined,
        associations: associationIds,
      }
    }
  },
  { immediate: true, deep: true },
)

const handleBadgeValidationChange = (validation: BadgeFormValidation) => {
  badgeValidation.value = validation
}

// Lazy loading handlers
const handleFileScrollBottom = async () => {
  if (uploadFilesStore.isLoading || uploadFilesStore.currentPage >= uploadFilesStore.totalPages) {
    return
  }

  try {
    await uploadFilesStore.loadMoreFiles({
      perPage: 8,
      order: 'asc',
      orderColumn: 'customFileName',
      search: searchQueries.value.file,
      isAdmin: true,
    })
  } catch (error) {
    console.error('Error loading more files:', error)
  }
}

const handleCourseScrollBottom = async () => {
  if (
    courseStore.coursesIsLoading ||
    courseStore.coursesCurrentPage >= courseStore.coursesTotalPages
  ) {
    return
  }

  try {
    await courseStore.loadMoreCourses({
      perPage: 8,
      order: 'asc',
      orderColumn: 'name',
      search: searchQueries.value.course,
      isAdmin: true,
    })
  } catch (error) {
    console.error('Error loading more courses:', error)
  }
}

const handleLessonsScrollBottom = async () => {
  if (isLoadingLessons.value || lessonsStore.page + 1 >= lessonsStore.total) {
    return
  }

  isLoadingLessons.value = true
  try {
    const response = await lessonsService.getLessons({
      page: lessonsStore.page + 1,
      perPage: 8,
      order: 'asc',
      orderColumn: 'name',
      search: searchQueries.value.lessons,
      isAdmin: true,
    })
    const existingIds = new Set(lessonsStore.lessons.map((l) => l.id))
    const newLessons = response.data.filter((lesson: Lesson) => !existingIds.has(lesson.id))
    lessonsStore.lessons = [...lessonsStore.lessons, ...newLessons]
    lessonsStore.page = response.page
    lessonsStore.total = response.totalPage
  } catch (error) {
    console.error('Error loading more lessons:', error)
  } finally {
    isLoadingLessons.value = false
  }
}

const handleQuizScrollBottom = async () => {
  if (isLoadingQuizzes.value || quizStore.page + 1 >= quizStore.total) {
    return
  }

  isLoadingQuizzes.value = true
  try {
    const response = await quizService.getQuizzes({
      page: quizStore.page + 1,
      perPage: 8,
      order: 'asc',
      orderColumn: 'title',
      search: searchQueries.value.quiz,
      isAdmin: true,
    })
    const existingIds = new Set(quizStore.quizzes.map((q) => q.id))
    const newQuizzes = response.data.filter((quiz: quizItem) => !existingIds.has(quiz.id))
    quizStore.quizzes = [...quizStore.quizzes, ...newQuizzes]
    quizStore.page = response.page
    quizStore.total = response.totalPage
  } catch (error) {
    console.error('Error loading more quizzes:', error)
  } finally {
    isLoadingQuizzes.value = false
  }
}

const handleScrollBottom = (type: 'file' | 'course' | 'lessons' | 'quiz') => {
  switch (type) {
    case 'file':
      handleFileScrollBottom()
      break
    case 'course':
      handleCourseScrollBottom()
      break
    case 'lessons':
      handleLessonsScrollBottom()
      break
    case 'quiz':
      handleQuizScrollBottom()
      break
  }
}

// Handle search queries - reset pagination and fetch with search (debounced)
const handleSearch = debounce(
  async (type: 'file' | 'course' | 'lessons' | 'quiz', query: string) => {
    // Update search query
    searchQueries.value[type] = query

    // Reset pagination and clear existing data
    switch (type) {
      case 'file':
        // Reset pagination - fetchFiles will replace the files list
        await uploadFilesStore.fetchFiles({
          page: 0,
          perPage: 8,
          order: 'asc',
          orderColumn: 'customFileName',
          search: query,
          isAdmin: true,
        })
        break
      case 'course':
        courseStore.coursesCurrentPage = 0
        courseStore.courses = []
        await courseStore.fetchCourses({
          page: 0,
          perPage: 8,
          search: query,
          isAdmin: true,
        })
        break
      case 'lessons':
        lessonsStore.page = 0
        lessonsStore.lessons = []
        await lessonsStore.fetchLessons({
          page: 0,
          perPage: 8,
          order: 'asc',
          orderColumn: 'name',
          search: query,
          isAdmin: true,
        })
        break
      case 'quiz':
        quizStore.page = 0
        quizStore.quizzes = []
        await quizStore.fetchQuizzes({
          page: 0,
          perPage: 8,
          order: 'asc',
          orderColumn: 'title',
          search: query,
          isAdmin: true,
        })
        break
    }
  },
  500,
) // 500ms debounce delay

const handleUpdate = async () => {
  if (props.badgeId) {
    try {
      // Build FormData payload (only includes new File objects, not existing Media)
      const formData = createBadgeFormData(badgeData.value)

      // Call the API to update the badge with reload params
      await badgeStore.editBadge(props.badgeId, formData, props.reloadParams)

      // Emit update event for parent to handle
      emit('update', props.badgeId, badgeData.value)
      showSuccessScreen.value = true
    } catch (error) {
      console.error('Error updating badge:', error)
      // Error is already handled by the store's toast
    }
  }
}

const handleCancel = () => {
  // Reset stored associations
  storedAssociations.value = { files: [], courses: [], lessons: [], quizzes: [] }
  emit('close')
}

const handleSuccessClose = () => {
  showSuccessScreen.value = false
}

const handleSuccessDone = () => {
  showSuccessScreen.value = false
  // Reset stored associations
  storedAssociations.value = { files: [], courses: [], lessons: [], quizzes: [] }
  emit('close')
}

onMounted(async () => {
  // Load initial data
  await Promise.all([
    uploadFilesStore.fetchFiles({
      page: 0,
      perPage: 8,
      order: 'asc',
      orderColumn: 'customFileName',
      search: '',
    }),
    courseStore.fetchCourses({
      page: 0,
      perPage: 8,
      search: '',
      isAdmin: true,
    }),
    lessonsStore.fetchLessons({
      page: 0,
      perPage: 8,
      order: 'asc',
      orderColumn: 'name',
      isAdmin: true,
    }),
    quizStore.fetchQuizzes({
      page: 0,
      perPage: 8,
      order: 'asc',
      orderColumn: 'title',
      isAdmin: true,
    }),
  ])
})
</script>

<template>
  <!-- Success Screen -->
  <BaseSideModal
    v-if="show && showSuccessScreen"
    :title="t('pages.badgeSkills.success.title')"
    size="md"
    :close-button="true"
    custom-class="left-0"
    :z-index="9999999"
    @on-close="handleSuccessClose"
  >
    <BadgeSkillsSuccessScreen @close="handleSuccessClose" @done="handleSuccessDone" />
  </BaseSideModal>

  <!-- Main Modal -->
  <BaseSideModal
    v-else-if="show"
    :title="t('pages.badgeSkills.edit.badgeTitle')"
    size="md"
    :close-button="true"
    custom-class="left-0"
    :z-index="9999999"
    @on-close="handleCancel"
  >
    <div class="lg:px-6 px-4 pt-8 pb-[48px] h-[calc(100svh-140px)] overflow-y-auto">
      <div class="flex flex-col overflow-y-auto flex-1 h-full min-h-0">
        <!-- Badge Section -->
        <BadgeForm
          v-model="badgeData"
          :association-options="associationOptions"
          @validation-change="handleBadgeValidationChange"
          @scroll-bottom="handleScrollBottom"
          @search="handleSearch"
        />
      </div>
    </div>

    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :fullSize="false"
          :text="t('pages.badgeSkills.buttons.cancel')"
          color="primary"
          size="sm"
          variant="link"
          class="max-w-[95px] !font-medium"
          @on-click="handleCancel"
        />
        <BaseButton
          :fullSize="false"
          :text="t('pages.badgeSkills.edit.update')"
          color="primary"
          size="sm"
          variant="default"
          class="max-w-[95px] !font-medium"
          :disabled="!isSaveEnabled"
          @on-click="handleUpdate"
        />
      </div>
    </div>
  </BaseSideModal>
</template>
