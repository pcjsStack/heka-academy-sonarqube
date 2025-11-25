<script lang="ts" setup>
import { onMounted, onBeforeUnmount } from 'vue'
import BaseIcon from '../icon/BaseIcon.vue'
import BaseText from '../text/BaseText.vue'
import type { PrimaryColors } from '@/types/Styles'
import { modalManager } from '@/utils/modalManager'

onMounted(() => {
  modalManager.openModal()
})

onBeforeUnmount(() => {
  modalManager.closeModal()
})

withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
    title?: string
    closeButton?: boolean
    zIndex?: number
    showBackButton?: boolean
    fullscreen?: boolean
    containerTailwindCss?: string
    closeButtonColor?: PrimaryColors
    backButtonColor?: PrimaryColors
    width?: string
    height?: string
    maxWidth?: string
    maxHeight?: string
    isHeader?: boolean
    enableScroll?: boolean
    createHeaderStyle?: string
    iconCutomSize?: string
  }>(),
  {
    size: 'md',
    title: undefined,
    closeButton: true,
    zIndex: 50,
    showBackButton: false,
    fullscreen: false,
    containerTailwindCss: undefined,
    closeButtonColor: 'neutral',
    backButtonColor: 'neutral',
    width: undefined,
    height: undefined,
    maxWidth: undefined,
    maxHeight: undefined,
    isHeader: true,
  },
)

const emit = defineEmits<{
  onClose: []
  onBack: []
  onBackgroundClick: []
}>()

function getSizeClass(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'): {
  width: string
  height: string
  maxWidth: string
} {
  const sizes = {
    xs: { width: '320px', height: 'auto', maxWidth: '100%' },
    sm: { width: '400px', height: 'auto', maxWidth: '100%' },
    md: { width: '500px', height: 'auto', maxWidth: '100%' },
    lg: { width: '600px', height: 'auto', maxWidth: '100%' },
    xl: { width: '800px', height: 'auto', maxWidth: '100%' },
    full: { width: '90vw', height: '90vh', maxWidth: '90vw' },
  }
  return sizes[size] || sizes.md
}
</script>

<style scoped>
.backdrop {
  transition: opacity 0.2s ease;
}

.rounded-xl {
  border-radius: 12px;
}
</style>

<template>
  <Teleport to="#modals">
    <div
      class="fixed inset-0 flex"
      :style="{ zIndex: zIndex || 50 }"
      :class="fullscreen ? 'p-0' : 'items-center justify-center p-4'"
    >
      <div
        class="backdrop absolute inset-0 bg-[#333333]/[0.08] backdrop-blur-none"
        :class="title === 'Approval' ? '!bg-[#333333]/[0.16]' : ''"
        @click="emit('onBackgroundClick')"
      />

      <div
        class="relative bg-white flex flex-col"
        :class="[fullscreen ? 'w-full h-full' : 'rounded-[16px] shadow-xl', containerTailwindCss]"
        :style="{
          width: fullscreen ? '100%' : width || getSizeClass(size).width,
          height: fullscreen ? '100%' : height || getSizeClass(size).height,
          maxWidth: fullscreen ? '100%' : maxWidth || getSizeClass(size).maxWidth,
          maxHeight: fullscreen ? '100%' : maxHeight || '90vh',
        }"
      >
        <div
          v-if="isHeader"
          :class="[
            'flex items-center px-6 pt-6 pb-[12px] md:px-4 md:pt-4 md:pb-3 lg:px-6 lg:pt-6 lg:pb-[12px] border-b border-grey-150 justify-between',
            createHeaderStyle,
          ]"
        >
          <div class="flex items-center gap-x-3 md:gap-x-2.5 lg:gap-x-3">
            <BaseIcon
              v-if="showBackButton"
              :color="backButtonColor"
              name="chevron-left"
              size="sm"
              variant="blank"
              @click="emit('onBack')"
              :iconCutomSize="iconCutomSize"
            />
            <BaseText
              v-if="title"
              :text="title"
              :tone="900"
              color="neutral"
              font="semibold"
              type="p-lg"
              :class="
                fullscreen
                  ? '!text-[24px] md:!text-[20px] lg:!text-[24px] tracking-[-0.032px] !text-neutral-700'
                  : '!text-[16px] tracking-[-0.01em] !text-neutral-700'
              "
            />
          </div>
          <div :class="fullscreen ? 'sm:flex-row flex-col sm:w-[auto] w-full' : ''">
            <slot v-if="fullscreen" name="header-actions" />
            <BaseIcon
              v-if="closeButton && !fullscreen"
              :color="closeButtonColor"
              name="clear"
              size="sm"
              variant="blank"
              @click="emit('onClose')"
              class="cursor-pointer text-neutral-700"
            />
          </div>
        </div>

        <div :class="!enableScroll ? 'flex-1' : 'flex-1 overflow-y-auto'">
          <slot />
        </div>

        <div v-if="$slots.footer" class="flex items-center justify-between gap-3 p-6 border-t">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
