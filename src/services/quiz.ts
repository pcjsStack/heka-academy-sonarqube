import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import type { GetQuizzesParams, EndQuizExecutionPayload } from '@/types/Quiz'
import { t } from '@/utils/i18n'

class QuizService {
  async createQuiz(quiz: FormData) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/quizzes`, quiz, {
      loadingMessage: t('types.loading.creatingQuiz'),
      showLoader: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  async updateQuiz(quizId: number, quiz: FormData) {
    const response = await axiosInstance.patch(`${academyPrefix}/catalog/quizzes/${quizId}`, quiz, {
      loadingMessage: t('types.loading.updatingQuiz'),
      showLoader: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  async getQuizById(quizId: number, isAdmin = false) {
    const response = await axiosInstance.get(
      `${academyPrefix}/catalog/quizzes/${quizId}?isAdmin=${isAdmin}`,
      {
        loadingMessage: t('types.loading.fetchingQuizById'),
        showLoader: true,
      },
    )
    return response.data
  }
  async getQuizzes(params?: GetQuizzesParams) {
    const query = new URLSearchParams()
    if (params?.status) {
      query.append('status', params.status)
    }
    if (params?.executionStatus) {
      if (Array.isArray(params.executionStatus)) {
        params.executionStatus.forEach((status) => query.append('executionStatus', status))
      } else {
        query.append('executionStatus', params.executionStatus)
      }
    }
    if (params?.search) {
      query.append('search', params.search)
    }
    query.append('order', params?.order ?? 'asc')
    query.append('orderColumn', params?.orderColumn ?? 'title')
    if (params?.page !== undefined) {
      query.append('page', params.page.toString())
    }
    if (params?.perPage) {
      query.append('perPage', params.perPage.toString())
    }
    const response = await axiosInstance.get(
      `${academyPrefix}/catalog/quizzes?${query.toString()}&isAdmin=${params?.isAdmin ?? false}`,
      {
        loadingMessage: t('types.loading.fetchingQuizzes'),
        showLoader: true,
      },
    )
    return response.data
  }
  async deleteQuiz(quizIds: number[], deleteType: 'soft' | 'hard') {
    const query = new URLSearchParams()
    quizIds.forEach((id) => {
      query.append('ids', id.toString())
    })
    query.append('deleteType', deleteType)

    const response = await axiosInstance.delete(
      `${academyPrefix}/catalog/quizzes?${query.toString()}`,
      {
        loadingMessage: t('types.loading.deletingQuiz'),
        showLoader: true,
      },
    )
    return response.data
  }
  async submitCategoryAnswers(answers: FormData) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/executions`, answers, {
      loadingMessage: t('types.loading.submittingCategoryAnswers'),
      showLoader: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  async endQuizExecution(payload: EndQuizExecutionPayload) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/executions/end`, payload, {
      loadingMessage: t('types.loading.endingQuizExecution'),
      showLoader: true,
    })
    return response.data
  }
  async retakeQuiz(payload: EndQuizExecutionPayload) {
    const response = await axiosInstance.post(
      `${academyPrefix}/catalog/executions/retake`,
      payload,
      {
        loadingMessage: t('types.loading.retakingQuiz'),
        showLoader: true,
      },
    )
    return response.data
  }
}
export default new QuizService()
