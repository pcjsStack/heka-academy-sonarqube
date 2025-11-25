import { defineStore } from 'pinia'
import CategoryService from '@/services/category'
import type {
  Category,
  CategoryDetail,
  GetCategoriesParams,
  CreateCategoryPayloadShape,
} from '@/types/Category'
import { t } from '@/utils/i18n'
import { useToaster } from '@/composables/useToaster'

export const useCategoryStore = defineStore('categoryStore', {
  state: () => ({
    categories: [] as Category[],
    categoriesTotal: 0,
    categoriesTotalPages: 0,
    categoriesCurrentPage: 0,
    categoriesIsLoading: false,
    selectedCategoryDetail: null as CategoryDetail | null,
  }),
  actions: {
    async fetchCategories(params?: GetCategoriesParams, append = false) {
      const { showToast } = useToaster()
      try {
        this.categoriesIsLoading = true
        const response = await CategoryService.getCategories(params || { page: 0 })

        if (append) {
          this.categories = [...this.categories, ...response.data]
        } else {
          this.categories = response.data
        }

        this.categoriesTotal = response.total
        this.categoriesTotalPages = response.totalPage
        this.categoriesCurrentPage = params?.page ?? 0
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingCategories')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      } finally {
        this.categoriesIsLoading = false
      }
    },
    async createCategory(category: CreateCategoryPayloadShape) {
      const { showToast } = useToaster()
      try {
        const response = await CategoryService.createCategory(category)
        showToast({
          tone: 'success',
          message: t('types.success.creatingCategory'),
        })
        return response.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.creatingCategory')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },

    async updateCategory(categoryId: number, payload: CreateCategoryPayloadShape) {
      const { showToast } = useToaster()
      try {
        const response = await CategoryService.updateCategory(categoryId, payload)
        showToast({
          tone: 'success',
          message: t('types.success.updatingCategory'),
        })
        return response.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.updatingCategory')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async handleDeleteCategory(categoryId: number[], deleteType: 'soft' | 'hard') {
      const { showToast } = useToaster()
      try {
        const response = await CategoryService.deleteCategory(categoryId, deleteType)
        showToast({
          tone: 'success',
          message: t('types.success.deletingCategory'),
        })
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.deletingCategory')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
      }
    },

    async fetchCategoryDetail(categoryId: number) {
      const { showToast } = useToaster()
      try {
        const response = await CategoryService.getCategoryById(categoryId)
        this.selectedCategoryDetail = response
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingCategory')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async loadMoreCategories(params: Omit<GetCategoriesParams, 'page'>) {
      if (this.categoriesIsLoading || this.categoriesCurrentPage >= this.categoriesTotalPages) {
        return
      }

      const nextPage = this.categoriesCurrentPage + 1
      return this.fetchCategories({ ...params, page: nextPage }, true)
    },

    resetCategories() {
      this.categories = []
      this.categoriesTotal = 0
      this.categoriesTotalPages = 0
      this.categoriesCurrentPage = 0
      this.categoriesIsLoading = false
    },
  },
  getters: {
    getCategories: (state) => state.categories,
  },
})
