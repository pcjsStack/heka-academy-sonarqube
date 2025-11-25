<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <header class="sticky top-0 z-50 bg-white border-b border-gray-200">
      <!-- Top Row: Title -->
      <div
        class="flex justify-between items-center px-4 py-4 sm:px-6 sm:py-[18px] sm:pb-[10px] lg:px-8 border-b border-gray-200"
      >
        <h1
          class="text-lg sm:text-xl lg:text-[24px] font-semibold text-neutral-700 tracking-[-0.032px]"
        >
          {{ t('pages.courseDetails.title') }}
        </h1>
      </div>

      <!-- Bottom Row: Breadcrumb -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
      >
        <!-- Left: Back navigation -->
        <div
          @click="handleBack"
          class="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0 flex-1 sm:flex-initial"
        >
          <BaseIcon
            name="chevron-left"
            size="sm"
            color="neutral"
            :tone="500"
            class="flex-shrink-0"
          />
          <BaseText
            :text="courseItem.title"
            type="p-sm"
            color="neutral"
            :tone="600"
            font="medium"
            class="!text-lg sm:!text-xl !font-semibold !text-black/85 !leading-none !tracking-[-0.02em] truncate"
          />
        </div>

        <!-- Right: To-do button -->
        <button
          class="flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2 sm:py-2.5 text-neutral-500 bg-grey-50 rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
        >
          <span
            class="text-xs sm:text-sm font-medium leading-none tracking-[-0.02em] whitespace-nowrap"
            >{{ t('pages.videoPlayer.todo') }}</span
          >
          <BaseIcon name="chevron-down" size="sm" class="!text-neutral-500 flex-shrink-0" />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <BaseVideoPlayer
        :title="courseItem.title"
        :category="'Training & Skill Development'"
        :thumbnail="courseItem.thumbnail"
        :video-src="courseItem.videoSrc"
        :duration="courseItem.duration"
        @play="handlePlay"
        @rewind="handleRewind"
        @fast-forward="handleFastForward"
        @fullscreen="handleFullscreen"
        @more-options="handleMoreOptions"
        @previous-file="handlePreviousFile"
        @jump-to="handleJumpTo"
        @next-file="handleNextFile"
      />
    </div>

    <!-- Course Completed Modal -->
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

    <!-- Course Leaderboard Modal -->
    <CourseLeaderboardModal
      v-if="showLeaderboardModal"
      @close="handleCloseLeaderboard"
      @return-home="handleLeaderboardReturnHome"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BaseText, BaseIcon, BaseVideoPlayer } from '@/components/common'
import CourseCompletedModal from '@/components/modal/CourseCompletedModal.vue'
import { CourseLeaderboardModal } from '@/components/leaderboard'
import { t } from '@/utils/i18n'
import mensCollectionImg from '@/assets/layout/mens_collection.png'
import jennyImg from '@/assets/users/Jenny.png'

const router = useRouter()
const route = useRoute()

// Course item data - gets video data from query parameters or uses defaults
const courseItem = ref({
  id: route.params.itemId,
  title: (route.query.videoName as string) || 'Preview Video',
  category: 'Training & Skill Development',
  thumbnail: mensCollectionImg, // Using existing image as placeholder
  videoSrc:
    (route.query.videoSrc as string) ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  duration: 1820, // 30:20 in seconds
  contentType: 'calendar',
  status: 'todo',
})

// Modal state
const showCourseCompletedModal = ref(false)
const showLeaderboardModal = ref(false)

// User data for the modal
const userName = ref('Jenny Wilson')
const userProfileImage = ref(jennyImg)
const userPosition = ref(1)
const userPoints = ref(240)

// Methods
const handleBack = () => {
  console.log('handleBack called')
  router.back()
}

// const handleCancel = () => {
//   router.back()
// }

// const handleMarkComplete = () => {
//   // Show the course completed modal
//   showCourseCompletedModal.value = true
// }

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

const handlePlay = () => {
  console.log('Play clicked')
}

const handleRewind = () => {
  console.log('Rewind clicked')
}

const handleFastForward = () => {
  console.log('Fast forward clicked')
}

const handleFullscreen = () => {
  console.log('Fullscreen clicked')
}

const handleMoreOptions = () => {
  console.log('More options clicked')
}

const handlePreviousFile = () => {
  console.log('Previous file clicked')
}

const handleJumpTo = () => {
  console.log('Jump to clicked')
}

const handleNextFile = () => {
  console.log('Next file clicked')
}
</script>
