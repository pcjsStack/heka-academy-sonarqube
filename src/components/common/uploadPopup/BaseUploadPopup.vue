<template>
  <Transition name="slide-up">
    <div v-if="shouldShowPopup" class="fixed bottom-4 right-4 z-[99999998]">
      <!-- Collapsed State -->
      <div
        v-if="!isExpanded"
        class="bg-white rounded-lg shadow-lg border border-neutral-200 px-4 py-3 flex items-center gap-3 cursor-pointer min-w-[180px] hover:shadow-xl transition-shadow"
        @click="expand"
      >
        <BaseText
          :text="collapsedText"
          tailwindCss="!text-neutral-700 !text-sm !font-medium flex-1"
        />
        <BaseIcon
          name="chevron-up"
          size="sm"
          class="text-neutral-500 cursor-pointer shrink-0"
          @click.stop="expand"
        />
        <BaseIcon
          name="clear"
          size="sm"
          class="text-neutral-500 cursor-pointer shrink-0"
          @click.stop="handleClose"
        />
      </div>

      <!-- Expanded State -->
      <div
        v-else
        class="bg-white rounded-lg shadow-xl border border-neutral-200 w-[400px] max-w-[calc(100vw-2rem)]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <BaseText
            :text="expandedTitle"
            tailwindCss="!text-neutral-900 !text-base !font-semibold"
          />
          <div class="flex items-center gap-2">
            <BaseButtonIcon
              icon="chevron-down"
              size="xs"
              variant="blank"
              color="neutral"
              tailwindCss="w-6 h-6 rounded-full hover:bg-neutral-100"
              @onClick="collapse"
            />
            <BaseButtonIcon
              icon="clear"
              size="xs"
              variant="blank"
              color="neutral"
              tailwindCss="w-6 h-6 rounded-full hover:bg-neutral-100"
              @onClick="handleClose"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="px-5 py-4">
          <!-- Active Uploads Section -->
          <template v-if="activeUploads.length > 0">
            <!-- Status Message and Cancel All Button -->
            <div class="flex items-center justify-between mb-3">
              <BaseText :text="statusMessage" tailwindCss="!text-neutral-600 !text-sm" />
              <BaseButton
                v-if="activeUploads.length > 1"
                :text="t('pages.uploadPopup.cancelAll')"
                variant="link"
                color="primary"
                size="sm"
                font="medium"
                :fullSize="false"
                tailwindCss="!text-primary-550 hover:!text-primary-600 !p-0 !h-auto !min-w-0 !w-auto shrink-0"
                @onClick="handleCancelAllClick"
              />
            </div>

            <!-- Active Upload Items -->
            <div v-for="upload in activeUploads" :key="upload.id" class="mb-3 last:mb-0 group">
              <!-- File Name and Progress Indicator with Hover Cancel -->
              <div class="flex items-center gap-3 relative">
                <BaseText
                  :text="upload.fileName"
                  tailwindCss="!text-neutral-900 !text-sm !font-medium flex-1 truncate"
                />
                <div class="relative w-[36px] h-[36px] flex items-center justify-center shrink-0">
                  <!-- Progress bar - hidden on hover -->
                  <div class="absolute inset-0 group-hover:opacity-0 transition-opacity">
                    <BaseCircularProgress :value="upload.progress" size="sm" color="primary" />
                  </div>
                  <!-- Cancel button - shown on hover, same size as progress -->
                  <div
                    class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto flex items-center justify-center"
                  >
                    <div
                      class="w-[36px] h-[36px] rounded-full bg-neutral-900/50 flex items-center justify-center"
                    >
                      <BaseButtonIcon
                        icon="clear"
                        size="xs"
                        variant="blank"
                        tailwindCss="!w-auto !h-auto"
                        iconClass="text-white"
                        @onClick="handleCancelSingleUpload(upload.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Completed Uploads Section -->
          <template v-if="completedUploads.length > 0">
            <div class="border-t border-neutral-200 pt-4 mt-4">
              <div
                v-for="upload in completedUploads"
                :key="upload.id"
                class="flex items-center gap-3 mb-2 last:mb-0"
              >
                <BaseIcon name="file-outline" size="sm" class="text-neutral-400 shrink-0" />
                <BaseText
                  :text="upload.fileName"
                  tailwindCss="!text-neutral-900 !text-sm !font-medium flex-1 truncate"
                />
                <div class="w-[36px] h-[36px] flex items-center justify-center shrink-0">
                  <BaseIcon name="check-circle" size="sm" class="text-success-600" />
                </div>
              </div>
            </div>
          </template>

          <!-- Cancelled Uploads Section -->
          <template v-if="cancelledUploads.length > 0">
            <div class="border-t border-neutral-200 pt-4 mt-4">
              <div
                v-for="upload in cancelledUploads"
                :key="upload.id"
                class="flex items-center gap-3 mb-2 last:mb-0"
              >
                <BaseIcon name="file-outline" size="sm" class="text-neutral-400 shrink-0" />
                <BaseText
                  :text="upload.fileName"
                  tailwindCss="!text-neutral-500 !text-sm !font-medium flex-1 truncate"
                />
                <BaseText
                  :text="t('pages.uploadPopup.uploadCancelled')"
                  tailwindCss="!text-neutral-400 !text-xs"
                />
              </div>
            </div>
          </template>

          <!-- Show message if no uploads -->
          <div
            v-if="
              activeUploads.length === 0 &&
              cancelledUploads.length === 0 &&
              completedUploads.length === 0
            "
            class="text-center py-4"
          >
            <BaseText
              :text="t('pages.uploadPopup.noActiveUploads')"
              tailwindCss="!text-neutral-500 !text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUploadPopupStore } from '@/stores/uploadPopup'
