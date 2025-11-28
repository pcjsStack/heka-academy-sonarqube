import { defineStore } from 'pinia'
import { uploadFilesService } from '@/services/uploadFiles'
import { useToaster } from '@/composables/useToaster'
import { t } from '@/utils/i18n'
import type { GetFilesParams, UpdateFileParams, UploadFileResponse } from '@/types/uploadFiles'
import { VisibilityStatus } from '@/types/Course'

export const useUploadFilesStore = defineStore('uploadFiles', {
  state: () => ({
    files: [] as UploadFileResponse[],
    totalFiles: 0,
    totalPages: 0,
    currentPage: 0,
    isLoading: false,
  }),
  actions: {
    addFile(file: UploadFileResponse) {
      this.files.push(file)
    },
    async uploadFiles(files: File[], visibility: VisibilityStatus) {
      const { showToast } = useToaster()
      try {
        const formData = new FormData()
        files.forEach((file) => {
          formData.append('files', file)
        })
        formData.append('visibility', visibility)
        formData.append('status', 'published')
        const response = await uploadFilesService.uploadFiles(formData)
        console.log('response', response)
        return response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.uploadingFiles')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async fetchFiles(params: GetFilesParams, append = false) {
      const { showToast } = useToaster()
      try {
        this.isLoading = true
        const response = await uploadFilesService.getFiles(params)

        if (append) {
          // Append new files to existing list
          this.files = [...this.files, ...response.data]
        } else {
          // Replace files list
          this.files = response.data
        }

        this.totalFiles = response.total
        this.totalPages = response.totalPage
        this.currentPage = params.page || 0
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.fetchingFiles')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async loadMoreFiles(params: Omit<GetFilesParams, 'page'>) {
      if (this.isLoading || this.currentPage >= this.totalPages) {
        return
      }

      const nextPage = this.currentPage + 1
      return this.fetchFiles({ ...params, page: nextPage }, true)
    },

    resetFiles() {
      this.files = []
      this.totalFiles = 0
      this.totalPages = 0
      this.currentPage = 1
      this.isLoading = false
    },
    async deleteFile(fileIds: string[], deleteType: 'soft' | 'hard') {
      const { showToast } = useToaster()
      try {
        const response = await uploadFilesService.deleteFile(fileIds, deleteType)
        showToast({
          tone: 'success',
          message: t('types.success.deletingFile'),
        })
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.deletingFile')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async updateFileDetails(data: UpdateFileParams) {
      const { showToast } = useToaster()
      try {
        const response = await uploadFilesService.updateFileDetails(data)
        showToast({
          tone: 'success',
          message: t('types.success.updatingFile'),
        })
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('types.error.updatingFile')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
  },
  getters: {
    allFiles: (state) => state.files,
  },
})
