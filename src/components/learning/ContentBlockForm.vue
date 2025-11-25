<template>
  <div class="py-8 px-6 overflow-y-auto h-[calc(100svh-144px)]">
    <!-- Video Section -->
    <div class="mb-5">
      <BaseText
        :text="t('pages.contentBlock.video.title')"
        class="!text-[12px] !leading-[15px] mb-[6px] !text-neutral-700 !font-medium"
      />
      <BaseDragAndDropFiles
        :text="t('pages.contentBlock.video.dragDrop')"
        accept=".avi,.mov,.mp4"
        iconName="video-outline"
        :model-value="uploadedVideo"
        :maxSize="100"
        @update:model-value="handleFileUpload"
        @error="handleFileError"
        custom_actions
      >
        <template #customActions>
          <div class="flex w-full items-center justify-between flex-wrap gap-2 mt-[8px] mb-[16px]">
            <BaseText
              :text="t('pages.contentBlock.video.supportedFormat')"
              type="p-sm"
              color="neutral"
              tailwind-css="!text-[12px] leading-[15px] text-grey-700 tracking-[-0.016px]"
            />
            <BaseText
              :text="t('pages.contentBlock.video.maxSize')"
              type="p-sm"
              color="neutral"
              tailwind-css="!text-[12px] leading-[15px] text-grey-700 tracking-[-0.016px]"
            />
          </div>
          <div
            v-for="(file, i) in uploadedFiles"
            :key="file.id"
            class="bg-grey-50 flex rounded-[12px] items-center gap-[16px] py-[14px] px-[14px] mt-[8px] !mb-[8px]"
          >
            <div>
              <img
                v-if="getFileType(file).startsWith('image/')"
                :src="getFileUrl(file)"
                class="w-9 h-9 radius-[8px] object-cover"
              />
              <img
                v-else-if="thumbnails[file.fileName || file.name]"
                :src="thumbnails[file.fileName || file.name]"
                class="w-9 h-9 min-w-[36px] object-cover rounded-[8px]"
              />
            </div>
            <div class="w-full">
              <BaseText
                :text="file.fileName || file.name"
                color="neutral"
                tailwind-css="mb-[2px] !text-[14px] leading-[17px] !font-medium tracking-[-0.016px] text-neutral-700"
              />
              <BaseText
                :text="fileSizeConvert(file.size)"
                :tone="500"
                color="neutral"
                tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] text-grey-700"
              />
            </div>
            <div class="text-error-600 cursor-pointer">
              <div @click="removeFile(i)">
                <BaseIcon name="clear" color="error" size="sm" variant="outline" />
              </div>
            </div>
          </div>
        </template>
      </BaseDragAndDropFiles>
    </div>

    <!-- Description Section -->
    <div class="mb-5">
      <BaseText
        :text="t('pages.contentBlock.description.title')"
        class="!text-[12px] !leading-[15px] mb-[6px] !text-neutral-700 !font-medium"
      />

      <!-- Rich Text Editor -->
      <BaseRichText
        v-model="description"
        :placeholder="t('pages.contentBlock.description.placeholder')"
        :max-length="1000"
      />
    </div>

    <!-- Background Color Section -->
    <div>
      <BaseColorPicker
        v-model="backgroundColor"
        :label="t('pages.contentBlock.backgroundColor.title')"
        :placeholder="t('pages.contentBlock.backgroundColor.placeholder')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import {
  BaseText,
  BaseRichText,
  BaseIcon,
  BaseDragAndDropFiles,
  BaseColorPicker,
} from '@/components/common'
import { t } from '@/utils/i18n'
import { getFileUrl, getFileType, fileSizeConvert, generateThumbnail } from '@/utils/generalUtils'
import type { ContentBlockData } from '@/types/ContentBlock'
import type { Media } from '@/types/Media'

// Props
const props = defineProps<{
  initialData?: {
    description?: string
    backgroundColor?: string
    video?: File[] | Media[] | null
  }
}>()

// Emits
const emit = defineEmits<{
  save: [data: ContentBlockData]
  cancel: []
  'update:hasVideo': [hasVideo: boolean]
}>()

// Form data
const uploadedVideo = ref<File[] | Media[] | null>(props.initialData?.video || null)
const uploadedFiles = ref<Media[]>([])
const thumbnails = ref<{ [key: string]: string }>({})
const loadingThumbnails = ref<{ [key: string]: boolean }>({})
const description = ref<string>(props.initialData?.description || '')
const backgroundColor = ref<string>(props.initialData?.backgroundColor || '#f9fafb')

// Check if video is selected
const hasVideo = computed(() => {
  return uploadedFiles.value.length > 0
})

const handleFileUpload = (files: File[] | Media[] | null | undefined) => {
  console.log('Files uploaded:', files)
  uploadedVideo.value = files as File[] | Media[] | null
  if (files && Array.isArray(files)) {
    uploadedFiles.value = files as Media[]
  }
}

// Initialize form with existing data
const initializeForm = () => {
  if (props.initialData) {
    // Set video data
    if (props.initialData.video && Array.isArray(props.initialData.video)) {
      uploadedVideo.value = props.initialData.video
      uploadedFiles.value = props.initialData.video as Media[]
    }
  }
}

const handleFileError = (errorMessage: string) => {
  console.error('File upload error:', errorMessage)
  // Error is now displayed inline by BaseDragAndDropFiles component
}

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
  emit('update:hasVideo', hasVideo.value)
}

const generateThumbnails = async () => {
  if (!uploadedFiles.value) return

  for (const file of uploadedFiles.value) {
    const fileType = getFileType(file)
    const fileName = file.fileName || file.name

    if (
      fileType &&
      fileType.startsWith('video/') &&
      !thumbnails.value[fileName] &&
      !loadingThumbnails.value[fileName]
    ) {
      loadingThumbnails.value[fileName] = true
      try {
        // Only generate thumbnails for File objects, not Media objects
        if ('type' in file) {
          const thumb = await generateThumbnail(file as unknown as File)
          thumbnails.value = {
            ...thumbnails.value,
            [fileName]: thumb,
          }
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error)
      } finally {
        loadingThumbnails.value[fileName] = false
      }
    }
  }
}

const handleSave = () => {
  const data: ContentBlockData = {
    video: uploadedFiles.value.length > 0 ? uploadedFiles.value : uploadedVideo.value,
    description: description.value,
    backgroundColor: backgroundColor.value,
  }
  emit('save', data)
}

const handleCancel = () => {
  emit('cancel')
}

// Expose methods and computed for parent component
defineExpose({
  handleSave,
  handleCancel,
  hasVideo,
})

// Initialize form on mount
onMounted(() => {
  initializeForm()
})

watch(
  () => uploadedFiles.value,
  async (filesVal) => {
    if (filesVal) {
      await generateThumbnails()
    }
    emit('update:hasVideo', hasVideo.value)
  },
  { immediate: true, deep: true },
)
</script>
