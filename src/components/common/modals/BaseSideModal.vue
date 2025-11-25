<template>
  <Teleport to="#modals">
    <div
      class="fixed bottom-0 top-0 z-50 flex justify-end h-full w-full transform"
      :style="{ zIndex: zIndex || 50 }"
      :class="customClass"
    >
      <div
        class="backdrop absolute inset-0 bg-[#333333]/[0.08] backdrop-blur-none"
        @click="emit('onBackgroundClick')"
      />
      <div
        :class="{
          'max-w-xs': size == 'xs',
          'max-w-md': size == 'sm',
          'max-w-[539px]': size == 'md',
          'max-w-3xl': size == 'lg',
          'max-w-5xl': size == 'xl',
        }"
        class="relative flex w-full flex-col bg-white h-full"
      >
        <!-- Fixed Header -->
        <div
          v-if="title || closeButton || prevButton"
          :class="{
            'justify-between': title || prevButton,
            'justify-end': !title && closeButton,
          }"
          class="flex items-center lg:p-6 lg:pt-6 pt-6 p-4 lg:pb-[12px] pb-[12px] border-b border-grey-150 flex-shrink-0"
        >
          <div
            :class="{
              'cursor-pointer': titleClickable,
              'flex items-center gap-x-2': prevButton,
            }"
            @click="emit('onClickTitle')"
          >
            <BaseIcon
              v-if="prevButton"
              :color="closeButtonColor"
              name="chevron-left"
              size="sm"
              variant="blank"
              @click="emit('onClickPrev')"
              class="text-neutral-700 cursor-pointer ml-[-6px]"
            />
            <slot v-if="customTitle" name="custom-title"></slot>
            <BaseText
              v-if="title && !customTitle"
              :text="title"
              :tone="900"
              color="neutral"
              font="semibold"
              type="p-lg"
              class="!text-[16px] tracking-[-0.016px] !text-neutral-700"
            />
          </div>
          <slot name="header-actions"></slot>

          <BaseIcon
            v-if="closeButton"
            name="clear"
            :size="closeButtonSize"
            variant="blank"
            @click="emit('onClose')"
            class="text-neutral-700 cursor-pointer"
          />
        </div>

        <!-- Scrollable Content -->
        <div :class="['flex-1 overflow-y-auto', containerTailwindCss]">
          <slot />
        </div>

        <!-- Fixed Footer (if needed) -->
        <div v-if="$slots.footer" class="flex-shrink-0 border-t border-grey-150">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { BaseText, BaseIcon } from '@/components/common'
import type { PrimaryColors } from '@/types/Styles'
import { modalManager } from '@/utils/modalManager'

const OVERFLOW_CLASS_Y_AUTO = 'overflow-y-auto'
const OVERFLOW_CLASS_Y_HIDDEN = 'xl:overflow-y-hidden'

onMounted(() => {
  modalManager.openModal()
})

onBeforeUnmount(() => {
  modalManager.closeModal()
  document.body.classList.remove(OVERFLOW_CLASS_Y_AUTO, OVERFLOW_CLASS_Y_HIDDEN)
})

withDefaults(
  defineProps<{
    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    title?: string
    titleClickable?: boolean
    closeButton?: boolean
    customTitle?: boolean
    prevButton?: boolean
    customClass?: string
    zIndex?: number
    containerTailwindCss?: string
    closeButtonColor?: PrimaryColors
    closeButtonSize?:
      | '6xl'
      | '5xl'
      | '4xl'
      | '3xl'
      | '2xl'
      | 'xl'
      | 'lg'
      | 'md'
      | 'sm'
      | 'xs'
      | '2xs'
  }>(),
  {
    size: 'md',
    title: undefined,
    titleClickable: undefined,
    closeButton: undefined,
    customTitle: undefined,
    prevButton: undefined,
    customClass: undefined,
    zIndex: 50,
    containerTailwindCss: undefined,
    closeButtonColor: 'primary',
    closeButtonSize: 'sm',
  },
)

const emit = defineEmits<{
  onClose: []
  onClickTitle: []
  onBackgroundClick: []
  onClickPrev: []
}>()
</script>