import BaseIcon from '../icon/BaseIcon.vue'
import BaseText from '../text/BaseText.vue'
import BaseCircularProgress from '../circularProgress/BaseCircularProgress.vue'
import BaseButton from '../button/BaseButton.vue'
import BaseButtonIcon from '../button/BaseButtonIcon.vue'
import { t } from '@/utils/i18n'

const uploadPopupStore = useUploadPopupStore()

const isExpanded = computed(() => uploadPopupStore.isExpanded)
const activeUploads = computed(() => uploadPopupStore.activeUploads)
const cancelledUploads = computed(() => uploadPopupStore.cancelledUploads)
const completedUploads = computed(() => uploadPopupStore.completedUploads)
const uploadCount = computed(() => uploadPopupStore.uploadCount)
const cancelledCount = computed(() => uploadPopupStore.cancelledCount)
const completedCount = computed(() => uploadPopupStore.completedCount)
const hasActiveUploads = computed(() => uploadPopupStore.hasActiveUploads)
const hasCancelledUploads = computed(() => uploadPopupStore.hasCancelledUploads)
const hasCompletedUploads = computed(() => uploadPopupStore.hasCompletedUploads)

const shouldShowPopup = computed(() => {
  return (
    uploadPopupStore.isVisible &&
    (hasActiveUploads.value ||
      hasCompletedUploads.value ||
      (hasCancelledUploads.value && uploadPopupStore.showCancelledUploads))
  )
})

const collapsedText = computed(() => {
  if (hasActiveUploads.value) {
    const count = uploadCount.value
    return count === 1
      ? t('pages.uploadPopup.uploadingOneItem')
      : t('pages.uploadPopup.uploadingItems', { count: count.toString() })
  }
  if (hasCompletedUploads.value) {
    const count = completedCount.value
    return count === 1
      ? t('pages.uploadPopup.oneUploadComplete')
      : t('pages.uploadPopup.uploadsComplete', { count: count.toString() })
  }
  if (hasCancelledUploads.value) {
    const count = cancelledCount.value
    return count === 1
      ? t('pages.uploadPopup.oneUploadCancelled')
      : t('pages.uploadPopup.uploadsCancelled', { count: count.toString() })
  }
  return ''
})

const expandedTitle = computed(() => {
  if (hasActiveUploads.value) {
    const count = uploadCount.value
    return count === 1
      ? t('pages.uploadPopup.uploadingOneItem')
      : t('pages.uploadPopup.uploadingItems', { count: count.toString() })
  }
  if (hasCompletedUploads.value) {
    const count = completedCount.value
    return count === 1
      ? t('pages.uploadPopup.oneUploadComplete')
      : t('pages.uploadPopup.uploadsComplete', { count: count.toString() })
  }
  if (hasCancelledUploads.value) {
    const count = cancelledCount.value
    return count === 1
      ? t('pages.uploadPopup.oneUploadCancelled')
      : t('pages.uploadPopup.uploadsCancelled', { count: count.toString() })
  }
  return ''
})

const statusMessage = computed(() => {
  if (activeUploads.value.length > 0 && activeUploads.value[0]) {
    // Use the first upload's status message, or show a general message
    const firstUpload = activeUploads.value[0]
    return firstUpload.statusMessage || t('pages.uploadPopup.uploading')
  }
  return ''
})

const expand = () => {
  uploadPopupStore.expand()
}

const collapse = () => {
  uploadPopupStore.collapse()
}

const handleClose = () => {
  if (hasActiveUploads.value) {
    // Show cancel modal if there are active uploads
    uploadPopupStore.openCancelModal()
  } else {
    // Just hide if no active uploads
    uploadPopupStore.hidePopup()
  }
}

const handleCancelSingleUpload = (id: string) => {
  // Open cancel modal when clicking cancel button on individual upload
  uploadPopupStore.openCancelModal()
  // Store the upload ID to cancel if user confirms
  uploadPopupStore.setPendingCancelId(id)
}

const handleCancelAllClick = () => {
  // Open cancel modal for cancelling all uploads
  uploadPopupStore.openCancelModal()
  // Clear any pending single cancel ID
  uploadPopupStore.setPendingCancelId(null)
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
