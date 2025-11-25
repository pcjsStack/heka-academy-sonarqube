import { defineStore } from 'pinia'
import BadgeAndSkillService from '@/services/badgeAndSkill'
import { t } from '@/utils/i18n'
import { useToaster } from '@/composables/useToaster'
import type {
  AddSkillPayload,
  Badge,
  Skill,
  GetBadgesParams,
  GetSkillsParams,
  EditSkillPayload,
} from '@/types/BadgeAndSkill'

export const useBadgeAndSkillStore = defineStore('badgeAndSkill', {
  state: () => ({
    badges: [] as Badge[],
    skills: [] as Skill[],
    isLoading: false,
    badgesTotal: 0,
    skillsTotal: 0,
    badgesTotalPages: 0,
    skillsTotalPages: 0,
    badgeDetails: null as Badge | null,
    skillDetails: null as Skill | null,
  }),
  actions: {
    async fetchBadges(params?: GetBadgesParams) {
      const { showToast } = useToaster()
      this.isLoading = true
      try {
        const response = await BadgeAndSkillService.fetchBadges(params)
        // Handle response structure: { data: [], page: 0, perPage: 10, totalPage: 1, total: 6 }
        this.badges = Array.isArray(response.data) ? response.data : response.data || []
        this.badgesTotal = response.total || this.badges.length
        this.badgesTotalPages = response.totalPage || 1
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingBadges')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchSkills(params?: GetSkillsParams) {
      const { showToast } = useToaster()
      this.isLoading = true
      try {
        const response = await BadgeAndSkillService.fetchSkills(params)
        // Handle response structure: { data: [], page: 0, perPage: 10, totalPage: 1, total: 6 }
        this.skills = Array.isArray(response.data) ? response.data : response.data || []
        this.skillsTotal = response.total || this.skills.length
        this.skillsTotalPages = response.totalPage || 1
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingSkills')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async addNewBadge(data: FormData, params?: GetBadgesParams) {
      const { showToast } = useToaster()
      try {
        const response = await BadgeAndSkillService.addNewBadge(data)
        await this.fetchBadges(params) // Refresh list with current params
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.addingNewBadge')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    async addNewSkill(data: AddSkillPayload, params?: GetSkillsParams) {
      const { showToast } = useToaster()
      try {
        const response = await BadgeAndSkillService.addNewSkill(data)
        await this.fetchSkills(params) // Refresh list with current params
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.addingNewSkill')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    async deleteBadge(
      ids: number | number[],
      params?: GetBadgesParams,
      deleteType: 'soft' | 'hard' = 'soft',
    ) {
      const { showToast } = useToaster()
      try {
        const response = await BadgeAndSkillService.deleteBadge(ids, deleteType)
        // Reload list with current params after deletion
        if (params) {
          await this.fetchBadges(params)
        } else {
          await this.fetchBadges()
        }
        showToast({
          tone: 'success',
          message: t('types.success.badgeDeleted'),
        })
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.deletingBadge')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    async deleteSkill(
      ids: number | number[],
      params?: GetSkillsParams,
      deleteType: 'soft' | 'hard' = 'soft',
    ) {
      const { showToast } = useToaster()
      try {
        const response = await BadgeAndSkillService.deleteSkill(ids, deleteType)
        // Reload list with current params after deletion
        if (params) {
          await this.fetchSkills(params)
        } else {
          await this.fetchSkills()
        }
        showToast({
          tone: 'success',
          message: t('types.success.skillDeleted'),
        })
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.deletingSkill')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchBadgeAndSkillDetails(type: 'badges' | 'skills', id: number) {
      const { showToast } = useToaster()
      try {
        const response = await BadgeAndSkillService.getBadgeAndSkillDetails(type, id)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : t('types.error.gettingBadgeAndSkillDetails', { type })
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async editBadge(id: number, data: FormData, params?: GetBadgesParams) {
      const { showToast } = useToaster()
      try {
        const response = await BadgeAndSkillService.editBadge(id, data)
        // Reload list with current params after update
        if (params) {
          await this.fetchBadges(params)
        } else {
          await this.fetchBadges()
        }
        showToast({
          tone: 'success',
          message: t('types.success.badgeUpdated'),
        })
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.editingBadge')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async editSkill(id: number, data: EditSkillPayload, params?: GetSkillsParams) {
      const { showToast } = useToaster()
      try {
        const response = await BadgeAndSkillService.editSkill(id, data)
        // Reload list with current params after update
        if (params) {
          await this.fetchSkills(params)
        } else {
          await this.fetchSkills()
        }
        showToast({
          tone: 'success',
          message: t('types.success.skillUpdated'),
        })
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.editingSkill')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
  },
})
