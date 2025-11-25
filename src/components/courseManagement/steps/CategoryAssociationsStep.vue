<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { GroupOptions } from 'sortablejs'
import { VueDraggable } from 'vue-draggable-plus'
import { debounce } from 'lodash'
import { useRouter } from 'vue-router'
import {
  BaseTab,
  BaseText,
  BaseButtonIcon,
  BaseIcon,
  BaseInput,
  BasePopupModal,
  BaseButton,
} from '@/components/common'
import AssociationDetailsExpanded from '@/components/courseCreation/steps/AssociationDetailsExpanded.vue'
import { CreateLessonModal } from '@/components/lessonCreation'
import { QuizCreationModal } from '@/components/quizCreation'
import FileViewerModal from '@/components/modal/FileViewerModal.vue'
import type { Media } from '@/types/Media'
import type { Icons } from '@/types/Styles'
import { t } from '@/utils/i18n'
import CourseService from '@/services/course'
import LessonsService from '@/services/lessons'
import QuizzesService from '@/services/quiz'
import CategoryService from '@/services/category'
import { uploadFilesService } from '@/services/uploadFiles'
import type { CourseItem } from '@/types/Course'
import type { Lesson } from '@/types/Lessons'
import { CourseExecutionType } from '@/types/Course'
import { useCourseStore } from '@/stores/courseStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useQuizStore } from '@/stores/QuizStore'
import type { LessonDetails } from '@/types/Lessons'
import type { QuizInfo } from '@/types/Quiz'

interface Props {
  uploadedFiles?: Media[]
  categoryId?: number
}

const props = withDefaults(defineProps<Props>(), {
  uploadedFiles: () => [],
  categoryId: undefined,
})

const associationTab = ref<'categories' | 'courses' | 'lessons' | 'files' | 'quizzes'>('categories')

const tabs = computed(() => [
  { label: t('pages.course.associations.tabs.categories'), value: 'categories' },
  { label: t('pages.course.associations.tabs.courses'), value: 'courses' },
  { label: t('pages.course.associations.tabs.lessons'), value: 'lessons' },
  { label: t('pages.course.associations.tabs.files'), value: 'files' },
  { label: t('pages.course.associations.tabs.quizzes'), value: 'quizzes' },
])

// Search functionality
const showSearchInput = ref(false)
const searchQuery = ref({ categories: '', courses: '', lessons: '', files: '', quizzes: '' })

type AssociationItem = {
  id: string | number
  type: 'category' | 'course' | 'lesson' | 'file' | 'quiz'
  title: string
  iconBg: string
  iconName: Icons
  iconColor: 'success' | 'primary' | 'error' | 'warning' | 'neutral'
  isNew?: boolean
  sourceList?: 'categories' | 'courses' | 'lessons' | 'files' | 'quizzes'
  thumbUrl?: string
  status?: string
  visibility?: string
  isVisible?: boolean
  // Store original file data for file viewer
  originalFileData?: FileApiItem
}

const leftItems = ref<AssociationItem[]>([])
const leftObjectUrls = ref<string[]>([])

// Right lists populated from API with lazy loading
const rightCategories = ref<AssociationItem[]>([])
const rightCourses = ref<AssociationItem[]>([])
const rightLessons = ref<AssociationItem[]>([])
const rightFiles = ref<AssociationItem[]>([])
const rightQuizzes = ref<AssociationItem[]>([])

// Pagination state per tab
const pages = ref({ categories: 0, courses: 0, lessons: 0, files: 0, quizzes: 0 })
const hasMore = ref({ categories: true, courses: true, lessons: true, files: true, quizzes: true })
const isLoading = ref({
  categories: false,
  courses: false,
  lessons: false,
  files: false,
  quizzes: false,
})
const hasLoaded = ref({
  categories: false,
  courses: false,
  lessons: false,
  files: false,
  quizzes: false,
})

// Expand/collapse state - tracks which item is currently expanded (only one at a time)
const expandedItemId = ref<string | number | null>(null)
const expandedItemType = ref<'category' | 'course' | 'lesson' | 'file' | 'quiz' | null>(null)
const isLoadingParticipants = ref(false)

// Initialize stores
const lessonsStore = useLessonsStore()
const quizStore = useQuizStore()
const courseStore = useCourseStore()
const router = useRouter()

// Modal states for editing
const showLessonEditModal = ref(false)
const showQuizEditModal = ref(false)
const editLessonData = ref<LessonDetails | null>(null)
const editQuizData = ref<QuizInfo | null>(null)

// Confirmation modal state
const showConfirmModal = ref(false)
const pendingViewItem = ref<AssociationItem | null>(null)

// File viewer modal state
const showFileViewer = ref(false)
const selectedFile = ref<Media | null>(null)

const mapCourse = (c: CourseItem): AssociationItem => ({
  id: c.id,
  type: 'course',
  title: c?.name || '-',
  iconBg: 'bg-green-100',
  iconName: 'course',
  iconColor: 'success',
  thumbUrl: c?.imageUrl || undefined,
  status: c?.status,
  visibility: (c as unknown as { visibility?: string })?.visibility,
})

const mapLesson = (l: Lesson): AssociationItem => ({
  id: l.id,
  type: 'lesson',
  title: l?.name || '-',
  iconBg: 'bg-blue-100',
  iconName: 'lesson',
  iconColor: 'primary',
  thumbUrl: l?.imageUrl || undefined,
  status: (l as unknown as { status?: string })?.status,
  visibility: (l as unknown as { visibility?: string })?.visibility,
})

