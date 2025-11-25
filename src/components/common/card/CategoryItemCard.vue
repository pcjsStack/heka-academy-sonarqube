<script setup lang="ts">
import { BaseIcon } from '@/components/common'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import type { Icons } from '@/types/Styles'
import { fileSizeConvert } from '@/utils/generalUtils'
import { t } from '@/utils/i18n'
import moment from 'moment'
import pdfIcon from '@/assets/images/pdf.svg'
import imageIcon from '@/assets/images/image.svg'
import filesIcon from '@/assets/images/files.svg'
import playIcon from '@/assets/images/play.svg'

interface CategoryItemCardProps {
  type: 'course' | 'lesson' | 'file'
  item: {
    id: string | number
    name?: string
    title?: string
    fileName?: string
    customFileName?: string
    category?: string
    thumbnail?: string
    imageUrl?: string
    progress?: number
    mentor?: string
    mimeType?: string
    size?: number
    createdAt?: string
    status?: string
    isExpired?: boolean
    expiryDate?: string
  }
  showMenu?: boolean
}

const props = withDefaults(defineProps<CategoryItemCardProps>(), {
  showMenu: true,
})

const emit = defineEmits(['click', 'edit', 'delete', 'progress'])

const getFileIcon = (type?: string) => {
  if (!type) return filesIcon
  if (type.includes('pdf')) return pdfIcon
  if (type.includes('image')) return imageIcon
  if (type.includes('video')) return playIcon
  return filesIcon
}

const getFileIconBackgroundColor = (type?: string) => {
  if (!type) return '#F3F4F6'
  if (type.includes('pdf')) return '#FF2A831A'
  if (type.includes('image')) return '#40BF7F1A'
  if (type.includes('video')) return '#1975FF1A'
  return '#F3F4F6'
}

const menuItems = [
  {
    label: 'Progress',
    icon: 'eye' as Icons,
    action: () => emit('progress'),
  },
  {
    label: 'Edit',
    icon: 'edit' as Icons,
    action: () => emit('edit'),
  },
  {
    label: 'Delete',
    icon: 'delete' as Icons,
    action: () => emit('delete'),
  },
]

const getItemTitle = () => {
  return (
    props.item.name || props.item.title || props.item.customFileName || props.item.fileName || ''
  )
}
</script>

<template>
  <!-- File Type Card -->
  <div
    v-if="type === 'file'"
    class="bg-grey-50 w-full flex items-center rounded-[12px] p-4 cursor-pointer"
    @click="$emit('click')"
  >
    <div
      class="flex items-center justify-center mr-[14px] w-[32px] h-[32px] rounded-[8px] flex-shrink-0"
      :style="{ backgroundColor: getFileIconBackgroundColor(item.mimeType) }"
    >
      <img :src="getFileIcon(item.mimeType)" :alt="`file icon`" class="w-4 h-4" />
    </div>
    <div class="flex-1 min-w-0">
      <h4 class="font-medium text-black/85 text-[14px] leading-[17px] mb-1 truncate max-w-full">
        {{ getItemTitle() }}
      </h4>
      <div class="flex">
        <p class="text-[12px] font-medium text-black/50 mr-2">
          {{ item.size ? fileSizeConvert(item.size) : '' }} .
        </p>
        <p class="text-[12px] font-medium text-black/50">
          {{ item.createdAt ? moment(item.createdAt).format('MMM D, YYYY') : '' }}
        </p>
      </div>
    </div>
    <ThreeDotMenu v-if="showMenu" :items="menuItems" />
  </div>

  <!-- Course/Lesson Type Card -->
  <div
    v-else
    :class="[
      'bg-grey-50 w-full rounded-[12px] p-3 transition-opacity',
      item.isExpired ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm',
    ]"
    @click="item.isExpired ? null : $emit('click')"
  >
    <div class="flex gap-3">
      <!-- Thumbnail -->
      <div class="flex-shrink-0">
        <img
          v-if="item.thumbnail || item.imageUrl"
          :src="item.thumbnail || item.imageUrl"
          :alt="getItemTitle()"
          :class="[
            'w-[120px] h-[120px] object-cover rounded-[12px]',
            item.isExpired ? 'opacity-50' : '',
          ]"
        />
        <div
          v-else
          :class="[
            'w-[120px] h-[120px] bg-gray-200 rounded-[12px] flex items-center justify-center',
            item.isExpired ? 'opacity-50' : '',
          ]"
        >
          <BaseIcon name="image" size="lg" color="gray-400" />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 flex flex-col justify-between py-1">
        <!-- Top Section -->
        <div>
          <!-- Type Tag & Expired Tag -->
          <div class="mb-2 flex items-center gap-2">
            <span
              class="inline-block px-2 py-1 text-[12px] font-semibold text-primary-600 bg-primary-50 rounded-md !leading-[100%] tracking-[-0.02em] capitalize"
            >
              {{ type }}
            </span>
            <span
              v-if="item.isExpired"
              class="inline-block px-2 py-1 text-[12px] font-semibold text-error-600 bg-error-50 rounded-md !leading-[100%] tracking-[-0.02em]"
            >
              {{ t('pages.courseDetails.status.expired') }}
            </span>
          </div>

          <!-- Title -->
          <h3
            :class="[
              'font-medium text-[16px] !leading-[19px] tracking-[-0.02em] mb-2 line-clamp-2',
              item.isExpired ? 'text-black/50' : 'text-black/85',
            ]"
          >
            {{ getItemTitle() }}
          </h3>
        </div>

        <!-- Bottom Section -->
        <div>
          <!-- Empty section for future content -->
        </div>
      </div>

      <!-- Three-dot menu -->
      <div v-if="showMenu && !item.isExpired" class="flex-shrink-0">
        <ThreeDotMenu :items="menuItems" />
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
