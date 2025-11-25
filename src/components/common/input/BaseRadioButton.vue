<template>
  <label class="base-radio-label" :class="wrapperClass">
    <input
      type="radio"
      :value="value"
      :checked="isChecked"
      :name="name"
      :disabled="disabled"
      :class="customInputStyles"
      @change="select"
      class="base-radio-input"
    />
    <span
      v-if="label"
      class="base-radio-label-text"
      :class="isChecked ? labelActiveClass : labelClass"
      >{{ label }}</span
    >
  </label>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    required: true,
  },
  value: {
    type: [String, Number, Boolean],
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  labelClass: {
    type: [String, Array, Object],
    default: '',
  },
  labelActiveClass: {
    type: [String, Array, Object],
    default: '',
  },
  customInputStyles: {
    type: [String, Array, Object],
    default: '',
  },
  wrapperClass: {
    type: [String, Array, Object],
    default: '',
  },
})
const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => {
  return props.modelValue === props.value
})

function select(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    emit('update:modelValue', props.value)
  }
}
</script>

<style scoped>
.base-radio-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  line-height: 17px;
}

.base-radio-input {
  margin: 0;
  cursor: pointer;
}

.base-radio-label-text {
  display: inline-block;
  font-weight: 500;
}
</style>