type FileApiItem = {
  id: string
  name?: string
  customFileName?: string
  fileName?: string
  mimeType?: string
  url?: string
  visibility?: string
  status?: string
}

const mapFile = (f: FileApiItem): AssociationItem => ({
  id: f.id,
  type: 'file',
  title: f.customFileName || f.name || f.fileName || '-',
  iconBg: f.mimeType?.startsWith('image') ? 'bg-green-100' : 'bg-red-100',
  iconName: f.mimeType?.startsWith('image') ? 'image' : 'file-outline',
  iconColor: f.mimeType?.startsWith('image') ? 'success' : 'error',
  thumbUrl: f.mimeType?.startsWith('image') && f.url ? f.url : undefined,
  status: f.status,
  visibility: f.visibility,
  originalFileData: f, // Store original file data for file viewer
})

type QuizItem = {
  id: number
  title: string
  imageUrl?: string
  status?: string
}
const mapQuiz = (q: QuizItem): AssociationItem => ({
  id: q.id,
  type: 'quiz',
  title: q.title || '-',
  iconBg: 'bg-blue-100',
  iconName: 'lesson',
  iconColor: 'primary',
  thumbUrl: q.imageUrl || undefined,
  status: q.status?.toLowerCase(),
  visibility: undefined,
})

type CategoryApiItem = {
  id: string | number
  name?: string
  visibility?: string
  status?: string
  isVisible?: boolean
}

const mapCategory = (c: CategoryApiItem): AssociationItem => ({
  id: c.id,
  type: 'category',
  title: c.name || '-',
  iconBg: 'bg-purple-100',
  iconName: 'grid',
  iconColor: 'neutral',
  status: c.status,
  visibility: c.visibility,
  isVisible: c.isVisible ?? true,
})

const loadCategories = async (reset = false) => {
  if (isLoading.value.categories || (!reset && !hasMore.value.categories)) return
  isLoading.value.categories = true
  try {
    if (reset) {
      pages.value.categories = 0
      rightCategories.value = []
      hasMore.value.categories = true
    }
    const next = pages.value.categories
    const search = searchQuery.value.categories.trim()
    const res = await CategoryService.getCategories({
      page: next,
      perPage: 10,
      isAdmin: true,
      ...(search ? { search } : {}),
    })
    const items = Array.isArray(res?.data) ? res.data : res?.data?.content || []
    const leftIds = new Set(leftItems.value.map((item) => item.id))
    // Filter out items that are already in leftItems
    const newItems = items.map(mapCategory).filter((item: AssociationItem) => !leftIds.has(item.id))
    rightCategories.value = reset ? newItems : [...rightCategories.value, ...newItems]
    pages.value.categories = next + 1
    hasMore.value.categories = items.length >= 10
  } catch (error) {
    console.error('Error loading categories:', error)
  } finally {
    isLoading.value.categories = false
    hasLoaded.value.categories = true
  }
}

const loadCourses = async (reset = false) => {
  if (isLoading.value.courses || (!reset && !hasMore.value.courses)) return
  isLoading.value.courses = true
  try {
    if (reset) {
      pages.value.courses = 0
      rightCourses.value = []
      hasMore.value.courses = true
    }
    const next = pages.value.courses
    const search = searchQuery.value.courses.trim()
    const res = await CourseService.getCourses({
      page: next,
      perPage: 10,
      isAdmin: true,
      ...(search ? { search } : {}),
    })
    const items = Array.isArray(res?.data) ? res.data : res?.data?.content || []
    const leftIds = new Set(leftItems.value.map((item) => item.id))
    // Filter out items that are already in leftItems and the current category
    const newItems = items
      .filter((item: CourseItem) => item.id.toString() !== (props.categoryId?.toString() as string))
      .map(mapCourse)
      .filter((item: AssociationItem) => !leftIds.has(item.id))
    rightCourses.value = reset ? newItems : [...rightCourses.value, ...newItems]
    pages.value.courses = next + 1
    hasMore.value.courses = items.length >= 10
  } catch (error) {
    console.error('Error loading courses:', error)
  } finally {
    isLoading.value.courses = false
    hasLoaded.value.courses = true
  }
}

const loadLessons = async (reset = false) => {
  if (isLoading.value.lessons || (!reset && !hasMore.value.lessons)) return
  isLoading.value.lessons = true
  try {
    if (reset) {
      pages.value.lessons = 0
      rightLessons.value = []
      hasMore.value.lessons = true
    }
    const next = pages.value.lessons
    const search = searchQuery.value.lessons.trim()
    const res = await LessonsService.getLessons({
      page: next,
      perPage: 10,
      isAdmin: true,
      ...(search ? { search } : {}),
    })
    const items = Array.isArray(res?.data) ? res.data : res?.data?.content || res || []
    const leftIds = new Set(leftItems.value.map((item) => item.id))
    // Filter out items that are already in leftItems
    const newItems = items.map(mapLesson).filter((item: AssociationItem) => !leftIds.has(item.id))
    rightLessons.value = reset ? newItems : [...rightLessons.value, ...newItems]
    pages.value.lessons = next + 1
    hasMore.value.lessons = items.length >= 10
  } catch (error) {
    console.error('Error loading lessons:', error)
  } finally {
    isLoading.value.lessons = false
    hasLoaded.value.lessons = true
  }
}

