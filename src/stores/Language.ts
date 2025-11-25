import { defineStore } from 'pinia'
import LanguageService from '@/services/language'
import { t } from '@/utils/i18n'
import { FirstLetterCapitalize } from '@/utils/utils'
import { useToaster } from '@/composables/useToaster'
import type { GlobalParams } from '@/types/GlobalTypes'

export interface Language {
  id: number
  name: string
  code: string
}
export const useLanguageStore = defineStore('language', {
  state: () => ({
    languages: [] as Language[],
    languagesIsLoading: false,
  }),
  actions: {
    async fetchAllLanguages(params?: GlobalParams) {
      const { showToast } = useToaster()
      try {
        this.languagesIsLoading = true
        const response = await LanguageService.getAllLanguages(params)
        this.languages = response.data.data.languages
        return response.data
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingAllLanguages')
        showToast({ tone: 'error', message: errorMessage })
        throw error
      } finally {
        this.languagesIsLoading = false
      }
    },
  },
  getters: {
    getLanguageOptions: (state) =>
      state.languages
        .map((language) => ({
          value: language.id.toString(),
          label: FirstLetterCapitalize(language.name),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
  },
})
