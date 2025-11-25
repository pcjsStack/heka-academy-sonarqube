import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'

class ContentBlockService {
  async getContentBlocks() {
    const response = await axiosInstance.get(`${academyPrefix}/content_block`, {
      loadingMessage: t('types.loading.fetchingContentBlocks'),
      showLoader: true,
    })
    return response.data
  }
  async updateContentBlock(contentBlock: FormData) {
    const response = await axiosInstance.patch(`${academyPrefix}/content_block`, contentBlock, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      loadingMessage: t('types.loading.updatingContentBlock'),
      showLoader: true,
    })
    return response.data
  }
}

export default new ContentBlockService()
