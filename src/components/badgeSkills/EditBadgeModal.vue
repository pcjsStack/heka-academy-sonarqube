<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
import type { Lesson } from '@/types/Lessons'
import type { quizItem } from '@/types/Quiz'
import type { BadgeFormData, BadgeFormValidation, GetBadgesParams } from '@/types/BadgeAndSkill'

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
const emit = defineEmits<{
  close: []
  update: [badgeId: number, badgeData: BadgeFormData]
}>()

const showSuccessScreen = ref<boolean>(false)

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

// Association options
const associationOptions = computed(() => ({
  file: uploadFilesStore.allFiles
    .filter((file) => file.id && file.fileName)
    .map((file) => ({
      value: String(file.id),
      label: file.fileName,
    })),
  course: courseStore.courses
    .filter((course) => course.id && course.name)
    .map((course) => ({
      value: String(course.id),
      label: course.name,
    })),
  lessons: lessonsStore.lessons
    .filter((lesson) => lesson.id && lesson.name)
    .map((lesson) => ({
      value: String(lesson.id),
      label: lesson.name,
    })),
  quiz: quizStore.quizzes
    .filter((quiz) => quiz.id && quiz.title)
    .map((quiz) => ({
      value: String(quiz.id),
      label: quiz.title,
    })),
}))

// Function to load missing association options
const loadMissingAssociationOptions = async (associationIds: {
  fileIds: string[]
  courseIds: string[]
  lessonIds: string[]
  quizIds: string[]
}) => {
  const loadPromises: Promise<void>[] = []

  // Load missing courses
  if (associationIds.courseIds.length > 0) {
    const missingCourseIds = associationIds.courseIds.filter(
      (id) => !courseStore.courses.some((course) => course.id?.toString() === id),
    )
    if (missingCourseIds.length > 0) {
      // Try to load more courses
      if (courseStore.coursesCurrentPage < courseStore.coursesTotalPages) {
        loadPromises.push(
          courseStore.loadMoreCourses({
            perPage: 20,
            order: 'asc',
            orderColumn: 'name',
            search: '',
            isAdmin: true,
          }),
        )
      }
    }
  }

  // Load missing lessons
  if (associationIds.lessonIds.length > 0) {
    const missingLessonIds = associationIds.lessonIds.filter(
      (id) => !lessonsStore.lessons.some((lesson) => lesson.id?.toString() === id),
    )
    if (missingLessonIds.length > 0) {
      // Try to load more lessons
      if (lessonsStore.page + 1 < lessonsStore.total) {
        loadPromises.push(
          lessonsStore.fetchLessons({
            page: lessonsStore.page + 1,
            perPage: 20,
            order: 'asc',
            orderColumn: 'name',
            isAdmin: true,
          }),
        )
      }
    }
  }

  // Load missing quizzes
  if (associationIds.quizIds.length > 0) {
    const missingQuizIds = associationIds.quizIds.filter(
      (id) => !quizStore.quizzes.some((quiz) => quiz.id?.toString() === id),
    )
    if (missingQuizIds.length > 0) {
      // Try to load more quizzes
      if (quizStore.page + 1 < quizStore.total) {
        loadPromises.push(
          quizStore.fetchQuizzes({
            page: quizStore.page + 1,
            perPage: 20,
            order: 'asc',
            orderColumn: 'title',
            isAdmin: true,
          }),
        )
      }
    }
  }

  await Promise.all(loadPromises)
}

// Watch for initial data changes and populate form
watch(
  () => props.initialBadgeData,
  async (newData) => {
    if (newData) {
      // Ensure options are loaded before setting associations
      // Load all associations if they exist to ensure options are available
      const associationIds = {
        fileIds: newData.associations?.fileIds || [],
        courseIds: newData.associations?.courseIds || [],
        lessonIds: newData.associations?.lessonIds || [],
        quizIds: newData.associations?.quizIds || [],
      }

      // Load missing options for associations
      await loadMissingAssociationOptions(associationIds)

      // Wait for next tick to ensure options are computed
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
      search: '',
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
      search: '',
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
  emit('close')
}

const handleSuccessClose = () => {
  showSuccessScreen.value = false
}

const handleSuccessDone = () => {
  showSuccessScreen.value = false
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
