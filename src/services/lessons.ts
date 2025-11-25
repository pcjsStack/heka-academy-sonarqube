import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'
import type { GetLessonsParams } from '@/types/Lessons'

class LessonsService {
  async getLessons(params?: GetLessonsParams) {
    const query = new URLSearchParams()
    if (params) {
      if (params.status) query.append('status', params.status)
      if (params.executionStatus) {
        if (Array.isArray(params.executionStatus)) {
          params.executionStatus.forEach((status) => query.append('executionStatus', status))
        } else {
          query.append('executionStatus', params.executionStatus)
        }
      }
      if (params.search && params.search.trim()) {
        query.append('search', params.search.trim())
      }
      if (Array.isArray(params.visibility) && params.visibility.length > 0) {
        if (!params.visibility.includes('all')) {
          params.visibility
            .filter((v) => v && v !== 'all')
            .forEach((v) => query.append('visibility', v))
        }
      }
      if (params.startDate) query.append('startDate', params.startDate)
      if (params.endDate) query.append('endDate', params.endDate)
      if (params.page !== undefined && params.page !== 0) query.append('page', String(params.page))
      if (params.perPage !== undefined) query.append('perPage', String(params.perPage))
      query.append('order', params.order ?? 'asc')
      query.append('orderColumn', params.orderColumn ?? 'name')
    }

    const url = query.toString()
      ? `${academyPrefix}/catalog/lessons?${query.toString()}&isAdmin=${params?.isAdmin ?? false}`
      : `${academyPrefix}/catalog/lessons?isAdmin=${params?.isAdmin ?? false}`

    const response = await axiosInstance.get(url, {
      loadingMessage: t('types.loading.fetchingLessons'),
      showLoader: true,
    })
    return response.data
  }
  async createLesson(lesson: FormData) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/lessons`, lesson, {
      loadingMessage: t('types.loading.creatingLesson'),
      showLoader: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  async deleteLesson(lessonIds: number[]) {
    const params = new URLSearchParams()
    lessonIds.forEach((id) => params.append('ids', id.toString()))

    const response = await axiosInstance.delete(
      `${academyPrefix}/catalog/lessons?${params.toString()}`,
      {
        loadingMessage: t('types.loading.deletingLesson'),
        showLoader: true,
      },
    )
    return response.data
  }

  async getLessonById(lessonId: number, isAdmin = false) {
    const response = await axiosInstance.get(
      `${academyPrefix}/catalog/lessons/${lessonId}?isAdmin=${isAdmin}`,
      {
        loadingMessage: t('types.loading.fetchingLesson'),
        showLoader: true,
      },
    )
    return response.data
  }

  async updateLesson(lessonId: number, formData: FormData) {
    const response = await axiosInstance.patch(
      `${academyPrefix}/catalog/lessons/${lessonId}`,
      formData,
      {
        loadingMessage: t('types.loading.updatingLessonDetails'),
        showLoader: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data
  }

  async lessonExecution(payload: unknown) {
    const formData = new FormData()
    formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    const response = await axiosInstance.post(`${academyPrefix}/catalog/executions`, formData, {
      loadingMessage: t('types.loading.lessonExecution'),
      showLoader: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async startExecution(payload: unknown) {
    const response = await axiosInstance.post(
      `${academyPrefix}/catalog/executions/start`,
      payload,
      {
        loadingMessage: t('types.loading.startExecution'),
        showLoader: false,
      },
    )
    return response.data
  }
}

export default new LessonsService()
