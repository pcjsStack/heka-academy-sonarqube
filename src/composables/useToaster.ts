import { useToasterStore } from '@/stores/toaster'

export function useToaster() {
  const toaster = useToasterStore()

  return {
    showToast: toaster.addToast,
  }
}
