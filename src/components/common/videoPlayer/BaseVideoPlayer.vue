<template>
  <div class="w-full">
    <!-- Video Player Container -->
    <div
      class="relative bg-black rounded-lg sm:rounded-xl lg:rounded-[20px] overflow-hidden shadow-lg"
    >
      <!-- Video Element -->
      <video
        ref="videoRef"
        class="w-full h-[250px] sm:h-[350px] lg:h-[450px] object-cover"
        :poster="thumbnail"
        @click="togglePlay"
        @timeupdate="updateProgress"
        @loadedmetadata="onLoadedMetadata"
      >
        <source :src="videoSrc" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <!-- Video Controls Overlay -->
      <div
        v-if="!isPlaying"
        class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"
      >
        <!-- Video Control Buttons -->
        <div class="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          <!-- Backward 15s Button -->
          <button
            class="w-12 h-12 flex items-center justify-center transition-opacity hover:opacity-80"
          >
            <img :src="backwardButton" alt="Backward 15s" class="w-full h-full object-contain" />
          </button>

          <!-- Main Play Button (Larger) -->
          <button
            class="w-24 h-24 flex items-center justify-center transition-opacity hover:opacity-80"
            @click="togglePlay"
          >
            <img :src="playButton" alt="Play" class="w-full h-full object-contain" />
          </button>

          <!-- Forward 15s Button -->
          <button
            class="w-12 h-12 flex items-center justify-center transition-opacity hover:opacity-80"
          >
            <img :src="forwardButton" alt="Forward 15s" class="w-full h-full object-contain" />
          </button>
        </div>

        <!-- Top Right Controls -->
        <div class="absolute top-2 right-2 sm:top-4 sm:right-4 flex space-x-1 sm:space-x-2">
          <!-- Fullscreen Button -->
          <button
            class="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all"
            @click="handleFullscreen"
          >
            <!-- Four arrows pointing outwards icon -->
            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <!-- More Options Button -->
          <button
            class="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all"
            @click="handleMoreOptions"
          >
            <!-- Three vertical dots icon -->
            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="6" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        <!-- Video Info Overlay (Bottom Left) -->
        <div
          class="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-white max-w-[60%] sm:max-w-[70%]"
        >
          <h3 class="text-sm sm:text-base lg:text-lg font-semibold truncate">{{ title }}</h3>
          <p class="text-xs sm:text-sm opacity-90 truncate">{{ category }}</p>
        </div>

        <!-- Video Duration (Bottom Right) -->
        <div
          class="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-white text-xs sm:text-sm font-medium"
        >
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>
      </div>

      <!-- Playing Controls Overlay (when video is playing) -->
      <div
        v-if="isPlaying"
        class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300"
        @mouseenter="showControls = true"
        @mouseleave="showControls = false"
      >
        <!-- Controls that appear on hover -->
        <div v-if="showControls" class="absolute inset-0 flex items-center justify-center">
          <!-- Pause Button -->
          <button
            class="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all"
            @click="togglePlay"
          >
            <div class="flex space-x-1">
              <div class="w-1.5 h-5 sm:w-2 sm:h-6 bg-white"></div>
              <div class="w-1.5 h-5 sm:w-2 sm:h-6 bg-white"></div>
            </div>
          </button>
        </div>

        <!-- Top Right Controls (always visible when playing) -->
        <div class="absolute top-2 right-2 sm:top-4 sm:right-4 flex space-x-1 sm:space-x-2">
          <!-- Fullscreen Button -->
          <button
            class="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all"
            @click="handleFullscreen"
          >
            <!-- Four arrows pointing outwards icon -->
            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <!-- More Options Button -->
          <button
            class="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all"
            @click="handleMoreOptions"
          >
            <!-- Three vertical dots icon -->
            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="6" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        <!-- Video Info Overlay (Bottom Left) -->
        <div
          class="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-white max-w-[60%] sm:max-w-[70%]"
        >
          <h3 class="text-sm sm:text-base lg:text-lg font-semibold truncate">{{ title }}</h3>
          <p class="text-xs sm:text-sm opacity-90 truncate">{{ category }}</p>
        </div>

        <!-- Video Duration (Bottom Right) -->
        <div
          class="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-white text-xs sm:text-sm font-medium"
        >
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-600">
        <div
          class="h-full bg-white transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Navigation Controls -->
    <div
      class="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 mt-4 sm:mt-6"
    >
      <!-- Previous File Button (Rewind -15s) -->
      <button
        :class="[
          'flex items-center gap-1 sm:gap-2 rounded-lg transition-colors',
          hasPreviousFile ? 'text-black/85 cursor-pointer' : 'text-black/50 cursor-not-allowed',
        ]"
        :disabled="!hasPreviousFile"
        @click="hasPreviousFile && handleRewind()"
      >
        <BaseIcon
          name="chevron-left"
          size="sm"
          :class="hasPreviousFile ? '!text-black/85' : '!text-black/50'"
          class="flex-shrink-0"
        />
        <span
          class="text-xs sm:text-sm font-medium leading-none tracking-[-0.02em] whitespace-nowrap"
          >{{ t('pages.videoPlayer.previousFile') }}</span
        >
      </button>

      <!-- Jump to Button -->
      <button
        class="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-neutral-500 bg-grey-50 border border-neutral-300 rounded-lg transition-colors"
        @click="handleJumpTo"
      >
        <span
          class="text-xs sm:text-sm font-medium leading-none tracking-[-0.02em] whitespace-nowrap"
          >{{ t('pages.videoPlayer.jumpTo') }}</span
        >
        <BaseIcon name="chevron-down" size="sm" class="!text-neutral-500 flex-shrink-0" />
      </button>

      <!-- Next File Button (Fast Forward +15s) -->
      <button
        :class="[
          'flex items-center gap-1 sm:gap-2 rounded-lg transition-colors',
          hasNextFile ? 'text-black/85 cursor-pointer' : 'text-black/50 cursor-not-allowed',
        ]"
        :disabled="!hasNextFile"
        @click="hasNextFile && handleFastForward()"
      >
        <span
          class="text-xs sm:text-sm font-medium leading-none tracking-[-0.02em] whitespace-nowrap"
          >{{ t('pages.videoPlayer.nextFile') }}</span
        >
        <BaseIcon
          name="chevron-right"
          size="sm"
          :class="hasNextFile ? '!text-black/85' : '!text-black/50'"
          class="flex-shrink-0"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BaseIcon } from '@/components/common'
