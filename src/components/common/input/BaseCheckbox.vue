<template>
  <label class="base-checkbox-label" :class="wrapperClass" @click="toggle">
    <div
      class="base-checkbox mr-4"
      :class="[{ checked: isChecked }, customInputStyles]"
      role="checkbox"
      :aria-checked="isChecked"
      tabindex="0"
      @click.stop="toggle"
      @keydown.space.prevent.stop="toggle"
      @keydown.enter.prevent.stop="toggle"
    >
      <svg
        v-if="isChecked"
        :width="checkboxWidth"
        :height="checkboxHeight"
        :viewBox="`0 0 ${checkboxWidth} ${checkboxHeight}`"
        fill="none"
      >
        <rect :width="checkboxWidth" :height="checkboxHeight" rx="3" fill="#2979FF" />
        <path
          d="M3.05 7.77L5.63 10.46L10.88 4.55"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg
        v-else
        :width="checkboxWidth"
        :height="checkboxHeight"
        :viewBox="`0 0 ${checkboxWidth} ${checkboxHeight}`"
        fill="none"
      >
        <rect
          :x="0.5"
          :y="0.5"
          :width="checkboxWidth - 1"
          :height="checkboxHeight - 1"
          rx="3"
          :stroke="uncheckedStroke"
          stroke-width="2"
          fill="white"
        />
      </svg>
    </div>
    <span
      v-if="label"
      class="base-checkbox-label-text"
      :class="isChecked ? labelActiveClass : labelClass"
      >{{ label }}</span
    >
  </label>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Boolean, Array],
    required: true,
  },
  value: {
    type: [String, Number, Boolean],
    default: undefined,
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
  uncheckedStroke: {
    type: String,
    default: 'rgba(0, 0, 0, 0.5)',
  },
  checkboxWidth: {
    type: Number,
    default: 15,
  },
  checkboxHeight: {
    type: Number,
    default: 15,
  },
})
const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue) && props.value !== undefined) {
    return props.modelValue.includes(props.value)
  }
  return !!props.modelValue
})

function toggle() {
  if (Array.isArray(props.modelValue) && props.value !== undefined) {
    const arr = [...props.modelValue]
    const idx = arr.indexOf(props.value)
    if (idx > -1) {
      arr.splice(idx, 1)
    } else {
      arr.push(props.value)
    }
    emit('update:modelValue', arr)
  } else {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<style scoped>
.base-checkbox-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.base-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  user-select: none;
  /* Remove fixed width/height for dynamic sizing */
}
.base-checkbox-label-text {
  display: inline-block;
}
</style>
