<script setup lang="ts">
import { computed } from 'vue'
import moment from 'moment'
import { BaseIcon } from '@/components/common'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import CardStatusBadge from './CardStatusBadge.vue'
import CardProgressBar from './CardProgressBar.vue'
import { t } from '@/utils/i18n'
import type { Icons } from '@/types/Styles'
import { VisibilityStatus } from '@/types/Course'

interface BaseCardProps {
  title: string
  category: string
  categoryColor?: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'red'
  mentor: string
  mentorAvatar?: string
  progress: number
  thumbnail?: string
  isBookmarked?: boolean
  showLikeDislike?: boolean
  isEditable?: boolean
  visibility?: VisibilityStatus
  isAdmin?: boolean
  startDate?: string | null
  endDate?: string | null
  totalAssignations?: number
}

const props = withDefaults(defineProps<BaseCardProps>(), {
  categoryColor: 'blue',
  isBookmarked: false,
  showLikeDislike: true,
  thumbnail: '',
  isEditable: false,
  visibility: VisibilityStatus.SHOW,
  isAdmin: false,
  startDate: null,
  endDate: null,
  totalAssignations: 0,
})

const emit = defineEmits(['bookmark', 'like', 'dislike', 'click', 'edit', 'delete', 'progress'])

// Determine badge type (same logic as CardStatusBadge)
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

// Check if card should be disabled (non-admin users cannot access expired or maintenance cards)
const isCardDisabled = computed(() => {
  return !props.isAdmin && (badgeType.value === 'expired' || badgeType.value === 'maintenance')
})

const handleCardClick = () => {
  if (!isCardDisabled.value) {
    emit('click')
  }
}

const menuItems = (visibility: VisibilityStatus) => {
  // Enable edit only when visibility is MAINTENANCE or HIDE
  // Edit is disabled when visibility is NOT (MAINTENANCE OR HIDE)
  const isEditDisabled = !(visibility === VisibilityStatus.MAINTENANCE)

  const deleteDisabledTooltip = isEditDisabled ? t('pages.common.cannotDeleteNotDraft') : undefined

  return [
    {
      label: t('pages.common.progress'),
      icon: 'eye' as Icons,
      action: () => {
        emit('progress')
      },
    },
    {
      label: t('pages.common.edit'),
      icon: 'edit' as Icons,
      action: () => {
        emit('edit')
      },
    },
    {
      label: t('pages.common.delete'),
      icon: 'delete' as Icons,
      danger: true,
      disabled: isEditDisabled,
      tooltip: deleteDisabledTooltip,
      action: () => {
        emit('delete')
      },
    },
  ]
}
</script>

<template>
  <div
    :class="[
      'w-full overflow-hidden bg-[#FBFBFB] rounded-[20px] p-4 md:p-2.5 lg:p-4',
      isCardDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
    @click="handleCardClick"
  >
    <!-- Thumbnail with Status Badge and Assignations -->
    <div class="relative">
      <img
        v-if="thumbnail"
        :src="thumbnail"
        :alt="title"
        class="w-full h-[120px] object-cover rounded-[14px]"
      />
      <div
        v-else
        class="w-full h-[120px] bg-gray-200 rounded-[14px] flex items-center justify-center"
      >
        <BaseIcon name="image" size="lg" color="gray-400" />
      </div>

      <!-- Status Badge -->
      <CardStatusBadge :visibility="visibility" :start-date="startDate" :end-date="endDate" />

      <!-- Total Assignations (Paperclip Icon) -->
      <div
        v-if="
          totalAssignations !== undefined && totalAssignations !== null && totalAssignations > 0
        "
        class="absolute bottom-2 right-2 rounded-[8px] px-2 py-1 bg-black/60 backdrop-blur-sm flex items-center gap-1 z-10"
      >
        <BaseIcon name="attachment" size="xs" color="white" />
        <span
          class="text-white text-[11px] md:text-[10px] lg:text-[11px] font-semibold leading-[13px]"
        >
          {{ totalAssignations }}
        </span>
      </div>

      <div v-if="isEditable" class="absolute bottom-[-42px] right-[-5px] p-2 transition-colors">
        <ThreeDotMenu :items="menuItems(visibility)" />
      </div>
    </div>

    <!-- Content -->
    <div class="px-[0] py-3 md:py-2.5 lg:py-3">
      <!-- Category Tag - Fixed height to maintain alignment -->
      <div class="mb-2 md:mb-1.5 lg:mb-2 h-[14px]">
        <span
          v-if="category"
          class="inline-block text-[14px] md:text-[12px] lg:text-[14px] font-semibold text-primary-600 !leading-[100%] tracking-[-0.02em]"
        >
          {{ category }}
        </span>
      </div>

      <!-- Title - Fixed height container -->
      <div class="mb-3 md:mb-2.5 lg:mb-3 h-10">
        <h3
          class="font-medium text-[16px] md:text-[14px] lg:text-[16px] !leading-[19px] tracking-[-0.02em] text-black/85 line-clamp-2"
        >
          {{ title }}
        </h3>
      </div>

      <!-- Progress Bar - Fixed height container -->
      <div class="mb-3 md:mb-2.5 lg:mb-3">
        <CardProgressBar v-if="!isAdmin" :value="progress" :max="100" size="lg" color="auto" />
      </div>

      <!-- Mentor Info -->
      <div class="flex items-center">
        <div
          class="w-8 h-8 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-gray-300 rounded-full flex items-center justify-center mr-4 md:mr-2.5 lg:mr-4"
        >
          <BaseIcon name="user" size="xs" color="gray-600" />
        </div>
        <div>
          <p
            class="text-xs md:text-[11px] lg:text-xs font-semibold text-gray-700 mb-1 md:mb-0.5 lg:mb-1"
          >
            {{ mentor }}
          </p>
          <p class="text-xs md:text-[11px] lg:text-xs font-medium text-gray-500">Mentor</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
}
</style>
