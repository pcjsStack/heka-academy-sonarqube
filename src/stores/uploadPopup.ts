import { defineStore } from 'pinia'
import { uploadFilesService } from '@/services/uploadFiles'
import { VisibilityStatus } from '@/types/Course'

export type UploadItem = {
  id: string
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error' | 'cancelled'
  statusMessage?: string
  fileSize?: number
  abortController?: AbortController
}

export type UploadPopupState = {
  isVisible: boolean
  isExpanded: boolean
  uploads: UploadItem[]
  showCancelModal: boolean
  showCancelledUploads: boolean
  pendingCancelId: string | null
  allowRefresh: boolean
  isRefreshAttempted: boolean
}

export const useUploadPopupStore = defineStore('uploadPopup', {
  state: (): UploadPopupState => ({
    isVisible: false, // Only show when there are active uploads
    isExpanded: false,
    uploads: [], // Start with empty array - uploads added dynamically
    showCancelModal: false,
    showCancelledUploads: false,
    pendingCancelId: null,
    allowRefresh: false,
    isRefreshAttempted: false,
  }),
  getters: {
    activeUploads: (state) => state.uploads.filter((upload) => upload.status === 'uploading'),
    cancelledUploads: (state) => state.uploads.filter((upload) => upload.status === 'cancelled'),
    completedUploads: (state) => state.uploads.filter((upload) => upload.status === 'completed'),
    uploadCount() {
      return this.activeUploads.length
    },
    cancelledCount() {
      return this.cancelledUploads.length
    },
    completedCount() {
      return this.completedUploads.length
    },
    hasActiveUploads() {
      return this.activeUploads.length > 0
    },
    hasCancelledUploads() {
      return this.cancelledUploads.length > 0
    },
    hasCompletedUploads() {
      return this.completedUploads.length > 0
    },
  },
  actions: {
    addUpload(file: File | { fileName: string; fileSize?: number }) {
      const id = Date.now().toString() + Math.random().toString(36).substring(7)
      const fileName = file instanceof File ? file.name : file.fileName
      const fileSize = file instanceof File ? file.size : file.fileSize

      const upload: UploadItem = {
        id,
        fileName,
        progress: 0,
        status: 'uploading',
        statusMessage: 'Starting upload...',
        fileSize,
      }

      this.uploads.push(upload)
      // Show popup and expand when uploads start
      this.isVisible = true
      this.isExpanded = true
      return id
    },
    updateUploadProgress(id: string, progress: number, statusMessage?: string) {
      const upload = this.uploads.find((u) => u.id === id)
      if (upload) {
        upload.progress = Math.min(Math.max(progress, 0), 100)
        if (statusMessage) {
          upload.statusMessage = statusMessage
        }
      }
    },
    completeUpload(id: string) {
      const upload = this.uploads.find((u) => u.id === id)
      if (upload) {
        upload.status = 'completed'
        upload.progress = 100
        upload.statusMessage = 'Upload complete'
      }
      // Don't auto-hide popup - let user close it manually
    },
    setUploadError(id: string, errorMessage?: string) {
      const upload = this.uploads.find((u) => u.id === id)
      if (upload) {
        upload.status = 'error'
        upload.statusMessage = errorMessage || 'Upload failed'
      }
    },
    cancelUpload(id: string) {
      // Abort the upload request if it exists
      const upload = this.uploads.find((u) => u.id === id)
      if (
        upload &&
        (upload as UploadItem & { abortController?: AbortController }).abortController
      ) {
        ;(upload as UploadItem & { abortController?: AbortController }).abortController?.abort()
      }

      if (upload) {
        upload.status = 'cancelled'
        upload.statusMessage = 'Upload cancelled'
        this.showCancelledUploads = true
        // Keep popup visible to show cancelled state
        this.isVisible = true
      }
      // Remove cancelled uploads after a delay
      setTimeout(() => {
        this.removeUpload(id)
        if (this.cancelledUploads.length === 0) {
          this.showCancelledUploads = false
          // Hide popup if no active uploads remain
          if (!this.hasActiveUploads) {
            this.hidePopup()
          }
        }
      }, 3000)
    },
    cancelAllUploads() {
      this.uploads.forEach((upload) => {
        if (upload.status === 'uploading') {
          // Abort the upload request if it exists
          if ((upload as UploadItem & { abortController?: AbortController }).abortController) {
            ;(upload as UploadItem & { abortController?: AbortController }).abortController?.abort()
          }
          upload.status = 'cancelled'
          upload.statusMessage = 'Upload cancelled'
        }
      })
      this.showCancelledUploads = true
      // Keep popup visible to show cancelled state
      this.isVisible = true
      // Remove all cancelled uploads after a delay
      setTimeout(() => {
        this.uploads = this.uploads.filter((u) => u.status !== 'cancelled')
        if (this.uploads.length === 0) {
          this.hidePopup()
          this.showCancelledUploads = false
        }
      }, 3000)
    },
    removeUpload(id: string) {
      this.uploads = this.uploads.filter((u) => u.id !== id)
      if (this.uploads.length === 0) {
        this.hidePopup()
      }
    },
    toggleExpand() {
      this.isExpanded = !this.isExpanded
    },
    expand() {
      this.isExpanded = true
    },
    collapse() {
      this.isExpanded = false
    },
    showPopup() {
      this.isVisible = true
    },
    hidePopup() {
      this.isVisible = false
      this.isExpanded = false
    },
    openCancelModal() {
      this.showCancelModal = true
    },
    closeCancelModal() {
      this.showCancelModal = false
      this.pendingCancelId = null
      // Reset allowRefresh when modal closes (unless refresh is in progress)
      // This ensures modal shows again on next refresh attempt
      if (!this.isRefreshAttempted) {
        // Only reset if not currently attempting refresh
        setTimeout(() => {
          if (!this.isRefreshAttempted) {
            this.allowRefresh = false
          }
        }, 100)
      }
    },
    setAllowRefresh(allow: boolean) {
      this.allowRefresh = allow
    },
    setRefreshAttempted(attempted: boolean) {
      this.isRefreshAttempted = attempted
    },
    setPendingCancelId(id: string | null) {
      this.pendingCancelId = id
    },
    clearAll() {
      this.uploads = []
      this.hidePopup()
      this.showCancelledUploads = false
    },
    // Handle page refresh - show popup if there are active uploads (without modal)
    // Only show popup if this is an actual page refresh (not initial load)
    checkForActiveUploadsOnRefresh() {
      // Check if there were active uploads when page was unloaded
      const hadActiveUploadsOnUnload = sessionStorage.getItem('hadActiveUploads') === 'true'

      // Only show popup (not modal) if there were uploads on unload AND we still have active uploads
      if (hadActiveUploadsOnUnload && this.hasActiveUploads) {
        // Just show the popup, don't open the cancel modal
        this.isVisible = true
        this.expand()
      }

      // Clear the flag after checking
      sessionStorage.removeItem('hadActiveUploads')
      // Reset refresh flags
      this.allowRefresh = false
      this.isRefreshAttempted = false
    },
    // Call this before page unload - only track state, don't block (we handle blocking via keyboard intercept)
    handleBeforeUnload(event: BeforeUnloadEvent) {
      // If refresh is allowed or no active uploads, track state and allow refresh
      if (this.allowRefresh || !this.hasActiveUploads) {
        if (this.hasActiveUploads) {
          sessionStorage.setItem('hadActiveUploads', 'true')
        } else {
          sessionStorage.removeItem('hadActiveUploads')
        }
        // Allow refresh
        return undefined
      }

      // If there are active uploads and user hasn't confirmed, block refresh
      // But don't return a value to prevent browser dialog - we handle it with our modal
      event.preventDefault()
      event.returnValue = ''

      // Show our cancel modal (this will be handled by the keyboard intercept)
      // Just track that refresh was attempted
      this.isRefreshAttempted = true

      // Return empty string to block but not show browser dialog
      return ''
    },
    // Handle keyboard refresh attempts (F5, Ctrl+R, etc.)
    handleRefreshAttempt(event?: KeyboardEvent) {
      if (this.hasActiveUploads && !this.allowRefresh) {
        // Prevent default refresh
        if (event) {
          event.preventDefault()
          event.stopPropagation()
        }

        // Show our cancel modal
        this.openCancelModal()
        this.isRefreshAttempted = true

        return true // Indicates refresh was blocked
      }
      return false // Refresh allowed
    },
    // Upload multiple files using streaming API
    async uploadFileStream(
      files: File[],
      visibility: VisibilityStatus = VisibilityStatus.SHOW,
      status: string = 'published',
      onProgress?: (fileIndex: number, progress: number, statusMessage?: string) => void,
    ) {
      if (!files || files.length === 0) {
        throw new Error('No files provided for upload')
      }

      const uploadIds: string[] = []
      const uploadPromises: Promise<string>[] = []

      // Create upload items for all files (this will show and expand the popup)
      files.forEach((file) => {
        const uploadId = this.addUpload(file)
        uploadIds.push(uploadId)
      })

      // Upload each file individually
      files.forEach((file, fileIndex) => {
        const uploadId = uploadIds[fileIndex]
        if (!uploadId) {
          console.error(`Failed to create upload for file: ${file.name}`)
          return
        }

        const abortController = new AbortController()

        // Store abort controller for cancellation
        const upload = this.uploads.find((u) => u.id === uploadId)
        if (upload) {
          upload.abortController = abortController
        }

        // Create upload promise for this file
        // New Presigned URL Flow
        const uploadPromise = (async () => {
          try {
            // Step 1: Get Presigned URL
            const payload = {
              visibility,
              status,
            }
            const { url } = await uploadFilesService.getPresignedUrl(
              file.name,
              file.type || 'application/octet-stream',
              file.size,
              payload,
            )

            if (abortController.signal.aborted) throw new Error('Cancelled')

            // Step 2: Upload to S3
            await uploadFilesService.uploadToS3(
              url,
              file,
              (progress) => {
                // Update progress for this specific file
                this.updateUploadProgress(uploadId, progress)

                // Calculate time remaining estimate
                let statusMessage = 'Uploading...'
                if (progress > 0 && progress < 100) {
                  const remaining = 100 - progress
                  if (remaining < 10) {
                    statusMessage = 'Less than a minute left'
                  } else if (remaining < 30) {
                    statusMessage = '1 min left...'
                  } else if (remaining < 60) {
                    statusMessage = '2 min left...'
                  } else {
                    statusMessage = 'Uploading...'
                  }
                }

                this.updateUploadProgress(uploadId, progress, statusMessage)

                // Call external progress callback if provided
                if (onProgress) {
                  onProgress(fileIndex, progress, statusMessage)
                }
              },
              abortController.signal,
            )

            if (abortController.signal.aborted) throw new Error('Cancelled')

            this.completeUpload(uploadId)
            return uploadId
          } catch (error) {
            console.log('error', error)
            // Check if it was cancelled
            if (abortController.signal.aborted || (error as Error).message === 'Cancelled') {
              this.cancelUpload(uploadId)
              throw error
            }

            const errorMessage = error instanceof Error ? error.message : String(error)
            this.setUploadError(uploadId, errorMessage)
            throw error
          }
        })()

        uploadPromises.push(uploadPromise)
      })

      // Wait for all uploads to complete (or fail)
      // Use Promise.allSettled to continue even if some fail
      const results = await Promise.allSettled(uploadPromises)

      // Return upload IDs and results
      return {
        uploadIds,
        results: results.map((result, index) => ({
          uploadId: uploadIds[index] || '',
          fileName: files[index]?.name || '',
          status: result.status,
          value: result.status === 'fulfilled' ? result.value : undefined,
          reason: result.status === 'rejected' ? result.reason : undefined,
        })),
      }
    },
  },
})
