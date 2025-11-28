<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-1">
      <BaseText
        :text="t('pages.reportBuilder.generateReport.academyFilters.label')"
        color="neutral"
        class="!text-[14px] !leading-[17px] !text-black/85 !font-medium"
      />
      <BaseTooltipIcon
        :text="t('pages.reportBuilder.generateReport.academyFilters.tooltip')"
        class="!m-[-6px]"
        placement="top"
      />
    </div>

    <div class="space-y-4">
      <FilterSelect
        v-for="field in filterFields"
        :key="field.key"
        :label="t(field.labelKey)"
        :placeholder="t(field.placeholderKey)"
        :model-value="modelValue[field.key]"
        :options="field.options"
        :disabled="field.disabled ? isDisabled : !isDisabled"
        @update:model-value="(values: string[]) => handleChange(field.key, values)"
        @scroll-bottom="field.onScroll"
        @on-search="field.onSearch"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { debounce } from 'lodash'
import { BaseText, BaseTooltipIcon } from '@/components/common'
import FilterSelect from './FilterSelect.vue'
import { t } from '@/utils/i18n'
import { useCourseStore } from '@/stores/courseStore'
import { useQuizStore } from '@/stores/QuizStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useBadgeAndSkillStore } from '@/stores/BadgeAndSkill'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import type { AcademyFilters } from '@/types/ReportBuilder'

interface Props {
  modelValue: AcademyFilters
  reportType: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: AcademyFilters]
}>()

// Stores
const courseStore = useCourseStore()
const quizStore = useQuizStore()
const lessonsStore = useLessonsStore()
const badgeAndSkillStore = useBadgeAndSkillStore()
const uploadFilesStore = useUploadFilesStore()

const searchQueries = ref({
  course: '',
  quiz: '',
  lesson: '',
  badge: '',
  skill: '',
  file: '',
})

const isDisabled = computed(() => props.reportType !== 'badgesAndSkills')

// Options
const courseOptions = computed(() =>
  courseStore.courses
    .filter((c) => c.id && c.name)
    .map((c) => ({ value: String(c.id), label: c.name })),
)

const quizOptions = computed(() =>
  quizStore.getQuizzesList
    .filter((q) => q.id && q.title)
    .map((q) => ({ value: String(q.id), label: q.title })),
)

const lessonOptions = computed(() =>
  lessonsStore.lessons
    .filter((l) => l.id && l.name)
    .map((l) => ({ value: String(l.id), label: l.name })),
)

const badgeOptions = computed(() =>
  badgeAndSkillStore.badges
    .filter((b) => b.id && b.name)
    .map((b) => ({ value: String(b.id), label: b.name })),
)

const skillOptions = computed(() =>
  badgeAndSkillStore.skills
    .filter((s) => s.id && s.name)
    .map((s) => ({ value: String(s.id), label: s.name })),
)

const fileOptions = computed(() =>
  uploadFilesStore.allFiles
    .filter((f) => f.id && f.fileName)
    .map((f) => ({ value: String(f.id), label: f.customFileName || f.fileName })),
)

// Handlers
const handleChange = (key: keyof AcademyFilters, values: string[]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: values })
}

