import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import { t } from '@/utils/i18n'
import type { CreateCategoryPayloadShape, GetCategoriesParams } from '@/types/Category'

class CategoryService {
  async getCategories(params: GetCategoriesParams) {
    const query = new URLSearchParams()
    if (params) {
      if (params.search && params.search.trim()) {
        query.append('search', params.search.trim())
      }
    }
    if (Array.isArray(params.visibility) && params.visibility.length > 0) {
      if (!params.visibility.includes('all')) {
        params.visibility
          .filter((v) => v && v !== 'all')
          .forEach((v) => query.append('visibility', v))
      }
    }
    if (params.perPage) {
      query.append('perPage', String(params.perPage))
    }
    if (params.page) {
      query.append('page', String(params.page))
    }
    query.append('isAdmin', String(params.isAdmin))
    const response = await axiosInstance.get(
      `${academyPrefix}/catalog/category?${query.toString()}`,
      {
        loadingMessage: t('types.loading.fetchingCategory'),
        showLoader: true,
      },
    )
    return response.data
  }
  async createCategory(category: CreateCategoryPayloadShape) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/category`, category, {
      loadingMessage: t('types.loading.creatingCategory'),
      showLoader: true,
    })
    return response.data
  }
  async updateCategory(categoryId: number, category: CreateCategoryPayloadShape) {
    const response = await axiosInstance.patch(
      `${academyPrefix}/catalog/category/${categoryId}`,
      category,
      {
        loadingMessage: t('types.loading.updatingCategory'),
        showLoader: true,
      },
    )
    return response.data
  }
  async deleteCategory(categoryId: number[], deleteType: 'soft' | 'hard') {
    const params = new URLSearchParams()
    categoryId.forEach((id) => params.append('ids', id.toString()))
    params.append('deleteType', deleteType)
    const response = await axiosInstance.delete(
      `${academyPrefix}/catalog/category?${params.toString()}`,
      {
        loadingMessage: t('types.loading.deletingCategory'),
        showLoader: true,
      },
    )
    return response.data
  }
  async getCategoryById(categoryId: number) {
    const response = await axiosInstance.get(`${academyPrefix}/catalog/category/${categoryId}`, {
      loadingMessage: t('types.loading.fetchingCategoryById'),
      showLoader: true,
    })
    return response.data
  }
}

export default new CategoryService()
