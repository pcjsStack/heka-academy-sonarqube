<template>
  <BasePopupModal
    v-if="isOpen && file"
    width="95vw"
    max-width="1400px"
    :title="t('pages.uploadFiles.scormViewer.title')"
    :isHeader="true"
    @onClose="handleClose"
  >
    <div class="p-6">
      <!-- SCORM Content Container -->
      <div class="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style="height: 80vh">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <BaseIcon name="play" size="lg" color="primary" class="mb-4" />
            <BaseText
              :text="t('pages.uploadFiles.scormViewer.loading')"
              color="neutral"
              :tone="500"
              type="p-md"
            />
          </div>
        </div>

        <!-- SCORM Content iframe -->
        <div v-else-if="scormContentUrl" class="h-full">
          <iframe
            :src="scormContentUrl"
            class="w-full h-full border-0"
            frameborder="0"
            allowfullscreen
            @load="handleIframeLoad"
            @error="handleIframeError"
          >
            <BaseText
              :text="t('pages.uploadFiles.scormViewer.notSupported')"
              color="neutral"
              :tone="500"
            />
          </iframe>
        </div>

        <!-- Launch Button State -->
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center max-w-md">
            <BaseIcon name="play" size="lg" color="primary" class="mb-4" />
            <BaseText
              :text="t('pages.uploadFiles.scormViewer.readyToLaunch')"
              color="neutral"
              :tone="700"
              type="p-md"
              class="mb-2"
            />
            <BaseText
              :text="t('pages.uploadFiles.scormViewer.clickToLaunch')"
              color="neutral"
              :tone="500"
              type="p-sm"
              class="mb-4"
            />
            <div class="flex gap-3 justify-center">
              <BaseButton
                :text="t('pages.uploadFiles.scormViewer.launchInNewWindow')"
                variant="outline"
                size="md"
                color="primary"
                @click="handleLaunchInNewWindow"
              />
              <BaseButton
                :text="t('pages.uploadFiles.scormViewer.launchSCORM')"
                variant="default"
                size="md"
                color="primary"
                @click="handleLaunchInIframe"
              />
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="hasError" class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <BaseIcon name="add-circle" size="lg" color="primary" class="mb-4" />
            <BaseText
              :text="t('pages.uploadFiles.scormViewer.error')"
              color="primary"
              :tone="700"
              type="p-md"
              class="mb-2"
            />
            <BaseButton
              :text="t('pages.uploadFiles.scormViewer.retry')"
              variant="outline"
              size="md"
              color="primary"
              @click="handleRetry"
            />
          </div>
        </div>
      </div>

      <!-- File Information -->
      <div v-if="file" class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style="background-color: #1975ff1a"
          >
            <img :src="playIcon" alt="SCORM icon" class="w-6 h-6" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-neutral-700 text-base mb-1 truncate">
              {{ file.customFileName || file.fileName }}
            </h3>
            <p class="text-sm text-neutral-500 mb-2">
              {{ formatFileSize(file.size) }} • SCORM Package
            </p>
          </div>
        </div>
      </div>
    </div>
  </BasePopupModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BasePopupModal, BaseText, BaseIcon, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import type { Media } from '@/types/Media'
import playIcon from '@/assets/images/play.svg'

const props = defineProps<{
  isOpen: boolean
  file: Media | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isLoading = ref(false)
const hasError = ref(false)
const scormContentUrl = ref<string | null>(null)

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleClose = () => {
  // Reset state when closing
  scormContentUrl.value = null
  isLoading.value = false
  hasError.value = false
  emit('close')
}

const handleLaunchInNewWindow = () => {
  if (props.file?.url) {
    // Open SCORM content in a new window/tab
    window.open(props.file.url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
  }
}

const handleLaunchInIframe = async () => {
  if (!props.file?.url) return

  isLoading.value = true
  hasError.value = false

  try {
    // For now, we'll use the direct URL
    // In a real implementation, you would:
    // 1. Send the SCORM file to your backend
    // 2. Backend extracts the SCORM package
    // 3. Backend serves the extracted content
    // 4. Return the URL to the main SCORM HTML file

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // This would be replaced with the actual extracted SCORM content URL
    // scormContentUrl.value = `${process.env.VUE_APP_API_URL}/scorm/extracted/${props.file.id}/index.html`
    scormContentUrl.value = props.file.url
  } catch (error) {
    console.error('Error launching SCORM content:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

const handleIframeLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleIframeError = () => {
  isLoading.value = false
  hasError.value = true
}

const handleRetry = () => {
  hasError.value = false
  handleLaunchInIframe()
}
</script>
