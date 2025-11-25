<template>
  <component
    :is="href ? 'a' : 'button'"
    :class="[
      {
        primary: color == 'primary' && variant == 'default',
        secondary: color == 'secondary' && variant == 'default',
        info: color == 'info' && variant == 'default',
        error: color == 'error' && variant == 'default',
        warning: color == 'warning' && variant == 'default',
        success: color == 'success' && variant == 'default',
        neutral: color == 'neutral' && variant == 'default',
        transparent: color == 'transparent' && variant == 'default',
        'primary-text': color == 'primary' && variant != 'default',
        'secondary-text': color == 'secondary' && variant != 'default',
        'info-text': color == 'info' && variant != 'default',
        'error-text': color == 'error' && variant != 'default',
        'warning-text': color == 'warning' && variant != 'default',
        'success-text': color == 'success' && variant != 'default',
        'neutral-text': color == 'neutral' && variant != 'default',

        'hover:bg-primary-50 active:bg-primary-100':
          color == 'primary' &&
          variant != 'default' &&
          variant != 'link' &&
          variant != 'defaultLink',
        'hover:bg-secondary-50 active:bg-secondary-100':
          color == 'secondary' &&
          variant != 'default' &&
          variant != 'link' &&
          variant != 'defaultLink',
        'hover:bg-info-50 active:bg-info-100':
          color == 'info' && variant != 'default' && variant != 'link' && variant != 'defaultLink',
        'hover:bg-error-50 active:bg-error-100':
          color == 'error' && variant != 'default' && variant != 'link' && variant != 'defaultLink',
        'hover:bg-warning-50 active:bg-warning-100':
          color == 'warning' &&
          variant != 'default' &&
          variant != 'link' &&
          variant != 'defaultLink',
        'hover:bg-success-50 active:bg-success-100':
          color == 'success' &&
          variant != 'default' &&
          variant != 'link' &&
          variant != 'defaultLink',
        'hover:bg-neutral-100 active:bg-neutral-200':
          color == 'neutral' &&
          variant != 'default' &&
          variant != 'link' &&
          variant != 'defaultLink',
        border: variant == 'outline',
        'focus:ring-2': variant != 'link' && variant != 'defaultLink',
        'px-6 py-3': size == 'lg' && variant != 'link',
        'px-5 py-2.5': size == 'md' && variant != 'link',
        'px-5 py-2.5 text-sm': size == 'sm' && variant != 'link',
        'px-4 py-2 text-sm': size == 'xs' && variant != 'link',
        'px-3.5 py-1.5 text-sm': size == '2xs' && variant != 'link',
        'px-0.5 py-0.5 text-xs': size == '3xs' && variant != 'link',
        'text-sm': (size == 'sm' || size == 'xs' || size == '2xs') && variant == 'link',
        'font-bold': font == 'bold',
        'font-cirulo-semibold font-semibold': font == 'semibold',
        'font-medium': font == 'medium',
        'font-normal': font == 'regular',
        'w-full': fullSize,
      },
      tailwindCss,
    ]"
    :disabled="disabled"
    :href="href"
    :type="type"
    class="flex w-full select-none items-center justify-center gap-2 rounded-lg transition-all duration-300 disabled:pointer-events-none"
    @click="onClick"
  >
    <span class="flex items-center justify-center gap-2" :class="iconTextGapClass">
      <BaseIcon
        v-if="leftIcon"
        :name="leftIcon"
        :spin="iconSpin"
        :color="leftIconColor"
        :size="leftIconSize"
        :class="leftIconClass"
      />
      <span v-if="!hideText" :class="[mobileScreen ? 'text-xs' : '', labelTextClass]">
        {{ text }}
      </span>
      <BaseIcon
        v-if="rightIcon"
        :name="rightIcon"
        :spin="iconSpin"
        :color="rightIconColor"
        :size="rightIconSize"
      />
    </span>
  </component>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import BaseIcon from '../icon/BaseIcon.vue'
import { isMobile } from '@/composables/screenTypes'
import type { BaseButtonSize } from '@/types/BaseButtonTypes'
import type { Icons, PrimaryColors } from '@/types/Styles'

const emit = defineEmits<{
  onClick: []
}>()

