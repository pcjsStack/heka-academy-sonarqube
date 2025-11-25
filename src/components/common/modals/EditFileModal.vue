<template>
  <BaseSideModal
    :closeButton="true"
    :title="t('pages.editFileModal.title')"
    customClass="left-0"
    size="sm"
    :zIndex="1000"
    @onClose="handleCancel"
  >
    <div class="lg:px-6 px-4 pt-8 pb-[48px] h-[calc(100svh-140px)] overflow-y-auto">
      <!-- File Preview Section -->
      <div class="mb-6">
        <div
          v-if="isImageFile || isVideoFile"
          class="w-full h-64 bg-black rounded-lg flex items-center justify-center overflow-hidden"
        >
          <!-- Image Preview -->
          <img
            v-if="isImageFile"
            :src="file.url"
            :alt="file.customFileName || file.fileName"
            class="w-full h-full object-contain"
            @error="handleImageError"
          />
          <!-- Video Preview -->
          <video
            v-else-if="isVideoFile"
            :src="file.url"
            class="w-full h-full object-contain"
            controls
            preload="metadata"
          >
            {{ t('pages.uploadFiles.videoViewer.notSupported') }}
          </video>
          <!-- Icon Preview -->
        </div>
        <div v-else class="bg-white rounded-lg p-6 border border-grey-200">
          <!-- File Icon and Details -->
          <div class="flex items-start gap-4">
            <!-- Large File Icon -->
            <div
              class="w-16 h-16 mt-[8px] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              :style="{ backgroundColor: getFileIconBackgroundColor(file.mimeType) }"
            >
              <img :src="getFileIcon(file.mimeType)" :alt="`${file.type} icon`" class="w-8 h-8" />
            </div>

            <!-- File Details -->
            <div class="flex-1 min-w-0">
              <!-- File Name -->
              <h3 class="font-semibold text-neutral-700 text-base mb-1 truncate">
                {{ file.customFileName || file.fileName }}
              </h3>

              <!-- File Size -->
              <p class="text-sm text-neutral-500 mb-2">
                {{ fileSizeConvert(file.size) }}
              </p>

              <!-- Download Link -->
              <a
                :href="file.url"
                :download="file.customFileName || file.fileName"
                class="text-sm text-primary-550 hover:text-primary-600 underline"
              >
                {{ t('pages.editFileModal.download') }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- File Name Input -->
      <div class="mb-6">
        <BaseText
          type="p-sm"
          color="neutral"
          class="mb-2"
          :text="t('pages.editFileModal.fileNameValidation')"
        />
        <BaseInput
          v-model="fileName"
          type="text"
          :placeholder="t('pages.editFileModal.fileNamePlaceholder')"
          class="w-full"
        />
      </div>

      <!-- Visibility Dropdown -->
      <div class="mb-6">
        <BaseText
          type="p-md"
          color="neutral"
          class="mb-2"
          :text="t('pages.editFileModal.visibility')"
        />
        <BaseSelect v-model="selectedVisibility" :options="visibilityOptions" class="w-full" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :text="t('pages.editFileModal.buttons.cancel')"
          size="sm"
          variant="link"
          class="max-w-[95px] !font-medium"
          @click="handleCancel"
        />
        <BaseButton
          :text="t('pages.editFileModal.buttons.save')"
          variant="default"
          size="sm"
          class="max-w-[81px] !font-medium"
          @click="handleSave"
        />
      </div>
    </div>
  </BaseSideModal>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { BaseButton, BaseText, BaseInput, BaseSelect, BaseSideModal } from '@/components/common'
import { t } from '@/utils/i18n'
import { fileSizeConvert } from '@/utils/generalUtils'
import pdfIcon from '@/assets/images/pdf.svg'
import imageIcon from '@/assets/images/image.svg'
import filesIcon from '@/assets/images/files.svg'
import playIcon from '@/assets/images/play.svg'
import { visibilityOptions } from '@/utils/defaultOption'
import type { Media } from '@/types/Media'
import type { UpdateFileParams } from '@/types/uploadFiles'
import { VisibilityStatus } from '@/types/Course'

interface FileWithVisibility extends Media {
  visibility?: VisibilityStatus | 'checking'
}

interface Props {
  file: FileWithVisibility
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'onClose'): void
  (e: 'onSuccess', data: UpdateFileParams): void
}>()

const fileName = ref('')
const selectedVisibility = ref<UpdateFileParams['visibility']>(VisibilityStatus.SHOW)

// Initialize form data
watch(
  () => props.file,
  (newFile) => {
    if (newFile) {
      fileName.value = newFile.customFileName || newFile.fileName
      selectedVisibility.value = newFile.visibility as UpdateFileParams['visibility']
    }
  },
  { immediate: true },
)

// File type detection
const isImageFile = computed(() => {
  return props.file.mimeType.startsWith('image/')
})

const isVideoFile = computed(() => {
  return props.file.mimeType.startsWith('video/')
})

// File icon and styling helpers

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) {
    return pdfIcon
  } else if (type.includes('image')) {
    return imageIcon
  } else if (type.includes('video')) {
    return playIcon
  } else if (type.includes('folder')) {
    return filesIcon
  } else if (type.includes('scorm')) {
    return playIcon
  } else {
    return filesIcon
  }
}

const getFileIconBackgroundColor = (type: string) => {
  if (type.includes('pdf')) {
    return '#FF2A831A'
  } else if (type.includes('image')) {
    return '#40BF7F1A'
  } else if (type.includes('video')) {
    return '#1975FF1A'
  } else if (type.includes('folder')) {
    return '#FF77001A'
  } else if (type.includes('scorm')) {
    return '#1975FF1A'
  } else {
    return '#F3F4F6'
  }
}

const handleImageError = () => {
  // Fallback to icon if image fails to load
  console.warn('Image failed to load:', props.file.url)
}

const handleCancel = () => {
  emit('onClose')
}

const handleSave = async () => {
  console.log('handleSave', fileName.value, selectedVisibility.value)
  emit('onSuccess', {
    id: props.file.id.toString(),
    customFileName: fileName.value,
    visibility: selectedVisibility.value,
    status: props.file.status,
  })
}
</script>
