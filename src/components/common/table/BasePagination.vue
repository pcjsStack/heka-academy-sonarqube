<script lang="ts" setup>
import { computed } from 'vue'
import BaseButton from '../button/BaseButton.vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})

const emit = defineEmits(['update:currentPage'])

const visiblePages = computed(() => {
  const current = props.currentPage
  const total = props.totalPages
  const range = 1
  const pages = []

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  pages.push(1)

  if (current > 2 + range) pages.push('...')
  for (let i = Math.max(2, current - range); i <= Math.min(total - 1, current + range); i++) {
    pages.push(i)
  }
  if (current < total - 1 - range) pages.push('...')

  pages.push(total)

  return pages
})

function changePage(page: number) {
  if (page < 1 || page > props.totalPages) return
  emit('update:currentPage', page)
}
</script>

<template>
  <div class="flex items-center justify-end gap-[6px]">
    <BaseButton
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
      text="Previous"
      variant="blank"
      left-icon="chevron-left"
      size="sm"
      class="sm:max-w-[98px] max-w-[calc(50% - 18px)] h-[36px] px-3 !py-1 text-sm !text-neutral-700 rounded disabled:!text-neutral-300 disabled:cursor-not-allowed hover:bg-transparent"
    />
    <div class="flex items-center gap-[16px]">
      <template v-for="page in visiblePages" :key="page">
        <button
          v-if="typeof page === 'number'"
          @click="changePage(page)"
          :class="[
            'px-1 py-1 text-sm rounded-[8px] w-9 h-9 font-medium',
            page === currentPage
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-700 hover:bg-gray-100',
          ]"
        >
          {{ page }}
        </button>
        <span
          v-else
          class="px-3 py-0 text-[16px] leading-[24px] text-neutral-700 w-9 h-9 flex items-end justify-center"
          >...</span
        >
      </template>
    </div>

    <BaseButton
      :disabled="currentPage === totalPages"
      @click="changePage(currentPage + 1)"
      text="Next"
      variant="blank"
      right-icon="chevron-right"
      size="sm"
      class="sm:max-w-[72px] max-w-[calc(50% - 18px)] h-[36px] px-3 !py-1 text-sm !text-neutral-700 rounded disabled:!text-neutral-300 disabled:cursor-not-allowed hover:bg-transparent"
    />
  </div>
</template>
