<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'
import BaseButton from '../button/BaseButton.vue'
import type { Icons } from '@/types/Styles'
import { t } from '@/utils/i18n'

interface TabOption {
  label: string
  value: string
  icon?: string
}

defineProps<{
  tabs: TabOption[]
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <nav class="flex mb-[-2px]" :aria-label="t('pages.common.tabs')">
    <BaseButton
      v-for="tab in tabs"
      :key="tab.value"
      :text="tab.label"
      color="neutral"
      size="xs"
      variant="blank"
      :title="tab.label"
      :leftIcon="tab.icon as Icons"
      leftIconClass="!w-[14px] !h-[14px]"
      @click="$emit('update:modelValue', tab.value)"
      :tailwindCss="
        [
          'whitespace-nowrap font-medium !transition-none text-sm hover:text-gray-700 hover:!bg-transparent hover:border-gray-300',
          '!rounded-[0] !w-auto h-[40px] !py-2 !px-4 !shadow-none focus:!shadow-none focus:!ring-0 focus:!outline-none',
          modelValue === tab.value
            ? '!border-primary-950 !text-primary-950 border-b-2'
            : 'border-transparent !text-neutral-500 border-b-2 !border-neutral-200',
        ].join(' ')
      "
    />
  </nav>
</template>
