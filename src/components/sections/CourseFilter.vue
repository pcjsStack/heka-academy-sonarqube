<script setup lang="ts">
import { computed } from 'vue'
import moment from 'moment'
import {
  BaseSideModal,
  BaseText,
  BaseCheckbox,
  BaseButton,
  BaseDatepicker,
} from '@/components/common'
import { t } from '@/utils/i18n'
import type { GetCoursesParams } from '@/types/Course'
import { ExecutionStatus } from '@/types/GlobalTypes'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'applyFilters', filters: GetCoursesParams): void
  (e: 'clear'): void
  (e: 'update:filters', filters: GetCoursesParams): void
}>()

const props = withDefaults(
  defineProps<{
    filters: GetCoursesParams
    isAdmin?: boolean
  }>(),
  {
    isAdmin: false,
  },
)

// Filter options
const visibilityOptions = [
  { value: 'all', label: t('pages.course.filter.visibility.all') },
  {
    value: 'show',
    label: t('pages.course.filter.visibility.showActivityCompletion'),
  },
  { value: 'hide', label: t('pages.course.filter.visibility.hide') },
  { value: 'maintenance', label: t('pages.course.filter.visibility.maintenance') },
]

// Active filter count
const activeFilterCount = computed(() => {
  let count = 0
  if (props.isAdmin) {
    // Admin filters
    if (props.filters.published) count++
    // Check if date range is set
    if (props.filters.date || (props.filters.startDate && props.filters.endDate)) count++
    // Count visibility filters (excluding 'all')
    const vis = props.filters.visibility ?? []
    count += vis.filter((v) => v !== 'all').length
  } else {
    // Non-admin filters
    // Count execution status filters
    if (Array.isArray(props.filters.executionStatus) && props.filters.executionStatus.length > 0) {
      count += props.filters.executionStatus.length
    } else if (props.filters.executionStatus) {
      count++
    }
    // Check if date range is set
    if (props.filters.date || (props.filters.startDate && props.filters.endDate)) count++
  }
  return count
})

// Computed property to convert date range string to Date array for datepicker
const getDateRangeValue = computed(() => {
  // Check if we have startDate and endDate
  if (props.filters.startDate && props.filters.endDate) {
    try {
      const start = moment(props.filters.startDate, 'YYYY-MM-DD')
      const end = moment(props.filters.endDate, 'YYYY-MM-DD')
      if (start.isValid() && end.isValid()) {
        return [start.toDate(), end.toDate()]
      }
    } catch (error) {
      console.warn('Invalid date format:', error)
    }
  }
  // Check if we have date string in format "YYYY-MM-DD,YYYY-MM-DD"
  if (props.filters.date) {
    try {
      const dates = props.filters.date.split(',')
      if (dates.length === 2 && dates[0] && dates[1]) {
        const start = moment(dates[0].trim(), 'YYYY-MM-DD')
        const end = moment(dates[1].trim(), 'YYYY-MM-DD')
        if (start.isValid() && end.isValid()) {
          return [start.toDate(), end.toDate()]
        }
      }
    } catch (error) {
      console.warn('Invalid date format:', error)
    }
  }
  return null
})

const applyFilters = () => {
  emit('applyFilters', props.filters)
}

const clearAll = () => {
  emit('clear')
}

const handleClose = () => {
  // Emit close event safely
  try {
    emit('close')
  } catch (error) {
    console.error('Error closing filter modal:', error)
  }
}

const handleDateRangeChange = (value: Date | Date[] | null | undefined) => {
  // Handle range mode: value will be Date[] when range is true
  if (!value || !Array.isArray(value) || value.length !== 2) {
    // Clear date range
    emit('update:filters', {
      ...props.filters,
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    })
    return
  }

  try {
    const start = value[0]
    const end = value[1]

    if (!start || !end) {
      // Clear if invalid
      emit('update:filters', {
        ...props.filters,
        date: undefined,
        startDate: undefined,
        endDate: undefined,
      })
      return
    }

    const startDate = moment(start).format('YYYY-MM-DD')
    const endDate = moment(end).format('YYYY-MM-DD')

    if (moment(startDate).isValid() && moment(endDate).isValid()) {
      // Store both as individual fields and as date string
      emit('update:filters', {
        ...props.filters,
        startDate,
        endDate,
        date: `${startDate},${endDate}`,
      })
    }
  } catch (error) {
    console.error('Error handling date range change:', error, value)
    // Clear on error
    emit('update:filters', {
      ...props.filters,
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    })
  }
}

const handlePublishedChange = (value: boolean) => {
  emit('update:filters', {
    ...props.filters,
    published: value,
  })
}

// Execution status options for non-admin users
const executionStatusOptions = [
  { value: ExecutionStatus.TODO, label: t('pages.courseDetails.status.todo') },
  { value: ExecutionStatus.IN_PROGRESS, label: t('pages.courseDetails.status.inProgress') },
  { value: ExecutionStatus.COMPLETED, label: t('pages.courseDetails.status.completed') },
]

const handleExecutionStatusUpdate = (
  statusValue: ExecutionStatus,
  selectedValues: ExecutionStatus[],
) => {
  const newSelection = Array.isArray(selectedValues) ? [...selectedValues] : []

  emit('update:filters', {
    ...props.filters,
    executionStatus: newSelection.length > 0 ? newSelection : null,
    status: undefined, // Clear status when using executionStatus
  })
}

// Specific visibility options (excluding 'all')
const specificOptions = ['show', 'hide', 'maintenance']

