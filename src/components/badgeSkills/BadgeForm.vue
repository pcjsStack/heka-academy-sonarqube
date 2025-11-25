<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  BaseInput,
  BaseText,
  BaseDragAndDropFiles,
  BaseSelect,
  BaseIcon,
  BaseTooltipIcon,
} from '@/components/common'
import { getFileUrl, getFileType, fileSizeConvert, generateThumbnail } from '@/utils/generalUtils'
import { t } from '@/utils/i18n'
import type { BadgeFormData, BadgeFormValidation, AssociationOption } from '@/types/BadgeAndSkill'
import type { Media as MediaType } from '@/types/Media'

const props = defineProps<{
  modelValue: BadgeFormData
  associationOptions: {
    file: AssociationOption[]
    course: AssociationOption[]
    lessons: AssociationOption[]
    quiz: AssociationOption[]
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BadgeFormData]
  'validation-change': [validation: BadgeFormValidation]
  'scroll-bottom': [type: 'file' | 'course' | 'lessons' | 'quiz']
}>()

const uploadedFiles = ref<MediaType[]>([])
const thumbnails = ref<Record<string, string>>({})
const loadingThumbnails = ref<Record<string, boolean>>({})

const badgeData = computed({
  get: () => props.modelValue,
  set: (value: BadgeFormData) => emit('update:modelValue', value),
})

// Computed to get display files (existing Media or uploaded Files)
const displayFiles = computed(() => {
  return uploadedFiles.value.length > 0 ? uploadedFiles.value : badgeData.value.image
})

// Validation computed properties
const validation = computed((): BadgeFormValidation => {
  const isNameValid = badgeData.value.name.trim() !== ''
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes

  // Check if we have an image (either existing Media or new File)
  const hasImage = badgeData.value.image.length > 0 || uploadedFiles.value.length > 0
  let isImageValid = hasImage

  // Check file size if it's a new File (not existing Media)
  if (isImageValid && badgeData.value.image[0]) {
    const imageItem = badgeData.value.image[0]
    // Only validate size for File objects, not Media objects
    if (imageItem instanceof File) {
      const fileSize = (imageItem as File).size
      isImageValid = fileSize <= maxSize
    }
  }

  // Check if at least one association is selected
  const hasAssociation =
    badgeData.value.associations.fileIds.length > 0 ||
    badgeData.value.associations.courseIds.length > 0 ||
    badgeData.value.associations.lessonIds.length > 0 ||
    badgeData.value.associations.quizIds.length > 0

  // Association is required only if name and image are filled
  const isAssociationValid = !(isNameValid && isImageValid) || hasAssociation

  const isFormValid = isNameValid && isImageValid && isAssociationValid

  return {
    isNameValid,
    isImageValid,
    isAssociationValid,
    isFormValid,
  }
})

// Watch for validation changes
watch(
  validation,
  (newValidation) => {
    emit('validation-change', newValidation)
  },
  { deep: true, immediate: true },
)

const handleNameChange = (value: string) => {
  badgeData.value = {
    ...badgeData.value,
    name: value,
  }
}

const handleFileUpload = (files: File[] | MediaType[] | null | undefined) => {
  if (files && Array.isArray(files)) {
    // Only allow single file
    const singleFile = files.slice(0, 1)
    // Check if it's a File (new upload) or Media (existing)
    if (singleFile[0] instanceof File) {
      // New file upload - store in image array
      badgeData.value = {
        ...badgeData.value,
        image: singleFile as File[],
      }
      uploadedFiles.value = singleFile as MediaType[]
    } else {
      // Existing Media object - just update uploadedFiles for display
      uploadedFiles.value = singleFile as MediaType[]
    }
  }
}

const handleFileError = (errorMessage: string) => {
  console.error('File upload error:', errorMessage)
}

const removeFile = () => {
  // Clear both image and uploadedFiles
  badgeData.value = {
    ...badgeData.value,
    image: [],
  }
  uploadedFiles.value = []
}

