<template>
  <div
    :class="[
      'flex items-center justify-between p-[14px] pr-6 rounded-[20px] transition-shadow',
      isExpired && !isAdmin ? '!bg-grey-50 opacity-60 cursor-not-allowed' : '!bg-white',
      disabled && !isExpired && !isAdmin ? 'opacity-50 cursor-not-allowed' : '',
      (!disabled || isAdmin) && (!isExpired || isAdmin) ? 'hover:shadow-md cursor-pointer' : '',
    ]"
    @click="(disabled || isExpired) && !isAdmin ? null : emit('click')"
  >
    <!-- Left Side: Icon and Title -->
    <div class="flex items-center space-x-3 flex-1">
      <!-- Content Type Icon with Colored Background -->
      <div class="flex-shrink-0 relative">
        <div
          :class="[iconBackgroundClass, isExpired && !isAdmin ? 'opacity-50' : '']"
          class="w-8 h-8 rounded-lg flex items-center justify-center"
        >
          <BaseIcon :name="contentIcon" :size="iconSize" :color="iconColor" :tone="iconTone" />
        </div>
        <!-- Green Checkmark Overlay when done -->
        <div
          v-if="computedStatus === 'done' && (!isExpired || isAdmin)"
          class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center border-2 border-white"
        >
          <BaseIcon name="check" size="xs" color="white" />
        </div>
      </div>

      <!-- Title and Action Type Tag -->
      <div class="flex items-center gap-2 flex-1">
        <!-- Title -->
        <BaseText
          :text="title"
          type="p-md"
          font="medium"
          :class="[
            'w-auto !text-[14px] !leading-[17px]',
            isExpired && !isAdmin ? '!text-black/50' : '!text-black/85',
          ]"
        />
        <!-- Action Type Tag -->
        <span class="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-medium">
          {{ actionTypeLabel }}
        </span>
        <!-- Expired Tag -->
        <span
          v-if="isExpired"
          class="bg-red-100 text-red-700 rounded-full px-3 py-1 text-xs font-medium"
        >
          {{ t('pages.courseDetails.status.expired') }}
        </span>
        <div
          v-if="visibility === VisibilityStatus.MAINTENANCE"
          class="rounded-[8px] px-2 py-1 bg-orange-400 flex items-center gap-1.5 z-10"
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
        <div
          v-if="visibility === VisibilityStatus.HIDE"
          class="rounded-[8px] px-2 py-1 bg-orange-400 flex items-center gap-1.5 z-10"
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
      </div>
    </div>

    <!-- Right Side: Status/Action Button -->
    <div class="flex-shrink-0 ml-3" v-if="!isAdmin && !isDisabledAction">
      <!-- Quiz - show action button or completed status -->
      <BaseButton
        v-if="actionType === CourseActionType.QUIZ && computedStatus === 'done'"
        :text="t('pages.courseDetails.status.completed')"
        color="success"
        size="xs"
        variant="blank"
        :rightIcon="'check'"
        rightIconSize="xs"
        :disabled="isExpired"
        class="!px-[14px] !py-[10px] bg-success-500-10 !text-success-500 !min-w-[103px]"
        iconTextGapClass="!gap-2"
      />
      <BaseButton
        v-else-if="actionType === CourseActionType.QUIZ"
        :text="t('pages.courseDetails.action.takeQuiz')"
        color="primary"
        size="xs"
        variant="blank"
        :disabled="isExpired"
        class="!px-[14px] !py-[10px] !bg-blue-100 !text-blue-700 hover:!bg-blue-200 !min-w-[103px]"
        iconTextGapClass="!gap-2"
      />
      <!-- Non-quiz items: Show status based on percentage -->
      <BaseButton
        v-else
        :text="statusText"
        color="neutral"
        size="xs"
        variant="blank"
        :rightIcon="'chevron-down'"
        rightIconSize="xs"
        :disabled="disabled || isAdmin || isExpired"
        :class="statusButtonClass"
        iconTextGapClass="!gap-[18px]"
      />
    </div>
    <div class="flex-shrink-0 ml-3" v-else-if="!isDisabledAction">
      <ThreeDotMenu
        v-if="!hideActionButton"
        :items="menuItems(visibility)"
        :iconClass="'w-4 h-4 text-neutral-500'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseIcon, BaseText, BaseButton } from '@/components/common'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import { t } from '@/utils/i18n'
import type { Icons } from '@/types/Styles'
import { CourseActionType, CourseContentType, VisibilityStatus } from '@/types/Course'

interface Props {
  title?: string
  contentType: CourseContentType
  status?: 'done' | 'todo'
  actionType?: CourseActionType | undefined
  percentage?: number
  disabled?: boolean
  isExpired?: boolean
  isAdmin?: boolean
  isDisabledAction?: boolean
  visibility?: VisibilityStatus
  hideActionButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  status: 'todo',
  actionType: CourseActionType.FILE_ASSET,
  percentage: 0,
  disabled: false,
  isExpired: false,
  isAdmin: false,
  visibility: VisibilityStatus.SHOW,
  isDisabledAction: false,
  hideActionButton: false,
})

