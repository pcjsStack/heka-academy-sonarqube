<template>
  <div :class="['flex w-full flex-col gap-1.5', customDatePickerStyle]">
    <div v-if="label" class="flex items-center space-x-1">
      <BaseText
        :text="`${label}`"
        :tone="700"
        color="neutral"
        font="medium"
        type="p-sm"
        :class="[labelClass, 'text-xs-custom text-custom-label-text']"
      />
      <span v-if="required" class="text-pink !ml-0 text-[12px] tracking-[-0.01em] leading-tight">
        *
      </span>
    </div>
    <div class="relative">
      <VueDatePicker
        cancel-text="Cancel"
        :class="[
          {
            default: (status ?? 'default') === 'default',
            error: (status ?? 'default') == 'error',
            success: (status ?? 'default') == 'success',
          },
          '!font-medium !text-black/85',
        ]"
        :clearable="clearable"
        :disabled="disabled"
        :disabled-dates="disableDates"
        :enable-time-picker="enableTimePicker || false"
        :time-picker="timePicker || false"
        :format="format ? format : timePicker ? 'HH:mm' : 'dd/MM/yyyy HH:mm'"
        :locale="'en'"
        :max-date="maxDate"
        :min-date="minDate ?? undefined"
        :model-type="
          range ? undefined : modelType ? modelType : timePicker ? 'HH:mm' : 'yyyy-MM-dd HH:mm'
        "
        :model-value="modelValue"
        :placeholder="placeholder"
        :range="range ? { partialRange: false } : undefined"
        :required="required"
        :auto-apply="true"
        :action-row="{ showSelect: false, showCancel: false }"
        @update:model-value="setValue"
      >
        <template #input-icon v-if="timePicker">
          <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <BaseIcon name="clock" size="sm" />
          </div>
        </template>
        <template #input-icon v-else>
          <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <BaseIcon name="calendar1" size="xs" />
          </div>
        </template>
        <template #clear-icon v-if="clearable">
          <div
            class="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer z-10"
            @click="handleClear"
          >
            <BaseIcon name="clear" size="xs" color="neutral" :tone="500" />
          </div>
        </template>
      </VueDatePicker>
    </div>
    <div v-if="Array.isArray(hintMessage)">
      <BaseText
        v-for="(message, i) in hintMessage"
        :key="`hint-message-${i}`"
        :color="status == 'error' ? 'error' : status == 'success' ? 'success' : 'neutral'"
        :text="message"
        font="medium"
        type="p-sm"
      />
    </div>
    <div v-else-if="hintMessage">
      <BaseText
        :color="status == 'error' ? 'error' : status == 'success' ? 'success' : 'neutral'"
        :text="hintMessage as string"
        font="medium"
        type="p-sm"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import BaseText from '../text/BaseText.vue'
import BaseIcon from '../icon/BaseIcon.vue'

defineProps<{
  label?: string
  placeholder?: string
  modelValue?: any
  hintMessage?: string | string[]
  format?: string
  modelType?: string
  status?: 'default' | 'error' | 'success'
  range?: boolean
  clearable?: boolean
  required?: boolean
  enableTimePicker?: boolean
  disableDates?: Date[] | string[] | ((date: Date) => boolean)
  minDate?: Date | string
  maxDate?: Date | string
  disabled?: boolean
  labelClass?: string
  timePicker?: boolean
  customDatePickerStyle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Date | Date[] | null | undefined]
}>()

const setValue = (value: Date | Date[] | null | undefined) => {
  emit('update:modelValue', value)
}

const handleClear = () => {
  // Emit null directly when clearing, which works for both single and range modes
  emit('update:modelValue', null)
}
</script>

<style>
.dp__input_icon {
  left: auto;
  right: 0;
}
.dp__input_icon_pad {
  padding-inline-start: 14px;
  padding-inline-end: 36px; /* Space for calendar icon on the right */
  font-size: 14px;
  letter-spacing: -0.01em;
  font-family: 'Inter', sans-serif;
  padding-top: 7px;
  padding-bottom: 7px;
  border-radius: 8px;
  font-weight: 500 !important;
  color: rgba(0, 0, 0, 0.85) !important;
}
.dp__pointer.dp__input_readonly.dp__input::placeholder {
  color: rgba(0, 0, 0, 0.5);
}
.custom-date-picker .dp__outer_menu_wrap {
  left: 0 !important;
}
.default.dp__main input {
  @apply border-neutral-300 focus:border-primary-400 focus:ring-blue-200 disabled:border-neutral-300;
}

.error.dp__main input {
  @apply border-error-300 focus:border-error-400 focus:ring-error-200;
}

.success.dp__main input {
  @apply border-success-300 focus:border-success-400 focus:ring-success-200;
}

/* Hide the default VueDatePicker clear icon to use our custom one */
.dp__clear_icon {
  display: none !important;
}
</style>