// Scroll handlers
const handleCourseScrollBottom = async () => {
  if (
    courseStore.coursesIsLoading ||
    courseStore.coursesCurrentPage >= courseStore.coursesTotalPages
  )
    return
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

const handleQuizScrollBottom = async () => {
  const totalPages = Math.ceil(quizStore.total / quizStore.perPage)
  if (quizStore.page >= totalPages - 1) return
  try {
    await quizStore.fetchQuizzes({
      page: quizStore.page + 1,
      perPage: 8,
      order: 'asc',
      orderColumn: 'title',
      search: searchQueries.value.quiz,
      isAdmin: true,
    })
  } catch (error) {
    console.error('Error loading more quizzes:', error)
  }
}

const handleLessonScrollBottom = async () => {
  const totalPages = Math.ceil(lessonsStore.total / lessonsStore.limit)
  if (lessonsStore.page >= totalPages - 1) return
  try {
    await lessonsStore.fetchLessons({
      page: lessonsStore.page + 1,
      perPage: 8,
      order: 'asc',
      orderColumn: 'name',
      search: searchQueries.value.lesson,
      isAdmin: true,
    })
  } catch (error) {
    console.error('Error loading more lessons:', error)
  }
}

const handleBadgeScrollBottom = async () => {
  if (badgeAndSkillStore.isLoading || badgeAndSkillStore.badgesTotalPages <= 1) return
  try {
    const currentPage = Math.floor(badgeAndSkillStore.badges.length / 8)
    await badgeAndSkillStore.fetchBadges({
      page: currentPage + 1,
      perPage: 8,
      search: searchQueries.value.badge,
      isAdmin: true,
    })
  } catch (error) {
    console.error('Error loading more badges:', error)
  }
}

const handleSkillScrollBottom = async () => {
  if (badgeAndSkillStore.isLoading || badgeAndSkillStore.skillsTotalPages <= 1) return
  try {
    const currentPage = Math.floor(badgeAndSkillStore.skills.length / 8)
    await badgeAndSkillStore.fetchSkills({
      page: currentPage + 1,
      perPage: 8,
      search: searchQueries.value.skill,
      isAdmin: true,
    })
  } catch (error) {
    console.error('Error loading more skills:', error)
  }
}

const handleFileScrollBottom = async () => {
  if (uploadFilesStore.isLoading || uploadFilesStore.currentPage >= uploadFilesStore.totalPages)
    return
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

// Search handlers
const handleCourseSearch = debounce((query: string) => {
  searchQueries.value.course = query
  courseStore.fetchCourses({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'name',
    search: query,
    isAdmin: true,
  })
}, 500)

const handleQuizSearch = debounce((query: string) => {
  searchQueries.value.quiz = query
  quizStore.fetchQuizzes({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'title',
    search: query,
    isAdmin: true,
  })
}, 500)

const handleLessonSearch = debounce((query: string) => {
  searchQueries.value.lesson = query
  lessonsStore.fetchLessons({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'name',
    search: query,
    isAdmin: true,
  })
}, 500)

const handleBadgeSearch = debounce((query: string) => {
  searchQueries.value.badge = query
  badgeAndSkillStore.fetchBadges({ page: 0, perPage: 8, search: query, isAdmin: true })
}, 500)

const handleSkillSearch = debounce((query: string) => {
  searchQueries.value.skill = query
  badgeAndSkillStore.fetchSkills({ page: 0, perPage: 8, search: query, isAdmin: true })
}, 500)

const handleFileSearch = debounce((query: string) => {
  searchQueries.value.file = query
  uploadFilesStore.fetchFiles({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'customFileName',
    search: query,
    isAdmin: true,
  })
}, 500)

// Map report types to their corresponding filter field keys
const reportTypeToFieldKey: Record<string, keyof AcademyFilters> = {
  course: 'courseIds',
  quiz: 'quizIds',
  lessons: 'lessonIds',
  files: 'fileIds',
  badgesAndSkills: 'badgeIds', // For badgesAndSkills, we'll show both badges and skills
}

// All filter fields configuration
const allFilterFields = [
  {
    key: 'courseIds' as keyof AcademyFilters,
    labelKey: 'pages.reportBuilder.generateReport.academyFilters.courses',
    placeholderKey: 'pages.reportBuilder.generateReport.academyFilters.selectCourses',
    options: courseOptions,
    disabled: false,
    onScroll: handleCourseScrollBottom,
    onSearch: handleCourseSearch,
  },
  {
    key: 'quizIds' as keyof AcademyFilters,
    labelKey: 'pages.reportBuilder.generateReport.academyFilters.quizzes',
    placeholderKey: 'pages.reportBuilder.generateReport.academyFilters.selectQuizzes',
    options: quizOptions,
    disabled: false,
    onScroll: handleQuizScrollBottom,
    onSearch: handleQuizSearch,
  },
  {
    key: 'lessonIds' as keyof AcademyFilters,
    labelKey: 'pages.reportBuilder.generateReport.academyFilters.lessons',
    placeholderKey: 'pages.reportBuilder.generateReport.academyFilters.selectLessons',
    options: lessonOptions,
    disabled: false,
    onScroll: handleLessonScrollBottom,
    onSearch: handleLessonSearch,
  },
  {
    key: 'fileIds' as keyof AcademyFilters,
    labelKey: 'pages.reportBuilder.generateReport.academyFilters.files',
    placeholderKey: 'pages.reportBuilder.generateReport.academyFilters.selectFiles',
    options: fileOptions,
    disabled: false,
    onScroll: handleFileScrollBottom,
    onSearch: handleFileSearch,
  },
  {
    key: 'badgeIds' as keyof AcademyFilters,
    labelKey: 'pages.reportBuilder.generateReport.academyFilters.badges',
    placeholderKey: 'pages.reportBuilder.generateReport.academyFilters.selectBadges',
    options: badgeOptions,
    disabled: true,
    onScroll: handleBadgeScrollBottom,
    onSearch: handleBadgeSearch,
  },
  {
    key: 'skillIds' as keyof AcademyFilters,
    labelKey: 'pages.reportBuilder.generateReport.academyFilters.skills',
    placeholderKey: 'pages.reportBuilder.generateReport.academyFilters.selectSkills',
    options: skillOptions,
    disabled: true,
    onScroll: handleSkillScrollBottom,
    onSearch: handleSkillSearch,
  },
]

// Filter fields based on report type
const filterFields = computed(() => {
  if (!props.reportType) return []

  // For badgesAndSkills, show both badges and skills
  if (props.reportType === 'badgesAndSkills') {
    return allFilterFields.filter((field) => field.key === 'badgeIds' || field.key === 'skillIds')
  }

  // For other report types, show only the matching field
  const fieldKey = reportTypeToFieldKey[props.reportType]
  if (!fieldKey) return []

  return allFilterFields.filter((field) => field.key === fieldKey)
})

// Load data based on report type
const loadDataForReportType = async (reportType: string) => {
  const loadPromises: Promise<unknown>[] = []

  switch (reportType) {
    case 'course':
      loadPromises.push(
        courseStore.fetchCourses({
          page: 0,
          perPage: 8,
          order: 'asc',
          orderColumn: 'name',
          isAdmin: true,
        }),
      )
      break
    case 'quiz':
      loadPromises.push(
        quizStore.fetchQuizzes({
          page: 0,
          perPage: 8,
          order: 'asc',
          orderColumn: 'title',
          isAdmin: true,
        }),
      )
      break
    case 'lessons':
      loadPromises.push(
        lessonsStore.fetchLessons({
          page: 0,
          perPage: 8,
          order: 'asc',
          orderColumn: 'name',
          isAdmin: true,
        }),
      )
      break
    case 'files':
      loadPromises.push(
        uploadFilesStore.fetchFiles({
          page: 0,
          perPage: 8,
          order: 'asc',
          orderColumn: 'customFileName',
          isAdmin: true,
        }),
      )
      break
    case 'badgesAndSkills':
      loadPromises.push(
        badgeAndSkillStore.fetchBadges({ page: 0, perPage: 8, isAdmin: true }),
        badgeAndSkillStore.fetchSkills({ page: 0, perPage: 8, isAdmin: true }),
      )
      break
  }

  if (loadPromises.length > 0) {
    await Promise.all(loadPromises)
  }
}

onMounted(async () => {
  if (props.reportType) {
    await loadDataForReportType(props.reportType)
  }
})

// Watch for report type changes and load data accordingly
watch(
  () => props.reportType,
  async (newReportType) => {
    if (newReportType) {
      await loadDataForReportType(newReportType)
    }
  },
)
</script>