import { t } from '@/utils/i18n'
import backwardButton from '@/assets/images/backward_button.png'
import forwardButton from '@/assets/images/forward_button.png'
import playButton from '@/assets/images/play_button.png'

interface BaseVideoPlayerProps {
  title: string
  category: string
  thumbnail?: string
  videoSrc?: string
  duration?: number
  hasPreviousFile?: boolean
  hasNextFile?: boolean
}

const props = withDefaults(defineProps<BaseVideoPlayerProps>(), {
  thumbnail: '',
  videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Dummy video
  duration: 1820, // 30:20 in seconds
  hasPreviousFile: true,
  hasNextFile: true,
})

const emit = defineEmits<{
  play: []
  rewind: []
  fastForward: []
  fullscreen: []
  moreOptions: []
  previousFile: []
  jumpTo: []
  nextFile: []
}>()

// Video state
const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const showControls = ref(false)
const currentTime = ref(0)

// Computed properties
const progressPercentage = computed(() => {
  return props.duration > 0 ? (currentTime.value / props.duration) * 100 : 0
})

// Methods
const togglePlay = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
  isPlaying.value = !isPlaying.value
  emit('play')
}

const updateProgress = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const onLoadedMetadata = () => {
  if (videoRef.value) {
    // Video metadata loaded
  }
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleRewind = () => {
  if (videoRef.value) {
    videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 15)
  }
  emit('rewind')
}

const handleFastForward = () => {
  if (videoRef.value) {
    videoRef.value.currentTime = Math.min(props.duration, videoRef.value.currentTime + 15)
  }
  emit('fastForward')
}

const handleFullscreen = () => {
  if (videoRef.value) {
    if (videoRef.value.requestFullscreen) {
      videoRef.value.requestFullscreen()
    }
  }
  emit('fullscreen')
}

const handleMoreOptions = () => {
  emit('moreOptions')
}

// const handlePreviousFile = () => {
//   emit('previousFile')
// }

const handleJumpTo = () => {
  emit('jumpTo')
}

// const handleNextFile = () => {
//   emit('nextFile')
// }

onMounted(() => {
  // Initialize video
  if (videoRef.value) {
    videoRef.value.addEventListener('play', () => {
      isPlaying.value = true
    })
    videoRef.value.addEventListener('pause', () => {
      isPlaying.value = false
    })
  }
})
</script>