const loadFiles = async (reset = false) => {
  if (isLoading.value.files || (!reset && !hasMore.value.files)) return
  isLoading.value.files = true
  try {
    if (reset) {
      pages.value.files = 0
      rightFiles.value = []
      hasMore.value.files = true
    }
    const next = pages.value.files
    const search = searchQuery.value.files.trim()
    const res = await uploadFilesService.getFiles({
      page: next,
      perPage: 10,
      ...(search ? { search } : {}),
    })
    const items = Array.isArray(res?.data) ? res.data : res?.data?.content || res || []
    const leftIds = new Set(leftItems.value.map((item) => item.id))
    // Filter out items that are already in leftItems
    const newItems = items.map(mapFile).filter((item: AssociationItem) => !leftIds.has(item.id))
    rightFiles.value = reset ? newItems : [...rightFiles.value, ...newItems]
    pages.value.files = next + 1
    hasMore.value.files = items.length >= 10
  } catch (error) {
    console.error('Error loading files:', error)
  } finally {
    isLoading.value.files = false
    hasLoaded.value.files = true
  }
}

const loadQuizzes = async (reset = false) => {
  if (isLoading.value.quizzes || (!reset && !hasMore.value.quizzes)) return
  isLoading.value.quizzes = true
  try {
    if (reset) {
      pages.value.quizzes = 0
      rightQuizzes.value = []
      hasMore.value.quizzes = true
    }
    const next = pages.value.quizzes
    const search = searchQuery.value.quizzes.trim()
    const res = await QuizzesService.getQuizzes({
      page: next,
      perPage: 10,
      isAdmin: true,
      ...(search ? { search } : {}),
    })
    const items = Array.isArray(res?.data) ? res.data : res?.data?.content || res || []
    const leftIds = new Set(leftItems.value.map((item) => item.id))
    // Filter out items that are already in leftItems
    const newItems = items.map(mapQuiz).filter((item: AssociationItem) => !leftIds.has(item.id))

    rightQuizzes.value = reset ? newItems : [...rightQuizzes.value, ...newItems]
    pages.value.quizzes = next + 1
    hasMore.value.quizzes = items.length >= 10
  } catch (error) {
    console.error('Error loading quizzes:', error)
  } finally {
    isLoading.value.quizzes = false
    hasLoaded.value.quizzes = true
  }
}

// Computed property for current search query
const currentSearchQuery = computed({
  get: () => searchQuery.value[associationTab.value],
  set: (value: string) => {
    searchQuery.value[associationTab.value] = value
  },
})

// Toggle search input visibility
const toggleSearch = async () => {
  showSearchInput.value = !showSearchInput.value
}

// Debounced search function
const debouncedSearch = debounce(async () => {
  switch (associationTab.value) {
    case 'categories':
      await loadCategories(true)
      break
    case 'courses':
      await loadCourses(true)
      break
    case 'lessons':
      await loadLessons(true)
      break
    case 'files':
      await loadFiles(true)
      break
    case 'quizzes':
      await loadQuizzes(true)
      break
  }
}, 500)

// Watch for search query changes
watch(
  () => currentSearchQuery.value,
  () => {
    if (showSearchInput.value) {
      debouncedSearch()
    }
  },
)

// Initial load for default tab
watch(
  () => associationTab.value,
  async (tab) => {
    // Load data for the tab
    // If there's a search query, it will be applied via the load function
    const hasSearch = searchQuery.value[tab].trim().length > 0
    if (tab === 'categories') {
      if (rightCategories.value.length === 0 || hasSearch) await loadCategories(hasSearch)
    }
    if (tab === 'courses') {
      if (rightCourses.value.length === 0 || hasSearch) await loadCourses(hasSearch)
    }
    if (tab === 'lessons') {
      if (rightLessons.value.length === 0 || hasSearch) await loadLessons(hasSearch)
    }
    if (tab === 'files') {
      if (rightFiles.value.length === 0 || hasSearch) await loadFiles(hasSearch)
    }
    if (tab === 'quizzes') {
      if (rightQuizzes.value.length === 0 || hasSearch) await loadQuizzes(hasSearch)
    }
  },
  { immediate: true },
)

// Map uploadedFiles into left section initially
type MaybeFile = Media & {
  lastModified?: number
  name?: string
  fileName?: string
  uuid?: string
  id?: string | number
  type?: string
  url?: string
}

const mapFileToItem = (f: Media, idx: number): AssociationItem => {
  const anyFile = f as MaybeFile
  const id = idx

  let thumbUrl: string | undefined
  if (anyFile.url && typeof anyFile.url === 'string') {
    thumbUrl = anyFile.url
  } else if (anyFile.type && typeof anyFile.type === 'string' && anyFile.type.startsWith('image')) {
    try {
      const blobUrl = URL.createObjectURL(f as unknown as File)
      leftObjectUrls.value.push(blobUrl)
      thumbUrl = blobUrl
    } catch {
      thumbUrl = undefined
    }
  }

  return {
    id,
    type: 'file',
    title: (anyFile.name || anyFile.fileName || '-') as string,
    iconBg: 'bg-neutral-100',
    iconName:
      anyFile.type && typeof anyFile.type === 'string' && anyFile.type.startsWith('image')
        ? 'image'
        : 'file-outline',
    iconColor: 'neutral',
    isNew: true,
    sourceList: 'files',
    thumbUrl,
  }
}

