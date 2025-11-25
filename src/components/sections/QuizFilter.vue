<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BaseSideModal,
  BaseText,
  BaseRadioButton,
  BaseButton,
  BaseCheckbox,
} from '@/components/common'
import { t } from '@/utils/i18n'
import type { GetQuizzesParams } from '@/types/Quiz'
import { PublishStatus, ExecutionStatus } from '@/types/GlobalTypes'

interface Props {
  filters: GetQuizzesParams
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const emit = defineEmits<{
  close: []
  applyFilters: [filters: GetQuizzesParams]
  clear: []
  'update:filters': [filters: GetQuizzesParams]
}>()

// Local state for UI only (admin status)
const selectedStatus = ref<string>('')

// Initialize selected status from props based on isAdmin
watch(
  () => [props.filters.status, props.isAdmin],
  ([newStatus, isAdmin]) => {
    if (isAdmin) {
      selectedStatus.value = (newStatus as string) || ''
    }
  },
  { immediate: true },
)

// Active filter count for badge
const activeFilterCount = computed(() => {
  let count = 0
  if (props.isAdmin) {
    if (selectedStatus.value) count++
  } else {
    // Count execution status filters
    if (Array.isArray(props.filters.executionStatus) && props.filters.executionStatus.length > 0) {
      count += props.filters.executionStatus.length
    } else if (props.filters.executionStatus) {
      count++
    }
  }
  return count
})

const applyFilters = () => {
  // Build filter params from current selections
  const filterParams: GetQuizzesParams = {
    ...props.filters,
  }

  if (props.isAdmin) {
    // Admin: use status field
    filterParams.status =
      selectedStatus.value === '' ? null : (selectedStatus.value as PublishStatus)
    filterParams.executionStatus = null
  } else {
    // Non-admin: executionStatus is already updated via handleExecutionStatusUpdate
    filterParams.status = null
  }

  emit('applyFilters', filterParams)
  emit('close')
}

const clearAll = () => {
  // Reset UI state
  if (props.isAdmin) {
    selectedStatus.value = ''
  }
  emit('clear')
}

const handleClose = () => {
  emit('close')
}

// Watch for changes and emit updates
watch(selectedStatus, (newValue) => {
  if (props.isAdmin) {
    const filterParams: GetQuizzesParams = {
      ...props.filters,
      status: newValue === '' ? null : (newValue as PublishStatus),
      executionStatus: null,
    }
    emit('update:filters', filterParams)
  }
})

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

  const filterParams: GetQuizzesParams = {
    ...props.filters,
    executionStatus: newSelection.length > 0 ? newSelection : null,
    status: null, // Clear status when using executionStatus
  }
  emit('update:filters', filterParams)
}
</script>

<template>
  <BaseSideModal
    size="sm"
    :title="t('pages.quizzes.filter.title')"
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
          :text="t('pages.quizzes.filter.title')"
          type="h6"
          color="neutral"
          font="semibold"
          class="text-lg"
        />
        <BaseText
          :text="activeFilterCount.toString()"
          class="!w-[24px] !bg-pink/10 !text-pink !h-[20px] ml-[2px] !rounded-[150px] flex justify-center !text-[12px] !font-medium"
        />
      </div>
    </template>
    <div
      class="lg:px-6 px-4 pt-8 sm:pb-[56px] pb-[32px] sm:h-[calc(100vh-155px)] h-[calc(100svh-155px)] overflow-y-auto"
    >
      <div class="flex flex-col gap-6 overflow-y-auto flex-1 h-full min-h-0">
        <!-- Admin: Status Radio Buttons Section -->
        <div v-if="isAdmin">
          <BaseText
            :text="t('pages.quizzes.filter.status.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <div class="flex flex-col gap-3">
            <BaseRadioButton
              v-model="selectedStatus"
              value=""
              :label="t('pages.quizzes.filter.status.all')"
              name="quiz-status"
            />
            <BaseRadioButton
              v-model="selectedStatus"
              :value="PublishStatus.PUBLISHED"
              :label="t('pages.quizzes.filter.status.published')"
              name="quiz-status"
            />
            <BaseRadioButton
              v-model="selectedStatus"
              :value="PublishStatus.DRAFT"
              :label="t('pages.quizzes.filter.status.draft')"
              name="quiz-status"
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
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :fullSize="false"
          :text="t('pages.quizzes.filter.clear')"
          color="primary"
          size="sm"
          variant="link"
          class="md:max-w-[102px] max-w-[50%] !font-medium"
          @on-click="clearAll"
        />
        <BaseButton
          :fullSize="false"
          :text="t('pages.quizzes.filter.applyFilters')"
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
