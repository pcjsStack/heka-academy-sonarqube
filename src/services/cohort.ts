import axiosInstance, { academyPrefix, corePrefix } from '@/services/api/axiosInstance'
import type { CohortFormData, GetCohortsParams } from '@/types/Cohort'
import { t } from '@/utils/i18n'
class CohortService {
  async getCohorts(params: GetCohortsParams) {
    const response = await axiosInstance.get(`${academyPrefix}/catalog/cohort`, {
      loadingMessage: t('types.loading.fetchingCohorts'),
      showLoader: true,
      params,
    })
    return response.data
  }

  async getRoles(page: number = 1, perPage: number = 10) {
    const response = await axiosInstance.get(
      `${corePrefix}/roles?perPage=${perPage}&page=${page}`,
      {
        loadingMessage: t('types.loading.fetchingRoles'),
        showLoader: true,
      },
    )
    return response.data
  }

  async getGroups(page: number = 1, perPage: number = 10) {
    const response = await axiosInstance.get(
      `${corePrefix}/groups?perPage=${perPage}&page=${page}`,
      {
        loadingMessage: t('types.loading.fetchingGroups'),
        showLoader: true,
      },
    )
    return response.data
  }

  async getClusters(page: number = 1, perPage: number = 10) {
    const response = await axiosInstance.get(
      `${corePrefix}/clusters?perPage=${perPage}&page=${page}`,
      {
        loadingMessage: t('types.loading.fetchingClusters'),
        showLoader: true,
      },
    )
    return response.data
  }

  async getUsers(page: number = 1, perPage: number = 10) {
    const response = await axiosInstance.get(
      `${corePrefix}/customer-users?perPage=${perPage}&page=${page}`,
      {
        loadingMessage: t('types.loading.fetchingUsers'),
        showLoader: true,
      },
    )
    return response.data
  }
  async getStores(page: number = 1, perPage: number = 10) {
    const response = await axiosInstance.get(
      `${corePrefix}/stores?perPage=${perPage}&page=${page}`,
      {
        loadingMessage: t('types.loading.fetchingStores'),
        showLoader: true,
      },
    )
    return response.data
  }
  async createCohort(data: CohortFormData) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/cohort`, data, {
      loadingMessage: t('types.loading.creatingCohort'),
      showLoader: true,
    })
    return response.data
  }
}

export default new CohortService()