const generateThumbnails = async () => {
  if (!uploadedFiles.value) return

  for (const file of uploadedFiles.value) {
    const fileType = getFileType(file)
    const fileName =
      ('fileName' in file && file.fileName ? file.fileName : 'name' in file ? file.name : '') || ''

    if (
      fileType &&
      fileType.startsWith('video/') &&
      !thumbnails.value[fileName] &&
      !loadingThumbnails.value[fileName]
    ) {
      loadingThumbnails.value[fileName] = true
      try {
        if (file instanceof File) {
          const thumb = await generateThumbnail(file)
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

const handleAssociationChange = (
  type: 'file' | 'course' | 'lessons' | 'quiz',
  values: string[],
) => {
  const mapping = {
    file: 'fileIds',
    course: 'courseIds',
    lessons: 'lessonIds',
    quiz: 'quizIds',
  } as const

  badgeData.value = {
    ...badgeData.value,
    associations: {
      ...badgeData.value.associations,
      [mapping[type]]: values,
    },
  }
}

const getAssociationOptions = (type: 'file' | 'course' | 'lessons' | 'quiz') => {
  const mapping = {
    file: 'file',
    course: 'course',
    lessons: 'lessons',
    quiz: 'quiz',
  } as const

  return props.associationOptions[mapping[type]]
}

// Watch for badgeData.image changes to sync uploadedFiles for display
watch(
  () => badgeData.value.image,
  (newImage) => {
    // If image is set and uploadedFiles is empty, sync it for display
    if (newImage && newImage.length > 0 && uploadedFiles.value.length === 0) {
      uploadedFiles.value = newImage as MediaType[]
    }
    // If image is cleared, clear uploadedFiles too
    if (!newImage || newImage.length === 0) {
      uploadedFiles.value = []
    }
  },
  { immediate: true, deep: true },
)

// Watch for file changes to generate thumbnails
watch(
  () => uploadedFiles.value,
  async (filesVal) => {
    if (filesVal) {
      await generateThumbnails()
    }
  },
  { immediate: true, deep: true },
)

const handleScrollBottom = (type: 'file' | 'course' | 'lessons' | 'quiz') => {
  emit('scroll-bottom', type)
}

const getImageErrorMessage = (): string => {
  const imageItem = badgeData.value.image[0]
  if (imageItem && imageItem instanceof File && imageItem.size > 10 * 1024 * 1024) {
    return t('pages.badgeSkills.badge.imageSizeExceeded')
  }
  return t('pages.badgeSkills.badge.imageRequired')
}
</script>

<template>
  <div>
    <BaseText
      :text="t('pages.badgeSkills.badge.title')"
      font="semibold"
      class="!text-[18px] !text-black/85 !leading-[18px] !tracking-[-0.02em] mb-6"
    />

    <!-- Badge Name -->
    <div class="mb-5">
      <BaseInput
        :model-value="badgeData.name"
        :label="t('pages.badgeSkills.badge.name')"
        :placeholder="t('pages.badgeSkills.badge.namePlaceholder')"
        type="text"
        required
        :error="!validation.isNameValid && badgeData.name !== ''"
        :error-message="t('pages.badgeSkills.badge.nameRequired')"
        @update:model-value="handleNameChange"
      />
    </div>

    <!-- Badge Image -->
    <div class="mb-8">
      <BaseDragAndDropFiles
        accept=".jpg,.jpeg,.svg,.png,.gif"
        :custom_actions="true"
        :text="t('pages.badgeSkills.badge.dragDropText')"
        :multiple="false"
        :show-history="false"
        iconName="image"
        :label="t('pages.badgeSkills.badge.image')"
        labelClass="!text-[12px] !leading-[15px] mb-1.5 !text-neutral-700"
        required
        :model-value="badgeData.image"
        :max-size="10"
        @update:model-value="handleFileUpload"
        @error="handleFileError"
      >
        <template #customActions>
          <div class="flex items-center mt-[14px] mb-[16px] gap-2 justify-between">
            <BaseText
              :text="t('pages.badgeSkills.badge.supportedFormat')"
              color="neutral"
              :tone="500"
              tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] !text-grey-700 !font-medium"
            />
            <BaseText
              :text="t('pages.badgeSkills.badge.maxSize')"
              color="neutral"
              :tone="500"
              tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] !text-grey-700 !font-medium"
            />
          </div>

          <div
            v-for="(file, i) in displayFiles"
            :key="('id' in file ? file.id : i) || i"
            class="bg-grey-50 flex rounded-[12px] items-center gap-[16px] py-[14px] px-[14px]"
          >
            <div>
              <img
                v-if="getFileType(file).startsWith('image/')"
                :src="getFileUrl(file)"
                class="w-9 h-9 min-w-[36px] rounded-[10px] object-cover"
              />
              <img
                v-else-if="thumbnails[('fileName' in file ? file.fileName : file.name) || '']"
                :src="thumbnails[('fileName' in file ? file.fileName : file.name) || '']"
                class="w-9 h-9 min-w-[36px] object-cover rounded-[10px]"
              />
            </div>
            <div class="w-full">
              <BaseText
                :text="('fileName' in file ? file.fileName : file.name) || ''"
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
              <div @click="removeFile()">
                <BaseIcon name="clear" color="error" size="sm" variant="outline" />
              </div>
            </div>
          </div>
        </template>
      </BaseDragAndDropFiles>

      <!-- Custom error display for image validation -->
      <div
        v-if="!validation.isImageValid && (badgeData.image.length > 0 || uploadedFiles.length > 0)"
        class="mt-2"
      >
        <BaseText :text="getImageErrorMessage()" color="error" :tone="600" size="sm" />
      </div>
    </div>

    <!-- Badge Associations -->
    <div class="mb-8">
      <div class="flex items-center gap-1 mb-3">
        <BaseText
          :text="t('pages.badgeSkills.badge.associateWith')"
          color="neutral"
          class="!text-[14px] !leading-[17px] !text-black/85 !font-medium"
        />
        <BaseTooltipIcon
          :text="t('pages.badgeSkills.badge.associationRequired')"
          class="!m-[-6px]"
          placement="top"
        />
      </div>

      <!-- Error message for association validation -->
      <div
        v-if="!validation.isAssociationValid && validation.isNameValid && validation.isImageValid"
        class="mb-3"
      >
        <BaseText
          :text="t('pages.badgeSkills.badge.associationRequired')"
          color="error"
          :tone="600"
          size="sm"
          class="underline"
        />
      </div>

      <div class="space-y-4">
        <div
          v-for="associationType in ['file', 'course', 'lessons', 'quiz'] as const"
          :key="associationType"
          class="flex items-center justify-between gap-2"
        >
          <BaseText
            :text="t(`pages.badgeSkills.associations.${associationType}`)"
            color="neutral"
            class="!text-[14px] !leading-[17px] !text-black/85 !font-medium flex-shrink-0"
          />
          <BaseSelect
            :model-value="
              badgeData.associations[
                associationType === 'file'
                  ? 'fileIds'
                  : associationType === 'course'
                    ? 'courseIds'
                    : associationType === 'lessons'
                      ? 'lessonIds'
                      : 'quizIds'
              ]
            "
            :options="getAssociationOptions(associationType)"
            :placeholder="t('pages.badgeSkills.associations.select')"
            multiple
            size="md"
            class="!w-[380px] flex-shrink-0"
            @update:model-value="(values) => handleAssociationChange(associationType, values)"
            @scroll-bottom="() => handleScrollBottom(associationType)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
