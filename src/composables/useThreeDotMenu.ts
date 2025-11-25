import { ref } from 'vue'

// Global state to track which menu is currently open
const currentOpenMenuId = ref<string | null>(null)

export function useThreeDotMenu(menuId: string) {
  const isOpen = ref(false)

  const open = () => {
    // Close any previously open menu
    if (currentOpenMenuId.value && currentOpenMenuId.value !== menuId) {
      // Trigger close event for other menus
      window.dispatchEvent(
        new CustomEvent('close-three-dot-menu', { detail: { menuId: currentOpenMenuId.value } }),
      )
    }
    isOpen.value = true
    currentOpenMenuId.value = menuId
  }

  const close = () => {
    isOpen.value = false
    if (currentOpenMenuId.value === menuId) {
      currentOpenMenuId.value = null
    }
  }

  const toggle = () => {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  // Listen for close events from other menus
  const handleCloseEvent = (event: Event) => {
    const customEvent = event as CustomEvent
    if (customEvent.detail?.menuId === menuId) {
      isOpen.value = false
    }
  }

  return {
    isOpen,
    open,
    close,
    toggle,
    handleCloseEvent,
  }
}
