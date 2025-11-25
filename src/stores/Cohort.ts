import { defineStore } from 'pinia'
import cohortService from '@/services/cohort'
import type {
  CohortItem,
  GetCohortsParams,
  RoleItem,
  GroupItem,
  ClusterItem,
  UserItem,
  CohortFormData,
} from '@/types/Cohort'
import { t } from '@/utils/i18n'
import { useToaster } from '@/composables/useToaster'

export const useCohortStore = defineStore('cohort', {
  state: () => ({
    cohorts: [] as CohortItem[],
    cohortsCurrentPage: 1,
    cohortsTotalPages: 1,
    cohortsIsLoading: false,
    roles: [] as RoleItem[],
    groups: [] as GroupItem[],
    clusters: [] as ClusterItem[],
    users: [] as UserItem[],
  }),
  actions: {
    async fetchCohorts(params: GetCohortsParams, append = false) {
      const { showToast } = useToaster()
      try {
        this.cohortsIsLoading = true
        const response = await cohortService.getCohorts(params)
        if (append) {
          this.cohorts = [...this.cohorts, ...response.data]
        } else {
          this.cohorts = response.data
        }
        this.cohortsTotalPages = response.totalPage
        this.cohortsCurrentPage = params?.page ?? 1
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingCohorts')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      } finally {
        this.cohortsIsLoading = false
      }
    },
    async loadMoreCohorts(params: Omit<GetCohortsParams, 'page'>) {
      if (this.cohortsIsLoading || this.cohortsCurrentPage >= this.cohortsTotalPages) {
        return
      }

      const nextPage = this.cohortsCurrentPage + 1
      return this.fetchCohorts({ ...params, page: nextPage }, true)
    },
    async fetchRoles() {
      const { showToast } = useToaster()
      try {
        const response = await cohortService.getRoles(1, 50)
        this.roles = response.data.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.fetchingRoles')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchGroups() {
      const { showToast } = useToaster()
      try {
        const response = await cohortService.getGroups(1, 50)
        this.groups = response.data.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingGroups')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchClusters() {
      const { showToast } = useToaster()
      try {
        const response = await cohortService.getClusters(1, 50)
        this.clusters = response.data.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingClusters')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchUsers() {
      const { showToast } = useToaster()
      try {
        const response = await cohortService.getUsers(1, 50)
        this.users = response.data.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.fetchingUsers')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async createCohort(data: CohortFormData) {
      const { showToast } = useToaster()
      try {
        const response = await cohortService.createCohort(data)
        showToast({
          tone: 'success',
          message: t('types.success.cohortCreated'),
        })
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.creatingCohort')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
  },
  getters: {
    getCohortsList: (state) => {
      const options = state.cohorts.map((cohort) => ({
        label: cohort.name,
        value: cohort.id,
      }))
      return options
    },
    getRolesList: (state) => {
      const options = state.roles.map((role) => ({
        label: role.title,
        value: role.id,
      }))
      return options
    },
    getGroupsList: (state) => {
      const options = state.groups.map((group) => ({
        label: group.name,
        value: group.id,
      }))
      return options
    },
    getClustersList: (state) => {
      const options = state.clusters.map((cluster) => ({
        label: cluster.name,
        value: cluster.id,
      }))
      return options
    },
    getUsersList: (state) => {
      const options = state.users.map((user) => ({
        label: user.name,
        value: user.id.toString(),
      }))
      return options
    },
  },
})
