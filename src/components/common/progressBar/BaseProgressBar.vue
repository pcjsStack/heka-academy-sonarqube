<script setup lang="ts">
import { computed } from 'vue'

interface BaseProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  showLabel?: boolean
  label?: string
}

const props = withDefaults(defineProps<BaseProgressBarProps>(), {
  max: 100,
  size: 'md',
  color: 'primary',
  showLabel: false,
  label: '',
})

const percentage = computed(() => {
  return Math.min(Math.max((props.value / props.max) * 100, 0), 100)
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-1'
    case 'md':
      return 'h-2'
    case 'lg':
      return 'h-3'
    default:
      return 'h-2'
  }
})

const colorClasses = computed(() => {
  switch (props.color) {
    case 'primary':
      return 'bg-primary-950'
    case 'secondary':
      return 'bg-gray-500'
    case 'success':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'error':
      return 'bg-red-500'
    case 'info':
      return 'bg-blue-500'
    default:
      return 'bg-primary-950'
  }
})
</script>

<template>
  <div class="w-full">
    <div v-if="showLabel && label" class="flex justify-between items-center mb-1">
      <span class="text-sm font-medium text-gray-700">{{ label }}</span>
      <span class="text-sm text-gray-500">{{ Math.round(percentage) }}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full overflow-hidden">
      <div
        :class="[sizeClasses, colorClasses]"
        class="transition-all duration-300 ease-in-out"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
  </div>
</template>
