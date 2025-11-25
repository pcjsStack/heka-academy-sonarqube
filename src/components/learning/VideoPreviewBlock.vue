<template>
  <div class="w-full">
    <div class="relative bg-white rounded-[30px] overflow-hidden">
      <!-- Video Thumbnail/Preview -->
      <div class="relative h-[320px] bg-gradient-to-br from-gray-100 to-gray-200">
        <!-- Video Thumbnail Image -->

        <!-- Video Element for thumbnail generation and playback -->
        <video
          v-if="videoData && isVideoFile"
          :src="videoUrl"
          class="w-full h-[320px] object-cover"
          :class="{ 'cursor-pointer': !isPlaying }"
          :muted="!isPlaying"
          :controls="false"
          preload="metadata"
          crossorigin="anonymous"
          @loadedmetadata="generateThumbnail"
          @play="onVideoPlay"
          @pause="onVideoPause"
          @ended="onVideoEnded"
          @click="handlePlayVideo"
          ref="videoElement"
        />

        <!-- Default video preview when no thumbnail available -->
        <div
          v-else-if="videoData"
          class="w-full h-[320px] flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100"
        >
          <div class="text-center">
            <BaseIcon name="play" size="xl" color="neutral" :tone="600" class="mb-3" />
            <BaseText
              :text="videoName"
              type="p-sm"
              color="neutral"
              :tone="700"
              font="medium"
              class="max-w-[200px] truncate"
            />
          </div>
        </div>

        <!-- Play Button - positioned like in the image (only show when not playing) -->
        <div class="absolute bottom-4 right-4">
          <BaseButton
            :text="
              !isPlaying ? t('pages.videoPreview.playVideo') : t('pages.videoPreview.pauseVideo')
            "
            variant="default"
            size="sm"
            :left-icon="!isPlaying ? 'play' : 'pause'"
            @onClick="handlePlayVideo"
            class="!bg-black/50 text-white px-4 py-[10px] !rounded-[20px] flex items-center"
          />
        </div>

        <!-- Remove Button - positioned like in the image (only show if not in saved mode) -->
        <div v-if="isEditMode" class="absolute top-4 right-4">
          <BaseButtonIcon
            icon="clear"
            size="sm"
            @onClick="handleRemove"
            class="!bg-pink text-white w-8 h-8 p-0 !rounded-full flex items-center justify-center"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { BaseButton, BaseButtonIcon, BaseIcon, BaseText } from '@/components/common'
import { t } from '@/utils/i18n'
import { getFileUrl, getFileType } from '@/utils/generalUtils'
import type { Media } from '@/types/Media'

// Props
interface Props {
  videoData?: Media | File
  isEditMode?: boolean
  isSavedMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: true,
  isSavedMode: false,
})

// Emits
const emit = defineEmits<{
  play: [video: Media | File]
  remove: []
}>()

// Template refs
const videoElement = ref<HTMLVideoElement | null>(null)

// State
const generatedThumbnail = ref<string | null>(null)
const isPlaying = ref<boolean>(false)
const showVideoPlayer = ref<boolean>(false)

// Computed properties
const videoName = computed(() => {
  if (!props.videoData) return ''
  // Check if it's a Media object (has fileName) or File object (has name)
  return ('fileName' in props.videoData ? props.videoData.fileName : props.videoData.name) || ''
})

const isVideoFile = computed(() => {
  if (!props.videoData) return false
  const fileType = getFileType(props.videoData)
  return fileType && fileType.startsWith('video/')
})

const videoUrl = computed(() => {
  if (!props.videoData) return ''
  return getFileUrl(props.videoData)
})

// Methods
const generateThumbnail = async () => {
  if (!videoElement.value || !isVideoFile.value) return

  try {
    const video = videoElement.value
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360

    // Seek to a specific time (e.g., 2 seconds) and draw frame
    video.currentTime = 2

    await new Promise((resolve) => {
      video.onseeked = () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          generatedThumbnail.value = canvas.toDataURL('image/jpeg', 0.8)
          resolve(true)
        } catch (canvasError) {
          console.warn('Cannot generate thumbnail due to CORS restrictions:', canvasError)
          // Don't set thumbnail if CORS prevents it
          resolve(false)
        }
      }

      video.onerror = () => {
        console.warn('Video failed to load for thumbnail generation')
        resolve(false)
      }
    })
  } catch (error) {
    console.error('Error generating video thumbnail:', error)
  }
}

const handlePlayVideo = () => {
  if (props.videoData && isVideoFile.value) {
    // In saved mode, toggle play/pause inline
    if (!videoElement.value) return

    showVideoPlayer.value = true

    if (isPlaying.value) {
      // Video is playing, pause it
      videoElement.value.pause()
    } else {
      // Video is paused, play it
      videoElement.value.play()
    }
  } else {
    // In edit mode, emit to parent for navigation
    emit('play', props.videoData as Media | File)
  }
}

// Handle video play event
const onVideoPlay = () => {
  isPlaying.value = true
}

// Handle video pause event
const onVideoPause = () => {
  isPlaying.value = false
}

// Handle video ended event
const onVideoEnded = () => {
  isPlaying.value = false
  showVideoPlayer.value = false
}

const handleRemove = () => {
  emit('remove')
}

// Watch for video data changes
watch(
  () => props.videoData,
  async (newVideoData) => {
    if (newVideoData && isVideoFile.value) {
      await nextTick()
      if (videoElement.value) {
        generateThumbnail()
      }
    }
  },
  { immediate: true },
)
</script>
