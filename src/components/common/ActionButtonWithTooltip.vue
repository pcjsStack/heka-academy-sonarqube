<template>
  <div
    class="relative inline-block"
    ref="buttonContainer"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <BaseButton
      :text="props.buttonConfig.text"
      :variant="props.buttonConfig.variant"
      :color="props.buttonConfig.color"
      :class="props.buttonConfig.buttonClass || '!min-w-[95px]'"
      :size="props.buttonConfig.size || 'xs'"
      :leftIconSize="props.buttonConfig.leftIconSize || 'xs'"
      :leftIcon="props.buttonConfig.leftIcon"
      :disabled="props.isDisabled"
      @click="props.buttonConfig.onClick"
    />
    <!-- Tooltip for disabled items -->
    <teleport to="body">
      <div
        v-if="props.isDisabled && props.buttonConfig.tooltipText && showTooltip"
        class="bg-warning-50 border border-warning-300 rounded-lg shadow-md px-3 py-2.5 z-[9999] max-w-[280px] sm:max-w-[320px] pointer-events-none"
        :style="getTooltipStyle()"
      >
        <div class="flex items-start gap-2">
          <BaseIcon name="warning" size="sm" class="!text-warning-600 flex-shrink-0 mt-0.5" />
          <span class="text-warning-800 text-xs sm:text-sm font-medium leading-relaxed">
            {{ props.buttonConfig.tooltipText }}
          </span>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { BaseButton, BaseIcon } from '@/components/common'
import type { ActionButtonConfig } from '@/types/GlobalTypes'

interface Props {
  buttonConfig: ActionButtonConfig
  isDisabled: boolean
}

const props = defineProps<Props>()

const buttonContainer = ref<HTMLElement | null>(null)
const showTooltip = ref(false)

function handleMouseEnter() {
  if (props.isDisabled && props.buttonConfig.tooltipText) {
    showTooltip.value = true
  }
}

function handleMouseLeave() {
  showTooltip.value = false
}

function getTooltipStyle(): Record<string, string> {
  const button = buttonContainer.value?.querySelector('button') as HTMLElement
  if (!button) return {}

  const buttonRect = button.getBoundingClientRect()
  const tooltipWidth = 280 // max-w-[280px] on mobile, 320px on desktop
  const padding = 8 // Minimum padding from viewport edge
  const gap = 8 // Gap between button and tooltip
  const viewportWidth = window.innerWidth

  // Calculate top position - position below the button (fixed positioning uses viewport coordinates)
  const top = buttonRect.bottom + gap

  // Calculate left position - try to align with button center, then adjust for overflow
  let left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2

  // If tooltip would overflow left edge, align to left edge of button
  if (left < padding) {
    left = buttonRect.left
  }

  // If tooltip would overflow right edge, align to right edge of button
  if (left + tooltipWidth > viewportWidth - padding) {
    left = buttonRect.right - tooltipWidth
    // If still overflowing, use right padding
    if (left < padding) {
      left = viewportWidth - tooltipWidth - padding
    }
  }

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
  }
}

// Hide tooltip on scroll/resize for better UX
function hideTooltip() {
  if (showTooltip.value) {
    showTooltip.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', hideTooltip, true)
  window.addEventListener('resize', hideTooltip)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', hideTooltip, true)
  window.removeEventListener('resize', hideTooltip)
})
</script>

<style scoped>
/* Tooltip styling is handled inline via Tailwind classes */
</style>
