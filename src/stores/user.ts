import { defineStore } from 'pinia'
import { usersService } from '@/services/users'
import { useToaster } from '@/composables/useToaster'
import { t } from '@/utils/i18n'
import type { User, Permission, PermissionResponse } from '@/types/Users'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    permissions: [] as Permission[],
  }),
  actions: {
    setUser(user: User) {
      this.user = user
    },
    async fetchPermission() {
      const { showToast } = useToaster()
      try {
        const response: PermissionResponse = await usersService.fetchPermission()
        if (response.success && response.data) {
          this.permissions = response.data
        } else {
          this.permissions = ['academy_access']
        }
      } catch (error) {
        console.error(error)
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.failedToFetchPermissions')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        this.permissions = ['academy_access']
      }
    },
  },
})
