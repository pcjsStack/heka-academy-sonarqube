<template>
  <div>
    <!-- Permission Denied Screen for Maintenance -->
    <PermissionDenied v-if="isMaintenance" @back="handleCancel" />

    <!-- Normal Course Details View -->
    <div v-else class="min-h-screen bg-gray-50">
      <!-- Header Section -->
      <HeaderView title="Course Details" :isSearch="false" :isBack="true" @back="handleCancel" />
      <div class="bg-white border-b-2 border-grey-150">
        <div v-if="hasAssignations" class="px-4 sm:px-6 md:px-4 lg:px-6 py-3 md:py-2.5 lg:py-3">
          <BaseTimer
            ref="timerRef"
            :defaultTime="0"
            :autoStart="false"
            :timerRunning="timerDetails?.running"
            @start="handleTimerStart"
            :hide-button="overallProgress === 100"
            @stop="handleTimerStop"
          />
        </div>
        <div class="px-4 sm:px-6 md:px-4 lg:px-8 pt-4 sm:pt-4 md:pt-3 lg:pt-4">
          <div class="flex justify-between items-center mb-8 md:mb-6 lg:mb-8">
            <div
              class="flex items-start gap-4 md:gap-3 lg:gap-4 flex-1"
              v-if="courseStore.courseDetails"
            >
              <!-- Course Image -->
              <div
                class="w-24 h-24 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden flex-shrink-0 border border-gray-200"
              >
                <img
                  v-if="courseStore.courseDetails?.attachment?.url"
                  :src="courseStore.courseDetails?.attachment?.url"
                  alt="Course Image"
                  class="w-full h-full object-cover"
                />
              </div>

              <!-- Course Info -->
              <div class="flex flex-col gap-1.5 md:gap-1 lg:gap-1.5 flex-1 min-w-0">
                <!-- Title -->
                <BaseText
                  :text="courseStore.courseDetails?.name || ''"
                  class="!text-[20px] md:!text-[18px] lg:!text-[20px] !leading-[24px] !text-black/85 !font-semibold"
                />

                <!-- Category -->
                <BaseText
                  :text="t('pages.courseDetails.course')"
                  type="p-sm"
                  color="primary"
                  :tone="600"
                  class="!text-primary-600"
                />

                <!-- Description with Tooltip -->
                <div v-if="courseStore.courseDetails?.description" class="flex items-start gap-1.5">
                  <popper hover placement="right" arrow class="popper-description light">
                    <div
                      v-safe-html="courseStore.courseDetails.description"
                      class="!text-[14px] md:!text-[13px] lg:!text-[14px] !leading-[20px] !text-black/85 !font-regular line-clamp-2 cursor-pointer"
                    />
                    <template #content>
                      <div
                        v-safe-html="courseStore.courseDetails.description"
                        class="max-w-xs text-black/85 text-sm"
                      />
                    </template>
                  </popper>
                </div>
              </div>
            </div>

            <!-- Right Side: Overall Progress or Done -->
            <div v-if="overallProgress === 100" class="flex flex-col items-center mr-8">
              <BaseText
                :text="t('pages.courseDetails.status.done')"
                type="p-lg"
                color="success"
                font="bold"
                class="!text-success-600 mt-2 text-center"
              />
            </div>
            <BaseCircularProgress
              v-else
              :value="overallProgress"
              :label="t('pages.courseDetails.overallProgress')"
              color="primary"
              size="md"
            />
          </div>
        </div>
      </div>

      <div class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6">
        <div class="">
          <div class="space-y-2">
            <BaseCourseItemCard
              v-for="item in courseItems"
              :key="item.id"
              :title="item.title"
              :content-type="item.contentType as CourseContentType"
              :visibility="item.visibility as VisibilityStatus"
              :status="item.status"
              :action-type="item.actionType as CourseActionType"
              :percentage="item.percentage"
              :disabled="isTimerStopped && overallProgress < 100"
              @click="handleItemClick(item as CourseAssignations)"
            />
          </div>
        </div>
      </div>

      <CourseCompletedModal
        v-if="showCourseCompletedModal"
        :user-name="userName"
        :user-profile-image="userProfileImage"
        :position="userPosition"
        :points="userPoints"
        @close="handleCloseCourseCompletedModal"
        @return-home="handleReturnHome"
        @see-leaderboard="handleSeeLeaderboard"
      />

      <!-- <QuizModal :show="showQuizModal" @close="handleCloseQuizModal" @submit="handleQuizSubmit" /> -->

      <CourseLeaderboardModal
        v-if="showLeaderboardModal"
        @close="handleCloseLeaderboard"
        @return-home="handleLeaderboardReturnHome"
      />
    </div>

    <CourseCompletedModal
      v-if="showCourseCompletedModal"
      :user-name="userName"
      :user-profile-image="userProfileImage"
      :position="userPosition"
      :points="userPoints"
      @close="handleCloseCourseCompletedModal"
      @return-home="handleReturnHome"
      @see-leaderboard="handleSeeLeaderboard"
    />

    <CourseLeaderboardModal
      v-if="showLeaderboardModal"
      @close="handleCloseLeaderboard"
      @return-home="handleLeaderboardReturnHome"
    />
    <FileViewerModal
      v-if="isFileViewerOpen"
      :isOpen="isFileViewerOpen"
      :file="currentFile"
      @close="handleCloseFileViewer"
    />
    <BasePopupModal
      v-if="showPopupModal"
      :title="t('pages.course.completed.title')"
      size="md"
      :close-button="true"
      :is-header="true"
      @on-close="handleClosePopupModal"
    >
      <div class="flex flex-col items-center px-6 py-8">
        <div class="mb-6">
          <div class="relative">
            <div class="flex items-center justify-center">
              <img
                :src="success"
                alt="Success"
                class="mx-auto w-[96px] h-[96px] sm:mb-[40px] mb-[22px]"
              />
            </div>
          </div>
        </div>

        <BaseText
          :text="t('pages.course.completed.message')"
          color="neutral"
          :tone="600"
          font="regular"
          type="p-md"
          class="text-center mb-8 leading-relaxed"
        />

        <!-- Done Button -->
        <BaseButton
          :text="t('pages.course.publishSuccess.done')"
          color="primary"
          variant="default"
          size="md"
          @click="handleClosePopupModal"
          class="px-8"
        />
      </div>
    </BasePopupModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Popper from 'vue3-popper'