// Initialize/append left items when prop changes
watch(
  () => props.uploadedFiles,
  (files: Media[] | undefined) => {
    leftObjectUrls.value.forEach((u) => URL.revokeObjectURL(u))
    leftObjectUrls.value = []
    const incoming = files || []
    const mappedIncoming = incoming.map((f, i) => mapFileToItem(f, i))

    const incomingTitles = new Set(
      incoming.map((f) => {
        const anyFile = f as MaybeFile
        return (anyFile.name || anyFile.fileName || '') as string
      }),
    )

    const nonFileItems = leftItems.value.filter((li) => li.type !== 'file')
    const stillPresentFiles = leftItems.value
      .filter((li) => li.type === 'file')
      .filter((li) => incomingTitles.has(li.title))

    const existingTitles = new Set(stillPresentFiles.map((li) => li.title))
    const newFiles = mappedIncoming.filter((mi) => !existingTitles.has(mi.title))

    leftItems.value = [...nonFileItems, ...stillPresentFiles, ...newFiles]
  },
  { immediate: true, deep: true },
)

// Drag-and-drop behavior: left cannot pull out; right items move to left (not clone)
const leftGroup: GroupOptions = { name: 'associations', pull: false, put: true }
const rightGroup: GroupOptions = { name: 'associations', pull: true, put: false }

// Get left items IDs for filtering
const leftItemsIds = computed(() => new Set(leftItems.value.map((item) => item.id)))

// Single reactive binding for the right column based on active tab
// Filter out items that are already in the left side
const rightList = computed<AssociationItem[]>({
  get() {
    let list: AssociationItem[] = []
    switch (associationTab.value) {
      case 'categories':
        list = rightCategories.value
        break
      case 'courses':
        list = rightCourses.value
        break
      case 'lessons':
        list = rightLessons.value
        break
      case 'files':
        list = rightFiles.value
        break
      case 'quizzes':
        list = rightQuizzes.value
        break
      default:
        return []
    }
    // Filter out items that are already in leftItems
    return list.filter((item) => !leftItemsIds.value.has(item.id))
  },
  set(newVal: AssociationItem[]) {
    // When setting (from VueDraggable), update the underlying array
    // The newVal is already filtered (doesn't contain leftItems), so we just update directly
    switch (associationTab.value) {
      case 'categories':
        rightCategories.value = newVal
        break
      case 'courses':
        rightCourses.value = newVal
        break
      case 'lessons':
        rightLessons.value = newVal
        break
      case 'files':
        rightFiles.value = newVal
        break
      case 'quizzes':
        rightQuizzes.value = newVal
        break
    }
  },
})

const moveItemUp = (index: number) => {
  if (index <= 0) return
  const items = leftItems.value
  const prev = items[index - 1] as AssociationItem
  const curr = items[index] as AssociationItem
  items[index - 1] = curr
  items[index] = prev
}

const moveItemDown = (index: number) => {
  const items = leftItems.value
  if (index >= items.length - 1) return
  const next = items[index + 1] as AssociationItem
  const curr = items[index] as AssociationItem
  items[index + 1] = curr
  items[index] = next
}

const removeFromLeft = (index: number) => {
  const items = leftItems.value
  const removed = items.splice(index, 1)[0]
  if (!removed) return

  // Don't return newly uploaded files (with isNew flag) to the right list
  // as they were never in the right list to begin with
  if (removed.isNew) return

  // Return the item to its respective right list at the top for visibility
  // Only add if it's not already in the list (to avoid duplicates)
  switch (removed.type) {
    case 'category':
      if (!rightCategories.value.some((item) => item.id === removed.id)) {
        rightCategories.value = [removed, ...rightCategories.value]
      }
      break
    case 'course':
      if (!rightCourses.value.some((item) => item.id === removed.id)) {
        rightCourses.value = [removed, ...rightCourses.value]
      }
      break
    case 'lesson':
      if (!rightLessons.value.some((item) => item.id === removed.id)) {
        rightLessons.value = [removed, ...rightLessons.value]
      }
      break
    case 'file':
      if (!rightFiles.value.some((item) => item.id === removed.id)) {
        rightFiles.value = [removed, ...rightFiles.value]
      }
      break
    case 'quiz':
      if (!rightQuizzes.value.some((item) => item.id === removed.id)) {
        rightQuizzes.value = [removed, ...rightQuizzes.value]
      }
      break
  }
}

// Handle drag-and-drop add event to prevent duplicates
const onDragAdd = () => {
  // Use setTimeout to ensure leftItems is updated after drag
  setTimeout(() => {
    // Remove duplicates from left items
    const seen = new Set<string | number>()
    const uniqueItems: AssociationItem[] = []

    for (const item of leftItems.value) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        uniqueItems.push(item)
      }
    }

    // If duplicates were found, update the list
    if (uniqueItems.length !== leftItems.value.length) {
      leftItems.value = uniqueItems
    }

    // Remove dragged items from the right list (update the underlying arrays)
    const leftIds = new Set(leftItems.value.map((item) => item.id))
    rightCategories.value = rightCategories.value.filter((item) => !leftIds.has(item.id))
    rightCourses.value = rightCourses.value.filter((item) => !leftIds.has(item.id))
    rightLessons.value = rightLessons.value.filter((item) => !leftIds.has(item.id))
    rightFiles.value = rightFiles.value.filter((item) => !leftIds.has(item.id))
    rightQuizzes.value = rightQuizzes.value.filter((item) => !leftIds.has(item.id))
  }, 10)
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    category: 'Category',
    course: 'Course',
    lesson: 'Lesson',
    file: 'File',
    quiz: 'Quiz',
  }
  return labels[type] || type
}

