<template>
  <div class="flex items-center gap-2">
    <BaseText v-if="label" :text="label" :tone="700" color="neutral" font="medium" type="p-sm" />
    <button
      :class="[
        'relative inline-flex h-4 w-8 items-center rounded-full transition-all focus:outline-none bg-white border-2',
        modelValue ? 'border-primary-600' : 'border-neutral-300',
      ]"
      @click="toggle"
      type="button"
    >
      <span
        :class="[
          'inline-block h-2.5 w-2.5 transform rounded-full transition-all',
          modelValue ? 'bg-primary-600 translate-x-[16px]' : 'bg-neutral-300 translate-x-[2px]',
        ]"
      />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'
import BaseText from '../text/BaseText.vue'

const props = defineProps<{
  modelValue: boolean
  label?: string
}>()

const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>