const handleVisibilityUpdate = (optionValue: string, selectedValues: string[]) => {
  const newSelection = Array.isArray(selectedValues) ? [...selectedValues] : []
  const currentSelection = props.filters.visibility ?? []
  const wasAllSelected = currentSelection.includes('all')
  const isAllSelected = newSelection.includes('all')

  if (optionValue === 'all') {
    // User clicked on 'all' checkbox
    if (isAllSelected && !wasAllSelected) {
      // 'all' is being selected - automatically select all specific options
      emit('update:filters', {
        ...props.filters,
        visibility: ['all', 'show', 'hide', 'maintenance'],
      })
    } else if (!isAllSelected && wasAllSelected) {
      // 'all' is being deselected - automatically deselect all specific options
      emit('update:filters', {
        ...props.filters,
        visibility: [],
      })
    } else {
      // Fallback: just use the new selection
      emit('update:filters', {
        ...props.filters,
        visibility: newSelection,
      })
    }
    return
  }

  // User clicked on a specific option (show, hide, or maintenance)
  // Remove 'all' from the selection first (we'll add it back if needed)
  let finalSelection = newSelection.filter((v) => v !== 'all')

  // Check if all specific options are now selected
  const allSpecificSelected = specificOptions.every((opt) => finalSelection.includes(opt))

  // If all specific options are selected, automatically add 'all'
  if (allSpecificSelected) {
    finalSelection = ['all', ...specificOptions]
  }

  emit('update:filters', {
    ...props.filters,
    visibility: finalSelection,
  })
}
</script>

<template>
  <BaseSideModal
    size="sm"
    :title="t('pages.course.filter.title')"
    close-button
    closeButtonColor="neutral"
    @onClose="handleClose"
    containerTailwindCss="!p-0"
    customClass="left-0"
    :zIndex="1000"
    customTitle
  >
    <template #custom-title>
      <div class="flex items-center gap-2">
        <BaseText
          :text="t('pages.course.filter.title')"
          type="h6"
          color="neutral"
          font="semibold"
          class="text-lg"
        />
        <BaseText
          :text="activeFilterCount.toString()"
          class="!w-[24px] !bg-[rgba(233,0,98,0.1)] !text-pink !h-[20px] ml-[2px] !rounded-[150px] flex justify-center !text-[12px] !font-medium"
        />
      </div>
    </template>
    <div
      class="lg:px-6 px-4 pt-8 sm:pb-[56px] pb-[32px] sm:h-[calc(100vh-155px)] h-[calc(100svh-155px)] overflow-y-auto"
    >
      <div class="flex flex-col gap-6 overflow-y-auto flex-1 h-full min-h-0">
        <!-- Admin: Published Section -->
        <div v-if="isAdmin">
          <BaseText
            :text="t('pages.course.filter.published.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <div class="flex items-center gap-3">
            <BaseCheckbox
              :model-value="[filters.published ? 'published' : '']"
              value="published"
              :label="t('pages.course.filter.published.label')"
              uncheckedStroke="#637083"
              :checkbox-width="16"
              :checkbox-height="16"
              wrapperClass="w-full"
              @update:model-value="(values) => handlePublishedChange(values.includes('published'))"
            />
          </div>
        </div>

        <!-- Non-Admin: Execution Status Section -->
        <div v-else>
          <BaseText
            :text="t('pages.course.filter.executionStatus.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <div class="flex flex-col gap-2">
            <div
              v-for="option in executionStatusOptions"
              :key="option.value"
              class="flex items-center gap-3"
            >
              <BaseCheckbox
                :model-value="
                  Array.isArray(filters.executionStatus)
                    ? filters.executionStatus
                    : filters.executionStatus
                      ? [filters.executionStatus]
                      : []
                "
                :value="option.value"
                :label="option.label"
                uncheckedStroke="#637083"
                :checkbox-width="16"
                :checkbox-height="16"
                wrapperClass="w-full"
                @update:model-value="
                  (vals) => handleExecutionStatusUpdate(option.value, vals as ExecutionStatus[])
                "
              />
            </div>
          </div>
        </div>

        <!-- Date Section -->
        <div>
          <BaseText
            :text="t('pages.course.filter.date.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <BaseDatepicker
            :model-value="getDateRangeValue"
            :placeholder="t('pages.course.filter.date.placeholder')"
            :range="true"
            :clearable="true"
            format="dd/MM/yyyy"
            model-type="yyyy-MM-dd"
            @update:model-value="handleDateRangeChange"
          />
        </div>

        <!-- Admin: Visibility Section -->
        <div v-if="isAdmin">
          <BaseText
            :text="t('pages.course.filter.visibility.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <div class="flex flex-col gap-2">
            <div
              v-for="option in visibilityOptions"
              :key="option.value"
              class="flex items-center gap-3"
            >
              <BaseCheckbox
                :model-value="filters.visibility ?? []"
                :value="option.value"
                :label="option.label"
                uncheckedStroke="#637083"
                :checkbox-width="16"
                :checkbox-height="16"
                wrapperClass="w-full"
                @update:model-value="(vals) => handleVisibilityUpdate(option.value, vals)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :fullSize="false"
          text="Reset"
          color="primary"
          size="sm"
          variant="link"
          class="md:max-w-[102px] max-w-[50%] !font-medium"
          @on-click="clearAll"
        />
        <BaseButton
          :fullSize="false"
          text="Search"
          color="primary"
          size="sm"
          variant="default"
          class="md:max-w-[129px] max-w-[50%] !font-medium"
          @on-click="applyFilters"
        />
      </div>
    </div>
  </BaseSideModal>
</template>
