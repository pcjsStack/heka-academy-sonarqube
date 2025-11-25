<template>
  <div class="w-full">
    <div v-if="label" class="flex items-center space-x-1">
      <BaseText
        :text="`${label}`"
        :tone="700"
        color="neutral"
        font="medium"
        type="p-sm"
        :class="[labelClass, 'text-xs-custom text-custom-label-text']"
      />
      <BaseTooltipIcons v-if="labelHelper" :text="labelHelper" placement="top-end" />
      <span v-if="required" class="text-pink !ml-0 text-xs-custom tracking-[-0.01em] leading-tight">
        *
      </span>
    </div>

    <div class="relative mb-1.5 mt-1.5" :class="customMargin">
      <!-- Left icon -->
      <div
        v-if="iconNameLeft"
        :class="[iconClasses, iconLeftClass]"
        class="absolute left-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center"
        @click.prevent="emit('onClickIcon')"
      >
        <BaseIcon :name="iconNameLeft" class="!fill-current !stroke-current text-black/50" />
      </div>

      <!-- Left prefix text -->
      <div
        v-else-if="prefixLeftText && type !== 'checkbox' && type !== 'textArea'"
        class="absolute left-4 top-1/2 -translate-y-1/2 flex h-5 items-center"
      >
        <BaseText :text="prefixLeftText" :tone="400" color="neutral" type="p-sm" />
      </div>

      <!-- Textarea (readonly uses same UI with disabled styles) -->
      <textarea
        v-if="type === 'textArea'"
        ref="inputRef"
        :id="idName"
        :class="[inputClasses, textAreaClasses]"
        :disabled="disabled"
        :readonly="readonly"
        :rows="inputRows"
        :name="name"
        :placeholder="placeholder"
        :value="modelValue"
        @input="handleInput"
        @blur="handleBlur"
        :aria-readonly="readonly"
        :aria-disabled="disabled"
        :aria-required="required"
      />

      <input
        v-else-if="type === 'checkbox'"
        ref="inputRef"
        type="checkbox"
        :id="idName"
        :name="name"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :checked="modelValue"
        @change="handleCheckboxInput"
        @click="onClick"
        @blur="handleBlur"
        :aria-readonly="readonly"
        :aria-disabled="disabled"
        :aria-required="required"
        class="w-4 h-4 accent-primary-550"
        :class="checkBoxStyle"
      />
      <!-- Regular input -->
      <input
        v-else
        ref="inputRef"
        :id="idName"
        :autofocus="autofocus"
        :class="[inputClasses, customInputStyles]"
        :disabled="disabled"
        :readonly="readonly"
        :name="name"
        :placeholder="placeholder"
        :required="required"
        :type="type"
        :value="modelValue"
        @input="handleInput"
        @click="onClick"
        @blur="handleBlur"
        @wheel.passive="type === 'number' ? ($event.target as HTMLInputElement).blur() : null"
        :aria-readonly="readonly"
        :aria-disabled="disabled"
        :aria-required="required"
      />

      <!-- Right icon -->
      <div
        v-if="iconName"
        :class="iconClasses"
        class="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center"
        @click.prevent="emit('onClickIcon')"
      >
        <BaseIcon :name="iconName" />
      </div>

      <!-- Right prefix text -->
      <div
        v-else-if="prefixRightText && type !== 'checkbox' && type !== 'textArea'"
        class="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 items-center"
      >
        <BaseText :text="prefixRightText" :tone="400" color="neutral" type="p-sm" />
      </div>
    </div>

    <!-- Hint messages -->
    <div v-if="Array.isArray(hintMessage)">
      <BaseText
        v-for="(message, i) in hintMessage"
        :key="`hint-message-${i}`"
        :color="hintMessageColor"
        :text="message"
        font="medium"
        type="p-sm"
      />
    </div>
    <div v-else-if="hintMessage">
      <BaseText :color="hintMessageColor" :text="hintMessage" font="medium" type="p-sm" />
    </div>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, onMounted, ref } from 'vue'
