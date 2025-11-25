<script setup lang="ts">
import { computed } from 'vue'
import { BaseButtonIcon } from '@/components/common'

interface BasePaginationProps {
  currentPage: number
  totalPages: number
  showPageNumbers?: boolean
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<BasePaginationProps>(), {
  showPageNumbers: false,
  maxVisiblePages: 5,
})

const emit = defineEmits(['pageChange', 'prev', 'next'])

const canGoPrev = computed(() => props.currentPage > 1)
const canGoNext = computed(() => props.currentPage < props.totalPages)

const handlePrev = () => {
  if (canGoPrev.value) {
    emit('prev')
    emit('pageChange', props.currentPage - 1)
  }
}

const handleNext = () => {
  if (canGoNext.value) {
    emit('next')
    emit('pageChange', props.currentPage + 1)
  }
}

const visiblePages = computed(() => {
  if (!props.showPageNumbers) return []

  const pages = []
  const start = Math.max(1, props.currentPage - Math.floor(props.maxVisiblePages / 2))
  const end = Math.min(props.totalPages, start + props.maxVisiblePages - 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <BaseButtonIcon
      icon="chevron-left"
      :disabled="!canGoPrev"
      variant="default"
      size="sm"
      @onClick="handlePrev"
      class="rounded-full"
      :class="['w-10 h-10', !canGoPrev && 'opacity-50 cursor-not-allowed']"
    />

    <!-- Page Numbers (if enabled) -->
    <template v-if="showPageNumbers">
      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'w-8 h-8 rounded-full text-sm font-medium transition-colors',
            page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
          ]"
          @click="$emit('pageChange', page)"
        >
          {{ page }}
        </button>
      </div>
    </template>

    <!-- Next Button -->
    <BaseButtonIcon
      icon="chevron-right"
      :disabled="!canGoNext"
      variant="default"
      size="sm"
      @onClick="handleNext"
      class="rounded-full"
      :class="['w-10 h-10', !canGoNext && 'opacity-50 cursor-not-allowed']"
    />
  </div>
</template>