import {
  BaseText,
  BaseCourseItemCard,
  BaseButton,
  BaseTimer,
  BaseCircularProgress,
  BasePopupModal,
  PermissionDenied,
} from '@/components/common'
import FileViewerModal from '@/components/modal/FileViewerModal.vue'
import HeaderView from '@/components/layouts/HeaderView.vue'
import CourseCompletedModal from '@/components/modal/CourseCompletedModal.vue'
import { CourseLeaderboardModal } from '@/components/leaderboard'
import { useCourseStore } from '@/stores/courseStore'
import TimerService from '@/services/timerService'
import success from '@/assets/gif/success.gif'
import { t } from '@/utils/i18n'
import type {
  CourseAssignations,
  CourseExecution,
  NavigationHistoryType,
  SubExecution,
} from '@/types/Course'
import {
  CourseContentType,
  CourseActionType,
  CourseExecutionType,
  VisibilityStatus,
} from '@/types/Course'
import jennyImg from '@/assets/users/Jenny.png'
import type { Assignation } from '@/types/Lessons'
import type { Media } from '@/types/Media'
import type { TimerItem } from '@/types/timer'
import { getContentTypeFromFile } from '@/utils/utils'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()
// State
const overallProgress = computed(() => {
  return courseStore.courseDetails?.execution?.percentage || 0
})

// Check if course is in maintenance mode
const isMaintenance = computed(() => {
  return (
    courseStore.courseDetails?.visibility === VisibilityStatus.MAINTENANCE ||
    courseStore.courseDetails?.visibility === 'maintenance'
  )
})
const showCourseCompletedModal = ref(false)
const showLeaderboardModal = ref(false)
const showQuizModal = ref(false)
const isFileViewerOpen = ref(false)
const currentItem = ref<Assignation | null>(null)
const currentFile = ref<Media | null>(null)
const timerRef = ref<InstanceType<typeof BaseTimer> | null>(null)
const isTimerStopped = ref(true) // Timer starts as stopped until it's started
const timerDetails = ref<TimerItem | null>(null)
const showPopupModal = ref(false)
const isInitializingTimer = ref(false) // Flag to prevent API calls during initialization
const isInitialLoad = ref(true) // Flag to track initial load

