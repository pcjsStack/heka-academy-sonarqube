<script setup lang="ts">
import { computed } from 'vue'
import moment from 'moment'
import { BaseIcon, BaseText } from '@/components/common'
import { VisibilityStatus } from '@/types/Course'

interface Props {
  visibility?: VisibilityStatus
  startDate?: string | null
  endDate?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  visibility: VisibilityStatus.SHOW,
  startDate: null,
  endDate: null,
})

// Determine which badge to show based on priority:
// 1. Expired (endDate in past) - highest priority
// 2. Maintenance (visibility === MAINTENANCE)
// 3. Hidden (visibility === HIDE)
// 4. Future date (startDate in future) - lowest priority

const badgeType = computed(() => {
  const now = moment()

  // Check if expired (endDate is in the past)
  if (props.endDate) {
    const endDateMoment = moment(props.endDate)
    if (endDateMoment.isValid() && endDateMoment.isBefore(now, 'day')) {
      return 'expired'
    }
  }

  // Check visibility status
  if (props.visibility === VisibilityStatus.MAINTENANCE) {
    return 'maintenance'
  }

  if (props.visibility === VisibilityStatus.HIDE) {
    return 'hidden'
  }

  // Check if future date (startDate is in the future)
  if (props.startDate) {
    const startDateMoment = moment(props.startDate)
    if (startDateMoment.isValid() && startDateMoment.isAfter(now, 'day')) {
      return 'future'
    }
  }

  return null
})

const formattedDate = computed(() => {
  if (!props.startDate || badgeType.value !== 'future') return null
  const startDateMoment = moment(props.startDate)
  if (startDateMoment.isValid()) {
    return startDateMoment.format('DD/MM/YYYY')
  }
  return null
})
</script>

<template>
  <!-- Expired Badge (Red) -->
  <div
    v-if="badgeType === 'expired'"
    class="absolute top-2 left-2 rounded-[8px] px-2 py-1 bg-red-500 flex items-center gap-1.5 z-10"
  >
    <BaseText
      text="Expired"
      type="p-xs"
      color="white"
      font="semibold"
      class="!text-[11px] md:!text-[10px] lg:!text-[11px] !leading-[13px]"
    />
  </div>

  <!-- Maintenance Badge (Orange) -->
  <div
    v-else-if="badgeType === 'maintenance'"
    class="absolute top-2 left-2 rounded-[8px] px-2 py-1 bg-orange-400 flex items-center gap-1.5 z-10"
  >
    <BaseIcon name="pause" size="xs" color="white" />
    <BaseText
      text="Maintenance"
      type="p-xs"
      color="white"
      font="semibold"
      class="!text-[11px] md:!text-[10px] lg:!text-[11px] !leading-[13px]"
    />
  </div>

  <!-- Hidden Badge (Orange) -->
  <div
    v-else-if="badgeType === 'hidden'"
    class="absolute top-2 left-2 rounded-[8px] px-2 py-1 bg-orange-400 flex items-center gap-1.5 z-10"
  >
    <BaseIcon name="eye-off" size="xs" color="white" />
    <BaseText
      text="Hidden"
      type="p-xs"
      color="white"
      font="semibold"
      class="!text-[11px] md:!text-[10px] lg:!text-[11px] !leading-[13px]"
    />
  </div>

  <!-- Future Date Badge (Purple) -->
  <div
    v-else-if="badgeType === 'future' && formattedDate"
    class="absolute top-2 left-2 rounded-[8px] px-2 py-1 bg-purple-400 flex items-center gap-1.5 z-10"
  >
    <BaseIcon name="clock" size="xs" color="white" />
    <BaseText
      :text="formattedDate"
      type="p-xs"
      color="white"
      font="semibold"
      class="!text-[11px] md:!text-[10px] lg:!text-[11px] !leading-[13px]"
    />
  </div>
</template>
