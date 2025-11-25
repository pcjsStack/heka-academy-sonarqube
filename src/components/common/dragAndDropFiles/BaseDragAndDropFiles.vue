<template>
  <div class="w-full">
    <div v-if="label" class="flex items-center space-x-1">
      <BaseText
        :text="`${label}`"
        :tone="700"
        color="neutral"
        font="medium"
        type="p-sm"
        :class="[labelClass, 'text-xs-custom text-custom-label-text']"
      />
      <span
        v-if="required"
        class="text-pink !ml-0 text-xs-custom tracking-[-0.01em] leading-tight self-start"
      >
        *
      </span>
    </div>
    <label
      v-if="!disabled"
      :class="{ 'bg-neutral-100': isDraggingFile }"
      class="flex w-full cursor-pointer flex-col items-center justify-center gap-[24px] border-dashed rounded-[20px] border-2 border-neutral-300 h-[142px]"
      :for="`dropzone-file-${dropzoneId}`"
      @dragenter.prevent="onDragEnterFile"
      @dragleave.prevent="onDragLeaveFile"
      @dragover.prevent="onDragOverFile"
      @drop.prevent="onDropFileEvent"
    >
      <BaseIcon :name="iconName" size="xl" :class="iconClass" />
      <div class="flex w-full flex-col items-center gap-0.5">
        <div class="text-sm-custom font-medium">
          <BaseText
            :text="text"
            :tone="900"
            color="primary"
            type="p-lg"
            tailwindCss="!text-[14px] leading-[17px] text-primary-550 !font-medium"
            :class="{
              'text-center px-6': isMobile,
              '!font-[500] [&_*]:!font-[500]': true,
            }"
          />
        </div>
      </div>
      <input
        :id="`dropzone-file-${dropzoneId}`"
        ref="dropzoneFile"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        type="file"
        @change="onFileUploadEvent"
      />
    </label>

    <slot v-if="custom_actions" name="customActions" />

    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-2">
      <BaseText :text="errorMessage" type="p-xs" color="error" :tone="600" font="medium" />
    </div>
    <div
      v-if="!custom_actions && showHistory"
      class="flex w-full items-center justify-between flex-wrap gap-2 mt-[8px] mb-[18px]"
    >
      <BaseText
        :text="uploadHintText"
        type="p-sm"
        color="neutral"
        tailwind-css="!text-[12px] leading-[15px] !text-grey-700 tracking-[-0.016px]"
      />
      <BaseText
        v-if="!hideSearchText"
        :text="'Search Repository'"
        tailwind-css="cursor-pointer underline !text-[14px] leading-[17px] text-primary-550 tracking-[-0.016px]"
      />
    </div>
    <div v-if="!custom_actions && showHistory">
      <div
        v-for="(file, i) in files"
        :key="`attach-create-${i}`"
        class="bg-grey-50 flex rounded-[12px] items-center gap-[16px] py-[16px] px-[20px] !mb-[8px]"
      >
        <div>
          <img v-if="file.url && file.mimeType.startsWith('image/')" :src="file.url" class="w-20" />
          <BaseIcon v-else name="file" size="sm" />
        </div>
        <div class="w-full">
          <BaseText
            :text="file.name"
            color="neutral"
            tailwind-css="mb-[2px] !text-[14px] leading-[17px] !font-medium tracking-[-0.016px] text-neutral-700"
          />
          <BaseText
            :text="fileSizeConvert(file.size)"
            :tone="500"
            color="neutral"
            tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] text-grey-700"
          />
          <div v-if="enableDownloadOption" class="inline-block mt-2">
            <BaseButton
              text="Download"
              :tone="500"
              color="secondary"
              variant="link"
              size="sm"
              @on-click="downloadFile(file.url, file.name)"
            />
          </div>
        </div>
        <div class="text-error-600 cursor-pointer" v-if="!disabled">
          <div @click="onFileRemove(i)">
            <BaseIcon name="clear" size="sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, watch } from 'vue'
import { BaseIcon } from '@/components/common'
import BaseButton from '../button/BaseButton.vue'
import BaseText from '../text/BaseText.vue'
import type { Media } from '@/types/Media'
import type { Icons } from '@/types/Styles'

