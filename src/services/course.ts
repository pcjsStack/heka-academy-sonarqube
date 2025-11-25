import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'
import type {
  CourseExecution,
  CourseExecutionType,
  GetCoursesParams,
  StartExecutionPayload,
  VisibilityType,
} from '@/types/Course'
import type { GlobalParams } from '@/types/GlobalTypes'
import { VisibilityStatus } from '@/types/Course'

class CourseService {
  async getCourses(params?: GetCoursesParams) {
    const query = new URLSearchParams()
    if (params) {
      if (params.published) query.append('published', String(params.published))
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
        // If 'all' is present in visibility, don't send any visibility parameters
        // Otherwise, send all the visibility values
        if (!params.visibility.includes('all')) {
          params.visibility
            .filter((v) => v && v !== 'all')
            .forEach((v) => query.append('visibility', v))
        }
      }
      if (params.startDate) query.append('startDate', params.startDate)
      if (params.endDate) query.append('endDate', params.endDate)
      if (params.date && !params.startDate && !params.endDate) {
        // Only use date string if startDate/endDate are not provided
        query.append('date', params.date)
      }
      if (params.categoryId) query.append('categoryId', String(params.categoryId))
      if (params.categoryIds && params.categoryIds.length > 0) {
        params.categoryIds.forEach((id) => query.append('categoryIds', String(id)))
      }
      if (params.page !== undefined && params.page !== 0) query.append('page', String(params.page))
      if (params.perPage !== undefined) query.append('perPage', String(params.perPage))
      query.append('order', params.order ?? 'asc')
      query.append('orderColumn', params.orderColumn ?? 'name')
      if (params.type) query.append('type', params.type)
    }

    const url = query.toString()
      ? `${academyPrefix}/catalog/course?${query.toString()}&isAdmin=${params?.isAdmin ?? false}`
      : `${academyPrefix}/catalog/course?isAdmin=${params?.isAdmin ?? false}`

    const response = await axiosInstance.get(url, {
      loadingMessage: t('types.loading.fetchingCourses'),
      showLoader: true,
    })
    return response.data
  }
  async deleteCourse(courseIds: number[], deleteType: 'soft' | 'hard') {
    const params = new URLSearchParams()
    courseIds.forEach((id) => params.append('ids', id.toString()))
    params.append('deleteType', deleteType)

    const response = await axiosInstance.delete(
      `${academyPrefix}/catalog/course?${params.toString()}`,
      {
        loadingMessage: t('types.loading.deletingCourse'),
        showLoader: true,
      },
    )
    return response.data
  }
  async getCourseById(courseId: number, isAdmin = false) {
    const response = await axiosInstance.get(
      `${academyPrefix}/catalog/course/${courseId}?isAdmin=${isAdmin}`,
      {
        loadingMessage: t('types.loading.fetchingCourseById'),
        showLoader: true,
      },
    )
    return response.data
  }
  async updateCourse(courseId: number, formData: FormData) {
    const response = await axiosInstance.patch(
      `${academyPrefix}/catalog/course/${courseId}`,
      formData,
      {
        loadingMessage: t('types.loading.updatingCourse'),
        showLoader: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data
  }
  async createCourse(formData: FormData) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/course`, formData, {
      loadingMessage: t('types.loading.creatingCourse'),
      showLoader: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  async courseExecution(payload: CourseExecution) {
    const formData = new FormData()
    formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    const response = await axiosInstance.post(`${academyPrefix}/catalog/executions`, formData, {
      loadingMessage: t('types.loading.courseExecution'),
      showLoader: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getCourseParticipants(id: number, type: CourseExecutionType, params?: GlobalParams) {
    const urlParams = new URLSearchParams()
    urlParams.append('ownerId', id.toString())
    urlParams.append('ownerType', type)
    if (params?.page) urlParams.append('page', (params.page - 1).toString())
    if (params?.perPage) urlParams.append('perPage', params.perPage.toString())
    if (params?.search) urlParams.append('search', params.search)
    const response = await axiosInstance.get(
      `${academyPrefix}/catalog/participants?${urlParams.toString()}`,
      {
        loadingMessage: t('types.loading.fetchingCourseParticipants'),
        showLoader: false,
      },
    )
    return response.data
  }

  async startExecution(payload: StartExecutionPayload) {
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

  async updateCourseVisibility(
    courseId: number,
    visibility: VisibilityStatus,
    type: VisibilityType,
  ) {
    const response = await axiosInstance.patch(
      `${academyPrefix}/catalog/${type}/${courseId}/visibility`,
      { visibility },
      {
        loadingMessage: t('types.loading.updatingCourseVisibility'),
        showLoader: false,
      },
    )
    return response.data
  }
}

export default new CourseService()