// Check if course has assignations
const hasAssignations = computed(() => {
  return (courseStore.courseDetails?.assignations?.length || 0) > 0
})

// User data for the modal
const userName = ref('Jenny Wilson')
const userProfileImage = ref(jennyImg)
const userPosition = ref(1)
const userPoints = ref(240)

onMounted(async () => {
  await loadCourse(route.params.id as unknown as number)

  // Mark initial load as complete after course is loaded
  await nextTick()
  isInitialLoad.value = false

  // Add beforeunload event listener to warn about unsaved changes
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// Handle page reload/close when timer is running
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  // Check if timer is running (not stopped)
  if (!isTimerStopped.value && timerDetails.value?.running) {
    // Standard way to show confirmation dialog
    event.preventDefault()
    event.returnValue = 'The changes you made may not be saved.'

    // Stop the timer when user leaves the page using the service
    if (courseStore.courseDetails?.execution?.timerId) {
      // Use special unload method that ensures delivery even after page closes
      TimerService.stopTimerOnUnload(courseStore.courseDetails.execution.timerId)

      // Update local state
      isTimerStopped.value = true
      if (timerDetails.value) {
        timerDetails.value.running = false
      }
    }

    // Return message for older browsers
    return 'The changes you made may not be saved. Are you sure you want to leave?'
  }
}
const loadCourse = async (id: number) => {
  await courseStore.fetchCourseById(id)

  // Check if course has assignations - if not, don't load timer details
  if (!hasAssignations.value) {
    return
  }

  // Fetch timer details if timerId exists and course has assignations
  if (courseStore.courseDetails?.execution?.timerId) {
    try {
      isInitializingTimer.value = true // Set flag to prevent API calls during initialization

      const timerResponse = await TimerService.getTimer(courseStore.courseDetails.execution.timerId)
      const timer = timerResponse.data
      timerDetails.value = timer

      // Set the timer to the existing elapsed time
      await nextTick()
      if (timerRef.value) {
        // Reset timer - this will trigger stop event but won't call API due to flag
        timerRef.value.reset(timer.seconds)

        // If timer was running, start it
        if (timer.running) {
          timerRef.value.start()
        }
      }

      // Clear initialization flag after a short delay to allow events to settle
      await nextTick()
      isInitializingTimer.value = false
    } catch (error) {
      console.error('Error fetching timer details:', error)
      isInitializingTimer.value = false
      // If timer fetch fails, start with default time
      await nextTick()
      timerRef.value?.start()
    }
  } else {
    // No timerId, start timer from 0
    await nextTick()
    timerRef.value?.start()
  }
}

watch(
  () => route.params.id,
  async (newId) => {
    // Set initialization flag to prevent API calls during cleanup
    isInitializingTimer.value = true
    isInitialLoad.value = true // Reset initial load flag for new course

    // Stop and reset timer
    if (timerRef.value) {
      timerRef.value.stop()
      timerRef.value.reset()
    }

    // Reset all state
    isTimerStopped.value = true
    timerDetails.value = null
    showCourseCompletedModal.value = false
    showQuizModal.value = false
    showLeaderboardModal.value = false
    isFileViewerOpen.value = false
    currentItem.value = null
    currentFile.value = null

    // Clear course details from store
    courseStore.clearCourseDetails()

    // Load new course (will clear initialization flag)
    await loadCourse(newId as unknown as number)

    // Mark initial load as complete after course is loaded
    await nextTick()
    isInitialLoad.value = false
  },
)

// Course items data - different file types
const courseItems = computed(() => {
  return (
    courseStore.courseDetails?.assignations.map((assignation) => ({
      id: assignation.id,
      title:
        assignation.relatedType === CourseActionType.FILE_ASSET
          ? assignation.model.fileName || ''
          : assignation.model.name || '',
      contentType: getContentType(assignation),
      status: (assignation.model.status === 'published' ? 'done' : 'todo') as 'done' | 'todo',
      actionType: assignation.relatedType as CourseActionType | undefined,
      visibility: assignation.model.visibility as VisibilityStatus,
      percentage: assignation.execution?.percentage || 0,
    })) || []
  )
})

const handleCancel = async () => {
  // Check if timer is running and stop it before leaving
  if (!isTimerStopped.value && timerDetails.value?.running) {
    await handleTimerStop(false) // programmatic call
  }

  courseStore.clearNavigationHistory()
  courseStore.clearCourseDetails()
  router.back()
}

const getContentType = (assignation: Assignation): CourseContentType => {
  // If it's not a FILE_ASSET, return the relatedType as content type
  if (assignation.relatedType !== CourseActionType.FILE_ASSET) {
    return assignation.relatedType as CourseContentType
  }

  // For FILE_ASSET, use the utility function to determine the content type
  return getContentTypeFromFile(assignation.model)
}
const handleTimerStart = async (fromEvent: boolean = true) => {
  isTimerStopped.value = false

  // Only start the timer component if this is a programmatic call (not from timer's own event)
  if (!fromEvent && timerRef.value) {
    timerRef.value.start()
  }

  // Only call API if not initializing and timerId exists
  if (!isInitializingTimer.value && courseStore.courseDetails?.execution?.timerId) {
    try {
      await TimerService.startTimer(courseStore.courseDetails.execution.timerId)
      if (timerDetails.value) {
        timerDetails.value.running = true
      }
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }
}

const handleTimerStop = async (fromEvent: boolean = true) => {
  isTimerStopped.value = true

  // Only stop the timer component if this is a programmatic call (not from timer's own event)
  if (!fromEvent && timerRef.value) {
    timerRef.value.stop()
  }

  // Only call API if not initializing and timerId exists
  if (!isInitializingTimer.value && courseStore.courseDetails?.execution?.timerId) {
    try {
      await TimerService.stopTimer(courseStore.courseDetails.execution.timerId)
      if (timerDetails.value) {
        timerDetails.value.running = false
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }
}

const handleCloseCourseCompletedModal = () => {
  showCourseCompletedModal.value = false
}

const handleReturnHome = () => {
  showCourseCompletedModal.value = false
  router.push({ name: 'dashboard' })
}

const handleSeeLeaderboard = () => {
  showCourseCompletedModal.value = false
  showLeaderboardModal.value = true
}

const handleCloseLeaderboard = () => {
  showLeaderboardModal.value = false
}

const handleLeaderboardReturnHome = () => {
  showLeaderboardModal.value = false
  router.push({ name: 'dashboard' })
}

const handleItemClick = (item: CourseAssignations) => {
  // Allow clicks if course is 100% complete, otherwise prevent if timer is stopped
  if (overallProgress.value < 100 && isTimerStopped.value) {
    return
  }
  const existingAssignation = courseStore.courseDetails?.assignations.find((a) => a.id === item.id)
  if (!existingAssignation) {
    return
  }

  if (item.actionType === CourseActionType.COURSE) {
    courseStore.addNavigationHistory({
      courseId: route.params.id as unknown as number,
      type: CourseActionType.COURSE,
    })
    router.push({
      name: 'course-details',
      params: { id: existingAssignation.relatedId.toString() },
    })
  }
  if (item.actionType === CourseActionType.QUIZ) {
    // Open quiz modal for quiz items
    showQuizModal.value = true
  } else if (item.actionType === CourseActionType.FILE_ASSET) {
    const file = existingAssignation.model as Media
    if (file) {
      isFileViewerOpen.value = true
      currentItem.value = existingAssignation
      currentFile.value = file
    }
  }
}
// Build CourseExecution payload from navigationHistory
const buildExecutionPayload = (percentage?: number): CourseExecution => {
  const navHistory = courseStore.navigationHistory
  const percentageValue = percentage || currentItem.value?.execution?.percentage || 0

  // If no navigation history, return simple payload
  if (!navHistory) {
    return {
      ownerId: route.params.id as unknown as number,
      ownerType: CourseExecutionType.COURSE,
      relatedId: currentItem.value?.relatedId as number,
      relatedType: currentItem.value?.relatedType as CourseActionType,
      percentage: percentageValue,
    }
  }

  // Recursively build subExecution from deepest to shallowest
  const buildSubExecution = (historyItem: NavigationHistoryType): SubExecution | undefined => {
    const hasNested = historyItem.nestedNavigationHistory
    const currentCourseId = route.params.id as unknown as number

    if (!hasNested) {
      // This is the deepest navigation level
      // Check if we need to add the current route's courseId as an intermediate level
      if (historyItem.courseId !== currentCourseId) {
        // Add current route as intermediate level before the file/item
        return {
          ownerId: historyItem.courseId,
          ownerType: CourseExecutionType.COURSE,
          relatedId: currentCourseId,
          relatedType: CourseActionType.COURSE,
          subExecution: {
            ownerId: currentCourseId,
            ownerType: CourseExecutionType.COURSE,
            relatedId: currentItem.value?.relatedId as number,
            relatedType: currentItem.value?.relatedType as CourseActionType,
            percentage: percentageValue,
          },
        }
      }

      // Current route matches history, no intermediate level needed
      return {
        ownerId: historyItem.courseId,
        ownerType: CourseExecutionType.COURSE,
        relatedId: currentItem.value?.relatedId as number,
        relatedType: currentItem.value?.relatedType as CourseActionType,
        percentage: percentageValue,
      }
    }

    // Build nested structure recursively
    const nestedSubExecution = buildSubExecution(hasNested)

    return {
      ownerId: historyItem.courseId,
      ownerType: CourseExecutionType.COURSE,
      relatedId: hasNested.courseId,
      relatedType: hasNested.type,
      subExecution: nestedSubExecution,
    }
  }

  // Build the complete payload starting from root
  const firstNested = navHistory.nestedNavigationHistory
  const currentCourseId = route.params.id as unknown as number

  if (!firstNested) {
    // Only root level, check if we need to add current route as intermediate
    if (navHistory.courseId !== currentCourseId) {
      return {
        ownerId: navHistory.courseId,
        ownerType: CourseExecutionType.COURSE,
        relatedId: currentCourseId,
        relatedType: CourseActionType.COURSE,
        subExecution: {
          ownerId: currentCourseId,
          ownerType: CourseExecutionType.COURSE,
          relatedId: currentItem.value?.relatedId as number,
          relatedType: currentItem.value?.relatedType as CourseActionType,
          percentage: percentageValue,
        },
      }
    }

    // Root matches current route, no intermediate needed
    return {
      ownerId: navHistory.courseId,
      ownerType: CourseExecutionType.COURSE,
      relatedId: currentItem.value?.relatedId as number,
      relatedType: currentItem.value?.relatedType as CourseActionType,
      percentage: percentageValue,
    }
  }

  return {
    ownerId: navHistory.courseId,
    ownerType: CourseExecutionType.COURSE,
    relatedId: firstNested.courseId,
    relatedType: firstNested.type,
    subExecution: buildSubExecution(firstNested),
  }
}
const cleanup = () => {
  isFileViewerOpen.value = false
  currentFile.value = null
  currentItem.value = null
}

const handleCloseFileViewer = async (payloadData?: {
  filetype: CourseActionType
  percentage?: number
}) => {
  // If course is 100% complete, don't call execution API - just cleanup
  if (overallProgress.value === 100) {
    cleanup()
    return
  }

  if (currentItem.value && currentItem.value.execution?.percentage === 100) {
    cleanup()
    return
  }
  if (payloadData?.percentage === 0) {
    cleanup()
    return
  }

  const payload = buildExecutionPayload(payloadData?.percentage)
  await courseStore.courseExecution(payload, route.params.id as unknown as number)
  cleanup()
}

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const handleClosePopupModal = () => {
  showPopupModal.value = false
}

watch(overallProgress, async (newVal) => {
  if (newVal === 100) {
    if (!isTimerStopped.value && timerDetails.value?.running) {
      await handleTimerStop(false) // programmatic call
    }
    // Only show popup if this is not the initial load
    if (!isInitialLoad.value) {
      showPopupModal.value = true
    }
  }
})
</script>

<style scoped>
.popper-description {
  position: relative;
}

:deep(.popper-description .popper) {
  max-width: 300px;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.light {
  --popper-theme-background-color: #f3f4f6;
  --popper-theme-background-color-hover: #f3f4f6;
  --popper-theme-text-color: #1f2937;
  --popper-theme-border-width: 1px;
  --popper-theme-border-color: #e5e7eb;
  --popper-theme-border-radius: 8px;
  --popper-theme-padding: 10px 14px;
  --popper-theme-box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.15);
}
</style>