import { BaseTooltipIcon as BaseTooltipIcons, BaseIcon, BaseText } from '@/components/common'
import type { Icons, PrimaryColors } from '@/types/Styles'

const emit = defineEmits(['update:modelValue', 'onClickIcon', 'onInput', 'onClick'])

const props = defineProps<{
  idName?: string
  placeholder?: string
  value?: any
  name?: string
  required?: boolean
  label?: string
  labelHelper?: string
  modelValue?: any
  disabled?: boolean
  readonly?: boolean
  hintMessage?: string | string[]
  iconClickable?: boolean
  iconName?: Icons
  iconNameLeft?: Icons
  iconColor?: PrimaryColors
  autofocus?: boolean
  inputRows?: number
  updateOnBlur?: boolean
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'hidden'
    | 'textArea'
    | 'color'
    | 'string'
    | 'button'
    | 'checkbox'
  status?: 'default' | 'error' | 'success'
  labelClass?: string
  customMargin?: string
  customInputStyles?: string
  iconLeftClass?: string
  textAreaClasses?: string
  checkBoxStyle?: string
  prefixLeftText?: string
  prefixRightText?: string
}>()

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()

onMounted(() => {
  if (props.autofocus && inputRef.value) {
    inputRef.value.focus()
  }
})

const onClick = () => {
  emit('onClick')
}

const handleBlur = () => {
  if (props.updateOnBlur && inputRef.value) {
    emit('update:modelValue', inputRef.value.value)
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
  emit('onInput', event)
}

const handleCheckboxInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('onInput', event)
}

const inputClasses = computed(() => [
  'w-full rounded-lg border placeholder:text-neutral-500 placeholder:text-sm-custom placeholder:font-medium py-2.5 px-3.5 h-10 text-sm-custom font-medium text-black/85 transition-all duration-300',
  {
    'h-auto': props.type === 'textArea',
    'min-h-25': props.type === 'textArea',
    'bg-neutral-200 cursor-not-allowed text-neutral-600 focus:border-none':
      props.readonly || props.disabled,
    'border-neutral-300 focus:border-neutral-500': props.status === 'default' || !props.status,
    'border-error-600 ring-error-200 focus:border-error-600': props.status === 'error',
    'border-success-600 ring-success-200 focus:border-success-600': props.status === 'success',
    'py-2.5 rounded-lg text-sm text-neutral-600 leading-5 font-normal w-72':
      props.iconName || props.iconNameLeft,
    'pl-10': props.iconNameLeft || !!props.prefixLeftText,
    'pr-10': props.iconName || !!props.prefixRightText,
  },
])

const iconClasses = computed(() => ({
  'cursor-pointer': props.iconClickable && !props.disabled,
  'text-primary-600': props.iconColor === 'primary',
  'text-secondary-600': props.iconColor === 'secondary',
  'text-info-600': props.iconColor === 'info',
  'text-error-600': props.iconColor === 'error',
  'text-warning-600': props.iconColor === 'warning',
  'text-success-600': props.iconColor === 'success',
  'text-neutral-600': !props.iconColor || props.iconColor === 'neutral',
}))

const hintMessageColor = computed(() =>
  props.status === 'error' ? 'error' : props.status === 'success' ? 'success' : 'neutral',
)
</script>

<style scoped>
.checkbox input {
  height: auto;
}
.checkbox .relative,
.option-input .relative {
  margin: 0;
  line-height: 0;
}
.option-input input {
  border: none;
  outline: none;
  box-shadow: none;
  height: 23px;
  padding: 0;
}
.option-input input:focus {
  outline: none;
  box-shadow: none;
}
.readonly-container {
  @apply relative flex items-center w-full;
}

.readonly-field {
  @apply w-full rounded-lg border border-gray-400 bg-gray-200 py-1.5 px-3.5 text-base text-gray-600 cursor-not-allowed;
}

.readonly-overlay {
  @apply absolute right-3 top-1 flex items-center justify-center;
}
</style>
