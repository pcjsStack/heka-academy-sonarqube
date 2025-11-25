import { defineStore } from 'pinia'
import type { Icons } from '@/types/Styles'

export type ToastMessage = {
  id: string
  message: string
  tone?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  leftIcon?: Icons
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const useToasterStore = defineStore('toaster', {
  state: () => ({
    toasts: [] as ToastMessage[],
  }),
  actions: {
    addToast(toast: Omit<ToastMessage, 'id'>) {
      const id = Date.now().toString()
      this.toasts.push({ ...toast, id })

      setTimeout(() => {
        this.removeToast(id)
      }, toast.duration || 3000)
    },
    removeToast(id: string) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id)
    },
  },
})
