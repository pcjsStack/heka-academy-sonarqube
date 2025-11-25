<template>
  <div>
    <div
      :class="[
        'flex items-center justify-between px-4 sm:px-3 md:px-3 lg:px-4 py-2 sm:py-1.5 md:py-1.5 lg:py-2 rounded-lg border',
        !timerRunning ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200',
      ]"
    >
      <!-- Timer Display -->
      <div class="flex items-center gap-2 sm:gap-1.5 md:gap-1.5 lg:gap-2">
        <BaseIcon
          v-if="!hideButton"
          name="timer"
          size="sm"
          :class="!timerRunning ? 'text-red-600' : 'text-green-600'"
        />
        <BaseText
          v-else
          type="p-md"
          color="error"
          :tone="500"
          font="bold"
          :text="t('pages.quiz.timer.totalTime')"
          :class="!timerRunning ? 'text-red-600' : 'text-green-600'"
        />
        <span
          :class="[
            'text-base sm:text-sm md:text-sm lg:text-base font-bold leading-[1]',
            !timerRunning ? 'text-red-600' : 'text-green-600',
          ]"
        >
          {{ formattedTime }}
        </span>
      </div>

      <!-- Pause/Resume Button -->
      <button
        v-if="!hideButton"
        @click="togglePause"
        :class="[
          'flex items-center gap-1.5 sm:gap-1 md:gap-1 lg:gap-1.5 px-3 sm:px-2.5 md:px-2.5 lg:px-3 py-1.5 sm:py-1 md:py-1 lg:py-1.5 rounded-md font-medium text-sm sm:text-xs md:text-xs lg:text-sm transition-colors',
          !timerRunning
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-green-100 text-green-600 hover:bg-green-200',
        ]"
      >
        <BaseIcon :name="!timerRunning ? 'play' : 'pause'" size="xs" />
        <span>{{ !timerRunning ? resumeText : pauseText }}</span>
      </button>
    </div>

    <!-- Paused Warning Message -->
    <div v-if="!hideButton && !timerRunning && showWarning" class="mt-3 sm:mt-2 md:mt-2 lg:mt-3">
      <BaseText
        :text="pausedWarningText"
        class="!text-red-600 !text-sm sm:!text-xs md:!text-xs lg:!text-sm !font-normal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { BaseIcon, BaseText } from '@/components/common'
import { t } from '@/utils/i18n'

interface Props {
  defaultTime?: number // Initial time in seconds (default: 0 for counting up)
  autoStart?: boolean // Auto start timer on mount (default: false)
  showWarning?: boolean // Show warning message when paused (default: true)
  pauseText?: string // Custom pause button text
  resumeText?: string // Custom resume button text
  timerRunning?: boolean // Timer running state
  pausedWarningText?: string // Custom warning message text
  hideButton?: boolean // Hide button when timer is running
}

const props = withDefaults(defineProps<Props>(), {
  defaultTime: 0,
  autoStart: false,
  showWarning: true,
  timerRunning: false,
  pauseText: () => t('pages.quiz.timer.pause'),
  resumeText: () => t('pages.quiz.timer.resume'),
  pausedWarningText: () => t('pages.quiz.timer.pausedWarning'),
  hideButton: false,
})

const emit = defineEmits<{
  start: []
  stop: []
  pause: []
  resume: []
  timeUpdate: [time: number]
}>()

// Local state
const elapsedTime = ref(props.defaultTime)
const isPaused = ref(false)
const timerInterval = ref<number | null>(null)
const isRunning = ref(false)

// Formatted time display (HH:MM:SS)
const formattedTime = computed(() => {
  const hours = Math.floor(elapsedTime.value / 3600)
  const minutes = Math.floor((elapsedTime.value % 3600) / 60)
  const seconds = elapsedTime.value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// Timer functions
const start = () => {
  if (timerInterval.value) return // Already running
  timerInterval.value = window.setInterval(() => {
    elapsedTime.value++
    emit('timeUpdate', elapsedTime.value)
  }, 1000)
  isPaused.value = false
  // isRunning.value = true
  emit('start')
}

const stop = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  emit('stop')
}

const pause = () => {
  stop()
  isPaused.value = true
  emit('pause')
}

const resume = () => {
  start()
  emit('resume')
}

const reset = (time: number = props.defaultTime) => {
  stop()
  elapsedTime.value = time
  isPaused.value = false
  emit('timeUpdate', elapsedTime.value)
}

const togglePause = () => {
  if (props.timerRunning) {
    pause()
  } else {
    resume()
  }
}

// Auto start if enabled
watch(
  () => props.autoStart,
  (newValue) => {
    if (newValue && !props.timerRunning) {
      start()
    }
  },
  { immediate: true },
)

// Cleanup timer on component unmount
onBeforeUnmount(() => {
  stop()
})

// Expose methods for parent component
defineExpose({
  start,
  stop,
  pause,
  resume,
  reset,
  getTime: () => elapsedTime.value,
  isRunning: () => isRunning.value,
  isPaused: () => isPaused.value,
})
</script>