const emit = defineEmits<{
  click: []
  progress: []
  edit: []
  delete: []
}>()

const menuItems = (visibility: VisibilityStatus) => {
  // Enable edit only when visibility is MAINTENANCE or HIDE
  const isEditDisabled =
    visibility !== VisibilityStatus.MAINTENANCE && visibility !== VisibilityStatus.HIDE

  const disabledTooltip = isEditDisabled
    ? t('pages.common.cannotEditOrDeleteNotMaintenance')
    : undefined

  // Progress button is only available for QUIZ, COURSE, and LESSONS
  const progressSupportedActionTypes = [
    CourseActionType.QUIZ,
    CourseActionType.COURSE,
    CourseActionType.LESSONS,
  ]
  const isProgressSupported = props.actionType
    ? progressSupportedActionTypes.includes(props.actionType)
    : false

  const menuItemsList = []

  // Add progress menu item only if action type supports it
  if (isProgressSupported) {
    menuItemsList.push({
      label: t('pages.common.progress'),
      icon: 'eye' as Icons,
      action: () => {
        emit('progress')
      },
    })
  }

  // Add edit and delete menu items
  menuItemsList.push(
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
      tooltip: disabledTooltip,
      action: () => {
        emit('delete')
      },
    },
  )

  return menuItemsList
}
// Computed status based on percentage
const computedStatus = computed(() => {
  if (props.percentage === 100) {
    return 'done'
  } else if (props.percentage > 0 && props.percentage < 100) {
    return 'inProgress'
  } else {
    return 'todo'
  }
})

// Get status text based on computed status
const statusText = computed(() => {
  switch (computedStatus.value) {
    case 'done':
      return t('pages.courseDetails.status.done')
    case 'inProgress':
      return t('pages.courseDetails.status.inProgress')
    case 'todo':
      return t('pages.courseDetails.status.todo')
    default:
      return t('pages.courseDetails.status.todo')
  }
})

// Get button classes based on status
const statusButtonClass = computed(() => {
  switch (computedStatus.value) {
    case 'done':
      return '!px-[14px] !py-[10px] !bg-success-50 !text-success-600 !min-w-[103px]'
    case 'inProgress':
      return '!px-[14px] !py-[10px] !bg-blue-50 !text-blue-600 !min-w-[103px]'
    case 'todo':
      return '!px-[14px] !py-[10px] !bg-blue-50 !text-blue-600 !min-w-[103px]'
    default:
      return '!px-[14px] !py-[10px] !bg-grey-50 !text-neutral-500 !min-w-[103px]'
  }
})

// Format action type label for display
const actionTypeLabel = computed(() => {
  if (!props.actionType) return 'File'

  switch (props.actionType) {
    case CourseActionType.COURSE:
      return 'Course'
    case CourseActionType.QUIZ:
      return 'Quiz'
    case CourseActionType.LESSONS:
      return 'Lessons'
    case CourseActionType.CATEGORY:
      return 'Category'
    case CourseActionType.FILE_ASSET:
      return 'File'
    case CourseActionType.NEW_FILE:
      return 'New File'
    default:
      return 'File'
  }
})

const contentIcon = computed((): Icons => {
  switch (props.contentType) {
    case CourseContentType.DOCUMENT:
      return 'file-outline'
    case CourseContentType.IMAGE:
      return 'photo'
    case CourseContentType.VIDEO:
      return 'play'
    case CourseContentType.PDF:
      return 'file'
    case CourseContentType.ZIP:
      return 'folder'
    case CourseContentType.CALENDAR:
      return 'calendar'
    case CourseContentType.QUIZ:
      return 'clipboard-list'
    default:
      return 'file'
  }
})

const iconSize = computed(() => {
  return 'sm' as const
})

const iconColor = computed(() => {
  switch (props.contentType) {
    case CourseContentType.DOCUMENT:
      return 'error'
    case CourseContentType.IMAGE:
      return 'success'
    case CourseContentType.VIDEO:
      return 'primary'
    case CourseContentType.PDF:
      return 'error'
    case CourseContentType.ZIP:
      return 'warning'
    case CourseContentType.CALENDAR:
      return 'primary'
    case CourseContentType.QUIZ:
      return 'warning'
    default:
      return 'neutral'
  }
})

const iconTone = computed(() => {
  return 600 as const
})

const iconBackgroundClass = computed(() => {
  switch (props.contentType) {
    case CourseContentType.DOCUMENT:
      return 'bg-red-100'
    case CourseContentType.IMAGE:
      return 'bg-green-100'
    case CourseContentType.VIDEO:
      return 'bg-blue-100'
    case CourseContentType.PDF:
      return 'bg-red-100'
    case CourseContentType.ZIP:
      return 'bg-yellow-100'
    case CourseContentType.CALENDAR:
      return 'bg-blue-100'
    case CourseContentType.QUIZ:
      return 'bg-yellow-100'
    default:
      return 'bg-gray-100'
  }
})
</script>
