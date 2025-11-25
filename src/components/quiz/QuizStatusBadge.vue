<script setup lang="ts">
import { computed } from 'vue'
import { BaseIcon } from '@/components/common'
import { PublishStatus } from '@/types/GlobalTypes'
import { utcToFormattedDate } from '@/utils/generalUtils'

interface Props {
  status: PublishStatus | string
  startDate?: string | null
  endDate?: string | null
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
  startDate: null,
  endDate: null,
})

const currentDate = computed(() => {
  const now = new Date()
  // Reset time to start of day for accurate date comparison
  now.setHours(0, 0, 0, 0)
  return now
})

const startDateObj = computed(() => {
  if (!props.startDate) return null
  try {
    const date = new Date(props.startDate)
    date.setHours(0, 0, 0, 0)
    return date
  } catch {
    return null
  }
})

const endDateObj = computed(() => {
  if (!props.endDate) return null
  try {
    const date = new Date(props.endDate)
    date.setHours(0, 0, 0, 0)
    return date
  } catch {
    return null
  }
})

const isStartDateFuture = computed(() => {
  if (!startDateObj.value) return false
  return startDateObj.value > currentDate.value
})

const isEndDatePast = computed(() => {
  if (!endDateObj.value) return false
  return endDateObj.value < currentDate.value
})

const formattedStartDate = computed(() => {
  if (!props.startDate || !isStartDateFuture.value) return ''
  try {
    return utcToFormattedDate(props.startDate, 'DD/MM/YYYY')
  } catch {
    return props.startDate
  }
})

const statusBadgeClass = computed(() => {
  const baseClasses =
    'inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap'

  // Priority 1: Expired (if endDate is past)
  if (isEndDatePast.value) {
    return `${baseClasses} bg-red-500`
  }

  // Priority 2: Draft (primary/blue badge)
  if (props.status === PublishStatus.DRAFT || props.status === 'Draft') {
    return `${baseClasses} bg-blue-500`
  }

  // Default: Published or other status
  return `${baseClasses} bg-green-500`
})

const statusText = computed(() => {
  // Priority 1: Expired (if endDate is past)
  if (isEndDatePast.value) {
    return 'Expired'
  }

  // Priority 2: Draft
  if (props.status === PublishStatus.DRAFT || props.status === 'Draft') {
    return 'Draft'
  }

  // Published status - return empty to hide badge
  return ''
})

const shouldShowDate = computed(() => {
  return isStartDateFuture.value && formattedStartDate.value !== ''
})
</script>

<template>
  <div class="flex flex-col gap-2 w-fit">
    <!-- Status Badge (only show if not Published) -->
    <span v-if="statusText" :class="statusBadgeClass">
      {{ statusText }}
    </span>

    <!-- Future Start Date Badge -->
    <div
      v-if="shouldShowDate"
      class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-purple-400 text-white text-xs font-medium whitespace-nowrap w-fit"
    >
      <BaseIcon name="clock" size="xs" color="white" />
      <span>{{ formattedStartDate }}</span>
    </div>
  </div>
</template>
