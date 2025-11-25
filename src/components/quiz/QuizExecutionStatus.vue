<script setup lang="ts">
import { computed } from 'vue'
import { BaseIcon, BaseCircularProgress } from '@/components/common'
import { ExecutionStatus, type ExecutionDetails } from '@/types/GlobalTypes'

interface Props {
  execution: ExecutionDetails | null
  showBadge?: boolean
  showThumbnailIcon?: boolean
  showProgressBar?: boolean
  showPercentageCircle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBadge: false,
  showThumbnailIcon: false,
  showProgressBar: false,
  showPercentageCircle: false,
})

const shouldShowStatus = computed(() => {
  return props.execution && props.execution.status !== ExecutionStatus.TODO
})

const statusBadgeClass = computed(() => {
  if (!props.execution) return ''

  const baseClasses = 'px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap'

  switch (props.execution.status) {
    case ExecutionStatus.IN_PROGRESS:
      return `${baseClasses} bg-blue-500`
    case ExecutionStatus.FAILED:
      return `${baseClasses} bg-red-500`
    default:
      return ''
  }
})

const statusText = computed(() => {
  if (!props.execution) return ''

  switch (props.execution.status) {
    case ExecutionStatus.IN_PROGRESS:
      return 'In progress'
    case ExecutionStatus.FAILED:
      return 'Failed'
    default:
      return ''
  }
})

const percentage = computed(() => {
  if (!props.execution || props.execution.percentage === null) {
    if (props.execution?.status === ExecutionStatus.FAILED) return 0
    if (props.execution?.status === ExecutionStatus.COMPLETED) return 100
    return 0
  }
  return props.execution.percentage
})

const showThumbnailIconComputed = computed(() => {
  return (
    props.execution &&
    (props.execution.status === ExecutionStatus.FAILED ||
      props.execution.status === ExecutionStatus.COMPLETED)
  )
})

const showProgressBarComputed = computed(() => {
  return (
    props.execution &&
    (props.execution.status === ExecutionStatus.FAILED ||
      props.execution.status === ExecutionStatus.COMPLETED)
  )
})
</script>

<template>
  <template v-if="shouldShowStatus">
    <!-- Thumbnail Icon (for FAILED and COMPLETED) -->
    <div
      v-if="props.showThumbnailIcon && showThumbnailIconComputed"
      class="absolute -top-1 -right-1 flex items-center justify-center z-10"
    >
      <!-- Sad emoji/icon for failed status -->
      <BaseIcon
        v-if="execution?.status === ExecutionStatus.FAILED"
        name="sad"
        size="sm"
        color="error"
        class="bg-error-100 rounded-full shadow-sm"
      />
      <BaseIcon
        v-else-if="execution?.status === ExecutionStatus.COMPLETED"
        name="check"
        size="sm"
        color="success"
        class="bg-success-100 rounded-full shadow-sm"
      />
    </div>

    <!-- Status Badge and Progress in one line -->
    <div
      v-if="
        (props.showBadge &&
          (execution?.status === ExecutionStatus.IN_PROGRESS ||
            execution?.status === ExecutionStatus.FAILED)) ||
        (props.showProgressBar && showProgressBarComputed)
      "
      class="flex items-center gap-2"
    >
      <!-- Status Badge (for IN_PROGRESS and FAILED) -->
      <span
        v-if="
          props.showBadge &&
          (execution?.status === ExecutionStatus.IN_PROGRESS ||
            execution?.status === ExecutionStatus.FAILED)
        "
        :class="statusBadgeClass"
      >
        {{ statusText }}
      </span>

      <!-- Progress Bar (for COMPLETED and FAILED) -->
      <div v-if="props.showProgressBar && showProgressBarComputed">
        <BaseCircularProgress
          :value="percentage"
          :max="100"
          size="sm"
          :color="execution?.status === ExecutionStatus.FAILED ? 'error' : 'success'"
        />
      </div>
    </div>
  </template>
</template>
