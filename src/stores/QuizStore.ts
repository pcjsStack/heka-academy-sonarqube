import { defineStore } from 'pinia'
import quizService from '@/services/quiz'
import TimerService from '@/services/timerService'
import CourseService from '@/services/course'
import { CourseExecutionType } from '@/types/Course'
import { useToaster } from '@/composables/useToaster'
import { t } from '@/utils/i18n'
import type { EndQuizExecutionPayload, GetQuizzesParams, QuizInfo, quizItem } from '@/types/Quiz'
import { ExecutionStatus, PublishStatus } from '@/types/GlobalTypes'

interface QuizState {
  quizzes: quizItem[]
  total: number
  page: number
  perPage: number
  quizInfo: QuizInfo | null
}

export const useQuizStore = defineStore('quiz', {
  state: (): QuizState => ({
    quizzes: [],
    total: 0,
    page: 0,
    perPage: 0,
    quizInfo: null,
  }),
  actions: {
    async fetchQuizzes(params: GetQuizzesParams) {
      const response = await quizService.getQuizzes(params)
      this.quizzes = response.data
      this.total = response.totalPage
      this.page = response.page
      this.perPage = response.perPage
    },
    async createQuiz(quiz: FormData) {
      const { showToast } = useToaster()
      try {
        const response = await quizService.createQuiz(quiz)
        return response
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
    async updateQuiz(quizId: number, quiz: FormData) {
      const { showToast } = useToaster()
      try {
        const response = await quizService.updateQuiz(quizId, quiz)
        return response.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.updatingQuiz')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async deleteQuiz(quizIds: number[], deleteType: 'soft' | 'hard') {
      const { showToast } = useToaster()
      try {
        const response = await quizService.deleteQuiz(quizIds, deleteType)
        showToast({
          tone: 'success',
          message: t('types.success.deletingQuiz'),
        })
        return response.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.deletingQuiz')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchQuizInfo(quizId: number, isAdmin = false) {
      const { showToast } = useToaster()
      try {
        const response = await quizService.getQuizById(quizId, isAdmin)
        this.quizInfo = response
        // Check if timerId is missing and create/update it
        if (!response.execution?.timerId && !isAdmin && response.status !== PublishStatus.DRAFT) {
          console.log('response.status', response.status)
          const timer = await TimerService.createTimer()
          await TimerService.startTimer(timer.data.id)
          await CourseService.startExecution({
            ownerId: quizId,
            ownerType: CourseExecutionType.QUIZ as CourseExecutionType,
            timerId: timer.data.id,
          })
          this.quizInfo = {
            ...(this.quizInfo as QuizInfo),
            execution: {
              attempts: null,
              percentage: null,
              timerId: timer.data.id,
              status: ExecutionStatus.TODO,
            },
          }
        }
        return this.quizInfo
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingQuizInfo')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async submitCategoryAnswers(answers: FormData) {
      const { showToast } = useToaster()
      try {
        const response = await quizService.submitCategoryAnswers(answers)
        showToast({
          tone: 'success',
          message: t('types.success.submittingCategoryAnswers'),
        })
        return response.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.submittingCategoryAnswers')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async endQuizExecution(payload: EndQuizExecutionPayload) {
      const { showToast } = useToaster()
      try {
        const response = await quizService.endQuizExecution(payload)
        showToast({
          tone: 'success',
          message: t('types.success.endingQuizExecution'),
        })
        return response.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.endingQuizExecution')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async retakeQuiz(payload: EndQuizExecutionPayload) {
      const { showToast } = useToaster()
      try {
        const response = await quizService.retakeQuiz(payload)
        showToast({
          tone: 'success',
          message: t('types.success.retakingQuiz'),
        })
        return response.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.retakingQuiz')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
  },
  getters: {
    getQuizzesList: (state) =>
      state.quizzes.map((quiz) => ({
        ...quiz,
        id: String(quiz.id),
        imageUrl: quiz.imageUrl || '',
        status: quiz.status === PublishStatus.PUBLISHED ? 'Published' : 'Draft',
        visibility: quiz.visibility,
      })),
    getTotal: (state) => state.total,
    getPage: (state) => state.page,
    getPerPage: (state) => state.perPage,
  },
})
