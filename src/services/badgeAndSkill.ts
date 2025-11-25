import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'
import type {
  AddSkillPayload,
  GetBadgesParams,
  GetSkillsParams,
  BadgeSkillsResponse,
  EditSkillPayload,
} from '@/types/BadgeAndSkill'

class BadgeAndSkillService {
  async fetchBadges(params?: GetBadgesParams): Promise<BadgeSkillsResponse> {
    const queryParams = new URLSearchParams()

    if (params?.deletedFilter) {
      queryParams.append('deletedFilter', params.deletedFilter)
    }

    if (params?.search) {
      queryParams.append('search', params.search)
    }

    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString())
    }

    if (params?.perPage !== undefined) {
      queryParams.append('perPage', params.perPage.toString())
    }

    queryParams.append('isAdmin', params?.isAdmin?.toString() ?? 'false')

    const queryString = queryParams.toString()
    const url = `${academyPrefix}/gamification/badges${queryString ? `?${queryString}` : ''}`

    const response = await axiosInstance.get(url, {
      loadingMessage: t('types.loading.fetchingBadges'),
      showLoader: true,
    })
    return response.data
  }

  async fetchSkills(params?: GetSkillsParams): Promise<BadgeSkillsResponse> {
    const queryParams = new URLSearchParams()

    if (params?.deletedFilter) {
      queryParams.append('deletedFilter', params.deletedFilter)
    }

    if (params?.search) {
      queryParams.append('search', params.search)
    }

    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString())
    }

    if (params?.perPage !== undefined) {
      queryParams.append('perPage', params.perPage.toString())
    }

    queryParams.append('isAdmin', params?.isAdmin?.toString() ?? 'false')

    const queryString = queryParams.toString()
    const url = `${academyPrefix}/gamification/skills${queryString ? `?${queryString}` : ''}`

    const response = await axiosInstance.get(url, {
      loadingMessage: t('types.loading.fetchingSkills'),
      showLoader: true,
    })
    return response.data
  }

  async addNewBadge(data: FormData) {
    const response = await axiosInstance.post(`${academyPrefix}/gamification/badges`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      loadingMessage: t('types.loading.addingNewBadge'),
      showLoader: true,
    })
    return response.data
  }

  async addNewSkill(data: AddSkillPayload) {
    const response = await axiosInstance.post(`${academyPrefix}/gamification/skills`, data, {
      loadingMessage: t('types.loading.addingNewSkill'),
      showLoader: true,
    })
    return response.data
  }

  async deleteBadge(ids: number | number[], deleteType: 'soft' | 'hard' = 'soft') {
    const queryParams = new URLSearchParams()

    // Handle ids - can be single number or array
    const idsArray = Array.isArray(ids) ? ids : [ids]
    idsArray.forEach((id) => {
      queryParams.append('ids', id.toString())
    })

    queryParams.append('deleteType', deleteType)

    const queryString = queryParams.toString()
    const url = `${academyPrefix}/gamification/badges?${queryString}`

    const response = await axiosInstance.delete(url, {
      loadingMessage: t('types.loading.deletingBadge'),
      showLoader: true,
    })
    return response.data
  }

  async deleteSkill(ids: number | number[], deleteType: 'soft' | 'hard' = 'soft') {
    const queryParams = new URLSearchParams()

    // Handle ids - can be single number or array
    const idsArray = Array.isArray(ids) ? ids : [ids]
    idsArray.forEach((id) => {
      queryParams.append('ids', id.toString())
    })

    queryParams.append('deleteType', deleteType)

    const queryString = queryParams.toString()
    const url = `${academyPrefix}/gamification/skills?${queryString}`

    const response = await axiosInstance.delete(url, {
      loadingMessage: t('types.loading.deletingSkill'),
      showLoader: true,
    })
    return response.data
  }
  async editBadge(id: number, data: FormData) {
    const response = await axiosInstance.patch(`${academyPrefix}/gamification/badges/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      loadingMessage: t('types.loading.editingBadge'),
      showLoader: true,
    })
    return response.data
  }

  async editSkill(id: number, data: EditSkillPayload) {
    const response = await axiosInstance.patch(`${academyPrefix}/gamification/skills/${id}`, data, {
      loadingMessage: t('types.loading.editingSkill'),
      showLoader: true,
    })
    return response.data
  }
  async getBadgeAndSkillDetails(type: 'badges' | 'skills', id: number) {
    const response = await axiosInstance.get(`${academyPrefix}/gamification/${type}/${id}`, {
      loadingMessage: t('types.loading.gettingBadgeAndSkillDetails', { type }),
      showLoader: true,
    })
    return response.data
  }
}

export default new BadgeAndSkillService()
