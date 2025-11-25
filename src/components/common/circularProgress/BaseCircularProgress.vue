<template>
  <div class="flex flex-col items-center">
    <div class="relative" :class="sizeClass">
      <!-- Background Circle -->
      <svg :class="sizeClass" class="transform" viewBox="0 0 36 36">
        <path
          class="text-gray-200"
          stroke="currentColor"
          :stroke-width="strokeWidth"
          fill="none"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- Progress Circle -->
        <path
          :class="progressColorClass"
          stroke="currentColor"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          fill="none"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <!-- Percentage Text -->
      <div
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
        :style="textContainerStyle"
      >
        <span
          :class="[textSizeClass, 'font-medium', textColorClass]"
          style="line-height: 1; display: block"
          >{{ Math.round(percentage) }}%</span
        >
      </div>
    </div>
    <!-- Label -->
    <span v-if="label" class="text-[14px] leading-[18px] text-black/50 mt-[12px] text-center">{{
      label
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface BaseCircularProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  label?: string
}

const props = withDefaults(defineProps<BaseCircularProgressProps>(), {
  max: 100,
  size: 'md',
  color: 'primary',
  label: '',
})

const percentage = computed(() => {
  return Math.min(Math.max((props.value / props.max) * 100, 0), 100)
})

const circumference = computed(() => {
  const radius = 15.9155
  return 2 * Math.PI * radius
})

const strokeDashoffset = computed(() => {
  return circumference.value - (percentage.value / 100) * circumference.value
})

const progressColorClass = computed(() => {
  switch (props.color) {
    case 'primary':
      return 'text-blue-600'
    case 'secondary':
      return 'text-gray-600'
    case 'success':
      return 'text-green-600'
    case 'warning':
      return 'text-yellow-600'
    case 'error':
      return 'text-red-600'
    case 'info':
      return 'text-blue-500'
    default:
      return 'text-blue-600'
  }
})

const textColorClass = computed(() => {
  switch (props.color) {
    case 'primary':
      return 'text-primary-550'
    case 'secondary':
      return 'text-gray-600'
    case 'success':
      return 'text-green-600'
    case 'warning':
      return 'text-yellow-600'
    case 'error':
      return 'text-red-600'
    case 'info':
      return 'text-blue-500'
    default:
      return 'text-blue-600'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-[36px] h-[36px]'
    case 'md':
      return 'w-[54px] h-[54px]'
    case 'lg':
      return 'w-[72px] h-[72px]'
    default:
      return 'w-[54px] h-[54px]'
  }
})

const textSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-[9px]'
    case 'md':
      return 'text-[11px]'
    case 'lg':
      return 'text-[13px]'
    default:
      return 'text-[11px]'
  }
})

const strokeWidth = computed(() => {
  switch (props.size) {
    case 'sm':
      return '2.5'
    case 'md':
      return '3'
    case 'lg':
      return '3.5'
    default:
      return '3'
  }
})

const textContainerStyle = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'padding: 6px;'
    case 'md':
      return 'padding: 8px;'
    case 'lg':
      return 'padding: 10px;'
    default:
      return 'padding: 8px;'
  }
})
</script>
