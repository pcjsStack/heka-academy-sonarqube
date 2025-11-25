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
      <span v-if="required" class="text-pink !ml-0 text-[12px] tracking-[-0.01em] leading-tight">
        *
      </span>
    </div>

    <div class="relative mb-1 mt-1.5" :class="customMargin">
      <!-- Left icon -->
      <div
        v-if="iconNameLeft"
        :class="iconClasses"
        class="absolute left-3.5 top-2 flex h-5 w-5 items-center justify-center"
        @click.prevent="emit('onClickIcon')"
      >
        <BaseIcon :name="iconNameLeft" />
      </div>

      <!-- Select box (single or multiple) - readonly uses same UI with disabled styles -->
      <div
        ref="selectContainer"
        :class="[inputClasses, customInputStyles]"
        tabindex="0"
        class="flex items-center flex-wrap gap-1 min-h-[40px] cursor-pointer"
        @blur="handleBlur"
        @click="toggleDropdown"
      >
        <template v-if="multiple">
          <span
            v-if="selectedValues.length === 0 && placeholder"
            class="text-[14px] text-neutral-500 tracking-[-0.01em] leading-tight"
          >
            {{ placeholder }}
          </span>
          <div
            v-for="selectedValue in selectedValues"
            :key="selectedValue"
            class="flex items-center gap-[4px] border border-neutral-300 rounded-[30px] pr-[4px] pl-[8px] py-[3px] text-[12px] text-neutral-500 tracking-[-0.01em] leading-tight max-w-[calc(100%-40px)]"
          >
            <img
              v-if="getOptionIcon(selectedValue)"
              :src="getOptionIcon(selectedValue)"
              class="w-4 h-4 rounded-full object-cover flex-shrink-0"
              alt="icon"
            />
            <span class="break-all">{{ getOptionLabel(selectedValue) }}</span>
            <button
              type="button"
              class="text-white bg-neutral-400 rounded-full w-[16px] h-[16px] flex items-center justify-center flex-shrink-0"
              :class="readonly ? 'opacity-50 cursor-not-allowed' : 'hover:text-neutral-700'"
              @click.stop="readonly ? null : removeSelected(selectedValue)"
            >
              <BaseIcon name="clear" class="w-auto text-white h-3" />
            </button>
          </div>
        </template>

        <template v-else>
          <input
            v-if="searchable"
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="flex-1 min-w-[50px] outline-none bg-transparent"
            :placeholder="!selectedLabel ? placeholder : ''"
            @click.stop
            @keydown="handleKeyDown"
          />
          <span
            v-else
            class="flex items-center gap-[10px] text-[14px] !text-neutral-900"
            :class="{
              'pl-0 text-[14px] text-neutral-900 tracking-[-0.01em] leading-tight': !iconNameLeft,
              'pl-10': iconNameLeft,
              ['!text-black/50']: textSelectStyle,
              ['!text-black']: textSelectLabelStyle,
            }"
          >
            <img
              v-if="getOptionIcon(props.modelValue as string)"
              :src="getOptionIcon(props.modelValue as string)"
              class="w-6 h-6 rounded-full object-cover"
              alt="icon"
            />
            {{ selectedLabel || placeholder }}
          </span>
        </template>

        <!-- Dropdown icon -->
        <div class="absolute right-3 top-1/2 -translate-y-1/2">
          <BaseIcon name="chevron-down" class="w-auto text-neutral-500" />
        </div>
      </div>

      <!-- Right icon -->
      <div
        v-if="iconName"
        :class="iconClasses"
        class="absolute right-3.5 top-2 flex h-5 w-5 items-center justify-center"
        @click.prevent="emit('onClickIcon')"
      >
        <BaseIcon :name="iconName" />
      </div>

      <!-- Dropdown options -->
      <div
        v-if="showDropdown && isRenderOptions"
        class="absolute z-10 w-full bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        :class="[dropdownClass, dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1']"
        ref="dropdownOptionsContainer"
        @scroll="onDropdownScroll"
      >
        <div
          v-for="option in filteredOptions"
          :key="option.value"
          class="px-3 py-2 cursor-pointer flex items-center gap-3"
          :class="[
            {
              'bg-neutral-100': isSelected(option.value),
              'opacity-50 cursor-not-allowed text-neutral-400': option.disabled,
              'hover:bg-neutral-100': !option.disabled,
            },
            dropdownOptionClass,
          ]"
          @click.stop="option.disabled ? null : toggleSelection(option.value)"
        >
          <img
            v-if="option.icon"
            :src="option.icon"
            class="w-4 h-4 rounded-full object-cover"
            alt="icon"
          />
          {{ option.label }}
        </div>
        <div v-if="filteredOptions.length === 0" class="px-3 py-2 text-grey-800 text-sm italic">
          No options found
        </div>
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
    <div v-else-if="hintMessage && showError && !isEmptyObject(modelValue)">
      <BaseText :color="hintMessageColor" :text="hintMessage" font="medium" type="p-sm" />
    </div>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { BaseTooltipIcon as BaseTooltipIcons, BaseIcon, BaseText } from '@/components/common'
import type { Icons, PrimaryColors } from '@/types/Styles'
import { onClickOutside } from '@vueuse/core'
import { isEmptyObject } from '@/utils/generalUtils'

interface SelectOption {
  value: string | number
  label: string
  icon?: string
  disabled?: boolean
}

const emit = defineEmits([
  'update:modelValue',
  'onClickIcon',
  'onChange',
  'onBlur',
  'scroll-bottom',
])

