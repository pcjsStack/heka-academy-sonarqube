<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { debounce } from 'lodash'
import { BaseSideModal, BaseButton } from '@/components/common'
import BadgeForm from './BadgeForm.vue'
import SkillsForm from './SkillsForm.vue'
import BadgeSkillsSuccessScreen from './BadgeSkillsSuccessScreen.vue'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import { useCourseStore } from '@/stores/courseStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useQuizStore } from '@/stores/QuizStore'
import { useBadgeAndSkillStore } from '@/stores/BadgeAndSkill'
import lessonsService from '@/services/lessons'
import quizService from '@/services/quiz'
import { t } from '@/utils/i18n'
import type { Lesson } from '@/types/Lessons'
import type { quizItem } from '@/types/Quiz'
import { createBadgeFormData, createSkillPayload } from '@/utils/badgeSkillsPayload'
import type {
  BadgeFormData,
  SkillsFormData,
  BadgeFormValidation,
  SkillsFormValidation,
  BadgeSkillsValidation,
} from '@/types/BadgeAndSkill'

const badgeAndSkillStore = useBadgeAndSkillStore()
const uploadFilesStore = useUploadFilesStore()
const courseStore = useCourseStore()
const lessonsStore = useLessonsStore()
const quizStore = useQuizStore()
const emit = defineEmits<{
  close: []
}>()

const showSuccessScreen = ref<boolean>(false)

// Form data
const badgeData = ref<BadgeFormData>({
  name: '',
  image: [],
  associations: {
    fileIds: [],
    courseIds: [],
    lessonIds: [],
    quizIds: [],
  },
})

const skillsData = ref<SkillsFormData>({
  names: [''],
  associations: {
    fileIds: [],
    courseIds: [],
    lessonIds: [],
    quizIds: [],
  },
})

// Validation states
const badgeValidation = ref<BadgeFormValidation>({
  isNameValid: true, // Initially true since badge is optional
  isImageValid: true, // Initially true since badge is optional
  isAssociationValid: true, // Initially true since badge is optional
  isFormValid: true, // Initially true since badge is optional
})

const skillsValidation = ref<SkillsFormValidation>({
  hasValidSkills: true, // Initially true since validation only applies when association is selected
  isAssociationValid: true, // Initially true since validation only applies when skill name is entered
  isFormValid: false,
})

// Computed validation
// Save is enabled if:
// - Badge form is valid (either all empty or all required fields filled)
// - AND Skills form is valid
const overallValidation = computed(
  (): BadgeSkillsValidation => ({
    badge: badgeValidation.value,
    skills: skillsValidation.value,
    isSaveEnabled: badgeValidation.value.isFormValid && skillsValidation.value.isFormValid,
  }),
)

// Association options
const associationOptions = computed(() => ({
  file: uploadFilesStore.allFiles
    .filter((file) => file.id && file.fileName) // Filter out invalid files
    .map((file) => ({
      value: String(file.id), // Use id instead of uuid
      label: file.customFileName || file.fileName,
    })),
  course: courseStore.courses
    .filter((course) => course.id && course.name) // Filter out invalid courses
    .map((course) => ({
      value: String(course.id),
      label: course.name,
    })),
  lessons: lessonsStore.lessons
    .filter((lesson) => lesson.id && lesson.name) // Filter out invalid lessons
    .map((lesson) => ({
      value: String(lesson.id),
      label: lesson.name,
    })),
  quiz: quizStore.quizzes
    .filter((quiz) => quiz.id && quiz.title) // Filter out invalid quizzes
    .map((quiz) => ({
      value: String(quiz.id),
      label: quiz.title,
    })),
}))

const handleBadgeValidationChange = (validation: BadgeFormValidation) => {
  badgeValidation.value = validation
}

const handleSkillsValidationChange = (validation: SkillsFormValidation) => {
  skillsValidation.value = validation
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

const handleLessonsScrollBottom = async () => {
  // Check if we've reached the last page (pages are 0-based, totalPage is count)
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
    // Filter out duplicates and append new lessons
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
  // Check if we've reached the last page (pages are 0-based, totalPage is count)
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
    // Filter out duplicates and append new quizzes
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

const handleCreate = async () => {
  try {
    // Check if badge should be created
    // Only create badge if at least one field is filled (name, image, or association)
    const hasBadgeName = badgeData.value.name.trim() !== ''
    const hasBadgeImage = badgeData.value.image.length > 0
    const hasBadgeAssociation =
      badgeData.value.associations.fileIds.length > 0 ||
      badgeData.value.associations.courseIds.length > 0 ||
      badgeData.value.associations.lessonIds.length > 0 ||
      badgeData.value.associations.quizIds.length > 0

    const shouldCreateBadge = hasBadgeName || hasBadgeImage || hasBadgeAssociation

    if (shouldCreateBadge) {
      const formData = createBadgeFormData(badgeData.value)
      await badgeAndSkillStore.addNewBadge(formData)
    }

    // Check if skill should be created
    // Only create skill if:
    // - At least one skill name is entered AND at least one association is selected
    const hasValidSkills = skillsData.value.names.some((name) => name.trim() !== '')
    const hasAssociation =
      skillsData.value.associations.fileIds.length > 0 ||
      skillsData.value.associations.courseIds.length > 0 ||
      skillsData.value.associations.lessonIds.length > 0 ||
      skillsData.value.associations.quizIds.length > 0

    if (hasValidSkills && hasAssociation) {
      const skillPayload = createSkillPayload(skillsData.value)
      await badgeAndSkillStore.addNewSkill(skillPayload)
    }

    if (shouldCreateBadge || (hasValidSkills && hasAssociation)) {
      showSuccessScreen.value = true
      return
    }
    handleCancel()
    return
  } catch (error) {
    console.error('Error creating badge/skill:', error)
    // Handle error appropriately
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
    v-if="showSuccessScreen"
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
    v-else
    :title="t('pages.badgeSkills.title')"
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

        <!-- Skills Section -->
        <div class="mt-8">
          <SkillsForm
            v-model="skillsData"
            :association-options="associationOptions"
            @validation-change="handleSkillsValidationChange"
            @scroll-bottom="handleScrollBottom"
            @search="handleSearch"
          />
        </div>
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
          :text="t('pages.badgeSkills.buttons.save')"
          color="primary"
          size="sm"
          variant="default"
          class="max-w-[81px] !font-medium"
          :disabled="!overallValidation.isSaveEnabled"
          @on-click="handleCreate"
        />
      </div>
    </div>
  </BaseSideModal>
</template>