const loadingMessage = computed(() => {
  switch (associationTab.value) {
    case 'categories':
      return t('types.loading.fetchingCategoriesForAssociation')
    case 'courses':
      return t('types.loading.fetchingCourses')
    case 'lessons':
      return t('types.loading.fetchingLessons')
    case 'files':
      return t('types.loading.fetchingFiles')
    case 'quizzes':
      return t('types.loading.fetchingQuizzes')
    default:
      return t('types.loading.fetchingCourses')
  }
})

const notFoundMessage = computed(() => {
  switch (associationTab.value) {
    case 'categories':
      return t('types.error.noCategoriesFound')
    case 'courses':
      return t('types.error.noCoursesFound')
    case 'lessons':
      return t('types.error.noLessonsFound')
    case 'files':
      return t('types.error.noFilesFound')
    case 'quizzes':
      return t('types.error.noQuizzesFound')
    default:
      return t('types.error.noDataFound')
  }
})

const isCurrentTabLoading = computed(() => {
  switch (associationTab.value) {
    case 'categories':
      return isLoading.value.categories
    case 'courses':
      return isLoading.value.courses
    case 'lessons':
      return isLoading.value.lessons
    case 'files':
      return isLoading.value.files
    case 'quizzes':
      return isLoading.value.quizzes
    default:
      return false
  }
})

const showNoDataMessage = computed(() => {
  switch (associationTab.value) {
    case 'categories':
      return hasLoaded.value.categories && rightCategories.value.length === 0
    case 'courses':
      return hasLoaded.value.courses && rightCourses.value.length === 0
    case 'lessons':
      return hasLoaded.value.lessons && rightLessons.value.length === 0
    case 'files':
      return hasLoaded.value.files && rightFiles.value.length === 0
    case 'quizzes':
      return hasLoaded.value.quizzes && rightQuizzes.value.length === 0
    default:
      return false
  }
})

const onRightScroll = async (e: Event) => {
  const target = e.target as HTMLElement
  if (!target) return
  const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80
  if (!nearBottom) return
  if (associationTab.value === 'categories') await loadCategories(false)
  if (associationTab.value === 'courses') await loadCourses(false)
  if (associationTab.value === 'lessons') await loadLessons(false)
  if (associationTab.value === 'files') await loadFiles(false)
  if (associationTab.value === 'quizzes') await loadQuizzes(false)
}

// Toggle expand/collapse for an item (accordion behavior - only one at a time)
const toggleExpanded = async (
  itemId: string | number,
  itemType: 'category' | 'course' | 'lesson' | 'file' | 'quiz',
) => {
  // If clicking on already expanded item, collapse it
  if (expandedItemId.value === itemId) {
    expandedItemId.value = null
    expandedItemType.value = null
    return
  }

  // Close previously expanded item and open the new one
  expandedItemId.value = itemId
  expandedItemType.value = itemType

  // Fetch participants data based on item type
  if (itemType === 'lesson' || itemType === 'quiz' || itemType === 'course') {
    isLoadingParticipants.value = true
    try {
      let type: CourseExecutionType
      if (itemType === 'lesson') type = CourseExecutionType.LESSON
      else if (itemType === 'quiz') type = CourseExecutionType.QUIZ
      else if (itemType === 'course') type = CourseExecutionType.COURSE
      else throw new Error('Invalid itemType for participants fetch')
      await courseStore.fetchCourseParticipants(Number(itemId), type, { page: 0, perPage: 5 })
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      isLoadingParticipants.value = false
    }
  }
  // TODO: Add logic for file and category types when API is available
}

// Handle pagination change for association details
const handlePageChange = async (page: number) => {
  if (!expandedItemId.value || !expandedItemType.value) return

  const itemType = expandedItemType.value
  const itemId = expandedItemId.value

  // Fetch participants data based on item type with new page
  if (itemType === 'course' || itemType === 'lesson' || itemType === 'quiz') {
    isLoadingParticipants.value = true
    try {
      let type: CourseExecutionType
      if (itemType === 'lesson') type = CourseExecutionType.LESSON
      else if (itemType === 'quiz') type = CourseExecutionType.QUIZ
      else if (itemType === 'course') type = CourseExecutionType.COURSE
      else throw new Error('Invalid itemType for participants fetch')
      await courseStore.fetchCourseParticipants(Number(itemId), type, { page, perPage: 5 })
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      isLoadingParticipants.value = false
    }
  }
}

// Check if an item is expanded
const isExpanded = (itemId: string | number) => {
  return expandedItemId.value === itemId
}

