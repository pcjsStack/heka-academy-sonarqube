import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'
import type { LeaderboardParams } from '@/types/LeaderBoard'
class LeaderboardService {
  async getCourseLeaderboard(type: 'course' | 'lessons') {
    const response = await axiosInstance.get(`${academyPrefix}/catalog/leaderboard/${type}`, {
      loadingMessage: t('types.loading.fetchingCourseLeaderboard'),
      showLoader: true,
    })
    return response.data
  }
  async getLessonLeaderboard(params: LeaderboardParams) {
    const { ownerType, ownerId, page, perPage } = params
    const queryParams = new URLSearchParams({
      ownerType: ownerType.toUpperCase(),
      page: page?.toString() ?? '0',
      perPage: perPage?.toString() ?? '15',
    })

    // Only add ownerId if it's provided (not for "All" tab)
    if (ownerId !== undefined && ownerId !== null) {
      queryParams.append('ownerId', ownerId.toString())
    }

    const response = await axiosInstance.get(
      `${academyPrefix}/catalog/leaderboard?${queryParams.toString()}`,
      {
        loadingMessage: t('types.loading.fetchingLessonLeaderboard'),
        showLoader: true,
      },
    )
    return response.data
  }
}

export default new LeaderboardService()
