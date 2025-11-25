<template>
  <component
    :is="noButton ? 'div' : 'button'"
    :class="[
      {
        border: variant == 'outline',
        'rounded-full': circle,
        'rounded-lg': !circle,
        primary: color == 'primary' && variant == 'default',
        secondary: color == 'secondary' && variant == 'default',
        info: color == 'info' && variant == 'default',
        error: color == 'error' && variant == 'default',
        warning: color == 'warning' && variant == 'default',
        success: color == 'success' && variant == 'default',
        neutral: color == 'neutral' && variant == 'default',
        'primary-text': color == 'primary' && variant != 'default' && variant != 'outline-light',
        'secondary-text':
          color == 'secondary' && variant != 'default' && variant != 'outline-light',
        'info-text': color == 'info' && variant != 'default' && variant != 'outline-light',
        'error-text': color == 'error' && variant != 'default' && variant != 'outline-light',
        'warning-text': color == 'warning' && variant != 'default' && variant != 'outline-light',
        'success-text': color == 'success' && variant != 'default' && variant != 'outline-light',

        'primary-outline-light': color == 'primary' && variant == 'outline-light',
        'secondary-outline-light': color == 'secondary' && variant == 'outline-light',
        'info-outline-light': color == 'info' && variant == 'outline-light',
        'error-outline-light': color == 'error' && variant == 'outline-light',
        'warning-outline-light': color == 'warning' && variant == 'outline-light',
        'success-outline-light': color == 'success' && variant == 'outline-light',

        'neutral-text': color == 'neutral' && variant != 'default',
        'button-2xl': size == '2xl',
        'button-xl': size == 'xl',
        'button-lg': size == 'lg',
        'button-md': size == 'md',
        'button-sm': size == 'sm',
        'button-xs': size == 'xs',
        'button-2xs': size == '2xs',
        'pointer-events-none': disabled,
      },
      tailwindCss,
    ]"
    :disabled="disabled"
    :type="type"
    class="flex items-center justify-center transition-all duration-300 relative"
    @click="emit('onClick')"
  >
    <BaseIcon :name="icon" :size="size" :spin="iconSpin" :class="iconClass" />
    <!-- Custom badge slot -->
    <slot name="badge"></slot>
  </component>
</template>

<script lang="ts" setup>
import type { Icons, PrimaryColors } from '@/types/Styles'
import BaseIcon from '../icon/BaseIcon.vue'
import type { BaseButtonIconSize } from '@/types/BaseButtonTypes'

const emit = defineEmits<{
  onClick: []
}>()

withDefaults(
  defineProps<{
    icon: Icons
    color?: PrimaryColors
    variant?: 'default' | 'outline' | 'blank' | 'outline-light'
    size?: BaseButtonIconSize
    circle?: boolean
    type?: 'submit' | 'reset' | 'button'
    disabled?: boolean
    noButton?: boolean
    iconSpin?: boolean
    tailwindCss?: string
    iconClass?: string
  }>(),
  {
    color: 'primary',
    variant: 'default',
    size: 'md',
    type: 'button',
    noButton: false,
  },
)
</script>
<style scoped>
.primary {
  @apply bg-primary-500 text-white focus:ring-primary-400 disabled:bg-primary-200 hover:bg-primary-700 active:bg-primary-800;
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
  @apply bg-neutral-200 text-neutral-700 focus:ring-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-400 hover:bg-neutral-300 active:bg-neutral-400 active:text-neutral-900;
}

.primary-text {
  @apply border-primary-500 text-primary-500  focus:ring-primary-100 disabled:border-primary-100 disabled:text-primary-100 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100 active:text-primary-900;
}

.secondary-text {
  @apply border-secondary-500 text-secondary-500  focus:ring-secondary-100 disabled:border-secondary-200 disabled:text-secondary-200 hover:bg-secondary-50 hover:text-secondary-700 active:bg-secondary-100 active:text-secondary-800;
}

.info-text {
  @apply border-info-500 text-info-500  focus:ring-info-100 disabled:border-info-200 disabled:text-info-200 hover:bg-info-50 hover:text-info-700 active:bg-info-100 active:text-info-800;
}

.error-text {
  @apply border-error-500 text-error-500  focus:ring-error-100 disabled:border-error-200 disabled:text-error-200 hover:bg-error-50 hover:text-error-700 active:bg-error-100 active:text-error-800;
}

.warning-text {
  @apply border-warning-500 text-warning-500  focus:ring-warning-100 disabled:border-warning-200 disabled:text-warning-200 hover:bg-warning-50 hover:text-warning-700 active:bg-warning-100 active:text-warning-800;
}

.success-text {
  @apply border-success-500 text-success-500  focus:ring-success-100 disabled:border-success-200 disabled:text-success-200 hover:bg-success-50 hover:text-success-700 active:bg-success-100 active:text-success-800;
}

.neutral-text {
  @apply border-neutral-500 text-neutral-500  focus:ring-neutral-200 disabled:border-neutral-300 disabled:text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600 active:bg-neutral-200 active:text-neutral-700;
}

.primary-outline-light {
  @apply bg-primary-100 text-primary-500 focus:ring-primary-400 hover:bg-primary-200;
}

.secondary-outline-light {
  @apply bg-secondary-100 text-secondary-500 focus:ring-secondary-400 hover:bg-secondary-200;
}

.info-outline-light {
  @apply bg-info-100 text-info-500 focus:ring-info-400 hover:bg-info-200;
}

.error-outline-light {
  @apply bg-error-100 text-error-500 focus:ring-error-400 hover:bg-error-200;
}

.warning-outline-light {
  @apply bg-warning-100 text-warning-500 focus:ring-warning-400 hover:bg-warning-200;
}

.success-outline-light {
  @apply bg-success-100 text-success-500 focus:ring-success-400 hover:bg-success-200;
}

.neutral-outline-light {
  @apply bg-neutral-100 text-neutral-500 focus:ring-neutral-400 hover:bg-neutral-200;
}

.button-2xl {
  @apply h-16 w-16 focus:ring-2;
}

.button-xl {
  @apply h-14 w-14 focus:ring-2;
}

.button-lg {
  @apply h-12 w-12 focus:ring-2;
}

.button-md {
  @apply h-10 w-10 focus:ring-2;
}

.button-sm {
  @apply h-8 w-8 focus:ring-2;
}

.button-xs {
  @apply h-6 w-6 focus:ring-1;
}

.button-2xs {
  @apply h-4 w-4 focus:ring-1;
}
</style>