// Handle edit button click
const handleEdit = async (
  itemId: string | number,
  itemTitle: string,
  itemType: 'course' | 'lesson' | 'quiz',
) => {
  const confirmed = window.confirm(t('pages.course.associations.details.confirmEdit'))
  if (!confirmed) return

  try {
    const id = Number(itemId)

    if (itemType === 'lesson') {
      // Fetch lesson details and open lesson edit modal
      await lessonsStore.fetchLessonById(id, true)
      editLessonData.value = lessonsStore.lessonDetails
      showLessonEditModal.value = true
    } else if (itemType === 'quiz') {
      // Fetch quiz details and open quiz edit modal
      await quizStore.fetchQuizInfo(id, true)
      editQuizData.value = quizStore.quizInfo
      showQuizEditModal.value = true
    }
  } catch (error) {
    console.error('Error fetching item details for editing:', error)
  }
}

// Handle modal close events
const handleCloseLessonModal = () => {
  // Clear the edit lesson data first to trigger cleanup
  editLessonData.value = null
  // Use nextTick to ensure the modal has time to clean up before closing
  nextTick(() => {
    showLessonEditModal.value = false
  })
}

const handleCloseQuizModal = () => {
  showQuizEditModal.value = false
  editQuizData.value = null
}

// Handle view button click - show confirmation modal first
const handleView = (item: AssociationItem) => {
  pendingViewItem.value = item
  showConfirmModal.value = true
}

// Handle confirmation modal confirm
const handleConfirmView = () => {
  if (!pendingViewItem.value) return

  const item = pendingViewItem.value
  showConfirmModal.value = false

  if (item.type === 'file') {
    // Find file in rightFiles or leftItems to get full file data
    let fileData: FileApiItem | null = null

    // Check in rightFiles first
    const rightFile = rightFiles.value.find((f) => f.id === item.id)
    if (rightFile?.originalFileData) {
      fileData = rightFile.originalFileData
    } else if (rightFile) {
      // Fallback: construct from available data
      fileData = {
        id: String(rightFile.id),
        name: rightFile.title,
        fileName: rightFile.title,
        mimeType: undefined,
        url: rightFile.thumbUrl,
      } as unknown as FileApiItem
    } else {
      // Check in leftItems
      const leftFile = leftItems.value.find((f) => f.id === item.id && f.type === 'file')
      if (leftFile?.originalFileData) {
        fileData = leftFile.originalFileData
      } else if (leftFile) {
        // Fallback: construct from available data
        fileData = {
          id: String(leftFile.id),
          name: leftFile.title,
          fileName: leftFile.title,
          mimeType: undefined,
          url: leftFile.thumbUrl,
        } as unknown as FileApiItem
      }
    }

    // If we found file data, construct Media object and show FileViewerModal
    if (fileData) {
      const fileId = typeof fileData.id === 'string' ? parseInt(fileData.id, 10) : fileData.id
      const mediaFile: Media = {
        id: fileId,
        uuid: String(fileId),
        name: fileData.fileName || fileData.name || '',
        fileName: fileData.fileName || fileData.name || '',
        mimeType: fileData.mimeType || '',
        url: fileData.url || `/api/files/${fileId}/download`,
        size: 0, // Size not available from listing
        createdAt: '',
        updatedAt: '',
        collectionName: '',
      } as Media

      selectedFile.value = mediaFile
      showFileViewer.value = true
    } else {
      // Fallback: try to get file from API if not found in listing
      // This should rarely happen, but handle it gracefully
      console.warn('File not found in listing, attempting to fetch from API')
      // For now, we'll just show an error or skip
      // In a production app, you might want to fetch the file details here
    }
  } else if (item.type === 'course') {
    router.push(`/admin/course/${item.id}`)
  } else if (item.type === 'lesson') {
    router.push(`/admin/lessons/${item.id}`)
  } else if (item.type === 'quiz') {
    router.push(`/admin/quiz/${item.id}`)
  } else if (item.type === 'category') {
    router.push(`/category/${item.id}`)
  }

  pendingViewItem.value = null
}

// Handle confirmation modal cancel
const handleCancelView = () => {
  showConfirmModal.value = false
  pendingViewItem.value = null
}

// Handle file viewer close
const handleFileViewerClose = () => {
  showFileViewer.value = false
  selectedFile.value = null
}

// Expose getter so parent can collect selected associations
defineExpose({
  getAssociations: () => ({
    leftItems: leftItems.value,
  }),
  setLeftItems: (items: AssociationItem[]) => {
    leftItems.value = Array.isArray(items) ? items : []
  },
})
</script>