const props = withDefaults(
  defineProps<{
    idName?: string
    placeholder?: string
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
    updateOnBlur?: boolean
    multiple?: boolean
    searchable?: boolean
    options: SelectOption[]
    status?: 'default' | 'error' | 'success'
    labelClass?: string
    dropdownClass?: string
    customMargin?: string
    customInputStyles?: string
    textSelectStyle?: boolean
    dropdownOptionClass?: string
    textSelectLabelStyle?: string
    isRenderOptions?: boolean
  }>(),
  {
    searchable: false,
    multiple: false,
    isRenderOptions: true,
  },
)

const selectContainer = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()
const showDropdown = ref(false)
const showError = ref(false)
const searchQuery = ref('')
const dropdownOptionsContainer = ref<HTMLElement | null>(null)
const dropdownPosition = ref<'top' | 'bottom'>('bottom')

function onDropdownScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
    emit('scroll-bottom')
  }
}

const selectedValues = computed(() => {
  if (!props.multiple) return []
  if (Array.isArray(props.modelValue)) return props.modelValue
  return props.modelValue ? [props.modelValue] : []
})

const selectedLabel = computed(() => {
  const option = props.options.find((opt) => opt.value === props.modelValue)
  return option ? option.label : ''
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const getOptionLabel = (value: any) => {
  const option = props.options.find((opt) => opt.value === value)
  return option ? option.label : value
}

const getOptionIcon = (value: string) => {
  return props.options.find((opt) => opt.value === value)?.icon || ''
}

const isSelected = (value: any) => {
  return props.multiple ? selectedValues.value.includes(value) : props.modelValue === value
}

const toggleSelection = (value: any) => {
  // Check if the option is disabled
  const option = props.options.find((opt) => opt.value === value)
  if (option?.disabled) {
    return // Don't allow selection of disabled options
  }

  if (props.multiple) {
    const newValue = [...selectedValues.value]
    const index = newValue.indexOf(value)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    index > -1 ? newValue.splice(index, 1) : newValue.push(value)
    if (newValue.length === 0) {
      showError.value = true
    } else {
      showError.value = false // clear error on valid selection
    }
    emit('update:modelValue', newValue)
    emit('onChange', newValue)
  } else {
    emit('update:modelValue', value)
    emit('onChange', value)
    showDropdown.value = false
    searchQuery.value = ''
  }
}

const handleBlur = () => {
  if (
    props.updateOnBlur &&
    (props.multiple ? selectedValues.value.length === 0 : !props.modelValue)
  ) {
    showError.value = true
  } else {
    showError.value = false
  }
  emit('onBlur')
}

const removeSelected = (value: any) => {
  if (!props.multiple) return
  const isDisabled = Array.isArray(props.options)
    ? !!(props.options as any[]).find((o) => o?.value === value && o?.disabled)
    : false
  if (isDisabled) return
  const newValue = selectedValues.value.filter((v) => v !== value)
  if (newValue.length === 0) {
    showError.value = true
  }
  emit('update:modelValue', newValue)
  emit('onChange', newValue)
}

const toggleDropdown = () => {
  if (props.disabled || props.readonly) return

  if (!showDropdown.value) {
    // Calculate position before showing dropdown
    calculateDropdownPosition()
  }

  showDropdown.value = !showDropdown.value
  if (showDropdown.value && props.searchable && searchInput.value) {
    searchInput.value.focus()
  }
}

const calculateDropdownPosition = () => {
  if (!selectContainer.value) return

  const containerRect = selectContainer.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const maxDropdownHeight = 200

  const spaceBelow = viewportHeight - containerRect.bottom
  const spaceAbove = containerRect.top

  const buffer = 20

  if (spaceBelow < maxDropdownHeight + buffer && spaceAbove > maxDropdownHeight + buffer) {
    dropdownPosition.value = 'top'
  } else {
    dropdownPosition.value = 'bottom'
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && filteredOptions.value.length > 0) {
    toggleSelection(filteredOptions.value[0]?.value)
  }
}

onClickOutside(selectContainer, () => {
  showDropdown.value = false
})

onMounted(() => {
  if (props.autofocus && searchInput.value) {
    searchInput.value.focus()
  }

  // Add window resize and scroll listeners
  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('scroll', handleWindowResize, true)
})

const handleWindowResize = () => {
  if (showDropdown.value) {
    calculateDropdownPosition()
  }
}

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('scroll', handleWindowResize, true)
})

const inputClasses = computed(() => [
  'w-full rounded-lg border py-[6px] px-3.5 h-[auto] min-h-[40px] text-base text-neutral-900 text-[14px] tracking-[-0.01em] leading-tight transition-all duration-300',
  {
    'bg-gray-200 cursor-not-allowed text-gray-600 focus:border-none':
      props.readonly || props.disabled,
    'border-neutral-300 focus:border-neutral-500': props.status === 'default' || !props.status,
    'border-error-600 ring-error-200 focus:border-error-600':
      props.status === 'error' && showError.value,
    'border-success-600 ring-success-200 focus:border-success-600': props.status === 'success',
    'pl-10': props.iconNameLeft,
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
.readonly-container {
  @apply relative flex items-center w-full;
}

.readonly-field {
  @apply w-full rounded-lg border border-gray-400 bg-gray-200 py-1.5 pl-3 pr-10 text-base text-gray-600 cursor-not-allowed;
}

.readonly-overlay {
  @apply absolute right-3 top-1 flex items-center justify-center;
}
</style>

<style>
.w-auto svg {
  width: 14px !important;
}

.w-auto.text-white svg {
  width: 14px !important;
  fill: #ffffff !important;
}

.black-icon svg {
  fill: #000000 !important;
}

.question-select .relative {
  margin: 0;
}

.question-select .relative .flex.border {
  height: 100%;
  min-height: 32px;
  border: 1px solid #0000001a;
}
</style>
