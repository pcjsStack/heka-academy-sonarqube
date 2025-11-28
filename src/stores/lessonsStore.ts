import { defineStore } from 'pinia'
import lessonsService from '@/services/lessons'
import TimerService from '@/services/timerService'
import { useToaster } from '@/composables/useToaster'
import { t } from '@/utils/i18n'
import type { Lesson, GetLessonsParams, LessonDetails } from '@/types/Lessons'
import type { CourseExecution, StartExecutionPayload } from '@/types/Course'
import { CourseExecutionType } from '@/types/Course'
import { ExecutionStatus } from '@/types/GlobalTypes'

export const useLessonsStore = defineStore('lessons', {
  state: () => ({
    lessons: [] as Lesson[],
    page: 0,
    limit: 12,
    total: 0,
    lessonDetails: null as LessonDetails | null,
  }),
  actions: {
    async fetchLessons(params?: GetLessonsParams) {
      const { showToast } = useToaster()
      try {
        const response = await lessonsService.getLessons(params)
        this.lessons = response.data
        this.page = response.page
        this.limit = response.limit
        this.total = response.totalPage
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingLessons')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async createLesson(formData: FormData) {
      const { showToast } = useToaster()
      try {
        const response = await lessonsService.createLesson(formData)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.creatingLesson')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async deleteLesson(lessonIds: number[]) {
      const { showToast } = useToaster()
      try {
        const response = await lessonsService.deleteLesson(lessonIds)
        showToast({
          tone: 'success',
          message: t('types.success.deletingLesson'),
        })
        this.lessonDetails = null
        await this.fetchLessons({ isAdmin: true })
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.deletingLesson')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchLessonById(lessonId: number, isAdmin = false) {
      const { showToast } = useToaster()
      try {
        const response = await lessonsService.getLessonById(lessonId, isAdmin)
        this.lessonDetails = response

        // Check if timerId is missing and create/update it
        if (!response.execution?.timerId && !isAdmin && response.assignations.length > 0) {
          const timer = await TimerService.createTimer()
          await TimerService.startTimer(timer.data.id)
          await lessonsService.startExecution({
            ownerId: lessonId,
            ownerType: CourseExecutionType.LESSON as CourseExecutionType,
            timerId: timer.data.id,
          } as StartExecutionPayload)
          this.lessonDetails = {
            ...(this.lessonDetails as LessonDetails),
            execution: {
              attempts: 0,
              percentage: 0,
              timerId: timer.data.id,
              status: ExecutionStatus.IN_PROGRESS,
            },
          }
        }

        return this.lessonDetails
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingLesson')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async updateLessonDetails(lessonId: number, formData: FormData) {
      const { showToast } = useToaster()
      try {
        const response = await lessonsService.updateLesson(lessonId, formData)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.updatingLesson')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    clearLessonDetails() {
      this.lessonDetails = null
    },
    async lessonExecution(payload: CourseExecution, lessonId: number) {
      const { showToast } = useToaster()
      try {
        const response = await lessonsService.lessonExecution(payload)
        showToast({
          tone: 'success',
          message: t('types.success.lessonExecution'),
        })
        // Refresh lesson details to get updated percentage
        await this.fetchLessonById(lessonId)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.lessonExecution')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
  },
  getters: {
    getLessons: (state) => state.lessons,
    getLessonById: (state) => (id: number) => state.lessons.find((lesson) => lesson.id === id),
    getLessonDetails: (state) => state.lessonDetails,
  },
})
