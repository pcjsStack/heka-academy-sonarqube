<template>
  <div>
    <div class="flex flex-row gap-4">
      <BaseSelect
        :label="t('pages.setRecurrence.recurrenceType')"
        :options="recurrenceTypeOptions"
        v-model="form.recurrenceType"
        :placeholder="t('pages.setRecurrence.selectRecurrenceType')"
        class="mb-4"
      />

      <!-- Recurrence Interval -->
      <BaseInput
        :label="t('pages.setRecurrence.recurrenceInterval')"
        type="number"
        min="1"
        v-model="form.recurrenceInterval"
        :placeholder="t('pages.setRecurrence.enterInterval')"
        class="mb-4"
      />
    </div>

    <!-- Repeat (Days of Week) -->
    <BaseText
      :text="t('pages.setRecurrence.repeat')"
      color="neutral"
      type="p-sm"
      font="medium"
      class="mb-1"
    />
    <div v-if="isWeekly" class="flex gap-2 mb-4">
      <button
        v-for="day in weekDays"
        :key="day.value"
        :class="[
          'w-8 h-8 rounded-full flex items-center justify-center',
          form.repeatDay === day.value
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-neutral-300 text-neutral-800',
        ]"
        @click="form.repeatDay = day.value"
        type="button"
      >
        {{ day.label }}
      </button>
    </div>
    <div v-else-if="isMonthly">
      <BaseSelect
        v-model="form.repeatDate"
        :options="monthDates.map((d) => ({ label: d.toString(), value: d }))"
        :label="t('pages.setRecurrence.repeatDate')"
        :placeholder="t('pages.setRecurrence.selectDate')"
      />
    </div>

    <!-- Ends -->
    <BaseText
      :text="t('pages.setRecurrence.ends')"
      color="neutral"
      type="p-sm"
      font="medium"
      class="mb-1"
    />
    <div class="flex flex-row items-start gap-4 mb-4">
      <div class="flex flex-col gap-2 min-w-[180px] w-[50%]">
        <BaseRadioButton
          v-for="end in endsOptions"
          :key="end.value"
          :label="end.label"
          :value="end.value"
          :modelValue="form.ends"
          name="recurrence-ends"
          direction="vertical"
          tailwindCss="min-h-[40px]"
          customInputStyles="w-[16px] h-[16px]"
          wrapperClass="!gap-[12px]"
          labelClass="!text-neutral-500 !text-[14px] !font-medium"
          labelActiveClass="!text-black/85 !text-[14px] !font-medium"
          @update:modelValue="(value) => (form.ends = value)"
        />
      </div>
      <div class="flex flex-col gap-2 flex-1 w-[50%]">
        <BaseDatepicker
          v-model="form.endDate"
          :disabled="form.ends !== 'endDate'"
          :placeholder="t('pages.setRecurrence.enterDate')"
        />
        <BaseInput
          type="number"
          min="1"
          v-model="form.endAfterOccurrences"
          :disabled="form.ends !== 'afterOccurrences'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import moment from 'moment'
import {
  BaseSelect,
  BaseInput,
  BaseText,
  BaseRadioButton,
  BaseDatepicker,
} from '@/components/common'
import { t } from '@/utils/i18n'
import { getCurrentDayChar } from '@/utils/generalUtils'

const emit = defineEmits(['update:modelValue'])
const props = defineProps<{
  isMobile?: boolean
  modelValue?: {
    recurrenceType: string
    recurrenceInterval: string | number
    repeatDay: string
    repeatDate: number
    ends: string
    endDate: string | null
    endAfterOccurrences: string | number
  } | null
}>()

const recurrenceTypeOptions = [
  { label: t('pages.setRecurrence.weeklyRecurrenceType'), value: 'Weekly' },
  { label: t('pages.setRecurrence.monthlyRecurrenceType'), value: 'Monthly' },
]

const weekDays = [
  { label: 'M', value: 'Monday' },
  { label: 'T', value: 'Tuesday' },
  { label: 'W', value: 'Wednesday' },
  { label: 'T', value: 'Thursday' },
  { label: 'F', value: 'Friday' },
  { label: 'S', value: 'Saturday' },
  { label: 'S', value: 'Sunday' },
]

const monthDates = Array.from({ length: 31 }, (_, i) => i + 1)

const endsOptions = [
  { label: t('pages.setRecurrence.endDate'), value: 'endDate' },
  { label: t('pages.setRecurrence.afterOccurrences'), value: 'afterOccurrences' },
]

// Helper to format date from ISO to simple format
const formatEndDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null

  // Check if it's an ISO format with timezone (e.g., 2025-11-19T18:30:00.000+00:00)
  if (dateStr.includes('T')) {
    // Parse and format to YYYY-MM-DD HH:mm
    return moment(dateStr).format('YYYY-MM-DD HH:mm')
  }

  // If already in simple format, return as is
  return dateStr
}

const form = reactive({
  recurrenceType: props.modelValue?.recurrenceType || 'Weekly',
  recurrenceInterval: props.modelValue?.recurrenceInterval || '',
  repeatDay: props.modelValue?.repeatDay || getCurrentDayChar(),
  repeatDate: props.modelValue?.repeatDate || 1,
  ends: props.modelValue?.ends || 'endDate',
  endDate: formatEndDate(props.modelValue?.endDate || null),
  endAfterOccurrences: props.modelValue?.endAfterOccurrences || '',
})

// Watch form changes and emit to parent
watch(
  form,
  () => {
    emit('update:modelValue', {
      recurrenceType: form.recurrenceType,
      recurrenceInterval: form.recurrenceInterval,
      repeatDay: form.repeatDay,
      repeatDate: form.repeatDate,
      ends: form.ends,
      endDate: form.endDate,
      endAfterOccurrences: form.endAfterOccurrences,
    })
  },
  { deep: true },
)

// Watch for modelValue changes (when editing existing course)
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      form.recurrenceType = newValue.recurrenceType || 'Weekly'
      form.recurrenceInterval = newValue.recurrenceInterval || ''
      form.repeatDay = newValue.repeatDay || getCurrentDayChar()
      form.repeatDate = newValue.repeatDate || 1
      form.ends = newValue.ends || 'endDate'
      form.endDate = formatEndDate(newValue.endDate || null)
      form.endAfterOccurrences = newValue.endAfterOccurrences || ''
    }
  },
  { deep: true },
)

// Clear opposite field when switching between end types
watch(
  () => form.ends,
  (val) => {
    if (val === 'endDate') {
      form.endAfterOccurrences = ''
    } else {
      form.endDate = null
    }
  },
)

const isWeekly = computed(() => form.recurrenceType === 'Weekly')
const isMonthly = computed(() => form.recurrenceType === 'Monthly')
</script>

<style scoped>
.bg-primary-600 {
  background-color: #2196f3;
}
.text-white {
  color: #fff;
}
</style>
