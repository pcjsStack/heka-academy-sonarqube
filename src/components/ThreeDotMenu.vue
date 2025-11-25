<template>
  <div class="relative inline-block text-left" ref="container">
    <BaseIcon
      name="three-points-vertical"
      variant="blank"
      size="xs"
      @click.stop="toggle"
      class="text-neutral-500"
      :class="iconClass"
    />

    <teleport to="body">
      <transition name="fade">
        <div
          v-if="open && items.length > 0"
          ref="dropdown"
          :style="dropdownStyle"
          class="absolute w-36 rounded-[8px] bg-white shadow-custom z-50 mr-4"
        >
          <div class="py-2 px-[6px] flex flex-col gap-2">
            <div
              v-for="(item, idx) in items"
              :key="idx"
              class="relative"
              @mouseenter="item.disabled && item.tooltip ? (hoveredItemIndex = idx) : null"
              @mouseleave="hoveredItemIndex = null"
            >
              <button
                @click="!item.disabled && onSelect(item.action)"
                :disabled="item.disabled"
                class="w-full text-left px-2 py-[6px] rounded-[8px]"
                :class="{
                  'opacity-50 cursor-not-allowed': item.disabled,
                  'hover:bg-gray-50': !item.disabled,
                }"
              >
                <div class="flex items-center">
                  <BaseIcon
                    :name="item.icon"
                    variant="blank"
                    size="xs"
                    class="mr-3"
                    :class="`${item.danger ? 'text-pink' : item.label === 'Translate' ? 'text-grey-800 translate-icon' : 'text-grey-800'}`"
                  />
                  <BaseText
                    :text="item.label"
                    :class="`!text-[14px] !leading-[17px] !font-medium ${item.danger ? '!text-pink' : '!text-grey-800'}`"
                  />
                </div>
              </button>

              <!-- Tooltip for disabled items -->
              <teleport to="body">
                <div
                  v-if="item.disabled && item.tooltip && hoveredItemIndex === idx"
                  class="absolute bg-warning-50 border border-warning-300 rounded-lg shadow-md px-3 py-2.5 z-[9999] max-w-[280px] sm:max-w-[320px] pointer-events-none"
                  :style="getTooltipStyle(idx)"
                >
                  <div class="flex items-start gap-2">
                    <BaseIcon
                      name="warning"
                      size="sm"
                      class="!text-warning-600 flex-shrink-0 mt-0.5"
                    />
                    <span class="text-warning-800 text-xs sm:text-sm font-medium leading-relaxed">
                      {{ item.tooltip }}
                    </span>
                  </div>
                </div>
              </teleport>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { BaseIcon, BaseText } from '@/components/common'
import type { Icons } from '@/types/Styles'
import { useThreeDotMenu } from '@/composables/useThreeDotMenu'

export type MenuItem = {
  label: string
  icon: Icons
  action: () => void
  danger?: boolean
  disabled?: boolean
  tooltip?: string
}

defineProps<{
  items: MenuItem[]
  iconClass?: string
}>()

// Generate unique menu ID
const menuId = `menu-${Math.random().toString(36).substr(2, 9)}`
const { isOpen, toggle: toggleMenu, handleCloseEvent } = useThreeDotMenu(menuId)

const open = isOpen
const container = ref<HTMLElement | null>(null)
const dropdown = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const hoveredItemIndex = ref<number | null>(null)

function toggle() {
  toggleMenu()
  if (open.value) {
    nextTick(() => setDropdownPosition())
  }
}

function setDropdownPosition() {
  const trigger = container.value
  const menu = dropdown.value
  if (trigger && menu) {
    const rect = trigger.getBoundingClientRect()
    const menuWidth = 144 // w-36 = 144px
    const menuHeight = menu.offsetHeight
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8 // Minimum padding from viewport edge
    const verticalOffset = 4 // Space between trigger and dropdown

    let top = rect.bottom + window.scrollY + verticalOffset
    let left = rect.right - menuWidth

    // Check if dropdown overflows right edge
    if (rect.right < menuWidth) {
      // Not enough space on left, align to left edge of trigger
      left = rect.left
    }

    // Check if dropdown overflows left edge
    if (left < padding) {
      left = padding
    }

    // Check if dropdown overflows right viewport
    if (left + menuWidth > viewportWidth - padding) {
      left = viewportWidth - menuWidth - padding
    }

    // Check if dropdown overflows bottom
    if (rect.bottom + menuHeight + verticalOffset > viewportHeight - padding) {
      // Position above the trigger instead
      top = rect.top + window.scrollY - menuHeight - verticalOffset
    }

    dropdownStyle.value = {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
    }
  }
}

function onSelect(fn: () => void) {
  fn()
  open.value = false
}

function getTooltipStyle(index: number): Record<string, string> {
  const menu = dropdown.value
  if (!menu) return {}

  const menuRect = menu.getBoundingClientRect()
  const buttonHeight = 30 // Approximate button height
  const buttonTop = menuRect.top + 8 + index * (buttonHeight + 8) // 8px padding, 8px gap
  const tooltipWidth = 280 // max-w-[280px] on mobile, 320px on desktop
  const padding = 8 // Minimum padding from viewport edge
  const gap = 8 // Gap between menu and tooltip
  const viewportWidth = window.innerWidth

  // Calculate left position - try to position to the left of the menu
  let left = menuRect.left - tooltipWidth - gap

  // If tooltip would overflow left edge, position to the right of the menu
  if (left < padding) {
    left = menuRect.right + gap
    // If it would overflow right edge, center it or adjust
    if (left + tooltipWidth > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - tooltipWidth - padding)
    }
  }

  return {
    position: 'fixed',
    top: `${buttonTop}px`,
    left: `${left}px`,
  }
}

// close when clicking outside
function handleClickOutside(e: MouseEvent) {
  const isClickInside =
    container.value?.contains(e.target as Node) || dropdown.value?.contains(e.target as Node)

  if (!isClickInside) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('close-three-dot-menu', handleCloseEvent as EventListener)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('close-three-dot-menu', handleCloseEvent as EventListener)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.translate-icon#icon {
  position: relative;
  top: 3px;
}
</style>