export interface BaseButtonProps {
  text: string
  color?: PrimaryColors
  variant?: 'default' | 'outline' | 'blank' | 'link' | 'defaultLink'
  size?: BaseButtonSize
  type?: 'submit' | 'reset' | 'button'
  font?: 'bold' | 'semibold' | 'medium' | 'regular'
  leftIcon?: Icons
  leftIconColor?: string
  leftIconSize?: '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | '2xs'
  rightIcon?: Icons
  rightIconColor?: string
  rightIconSize?: '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | '2xs'
  href?: string
  disabled?: boolean
  iconSpin?: boolean
  fullSize?: boolean
  hideText?: boolean
  isPreventActive?: boolean
  tailwindCss?: string
  leftIconClass?: string
  iconTextGapClass?: string
  labelTextClass?: string
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  color: 'primary',
  variant: 'default',
  size: 'md',
  type: 'button',
  font: 'semibold',
  leftIcon: undefined,
  leftIconSize: 'sm',
  rightIcon: undefined,
  rightIconSize: 'sm',
  href: undefined,
  fullSize: true,
  isPreventActive: false,
})

const mobileScreen = computed(() => isMobile().value)

const onClick = (e: MouseEvent) => {
  if (props.isPreventActive) {
    e.preventDefault()
  }
  emit('onClick')
}
</script>

<style scoped>
.primary {
  @apply bg-primary-550 text-white focus:ring-primary-400 disabled:bg-grey-100 disabled:text-secondary-900 hover:bg-primary-700 active:bg-primary-800;
}

.secondary {
  @apply bg-secondary-500 text-white focus:ring-secondary-400 disabled:bg-secondary-200 hover:bg-secondary-700 active:bg-secondary-800;
}

.info {
  @apply bg-info-500 text-white focus:ring-info-400 disabled:bg-info-200 hover:bg-info-700 active:bg-info-800;
}

.error {
  @apply bg-error-500 text-white focus:ring-error-400 disabled:bg-error-200 hover:bg-error-700 active:bg-error-800;
}

.warning {
  @apply bg-warning-500 text-white focus:ring-warning-400 disabled:bg-warning-200 hover:bg-warning-700 active:bg-warning-800;
}

.success {
  @apply bg-success-500 text-white focus:ring-success-400 disabled:bg-success-200 hover:bg-success-700 active:bg-success-800;
}

.neutral {
  @apply bg-neutral-100 text-neutral-700 focus:ring-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-400 hover:bg-neutral-300 active:bg-neutral-400 active:text-neutral-900;
}
.transparent {
  @apply bg-transparent text-neutral-500 focus:ring-neutral-300 disabled:bg-transparent disabled:text-neutral-400 hover:bg-neutral-300 active:bg-neutral-100 active:text-neutral-900;
}

.primary-text {
  @apply border-primary-550 text-primary-550  focus:ring-primary-100 disabled:border-primary-100 disabled:text-primary-100 hover:text-primary-700 active:text-primary-900;
}

.secondary-text {
  @apply border-secondary-500 text-secondary-500  focus:ring-secondary-100 disabled:border-secondary-200 disabled:text-secondary-200 hover:text-secondary-700 active:text-secondary-800;
}

.info-text {
  @apply border-info-500 text-info-500  focus:ring-info-100 disabled:border-info-200 disabled:text-info-200 hover:text-info-700 active:text-info-800;
}

.error-text {
  @apply border-error-500 text-error-500  focus:ring-error-100 disabled:border-error-200 disabled:text-error-200 hover:text-error-700 active:text-error-800;
}

.warning-text {
  @apply border-warning-500 text-warning-500  focus:ring-warning-100 disabled:border-warning-200 disabled:text-warning-200 hover:text-warning-700 active:text-warning-800;
}

.success-text {
  @apply border-success-500 text-success-500  focus:ring-success-100 disabled:border-success-200 disabled:text-success-200 hover:text-success-700 active:text-success-800;
}

.neutral-text {
  @apply border-neutral-500 text-neutral-500  focus:ring-neutral-200 disabled:border-neutral-300 disabled:text-neutral-300 hover:text-neutral-600 active:text-neutral-700;
}
</style>
