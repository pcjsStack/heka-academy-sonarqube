<template>
  <BasePopupModal
    v-if="isVisible"
    size="md"
    :close-button="true"
    :title="modalTitle"
    @onClose="handleContinue"
  >
    <div class="flex flex-col gap-6 py-4 overflow-y-auto px-6">
      <div class="flex flex-col gap-2">
        <BaseText :text="modalDescription" tailwindCss="!text-neutral-600 !text-sm" />
      </div>

      <div class="flex items-center justify-end gap-3">
        <BaseButton
          :text="t('pages.uploadPopup.cancelAll.continueUploads')"
          color="primary"
          @onClick="handleContinue"
        />
        <BaseButton
          :text="cancelButtonText"
          variant="outline"
          color="primary"
          @onClick="handleCancelAll"
        />
      </div>
    </div>
  </BasePopupModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUploadPopupStore } from '@/stores/uploadPopup'
import BasePopupModal from '../modals/BasePopupModal.vue'
import BaseText from '../text/BaseText.vue'
import BaseButton from '../button/BaseButton.vue'
import { t } from '@/utils/i18n'

const uploadPopupStore = useUploadPopupStore()

const isVisible = computed(() => uploadPopupStore.showCancelModal)

const modalTitle = computed(() => {
  return uploadPopupStore.pendingCancelId
    ? t('pages.uploadPopup.cancelSingle.title')
    : t('pages.uploadPopup.cancelAll.title')
})

const modalDescription = computed(() => {
  return uploadPopupStore.pendingCancelId
    ? t('pages.uploadPopup.cancelSingle.description')
    : t('pages.uploadPopup.cancelAll.description')
})

const cancelButtonText = computed(() => {
  return uploadPopupStore.pendingCancelId
    ? t('pages.uploadPopup.cancelSingle.cancelUpload')
    : t('pages.uploadPopup.cancelAll.cancelUploads')
})

const handleContinue = () => {
  // If this was triggered by refresh attempt, allow refresh for this attempt only
  if (uploadPopupStore.isRefreshAttempted) {
    uploadPopupStore.setAllowRefresh(true)
    uploadPopupStore.setRefreshAttempted(false)
    uploadPopupStore.closeCancelModal()
    // Note: allowRefresh will be reset in beforeUnload handler or by visibility/focus listeners
    // if user doesn't actually refresh
    return
  }

  uploadPopupStore.closeCancelModal()
}

const handleCancelAll = () => {
  // If there's a pending cancel ID, cancel only that upload
  if (uploadPopupStore.pendingCancelId) {
    uploadPopupStore.cancelUpload(uploadPopupStore.pendingCancelId)
  } else {
    // Otherwise cancel all uploads
    uploadPopupStore.cancelAllUploads()
  }

  // If this was triggered by refresh attempt, reload the page
  if (uploadPopupStore.isRefreshAttempted) {
    uploadPopupStore.setAllowRefresh(true)
    uploadPopupStore.setRefreshAttempted(false)
    uploadPopupStore.closeCancelModal()
    // Reload the page after a short delay to ensure state is saved
    setTimeout(() => {
      window.location.reload()
    }, 100)
    return
  }

  uploadPopupStore.closeCancelModal()
  // Only hide popup if no active uploads remain
  if (!uploadPopupStore.hasActiveUploads) {
    uploadPopupStore.hidePopup()
  }
}
</script>