import { downloadFile, fileSizeConvert } from '@/utils/generalUtils'
const props = withDefaults(
  defineProps<{
    text: string
    accept: string
    modelValue: File[] | Media[] | null | undefined
    multiple?: boolean
    disabled?: boolean
    showHistory?: boolean
    enableDownloadOption?: boolean
    required?: boolean
    label?: string
    labelHelper?: string
    labelClass?: string
    custom_actions?: boolean
    isMobile?: boolean
    hideSearchText?: boolean
    uploadTextCss?: string
    uploadHintText?: string
    iconName?: Icons
    iconClass?: string
    maxSize?: number // Maximum file size in MB
  }>(),
  {
    modelValue: undefined,
    multiple: false,
    showHistory: false,
    enableDownloadOption: false,
    accept: '*',
    iconName: 'upload-file-2',
    iconClass: 'text-neutral-700',
    maxSize: undefined,
    uploadHintText: 'Upload a PDF, Image & Video file',
  },
)

const emit = defineEmits<{
  'update:modelValue': [files: any[]]
  error: [message: string]
}>()

const files = ref<any[]>(props.modelValue ?? [])
const errorMessage = ref<string>('')

watch(
  () => props.modelValue,
  (newValue) => {
    files.value = newValue ?? []
  },
)

const isDraggingFile = ref<boolean>(false)
const dropzoneId = ref<string>(Math.random().toString(36).substring(7))
const dropzoneFile = ref<HTMLInputElement | null>(null)

function fileListToArray(fileList: FileList) {
  return Array.from(fileList)
}

const onDragEnterFile = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDraggingFile.value = true
}

const onDragOverFile = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDraggingFile.value = true
}

const onDragLeaveFile = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  // Only set to false if we're leaving the dropzone itself, not a child element
  if (e.currentTarget === e.target) {
    isDraggingFile.value = false
  }
}

const onFileRemove = (index: number) => {
  files.value.splice(index, 1)
  emit('update:modelValue', files.value)
  errorMessage.value = ''

  if (dropzoneFile.value) {
    dropzoneFile.value.value = ''
  }
}

const validateFileSize = (file: File): boolean => {
  if (!props.maxSize) {
    errorMessage.value = ''
    return true
  }

  const fileSizeInMB = file.size / (1024 * 1024)
  if (fileSizeInMB > props.maxSize) {
    const message = `File "${file.name}" exceeds the maximum size of ${props.maxSize} MB. File size: ${fileSizeInMB.toFixed(2)} MB`
    errorMessage.value = message
    emit('error', message)
    return false
  }

  errorMessage.value = ''
  return true
}

const addFiles = (tempFiles: File[]) => {
  // Validate file sizes
  const invalidFiles: File[] = []
  const validFiles: File[] = []

  tempFiles.forEach((file) => {
    if (validateFileSize(file)) {
      validFiles.push(file)
    } else {
      invalidFiles.push(file)
    }
  })

  // If there are invalid files and some valid files, update error message
  if (invalidFiles.length > 0 && validFiles.length > 0) {
    errorMessage.value = `${invalidFiles.length} file(s) exceeded the maximum size of ${props.maxSize} MB and were not uploaded.`
  }

  if (validFiles.length === 0) {
    return
  }

  if (props.multiple) {
    files.value.push(...validFiles)
  } else {
    files.value = [validFiles[0]]
  }

  emit('update:modelValue', files.value)
}
const onDropFileEvent = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDraggingFile.value = false

  if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return

  const tempFiles = fileListToArray(e.dataTransfer.files)

  // validate file extension and MIME type
  if (props.accept !== '*') {
    const acceptedTypes = props.accept.split(',').map((ext) => ext.trim().toLowerCase())
    const validFiles = tempFiles.filter((file) => validateFile(file, acceptedTypes))
    addFiles(validFiles)
  } else {
    addFiles(tempFiles)
  }
}

const validateFile = (file: File, acceptedTypes: string[]): boolean => {
  // Check file extension
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

  return acceptedTypes.some((type) => {
    if (type === '*') return true
    if (type.startsWith('.')) {
      return type === fileExt
    }
    // Check MIME type patterns (e.g., "image/*", "video/*")
    if (type.includes('/*')) {
      const baseType = type.split('/')[0]
      return file.type.startsWith(baseType + '/')
    }
    // Check exact MIME type (e.g., "application/pdf")
    return file.type === type
  })
}

const onFileUploadEvent = (e: Event) => {
  e.preventDefault()

  const input = e.target as HTMLInputElement
  const tempFiles = input.files

  if (!tempFiles) return
  const tempFilesArray = fileListToArray(tempFiles)

  // validate file extension and MIME type
  if (props.accept !== '*') {
    const acceptedTypes = props.accept.split(',').map((ext) => ext.trim().toLowerCase())
    const validFiles = tempFilesArray.filter((file) => validateFile(file, acceptedTypes))
    addFiles(validFiles)
  } else {
    addFiles(tempFilesArray)
  }

  emit('update:modelValue', files.value)
  input.value = ''
}
</script>
