<script setup lang="ts">
import { ref, watch } from 'vue'
import { t } from '@/utils/i18n'
import {
  BaseText,
  BaseDragAndDropFiles,
  BaseButtonIcon,
  BaseButton,
  BasePopupModal,
  BaseInput,
  BaseIcon,
} from '@/components/common'
import type { Media } from '@/types/Media'
import { getFileUrl, getFileType, fileSizeConvert, generateThumbnail } from '@/utils/generalUtils'
import { validateCourseFiles, type FileValidationResult } from '@/utils/courseValidation'
import otherFile from '@/assets/images/files.svg'
import pdfFile from '@/assets/images/pdf.svg'
import imageFile from '@/assets/images/image.svg'
import videoFile from '@/assets/images/play.svg'

const MAX_SIZE_MB = 100
const props = defineProps<{
  uploadedFiles: Media[]
}>()

const emit = defineEmits<{
  'update:uploadedFiles': [files: Media[]]
  'validation-change': [isValid: boolean, errors: string[]]
}>()

const uploadedFiles = ref<Media[]>(props.uploadedFiles || [])
const thumbnails = ref<{ [key: string]: string }>({})
const loadingThumbnails = ref<{ [key: string]: boolean }>({})

// Rename modal state
const showRenameModal = ref(false)
const fileToRename = ref<Media | null>(null)
const newFileName = ref('')

// Validation state
const validationResult = ref<FileValidationResult>({
  isValid: true,
  errors: [],
  fileCount: 0,
  totalSizeMB: 0,
})

// Ensure each file has a sequential id (1-based) without stripping File properties
const withSequentialIds = (files: Media[] = []): Media[] =>
  files.map((file, index) => {
    const id = index
    // If it's a native File, attach id via defineProperty to avoid losing File internals
    if (typeof File !== 'undefined' && file instanceof File) {
      try {
        Object.defineProperty(file, 'id', { value: id, writable: true, configurable: true })
        return file as unknown as Media
      } catch {
        // Fallback if defineProperty fails
        return Object.assign(file, { id }) as unknown as Media
      }
    }
    // Plain object path
    return { ...(file as unknown as Record<string, unknown>), id } as Media
  })

// Watch for validation changes
watch(
  () => uploadedFiles.value,
  (files) => {
    validationResult.value = validateCourseFiles(files)
    emit('validation-change', validationResult.value.isValid, validationResult.value.errors)
  },
  { immediate: true, deep: true },
)

const handleFileUpload = (files: File[] | Media[] | null | undefined) => {
  if (files && Array.isArray(files)) {
    const mapped = withSequentialIds(files as Media[])
    uploadedFiles.value = mapped
    emit('update:uploadedFiles', mapped)
  }
}

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
  const newFiles = withSequentialIds(uploadedFiles.value)
  emit('update:uploadedFiles', newFiles)
}

