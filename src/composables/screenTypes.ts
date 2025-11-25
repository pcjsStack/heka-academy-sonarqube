import { useMediaQuery } from '@vueuse/core'
import type { Ref } from 'vue'

export function isMobile(): Ref<boolean> {
  return useMediaQuery('(max-width: 768px)')
}

export function isMediumScreen(): Ref<boolean> {
  return useMediaQuery('(max-width: 1024px)')
}
