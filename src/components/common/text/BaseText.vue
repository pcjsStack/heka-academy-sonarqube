<template>
  <component
    :is="['p-lg', 'p-md', 'p-sm', 'p-xs', 'subtitle', 'caption'].includes(type) ? 'p' : type"
    v-safe-html="typeof text === 'number' ? text.toString() : text"
    :class="[
      {
        'text-7xl': type == 'h1',
        'xl:text-6xl': type == 'h2',
        'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl xl:leading-[3rem]': type == 'h3',
        'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl': type == 'h4',
        'text-3xl': type == 'h5',
        'text-2xl leading-loose': type == 'h6',
        'text-xl leading-7': type == 'subtitle',
        'text-lg leading-5': type == 'p-lg',
        'text-base leading-5': type == 'p-md',
        'text-sm leading-tight': type == 'p-sm',
        'text-xs leading-tight': type == 'p-xs',
        'text-xs leading-none': type == 'caption',
        'font-bold': font == 'bold',
        'font-inter font-semibold': font == 'semibold',
        'font-medium': font == 'medium',
        'font-normal': font == 'regular',
        'text-white': color == 'white',
        ['text-primary-' + tone]: color == 'primary',
        ['text-secondary-' + tone]: color == 'secondary',
        ['text-info-' + tone]: color == 'info',
        ['text-error-' + tone]: color == 'error',
        ['text-warning-' + tone]: color == 'warning',
        ['text-success-' + tone]: color == 'success',
        ['text-neutral-' + tone]: color == 'neutral',
      },
      tailwindCss,
    ]"
  />
</template>

<script lang="ts" setup>
import type { BaseTextType } from '@/types/BaseTextTypes'
import type { Tones } from '@/types/Styles'

withDefaults(
  defineProps<{
    text: string | number
    type?: BaseTextType
    font?: 'bold' | 'semibold' | 'medium' | 'regular'
    color?:
      | 'primary'
      | 'secondary'
      | 'info'
      | 'error'
      | 'warning'
      | 'success'
      | 'neutral'
      | 'white'
      | 'black'
    tone?: Tones
    tailwindCss?: string
  }>(),
  {
    font: 'regular',
    type: 'p-md',
    color: 'primary',
    tone: 500,
    tailwindCss: '',
  },
)
</script>
