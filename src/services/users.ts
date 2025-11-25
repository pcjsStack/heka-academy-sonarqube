import axiosInstance, { corePrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'

const prefix = corePrefix
export const usersService = {
  fetchUsers: async () => {
    const response = await axiosInstance.get(`${prefix}/customer-users`, {
      loadingMessage: t('types.loading.fetchingUsers'),
      showLoader: true,
    })
    return response.data
  },
  fetchPermission: async () => {
    const response = await axiosInstance.get(`${prefix}/abilities`, {
      loadingMessage: t('types.loading.fetchingPermission'),
      showLoader: true,
    })
    return response.data
  },
}
