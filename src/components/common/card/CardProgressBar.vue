<script setup lang="ts">
import { computed } from 'vue'

interface CardProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'auto'
}

const props = withDefaults(defineProps<CardProgressBarProps>(), {
  max: 100,
  size: 'sm',
  color: 'auto',
})

const percentage = computed(() => {
  return Math.min(Math.max((props.value / props.max) * 100, 0), 100)
})

const roundedPercentage = computed(() => {
  return Math.round(percentage.value)
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-2'
    case 'md':
      return 'h-2.5'
    case 'lg':
      return 'h-3'
    case 'xl':
      return 'h-4'
    default:
      return 'h-2'
  }
})

const autoColorClass = computed(() => {
  if (roundedPercentage.value === 0) {
    return ''
  }
  if (props.color !== 'auto') {
    return getColorClass(props.color)
  }
  if (roundedPercentage.value === 100) {
    return 'bg-green-500'
  } else if (roundedPercentage.value >= 70) {
    return 'bg-green-500'
  } else {
    return 'bg-warning-500'
  }
})

const getColorClass = (color: string) => {
  switch (color) {
    case 'primary':
      return 'bg-primary-600'
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
      return 'bg-primary-600'
  }
}

const textSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-[10px] md:text-[9px] lg:text-[10px] xl:text-[11px]'
    case 'md':
      return 'text-xs'
    case 'lg':
      return 'text-xs'
    case 'xl':
      return 'text-lg'
    default:
      return 'text-[10px] md:text-[9px] lg:text-[10px]'
  }
})
</script>

<template>
  <div class="w-full relative">
    <div class="w-full bg-neutral-200 relative rounded-full overflow-hidden" :class="sizeClasses">
      <div
        v-if="roundedPercentage > 0"
        :class="[sizeClasses, autoColorClass]"
        class="transition-all duration-300 ease-in-out rounded-full flex items-center"
        :style="{ width: `${percentage}%` }"
      >
        <span
          :class="[
            textSizeClasses,
            'font-semibold text-white whitespace-nowrap leading-none absolute w-full text-center',
          ]"
        >
          {{ roundedPercentage }}%
        </span>
      </div>
    </div>
  </div>
</template>
