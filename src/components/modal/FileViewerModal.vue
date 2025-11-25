<script setup lang="ts">
import { computed, ref } from 'vue'
import { BasePopupModal, BaseText, BaseIcon } from '@/components/common'
import ScormPlayerModal from './ScormPlayerModal.vue'
import { t } from '@/utils/i18n'
import type { Media } from '@/types/Media'
import { CourseActionType } from '@/types/Course'

const props = defineProps<{
  isOpen: boolean
  file: Media | null
}>()

const emit = defineEmits<{
  (e: 'close', payload: { filetype: CourseActionType; percentage: number }): void
}>()

const percentage = ref(0)

// Get file extension from filename
const getFileExtension = (fileName: string | undefined): string => {
  if (!fileName) return ''
  const lastDot = fileName.lastIndexOf('.')
  return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : ''
}

// Determine file type based on MIME type and filename
const fileType = computed(() => {
  console.log('props.file', props.file)
  if (!props.file) return 'unknown'

  const mimeType = (props.file.mimeType || '').toLowerCase()
  const fileName = props.file.fileName?.toLowerCase() || ''
  const fileExtension = getFileExtension(props.file.fileName)

  // Image file extensions
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
  // Video file extensions
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp']
  // PDF extension
  const pdfExtensions = ['pdf']
  // SCORM/ZIP extensions
  const scormExtensions = ['zip']

  // Check MIME type first
  if (mimeType.includes('image')) return 'image'
  if (mimeType.includes('video')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('scorm')) return 'scorm'
  // Check for ZIP/SCORM files - handle "application/zip" and other zip MIME types
  if (mimeType.includes('zip') || mimeType === 'application/zip') return 'scorm'

  // Fallback to file extension if MIME type is incorrect or missing
  if (imageExtensions.includes(fileExtension)) return 'image'
  if (videoExtensions.includes(fileExtension)) return 'video'
  if (pdfExtensions.includes(fileExtension)) return 'pdf'
  if (scormExtensions.includes(fileExtension)) return 'scorm'

  // Check filename patterns for SCORM
  if (fileName.includes('scorm') || fileName.includes('imsmanifest.xml')) {
    return 'scorm'
  }

  return 'unknown'
})

// Format the file size and date for display
const fileInfo = computed(() => {
  if (!props.file) return null

  return {
    name: props.file.fileName,
    type: props.file.mimeType,
    date: props.file.createdAt
      ? new Date(props.file.createdAt).toLocaleDateString()
      : 'Unknown date',
    size: formatFileSize(props.file.size),
  }
})

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleClose = () => {
  console.log('isFinished', percentage.value)
  // if (isFinished.value) {
  //   emit('finish')
  // }
  emit('close', {
    filetype: CourseActionType.FILE_ASSET,
    percentage: fileType.value === 'scorm' ? percentage.value : 100,
  })
}

const getFileUrl = (file: Media) => {
  return file.url || `/api/files/${file.id}/download`
}

// Get modal title based on file type
const getModalTitle = () => {
  if (!props.file) return 'File Viewer'

  switch (fileType.value) {
    case 'image':
      return 'Image Viewer'
    case 'video':
      return 'Video Viewer'
    case 'pdf':
      return 'PDF Viewer'
    case 'scorm':
      return 'SCORM Viewer'
    default:
      return 'File Viewer'
  }
}
</script>

<template>
  <BasePopupModal
    v-if="isOpen && file"
    width="90vw"
    max-width="1200px"
    :title="getModalTitle()"
    :isHeader="true"
    @onClose="handleClose"
  >
    <div class="p-6">
      <!-- File Content Container -->
      <div class="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style="max-height: 70vh">
        <!-- Image Viewer -->
        <div v-if="fileType === 'image'">
          <img
            v-if="file.url"
            :src="getFileUrl(file)"
            :alt="fileInfo?.name || 'Image'"
            class="w-full h-auto object-contain"
            style="max-height: 70vh"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div v-else class="flex items-center justify-center h-64 text-gray-500">
            <div class="text-center">
              <BaseIcon name="image" size="lg" color="neutral" class="mb-2" />
              <BaseText
                :text="t('pages.uploadFiles.imageViewer.loading')"
                color="neutral"
                :tone="500"
              />
            </div>
          </div>
        </div>

        <!-- Video Viewer -->
        <div v-else-if="fileType === 'video'">
          <video
            v-if="file.url"
            :src="getFileUrl(file)"
            controls
            class="w-full h-auto object-contain"
            style="max-height: 70vh"
            preload="metadata"
          >
            <BaseText
              :text="t('pages.uploadFiles.videoViewer.notSupported')"
              color="neutral"
              :tone="500"
            />
          </video>
          <div v-else class="flex items-center justify-center h-64 text-gray-500">
            <div class="text-center">
              <BaseIcon name="play" size="lg" color="neutral" class="mb-2" />
              <BaseText
                :text="t('pages.uploadFiles.videoViewer.loading')"
                color="neutral"
                :tone="500"
              />
            </div>
          </div>
        </div>

        <!-- PDF Viewer -->
        <div v-else-if="fileType === 'pdf'">
          <iframe
            v-if="file.url"
            :src="getFileUrl(file)"
            class="w-full h-full"
            style="min-height: 70vh"
            frameborder="0"
          >
            <BaseText
              :text="t('pages.uploadFiles.pdfViewer.notSupported')"
              color="neutral"
              :tone="500"
            />
          </iframe>
          <div v-else class="flex items-center justify-center h-64 text-gray-500">
            <div class="text-center">
              <BaseIcon name="file" size="lg" color="neutral" class="mb-2" />
              <BaseText
                :text="t('pages.uploadFiles.pdfViewer.loading')"
                color="neutral"
                :tone="500"
              />
            </div>
          </div>
        </div>

        <!-- SCORM Viewer -->
        <div v-else-if="fileType === 'scorm'">
          <ScormPlayerModal v-if="file.url" :scorm-url="file.url" v-model:percentage="percentage" />
          <div v-else class="flex items-center justify-center h-64 text-gray-500">
            <div class="text-center">
              <BaseIcon name="play" size="lg" color="neutral" class="mb-2" />
              <BaseText
                :text="t('pages.uploadFiles.scormViewer.loading')"
                color="neutral"
                :tone="500"
              />
            </div>
          </div>
        </div>

        <!-- Unknown File Type -->
        <div v-else class="flex items-center justify-center h-64 text-gray-500">
          <div class="text-center">
            <BaseIcon name="file" size="lg" color="neutral" class="mb-2" />
            <BaseText
              :text="t('pages.uploadFiles.fileViewer.unsupportedType')"
              color="neutral"
              :tone="500"
            />
          </div>
        </div>
      </div>
    </div>
  </BasePopupModal>
</template>
