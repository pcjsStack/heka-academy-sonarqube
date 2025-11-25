<template>
  <div
    id="icon"
    :class="[
      {
        'h-13 w-13': size == '6xl',
        'h-12 w-12': size == '5xl',
        'h-11 w-11': size == '4xl',
        'h-10 w-10': size == '3xl',
        'h-9 w-9': size == '2xl',
        'h-8 w-8': size == 'xl',
        'h-7 w-7': size == 'lg',
        'h-6 w-6': size == 'md',
        'h-5 w-5': size == 'sm',
        'h-4 w-4': size == 'xs',
        'h-3 w-3': size == '2xs',
        'h-full w-full': !size,
        'animate-spin': spin,
      },
      iconCutomSize,
    ]"
    class="flex items-center justify-center"
  >
    <icomoon :class="iconClasses" :icon-set="selection" :name="name" />
  </div>
</template>

<script lang="ts" setup>
import selection from './selection.json'
import { Icomoon } from 'vue-icomoon'
import { computed } from 'vue'
import { type Icons } from '@/types/Styles'

const props = defineProps<{
  name: Icons
  spin?: boolean
  size?: '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | '2xs'
  color?: string
  iconCutomSize?: string
}>()

const iconClasses = computed(() => {
  if (!props.color) return []

  // If color already contains a dash (e.g., "neutral-700", "red-500"), use it as-is with text- prefix
  if (props.color.includes('-')) {
    return [`text-${props.color}`]
  }

  // Map simple color names to Tailwind classes
  const colorMap: Record<string, string> = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    success: 'text-success-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
    info: 'text-info-600',
    neutral: 'text-neutral-600',
    red: 'text-red-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600',
    grey: 'text-gray-600',
    white: 'text-white',
    purple: 'text-purple-600',
  }

  const colorClass = colorMap[props.color.toLowerCase()] || `text-${props.color}-600`
  return [colorClass]
})
</script>

<style scoped>
svg {
  width: 100% !important;
  height: 100% !important;
}
</style>
