<template>
  <Transition name="fade">
    <div v-if="visible">
      <div
        class="fixed top-0 right-0 z-[99999999] pointer-events-none flex flex-col gap-2 p-4 w-full h-full inset-0 bg-[#333333]/[0.08] backdrop-blur-none"
      ></div>
      <div
        v-if="visible"
        :class="[
          'fixed z-[99999999] flex items-center gap-[12px] py-[16px] px-[20px] rounded-[8px] transition-all bg-white  ',
          positionClasses,
          backgroundColor,
        ]"
        :style="{ width: 'fit-content', maxWidth: '90%' }"
      >
        <BaseButtonIcon
          v-if="leftIcon"
          :icon="leftIcon"
          size="md"
          :color="tone"
          :class="['!rounded-full p-3', iconBackgroundColor, iconTextColor].join(' ')"
        />
        <BaseText
          :text="message"
          :tailwindCss="
            [
              '!text-black/85 !text-[14px] tracking-[-0.032px] leading-[22px] !font-medium min-w-[286px] max-w-[292px]',
              textColor,
            ].join(' ')
          "
        />
        <BaseIcon
          name="clear"
          size="sm"
          class="w-5 h-5 cursor-pointer !text-neutral-700 shrink-0"
          @click="close"
        />
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import BaseIcon from '../icon/BaseIcon.vue'
import BaseText from '../text/BaseText.vue'
import type { Icons } from '@/types/Styles'
import BaseButtonIcon from '../button/BaseButtonIcon.vue'

const props = defineProps<{
  message: string
  tone?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  leftIcon?: Icons
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}>()

const visible = ref(true)

const close = () => {
  visible.value = false
}

onMounted(() => {
  if (props.duration !== 0) {
    // setTimeout(close, props.duration || 3000)
  }
})

const backgroundColor = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'bg-success-500'
    case 'error':
      return 'bg-error-500'
    case 'info':
      return 'bg-info-500'
    case 'warning':
      return 'bg-warning-500'
    default:
      return 'bg-neutral-900'
  }
})

const textColor = computed(() => {
  switch (props.tone) {
    case 'success':
      return '!text-green-800'
    case 'error':
      return '!text-red-800'
    case 'info':
      return '!text-blue-800'
    case 'warning':
      return '!text-yellow-800'
    default:
      return '!text-gray-800'
  }
})

const iconBackgroundColor = computed(() => {
  switch (props.tone) {
    case 'success':
      return '!bg-green-100'
    case 'error':
      return '!bg-red-100'
    case 'info':
      return '!bg-blue-100'
    case 'warning':
      return '!bg-yellow-100'
    default:
      return '!bg-gray-100'
  }
})

const iconTextColor = computed(() => {
  switch (props.tone) {
    case 'success':
      return '!text-green-600'
    case 'error':
      return '!text-red-600'
    case 'info':
      return '!text-blue-600'
    case 'warning':
      return '!text-yellow-600'
    default:
      return '!text-gray-600'
  }
})

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top-left':
      return 'top-[15px] right-[10px] sm:top-9 sm:left-8 sm:right-auto sm:bottom-auto'
    case 'top-right':
      return 'top-[15px] right-[10px] sm:top-9 sm:right-8 sm:left-auto sm:bottom-auto'
    case 'bottom-left':
      return 'top-[15px] right-[10px] sm:bottom-9 sm:left-8 sm:right-auto sm:top-auto'
    case 'bottom-right':
    default:
      return 'top-[15px] right-[10px] sm:bottom-9 sm:right-8 sm:left-auto sm:top-auto'
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
