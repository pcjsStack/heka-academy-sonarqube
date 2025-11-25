<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onBeforeUnmount } from 'vue'
import { BaseToaster, BaseLoader, BaseUploadPopup, CancelUploadModal } from './components/common'
import { useToasterStore } from '@/stores/toaster'
import { useLoaderStore } from '@/stores/useLoaderStore'
import { useUploadPopupStore } from '@/stores/uploadPopup'

const toaster = useToasterStore()
const loaderStore = useLoaderStore()
const uploadPopupStore = useUploadPopupStore()

onMounted(() => {
  // Check for active uploads on page refresh (only if there were uploads before unload)
  // This will show the popup but NOT the cancel modal
  uploadPopupStore.checkForActiveUploadsOnRefresh()

  // Intercept keyboard refresh attempts (F5, Ctrl+R, Ctrl+Shift+R)
  const keyboardHandler = (event: KeyboardEvent) => {
    // Check for refresh shortcuts
    const isRefreshKey =
      event.key === 'F5' ||
      (event.ctrlKey && event.key === 'r') ||
      (event.ctrlKey && event.shiftKey && event.key === 'R') ||
      (event.metaKey && event.key === 'r') // Cmd+R on Mac

    if (isRefreshKey && uploadPopupStore.hasActiveUploads) {
      // Check if refresh should be allowed (one-time flag)
      const shouldAllowRefresh = uploadPopupStore.allowRefresh

      // Reset allowRefresh immediately so next attempt will show modal again
      if (uploadPopupStore.allowRefresh) {
        uploadPopupStore.setAllowRefresh(false)
      }

      // If refresh is not allowed, block and show modal
      if (!shouldAllowRefresh) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        // Show our custom modal
        uploadPopupStore.openCancelModal()
        uploadPopupStore.setRefreshAttempted(true)

        // Return false to prevent any further handling
        return false
      }
      // If refresh is allowed, let it proceed (don't prevent default)
    }
  }

  // Intercept browser refresh button clicks and navigation
  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    // Only handle if there are active uploads
    if (!uploadPopupStore.hasActiveUploads) {
      return undefined
    }

    // Check if refresh should be allowed (one-time flag)
    const shouldAllowRefresh = uploadPopupStore.allowRefresh

    // Reset allowRefresh immediately so next attempt will show modal again
    if (uploadPopupStore.allowRefresh) {
      uploadPopupStore.setAllowRefresh(false)
    }

    // If refresh is not allowed, block navigation
    if (!shouldAllowRefresh) {
      // Mark that refresh was attempted
      uploadPopupStore.setRefreshAttempted(true)

      // Block navigation - browser will show its default dialog
      // Note: We can't prevent the browser dialog completely due to security restrictions
      // The keyboard handler already shows our custom modal for keyboard shortcuts
      // For browser refresh button, the browser dialog will appear, but if user cancels it,
      // they can use keyboard shortcuts which will show our modal
      event.preventDefault()
      event.returnValue = ''
      return event
    }

    // If refresh is allowed, track state and allow
    const result = uploadPopupStore.handleBeforeUnload(event)
    return result
  }

  // Listen for keyboard events
  window.addEventListener('keydown', keyboardHandler, true) // Use capture phase

  // Listen for beforeunload (for browser refresh button, navigation, etc.)
  window.addEventListener('beforeunload', beforeUnloadHandler)

  // Clean up on unmount
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', keyboardHandler, true)
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  })
})
</script>

<template>
  <RouterView />
  <Teleport to="body">
    <BaseLoader :isLoading="loaderStore.isLoading" :message="loaderStore.loadingMessage || ''" />
    <BaseToaster
      v-for="toast in toaster.toasts"
      :key="toast.id"
      :message="toast.message"
      :tone="toast.tone"
      :position="toast.position"
      :duration="toast.duration"
      :leftIcon="toast.leftIcon"
      @close="toaster.removeToast(toast.id)"
    />
    <BaseUploadPopup />
    <CancelUploadModal />
  </Teleport>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
