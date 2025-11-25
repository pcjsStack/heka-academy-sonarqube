import axiosInstance, { corePrefix } from '@/services/api/axiosInstance'
import type { GlobalParams } from '@/types/GlobalTypes'
import { t } from '@/utils/i18n'

class LanguageService {
  async getAllLanguages(params?: GlobalParams) {
    const response = await axiosInstance.get(`${corePrefix}/lang/all`, {
      loadingMessage: t('types.loading.fetchingAllLanguages'),
      showLoader: true,
      params,
    })
    return response
  }
}

export default new LanguageService()
