import { defineStore } from 'pinia'
import LeaderboardService from '@/services/leaderBoard'
import { useToaster } from '@/composables/useToaster'
import type { CourseLeaderboard, LeaderBoardItem, LeaderboardParams } from '@/types/LeaderBoard'
import { t } from '@/utils/i18n'

export const useLeaderboardStore = defineStore('leaderboardStore', {
  state: () => ({
    // For course/lesson list leaderboard (getCourseLeaderboard)
    courseLeaderboards: [] as CourseLeaderboard[],

    // For specific course/lesson leaderboard items (getLessonLeaderboard)
    leaderboardItems: [] as LeaderBoardItem[],
    leaderboardItemsTotal: 0,
    leaderboardItemsTotalPages: 0,
    leaderboardItemsCurrentPage: 0,
    // Current filters/params
    currentLeaderboardParams: null as LeaderboardParams | null,
  }),

  getters: {
    // Get course leaderboards
    getCourseLeaderboards: (state) => state.courseLeaderboards,

    // Get leaderboard items
    getLeaderboardItems: (state) => state.leaderboardItems,

    // Get leaderboard pagination info
    getLeaderboardPagination: (state) => ({
      total: state.leaderboardItemsTotal,
      totalPages: state.leaderboardItemsTotalPages,
      currentPage: state.leaderboardItemsCurrentPage,
    }),

    // Check if there are more pages
    hasMoreLeaderboardItems: (state) =>
      state.leaderboardItemsCurrentPage < state.leaderboardItemsTotalPages,
  },

  actions: {
    /**
     * Fetch course/lesson leaderboard list
     * Returns array of CourseLeaderboard items
     */
    async fetchCourseLeaderboard(type: 'course' | 'lessons') {
      const { showToast } = useToaster()
      try {
        const response = await LeaderboardService.getCourseLeaderboard(type)

        // Handle array response directly (service returns response.data)
        if (Array.isArray(response)) {
          this.courseLeaderboards = response
        } else {
          this.courseLeaderboards = []
        }

        return this.courseLeaderboards
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingCourseLeaderboard')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    /**
     * Fetch leaderboard items for a specific course/lesson or all items
     * Returns paginated LeaderBoardItem array
     */
    async fetchLessonLeaderboard(params: LeaderboardParams, append = false) {
      const { showToast } = useToaster()
      try {
        this.currentLeaderboardParams = params

        const response = await LeaderboardService.getLessonLeaderboard(params)

        // Handle response structure (service returns response.data)
        let items: LeaderBoardItem[] = []
        let total = 0
        let totalPages = 0

        if (Array.isArray(response)) {
          // Direct array response
          items = response
          total = response.length
          totalPages = 1
        } else if (response && typeof response === 'object') {
          // Response with data property and pagination
          if (Array.isArray(response.data)) {
            items = response.data
          } else if (Array.isArray(response)) {
            items = response
          }
          // Handle pagination if available
          total = response.total ?? (Array.isArray(items) ? items.length : 0)
          totalPages = response.totalPage ?? 1
        }

        if (append) {
          this.leaderboardItems = [...this.leaderboardItems, ...items]
        } else {
          this.leaderboardItems = items
        }

        this.leaderboardItemsTotal = total
        this.leaderboardItemsTotalPages = totalPages
        this.leaderboardItemsCurrentPage = params.page ?? 0

        return {
          data: this.leaderboardItems,
          total,
          totalPage: totalPages,
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingLessonLeaderboard')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    /**
     * Load more leaderboard items (pagination)
     */
    async loadMoreLeaderboardItems() {
      if (!this.hasMoreLeaderboardItems || !this.currentLeaderboardParams) {
        return
      }

      const nextPage = this.leaderboardItemsCurrentPage + 1
      const params: LeaderboardParams = {
        ...this.currentLeaderboardParams,
        page: nextPage,
      }

      return this.fetchLessonLeaderboard(params, true)
    },

    /**
     * Reset leaderboard state
     */
    resetLeaderboardItems() {
      this.leaderboardItems = []
      this.leaderboardItemsTotal = 0
      this.leaderboardItemsTotalPages = 0
      this.leaderboardItemsCurrentPage = 0
      this.currentLeaderboardParams = null
    },

    /**
     * Reset course leaderboards
     */
    resetCourseLeaderboards() {
      this.courseLeaderboards = []
    },
  },
})
