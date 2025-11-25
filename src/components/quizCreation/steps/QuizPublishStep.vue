<script setup lang="ts">
import { ref } from 'vue'
import moment from 'moment'
import { BaseDatepicker } from '@/components/common'
import { t } from '@/utils/i18n'
import type { QuizPublishData, QuizPublishExpose } from '@/types/QuizCreation'

// Form data
const startDate = ref<string>('')
const endDate = ref<string>('')

// Handler to clear end date when start date changes
const handleStartDateUpdate = (newVal: Date | Date[] | null | undefined) => {
  if (newVal) {
    // Clear end date when start date changes
    endDate.value = ''
  }
}

// Expose getter/setter to parent component
defineExpose<QuizPublishExpose>({
  getPublishData: () => ({
    startDate: startDate.value,
    endDate: endDate.value,
  }),
  setPublishData: (values: Partial<QuizPublishData>) => {
    if (!values) return
    if (values.startDate !== undefined)
      startDate.value = moment(values.startDate).format('YYYY-MM-DD HH:mm')
    if (values.endDate !== undefined)
      endDate.value = moment(values.endDate).format('YYYY-MM-DD HH:mm')
  },
})
</script>

<template>
  <div class="max-w-[816px] mx-auto">
    <div class="space-y-6">
      <!-- Date Range -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseDatepicker
          v-model="startDate"
          :label="t('pages.quizCreation.publish.validFrom')"
          :placeholder="t('pages.quizCreation.publish.validFrom')"
          format="dd/MM/yyyy"
          :min-date="new Date().toISOString()"
          @update:model-value="
            (value: Date | Date[] | null | undefined) => handleStartDateUpdate(value)
          "
          :enable-time-picker="false"
          clearable
        />
        <BaseDatepicker
          v-model="endDate"
          :label="t('pages.quizCreation.publish.validTo')"
          :placeholder="t('pages.quizCreation.publish.validTo')"
          format="dd/MM/yyyy"
          :min-date="startDate"
          clearable
          :enable-time-picker="false"
        />
      </div>
    </div>
  </div>
</template>
