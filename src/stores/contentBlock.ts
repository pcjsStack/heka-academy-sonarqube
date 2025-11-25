import { defineStore } from 'pinia'
import contentBlockService from '@/services/contentblock'
import type { ContentBlockData, ContentBlockResponse } from '@/types/ContentBlock'
import type { Media } from '@/types/Media'
import { t } from '@/utils/i18n'
import { useToaster } from '@/composables/useToaster'

export const useContentBlockStore = defineStore('contentBlock', {
  state: () => ({
    contentBlocks: null as ContentBlockResponse | null,
  }),
  actions: {
    async fetchContentBlocks() {
      const { showToast } = useToaster()
      try {
        const response = await contentBlockService.getContentBlocks()
        this.contentBlocks = response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.fetchingContentBlocks')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async updateContentBlock(contentBlock: ContentBlockData) {
      const { showToast } = useToaster()
      try {
        const formData = new FormData()
        if (
          contentBlock.video &&
          Array.isArray(contentBlock.video) &&
          contentBlock.video.length > 0
        ) {
          formData.append('attachment', contentBlock.video[0] as File)
        }
        formData.append('description', contentBlock.description)
        formData.append('backgroundColor', contentBlock.backgroundColor || '')
        const response = await contentBlockService.updateContentBlock(formData)
        console.log('updateContentBlock response:', response)
        this.contentBlocks = response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.updatingContentBlock')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    // Save changes locally without API call - updates contentBlocks directly
    saveContentBlockLocally(contentBlock: ContentBlockData) {
      if (this.contentBlocks) {
        // Update existing contentBlocks with new data
        const videoItem =
          contentBlock.video && Array.isArray(contentBlock.video) && contentBlock.video.length > 0
            ? contentBlock.video[0]
            : null

        this.contentBlocks = {
          ...this.contentBlocks,
          description: contentBlock.description,
          backgroundColor: contentBlock.backgroundColor || '',
          // Store File or Media - File will be converted to Media by API on save
          attachment: videoItem as Media | File | null,
        } as ContentBlockResponse
      } else {
        // If no contentBlocks exist, create a temporary structure for local editing
        // This will be saved to API when handleSave is called
        const videoItem =
          contentBlock.video && Array.isArray(contentBlock.video) && contentBlock.video.length > 0
            ? contentBlock.video[0]
            : null

        this.contentBlocks = {
          id: 0,
          description: contentBlock.description,
          backgroundColor: contentBlock.backgroundColor || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          video: null,
          attachment: videoItem as Media | File | null,
        } as ContentBlockResponse
      }
    },

    // Save contentBlocks to API
    async saveContentBlock() {
      const { showToast } = useToaster()
      try {
        if (!this.contentBlocks) {
          console.log('No content blocks to save')
          return
        }

        const formData = new FormData()
        formData.append('description', this.contentBlocks.description || '')
        formData.append('backgroundColor', this.contentBlocks.backgroundColor || '')

        // Handle video attachment - could be File (new upload) or Media (existing from API)
        if (this.contentBlocks.attachment) {
          // If attachment is a File, append it directly to update/replace
          if (this.contentBlocks.attachment instanceof File) {
            formData.append('attachment', this.contentBlocks.attachment)
          }
          // If it's a Media object (has url property), it's already saved and we don't need to send it again
          // The API will keep the existing attachment unless we send a new File
        }

        const response = await contentBlockService.updateContentBlock(formData)
        console.log('saveContentBlock response:', response)
        this.contentBlocks = response
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('types.error.savingContentBlock')
        showToast({
          tone: 'error',
          message: errorMessage,
        })
        throw error
      }
    },
    async removeVideo() {
      if (this.contentBlocks) {
        this.contentBlocks = {
          ...this.contentBlocks,
          attachment: null,
        }
      }
    },
  },
})
