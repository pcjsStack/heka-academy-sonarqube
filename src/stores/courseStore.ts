import { defineStore } from 'pinia'
import CourseService from '@/services/course'
import TimerService from '@/services/timerService'
import { useToaster } from '@/composables/useToaster'
import type {
  CourseDetails,
  CourseItem,
  GetCoursesParams,
  CourseExecution,
  NavigationHistoryType,
  CourseParticipants,
  VisibilityStatus,
  VisibilityType,
} from '@/types/Course'
import { CourseExecutionType } from '@/types/Course'
import { t } from '@/utils/i18n'
import { ExecutionStatus, type GlobalParams } from '@/types/GlobalTypes'

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [] as CourseItem[],
    coursesTotal: 0,
    coursesTotalPages: 0,
    coursesCurrentPage: 0,
    coursesIsLoading: false,
    courseDetails: null as CourseDetails | null,
    navigationHistory: null as NavigationHistoryType | null,
    courseParticipants: [] as CourseParticipants[],
    courseParticipantsTotal: 0,
    courseParticipantsCurrentPage: 0,
    courseParticipantsPerPage: 5,
  }),
  actions: {
    async fetchCourses(params?: GetCoursesParams, append = false) {
      const { showToast } = useToaster()
      try {
        this.coursesIsLoading = true
        const response = await CourseService.getCourses(params || { page: 0 })

        if (append) {
          this.courses = [...this.courses, ...response.data]
        } else {
          this.courses = response.data
        }

        this.coursesTotal = response.total
        this.coursesTotalPages = response.totalPage
        this.coursesCurrentPage = params?.page ?? 0
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingCourses')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      } finally {
        this.coursesIsLoading = false
      }
    },

    async loadMoreCourses(params: Omit<GetCoursesParams, 'page'>) {
      if (this.coursesIsLoading || this.coursesCurrentPage >= this.coursesTotalPages) {
        return
      }

      const nextPage = this.coursesCurrentPage + 1
      return this.fetchCourses({ ...params, page: nextPage, isAdmin: true }, true)
    },

    async fetchCourseById(courseId: number, isAdmin = false) {
      const { showToast } = useToaster()
      try {
        const response = await CourseService.getCourseById(courseId, isAdmin)
        this.courseDetails = response

        // Check if timerId is missing and create/update it
        if (!response.execution && !isAdmin && response.assignations.length > 0) {
          const timer = await TimerService.createTimer()
          await TimerService.startTimer(timer.data.id)
          await CourseService.startExecution({
            ownerId: courseId,
            ownerType: CourseExecutionType.COURSE as CourseExecutionType,
            timerId: timer.data.id,
          })
          this.courseDetails = {
            ...(this.courseDetails as CourseDetails),
            execution: {
              attempts: 0,
              percentage: 0,
              timerId: timer.data.id,
              status: ExecutionStatus.IN_PROGRESS,
            },
          }
        }

        return this.courseDetails
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingCourseById')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    async updateCourse(courseId: number, formData: FormData) {
      const { showToast } = useToaster()
      try {
        const response = await CourseService.updateCourse(courseId, formData)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.updatingCourse')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async createCourse(formData: FormData) {
      const { showToast } = useToaster()
      try {
        const response = await CourseService.createCourse(formData)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.creatingCourse')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    clearCourseDetails() {
      this.courseDetails = null
    },

    resetCourses() {
      this.courses = []
      this.coursesTotal = 0
      this.coursesTotalPages = 0
      this.coursesCurrentPage = 1
      this.coursesIsLoading = false
    },

    addNavigationHistory(history: NavigationHistoryType) {
      // First time - set as parent navigationHistory
      if (!this.navigationHistory) {
        this.navigationHistory = history
        return
      }

      // Find the deepest nested level and add there
      const addToDeepest = (item: NavigationHistoryType): void => {
        // If this item has nested history, go deeper
        if (item.nestedNavigationHistory) {
          addToDeepest(item.nestedNavigationHistory)
        } else {
          // This is the deepest level, set the nested object here
          item.nestedNavigationHistory = history
        }
      }

      addToDeepest(this.navigationHistory)
    },

    removeNavigationHistory(courseId: number) {
      if (!this.navigationHistory) {
        return
      }

      // If the root matches, clear everything
      if (this.navigationHistory.courseId === courseId) {
        this.navigationHistory = null
        return
      }

      // Remove from nested (traverse and remove matching node)
      const removeFromNested = (item: NavigationHistoryType): boolean => {
        if (!item.nestedNavigationHistory) {
          return false
        }

        // If the nested item matches, remove it
        if (item.nestedNavigationHistory.courseId === courseId) {
          // Remove by setting the parent's nested to the nested's nested (skip this level)
          item.nestedNavigationHistory =
            item.nestedNavigationHistory.nestedNavigationHistory || undefined
          return true
        }

        // Go deeper
        return removeFromNested(item.nestedNavigationHistory)
      }

      removeFromNested(this.navigationHistory)
    },

    clearNavigationHistory() {
      this.navigationHistory = null
    },

    async courseExecution(payload: CourseExecution, courseId: number) {
      const { showToast } = useToaster()
      try {
        const response = await CourseService.courseExecution(payload)
        showToast({
          tone: 'success',
          message: t('types.success.courseExecution'),
        })
        this.fetchCourseById(courseId)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.courseExecution')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    async deleteCourse(courseIds: number[], deleteType: 'soft' | 'hard') {
      const { showToast } = useToaster()
      try {
        const response = await CourseService.deleteCourse(courseIds, deleteType)
        showToast({
          tone: 'success',
          message: t('types.success.deletingCourse'),
        })
        await this.fetchCourses({ page: 0, perPage: 12, isAdmin: true })
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.deletingCourse')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchCourseParticipants(id: number, type: CourseExecutionType, params: GlobalParams) {
      const { showToast } = useToaster()
      try {
        const response = await CourseService.getCourseParticipants(id, type, params)
        this.courseParticipants = response.data
        this.courseParticipantsTotal = response.total
        this.courseParticipantsCurrentPage = params?.page ?? 1
        this.courseParticipantsPerPage = params?.perPage ?? 5
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingCourseParticipants')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async updateCourseVisibilityDetails(
      courseId: number,
      visibility: VisibilityStatus,
      type: VisibilityType,
    ) {
      const { showToast } = useToaster()
      try {
        const response = await CourseService.updateCourseVisibility(courseId, visibility, type)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.updatingCourseVisibility')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    resetCourseParticipants() {
      this.courseParticipants = []
      this.courseParticipantsTotal = 0
      this.courseParticipantsCurrentPage = 1
      this.courseParticipantsPerPage = 5
    },
  },
  getters: {
    getCourses: (state) => state.courses,
  },
})
