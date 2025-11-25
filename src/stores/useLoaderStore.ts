import { defineStore } from 'pinia'

interface LoaderState {
  isLoading: boolean
  loadingMessage: string | null
  loadingCount: number
}

export const useLoaderStore = defineStore('loader', {
  state: (): LoaderState => ({
    isLoading: false,
    loadingMessage: null,
    loadingCount: 0,
  }),

  actions: {
    showLoader(message?: string) {
      this.loadingCount++
      this.isLoading = true
      if (message) {
        this.loadingMessage = message
      }
    },

    hideLoader() {
      this.loadingCount = Math.max(0, this.loadingCount - 1)
      if (this.loadingCount === 0) {
        this.isLoading = false
        this.loadingMessage = null
      }
    },

    resetLoader() {
      this.isLoading = false
      this.loadingMessage = null
      this.loadingCount = 0
    },
  },
})