<template>
  <div class="w-full">
    <!-- Header: 2-column grid layout -->
    <div class="px-2 py-4 border-b border-neutral-200 bg-white lg:px-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left Column: Title -->
        <div class="flex items-center">
          <BaseText
            :text="t('pages.category.associations.thisCategory')"
            :tone="900"
            color="neutral"
            font="semibold"
            type="p-lg"
          />
        </div>
        <!-- Right Column: Tabs + Search Icon -->
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <BaseTab :tabs="tabs" v-model="associationTab" />
          </div>
          <BaseButtonIcon
            icon="search"
            color="neutral"
            variant="outline-light"
            size="sm"
            @onClick="toggleSearch"
          />
        </div>
      </div>
      <!-- Search Input - Only in right column (col-span-1) -->
      <div v-if="showSearchInput" class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
        <div></div>
        <div class="lg:col-span-1">
          <BaseInput
            v-model="currentSearchQuery"
            type="text"
            :placeholder="t('pages.common.search') || 'Search'"
            class="w-full"
            iconName="search"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-250px)]">
      <!-- Left: This category items -->
      <div class="lg:col-span-1 h-full flex flex-col lg:pr-5 pt-4">
        <div class="flex-1 overflow-y-auto no-scrollbar">
          <VueDraggable
            v-model="leftItems"
            :group="leftGroup"
            class="space-y-[12px] w-full h-full min-h-full"
            @add="onDragAdd"
          >
            <div
              v-if="leftItems.length === 0"
              class="w-full h-full min-h-[200px] rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center"
            >
              <BaseText
                :text="t('pages.uploadedFiles.noFilesUploaded')"
                :tone="500"
                color="neutral"
                type="p-sm"
              />
            </div>
            <div
              v-for="(element, index) in leftItems"
              :key="element.id"
              class="border border-neutral-200 rounded-lg p-4 min-h-[66px] flex items-center justify-between bg-white"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <template v-if="element.thumbUrl">
                  <img :src="element.thumbUrl" class="w-6 h-6 rounded object-cover flex-shrink-0" />
                </template>
                <template v-else>
                  <div
                    class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                    :class="element.iconBg"
                  >
                    <BaseIcon :name="element.iconName" size="xs" :color="element.iconColor" />
                  </div>
                </template>
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <BaseText
                    :text="element.title || '-'"
                    :tone="800"
                    color="neutral"
                    type="p-sm"
                    class="truncate"
                  />
                  <!-- Type Badge -->
                  <BaseText
                    v-if="element.type && element.type !== 'file'"
                    :text="getTypeLabel(element.type)"
                    type="p-xs"
                    class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0"
                  />
                  <!-- Status Badges -->
                  <BaseText
                    v-if="element.visibility === 'maintenance'"
                    :text="'Maintenance'"
                    type="p-xs"
                    class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex-shrink-0"
                  />
                  <BaseText
                    v-if="element.visibility === 'hide' || element.visibility === 'hidden'"
                    :text="'Hidden'"
                    type="p-xs"
                    class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex-shrink-0"
                  />
                  <BaseText
                    v-if="element.status === 'expired'"
                    :text="'Expired'"
                    type="p-xs"
                    class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0"
                  />
                  <BaseText
                    v-if="element.isNew"
                    :text="'New'"
                    type="p-xs"
                    class="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 flex-shrink-0"
                  />
                </div>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <BaseButtonIcon
                  icon="arrow-up"
                  color="neutral"
                  variant="outline-light"
                  size="xs"
                  @onClick="() => moveItemUp(index)"
                />
                <BaseButtonIcon
                  icon="arrow-down"
                  color="neutral"
                  variant="outline-light"
                  size="xs"
                  @onClick="() => moveItemDown(index)"
                />
                <BaseButtonIcon
                  v-if="element.type === 'lesson' || element.type === 'quiz'"
                  icon="edit"
                  color="neutral"
                  variant="outline-light"
                  size="xs"
                  :disabled="
                    element.type === 'lesson' &&
                    !(
                      element.visibility === 'maintenance' ||
                      element.visibility === 'hide' ||
                      element.visibility === 'hidden'
                    )
                  "
                  @onClick="
                    () => handleEdit(element.id, element.title, element.type as 'lesson' | 'quiz')
                  "
                />
                <BaseButtonIcon
                  v-if="
                    element.type === 'category' ||
                    element.type === 'course' ||
                    element.type === 'lesson' ||
                    element.type === 'file' ||
                    element.type === 'quiz'
                  "
                  icon="eye"
                  color="neutral"
                  variant="outline-light"
                  size="xs"
                  @onClick="() => handleView(element as AssociationItem)"
                />
                <BaseButtonIcon
                  icon="delete-outline"
                  color="error"
                  variant="outline-light"
                  size="xs"
                  @onClick="() => removeFromLeft(index)"
                />
              </div>
            </div>
          </VueDraggable>
        </div>
      </div>

      <!-- Right: Association content area -->
      <div
        class="lg:col-span-1 lg:border-l lg:border-neutral-200 lg:pl-5 pt-4 h-full overflow-y-auto no-scrollbar"
        @scroll.passive="onRightScroll"
      >
        <div class="space-y-3">
          <VueDraggable v-model="rightList" :group="rightGroup" class="space-y-3">
            <div v-for="element in rightList" :key="element.id" class="space-y-3">
              <!-- Item Header - Category (Simplified) -->
              <div
                v-if="element.type === 'category'"
                class="bg-white rounded-lg p-4 min-h-[56px] flex items-center justify-between border border-neutral-200"
              >
                <div class="flex items-center gap-3">
                  <BaseButtonIcon
                    icon="arrow-move"
                    color="neutral"
                    variant="blank"
                    size="xs"
                    noButton
                  />
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    :class="element.iconBg"
                  >
                    <BaseIcon :name="element.iconName" size="sm" :color="element.iconColor" />
                  </div>
                  <BaseText :text="element.title || '-'" type="p-sm" :tone="900" color="neutral" />
                </div>
                <div class="flex items-center gap-2">
                  <BaseButtonIcon
                    :icon="element.isVisible ? 'eye' : 'eye-off'"
                    color="neutral"
                    variant="outline-light"
                    size="xs"
                    @onClick="() => console.log('Toggle visibility for category:', element.id)"
                  />
                  <BaseButtonIcon
                    icon="edit"
                    color="neutral"
                    variant="outline-light"
                    size="xs"
                    @onClick="() => console.log('Edit category:', element.id, element.title)"
                  />
                </div>
              </div>

              <!-- Item Header - Other Types (Full) -->
              <div
                v-else
                class="bg-white rounded-lg p-4 min-h-[56px] flex items-center justify-between border border-neutral-200"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <BaseButtonIcon
                    icon="arrow-move"
                    color="neutral"
                    variant="blank"
                    size="xs"
                    noButton
                  />
                  <template v-if="element.thumbUrl">
                    <img
                      :src="element.thumbUrl"
                      class="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                  </template>
                  <template v-else>
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      :class="element.iconBg"
                    >
                      <BaseIcon :name="element.iconName" size="sm" :color="element.iconColor" />
                    </div>
                  </template>
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <BaseText
                      :text="element.title || '-'"
                      type="p-sm"
                      :tone="900"
                      color="neutral"
                      class="truncate"
                    />
                    <!-- Status Badges -->
                    <BaseText
                      v-if="element.visibility === 'maintenance'"
                      :text="'Maintenance'"
                      type="p-xs"
                      class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex-shrink-0"
                    />
                    <BaseText
                      v-if="element.visibility === 'hide' || element.visibility === 'hidden'"
                      :text="'Hidden'"
                      type="p-xs"
                      class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex-shrink-0"
                    />
                    <BaseText
                      v-if="element.status === 'expired'"
                      :text="'Expired'"
                      type="p-xs"
                      class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0"
                    />
                  </div>
                </div>
                <div
                  class="flex items-center gap-2 flex-shrink-0"
                  v-if="
                    element.type == 'course' || element.type == 'lesson' || element.type == 'quiz'
                  "
                >
                  <BaseButtonIcon
                    :icon="isExpanded(element.id) ? 'chevron-up' : 'chevron-down'"
                    color="neutral"
                    variant="blank"
                    size="xs"
                    @onClick="() => toggleExpanded(element.id, element.type)"
                  />
                  <BaseButtonIcon
                    icon="edit"
                    color="neutral"
                    variant="outline-light"
                    size="xs"
                    :disabled="
                      element.type === 'lesson' ||
                      element.type === 'quiz' ||
                      (element.type === 'course' &&
                        !(
                          element.visibility === 'maintenance' ||
                          element.visibility === 'hide' ||
                          element.visibility === 'hidden'
                        ))
                    "
                    @onClick="
                      () => handleEdit(element.id, element.title, element.type as 'lesson' | 'quiz')
                    "
                  />
                </div>
              </div>

              <!-- Expanded Details (Only for non-category items) -->
              <div v-if="element.type !== 'category' && isExpanded(element.id)">
                <AssociationDetailsExpanded
                  :association-id="element.id"
                  :association-type="element.type"
                  :association-title="element.title"
                  :is-loading="isLoadingParticipants"
                  :participants-data="courseStore.courseParticipants"
                  :progress-data="courseStore.courseParticipants"
                  :course-participants-current-page="courseStore.courseParticipantsCurrentPage"
                  :course-participants-per-page="courseStore.courseParticipantsPerPage"
                  :course-participants-total="courseStore.courseParticipantsTotal"
                  :show-participants-tab="element.type !== 'quiz'"
                  @page-change="handlePageChange"
                />
              </div>
            </div>
          </VueDraggable>

          <!-- Loading state -->
          <div v-if="isCurrentTabLoading" class="py-8 text-center">
            <BaseText :text="loadingMessage" :tone="500" color="neutral" type="p-sm" />
          </div>

          <!-- No data found state -->
          <div v-else-if="showNoDataMessage" class="py-8 text-center">
            <div class="flex flex-col items-center justify-center gap-3">
              <BaseIcon name="inbox" size="lg" color="neutral" :tone="300" />
              <BaseText :text="notFoundMessage" :tone="500" color="neutral" type="p-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <CreateLessonModal
      v-if="showLessonEditModal"
      :show="showLessonEditModal"
      :edit-lesson="editLessonData"
      @close="handleCloseLessonModal"
    />
    <QuizCreationModal
      v-if="showQuizEditModal"
      :show="showQuizEditModal"
      :quiz-id="editQuizData?.id"
      @close="handleCloseQuizModal"
    />

    <!-- Confirmation Modal -->
    <BasePopupModal
      v-if="showConfirmModal"
      width="400px"
      max-width="90vw"
      title="academy.hekanize.com says"
      :isHeader="true"
      @onClose="handleCancelView"
    >
      <div class="p-6">
        <BaseText
          :text="t('pages.course.associations.details.confirmEdit')"
          color="neutral"
          :tone="700"
          type="p-md"
          class="mb-6"
        />
        <div class="flex justify-end gap-3">
          <BaseButton
            text="Cancel"
            color="primary"
            variant="link"
            size="sm"
            @on-click="handleCancelView"
          />
          <BaseButton
            text="OK"
            color="primary"
            variant="default"
            size="sm"
            @on-click="handleConfirmView"
          />
        </div>
      </div>
    </BasePopupModal>

    <!-- File Viewer Modal -->
    <FileViewerModal
      v-if="showFileViewer && selectedFile"
      :isOpen="showFileViewer"
      :file="selectedFile"
      @close="handleFileViewerClose"
    />
  </div>
</template>