const handleDownload = (file: Media) => {
  const url = getFileUrl(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.fileName || file.name || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleRename = (file: Media) => {
  fileToRename.value = file
  newFileName.value = file.fileName || file.name || ''
  showRenameModal.value = true
}

const handleRenameConfirm = () => {
  if (fileToRename.value && newFileName.value.trim()) {
    type FileLikeWithId = Media & { id?: unknown; fileName?: string }
    let fileIndex = uploadedFiles.value.findIndex(
      (f: FileLikeWithId) => f.id === (fileToRename.value as FileLikeWithId | null)?.id,
    )
    // Fallback: if items are native File objects without id, match by reference
    if (fileIndex === -1) {
      fileIndex = uploadedFiles.value.findIndex((f) => f === fileToRename.value)
    }
    if (fileIndex !== -1) {
      const target = uploadedFiles.value[fileIndex] as unknown as Media & { fileName?: string }
      const trimmed = newFileName.value.trim()
      // If the item is a native File (name is read-only), create a new File with same data
      if (typeof File !== 'undefined' && target instanceof File) {
        const original = target as unknown as File
        const replaced = new File([original], trimmed, {
          type: original.type,
          lastModified: original.lastModified,
        }) as unknown as Media & { fileName?: string }
        // Preserve any custom enumerable properties attached to the original object
        const originalRecord = original as unknown as Record<string, unknown>
        const replacedRecord = replaced as unknown as Record<string, unknown>
        Object.keys(originalRecord).forEach((key) => {
          if (!(key in replacedRecord)) {
            replacedRecord[key] = originalRecord[key]
          }
        })
        uploadedFiles.value.splice(fileIndex, 1, replaced as unknown as Media)
      } else {
        // Only update the file name fields; keep all other properties untouched
        target.name = trimmed
        if (typeof target.fileName === 'string') {
          target.fileName = trimmed
        }
      }
      const newFiles = withSequentialIds(uploadedFiles.value)
      emit('update:uploadedFiles', newFiles)
    }
  }
  showRenameModal.value = false
  fileToRename.value = null
  newFileName.value = ''
}

const handleRenameCancel = () => {
  showRenameModal.value = false
  fileToRename.value = null
  newFileName.value = ''
}

const generateThumbnails = async () => {
  if (!uploadedFiles.value) return

  for (const file of uploadedFiles.value) {
    const fileType = getFileType(file)

    if (
      fileType.startsWith('video/') &&
      !thumbnails.value[file.name] &&
      !loadingThumbnails.value[file.name]
    ) {
      loadingThumbnails.value[file.name] = true
      try {
        const thumb = await generateThumbnail(file)
        thumbnails.value = {
          ...thumbnails.value,
          [file.name]: thumb,
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error)
      } finally {
        loadingThumbnails.value[file.name] = false
      }
    }
  }
}

const getFileIcon = (file: Media): string => {
  const type = getFileType(file)
  if (type.startsWith('image/')) {
    return imageFile
  } else if (type === 'application/pdf') {
    return pdfFile
  } else if (type.startsWith('video/')) {
    return videoFile
  } else {
    return otherFile
  }
}

// Get background color class based on file type
const getFileIconBgClass = (file: Media): string => {
  const type = getFileType(file)
  if (type.startsWith('image/')) {
    return 'bg-success-500-10' // Green with 10% opacity
  } else if (type === 'application/pdf') {
    return 'bg-error-500-10' // Pink/Red with 10% opacity
  } else if (type.startsWith('video/')) {
    return 'bg-primary-550-10' // Blue with 10% opacity
  } else {
    return 'bg-neutral-300-10' // Gray with 10% opacity
  }
}

watch(
  () => props.uploadedFiles,
  (newFiles) => {
    uploadedFiles.value = withSequentialIds(newFiles || [])
  },
  { immediate: true },
)

watch(
  () => uploadedFiles.value,
  async (filesVal) => {
    if (filesVal) {
      await generateThumbnails()
    }
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <div class="max-w-[816px] mx-auto">
    <BaseText
      :text="t('pages.lesson.create.files.title')"
      font="medium"
      class="!text-[12px] md:!text-[11px] lg:!text-[12px] !leading-[15px] mb-1.5 md:mb-1 lg:mb-1.5 !text-neutral-700"
    />

    <!-- Validation Errors -->
    <div
      v-if="!validationResult.isValid && validationResult.errors.length > 0"
      class="mb-6 md:mb-5 lg:mb-6"
    >
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 md:p-3 lg:p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <BaseIcon name="clear-circle-solid" color="error" size="sm" />
          </div>
          <div class="ml-3">
            <BaseText
              :text="t('pages.lesson.create.files.validationErrors')"
              color="error"
              :tone="600"
              font="medium"
              type="p-sm"
            />
            <BaseText
              :text="validationResult.errors.join(', ')"
              color="error"
              :tone="600"
              font="medium"
              type="p-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- File Count and Size Info -->
    <div v-if="uploadedFiles.length > 0" class="mb-4 md:mb-3 lg:mb-4">
      <div class="flex justify-between items-center text-sm md:text-xs lg:text-sm text-gray-600">
        <span>{{
          t('pages.lesson.create.files.fileCount', { count: uploadedFiles.length, max: 10 })
        }}</span>
        <span>{{
          t('pages.lesson.create.files.totalSize', {
            size: validationResult.totalSizeMB.toFixed(2),
            max: MAX_SIZE_MB,
          })
        }}</span>
      </div>
    </div>

    <!-- File Upload Dropzone -->
    <div class="mb-8 md:mb-6 lg:mb-8">
      <BaseDragAndDropFiles
        :text="t('pages.lesson.create.files.dragDropText')"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.zip"
        :multiple="true"
        :show-history="false"
        :model-value="uploadedFiles"
        @update:model-value="handleFileUpload"
        custom_actions
      >
        <template #customActions>
          <div class="mt-6 md:mt-5 lg:mt-6 flex flex-col gap-2 md:gap-1.5 lg:gap-2">
            <div
              v-for="(file, i) in uploadedFiles"
              :key="file.id || i"
              class="bg-grey-50 flex rounded-[16px] items-center gap-[16px] md:gap-3 lg:gap-[16px] py-[14px] md:py-3 lg:py-[14px] px-[14px] md:px-3 lg:px-[14px]"
            >
              <div
                :class="getFileIconBgClass(file)"
                class="w-8 h-8 md:w-7 md:h-7 lg:w-8 lg:h-8 min-w-[32px] md:min-w-[28px] lg:min-w-[32px] rounded-[8px] flex items-center justify-center"
              >
                <img
                  :src="getFileIcon(file)"
                  class="w-[14px] h-[14px] md:w-[12px] md:h-[12px] lg:w-[14px] lg:h-[14px] object-contain"
                />
              </div>
              <div class="w-full">
                <BaseText
                  :text="file.name"
                  color="neutral"
                  tailwind-css="mb-[2px] !text-[14px] md:!text-[13px] lg:!text-[14px] leading-[17px] !font-medium tracking-[-0.016px] text-neutral-700"
                />
                <BaseText
                  :text="fileSizeConvert(file.size)"
                  :tone="500"
                  color="neutral"
                  tailwind-css="!text-[12px] md:!text-[11px] lg:!text-[12px] leading-[15px] tracking-[-0.016px] text-grey-700"
                />
                <div class="flex items-center gap- mt-1 md:mt-0.5 lg:mt-1">
                  <BaseButton
                    :text="t('pages.lesson.create.files.actions.download')"
                    variant="link"
                    color="primary"
                    size="sm"
                    class="!w-[100px]"
                    @on-click="() => handleDownload(file)"
                  />
                  <BaseButton
                    :text="t('pages.lesson.create.files.actions.rename')"
                    variant="link"
                    color="secondary"
                    size="sm"
                    class="!w-[100px]"
                    @on-click="() => handleRename(file)"
                  />
                </div>
              </div>
              <div class="text-error-600 cursor-pointer">
                <div @click="removeFile(i)">
                  <BaseButtonIcon
                    icon="delete-outline"
                    iconClass="!text-pink !w-[12px]"
                    size="sm"
                    variant="default"
                    class="!bg-pink/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </BaseDragAndDropFiles>
    </div>

    <!-- Rename Modal -->
    <BasePopupModal
      v-if="showRenameModal"
      :title="t('pages.course.create.files.renameModal.title')"
      :close-button="false"
      @on-close="handleRenameCancel"
    >
      <div class="p-6 md:p-4 lg:p-6">
        <BaseText
          :text="t('pages.course.create.files.renameModal.description')"
          color="neutral"
          :tone="600"
          class="mb-4 md:mb-3 lg:mb-4"
        />

        <BaseInput
          v-model="newFileName"
          type="text"
          :placeholder="t('pages.course.create.files.renameModal.placeholder')"
          :label="t('pages.course.create.files.renameModal.label')"
          class="mb-6 md:mb-5 lg:mb-6"
        />

        <div class="flex justify-end gap-3 md:gap-2.5 lg:gap-3">
          <BaseButton
            :text="t('pages.course.create.files.renameModal.buttons.cancel')"
            variant="outline"
            color="secondary"
            size="sm"
            @on-click="handleRenameCancel"
          />
          <BaseButton
            :text="t('pages.course.create.files.renameModal.buttons.confirm')"
            variant="default"
            color="primary"
            size="sm"
            :disabled="!newFileName.trim()"
            @on-click="handleRenameConfirm"
          />
        </div>
      </div>
    </BasePopupModal>
  </div>
</template>
