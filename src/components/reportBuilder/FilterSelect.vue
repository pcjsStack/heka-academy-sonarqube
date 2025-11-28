<template>
  <div class="flex items-center justify-between gap-2">
    <BaseText
      :text="label"
      color="neutral"
      class="!text-[14px] !leading-[17px] !text-black/85 !font-medium flex-shrink-0"
    />
    <BaseSelect
      :model-value="modelValue"
      :options="unwrappedOptions"
      :placeholder="placeholder"
      :disabled="disabled"
      multiple
      searchable
      size="md"
      class="!w-[380px] flex-shrink-0"
      @update:model-value="$emit('update:modelValue', $event)"
      @scroll-bottom="$emit('scrollBottom')"
      @on-search="$emit('onSearch', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { BaseText, BaseSelect } from '@/components/common'

interface Props {
  label: string
  placeholder: string
  modelValue: string[]
  options:
    | Array<{ value: string; label: string }>
    | ComputedRef<Array<{ value: string; label: string }>>
  disabled?: boolean
}

const props = defineProps<Props>()

const unwrappedOptions = computed(() => {
  return Array.isArray(props.options) ? props.options : props.options.value
})

defineEmits<{
  'update:modelValue': [values: string[]]
  scrollBottom: []
  onSearch: [query: string]
}>()
</script>
