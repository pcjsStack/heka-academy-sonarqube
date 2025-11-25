<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BasePopupModal,
  BaseButton,
  BaseDragAndDropFiles,
  BaseText,
  BaseProgressBar,
  BaseSelect,
  BaseIcon,
} from '@/components/common'
import { useUploadPopupStore } from '@/stores/uploadPopup'
import success from '@/assets/gif/success.gif'
import { t } from '@/utils/i18n'
import { visibilityOptions } from '@/utils/defaultOption'
import { VisibilityStatus } from '@/types/Course'

const uploadPopupStore = useUploadPopupStore()
const courseVisibility = ref<VisibilityStatus>(VisibilityStatus.SHOW)

const emit = defineEmits<{ (e: 'close'): void }>()
const selectedFiles = ref<File[]>([])
const showSuccess = ref(false)

const MAX_SIZE_MB = 5120
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
type SelectedFileInfo = { file: File; sizeLabel: string }

function formatSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) {
    const kb = Math.max(1, Math.round(bytes / 1024))
    return `${kb} KB`
  }
  const mb = Math.round((bytes / (1024 * 1024)) * 100) / 100
  return `${mb} MB`
}

const totalSize = computed(() => {
  return selectedFiles.value.reduce((sum, file) => sum + file.size, 0)
})

const isOverLimit = computed(() => totalSize.value > MAX_SIZE_BYTES)

const fileSizeLimitProgress = computed(() => {
  return Math.max(0, Math.min(100, Math.round((totalSize.value / MAX_SIZE_BYTES) * 100)))
})

const selectedFileInfos = computed<SelectedFileInfo[]>(() => {
  return selectedFiles.value.map((file) => {
    const sizeLabel = formatSizeLabel(file.size)
    return { file, sizeLabel }
  })
})

const handleFileUpdate = (files: File[]) => {
  selectedFiles.value = files
}

const handleRemoveFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const handleUpload = async () => {
  try {
    uploadPopupStore.uploadFileStream(selectedFiles.value, courseVisibility.value, 'published')
    emit('close')
  } catch (error) {
    console.error('Error starting uploads:', error)
    if (error instanceof Error && error.message === 'No files provided for upload') {
      return
    }
    emit('close')
  }
}

const handleDone = async () => {
  emit('close')
}
</script>

<template>
  <BasePopupModal
    width="524px"
    size="xl"
    :title="showSuccess ? t('pages.uploadFiles.successTitle') : t('pages.uploadFiles.title')"
    :isHeader="true"
    @onClose="emit('close')"
  >
    <div class="p-6">
      <template v-if="showSuccess">
        <div class="flex flex-col items-center justify-center text-center py-8">
          <img
            :src="success"
            alt="Success"
            class="mx-auto w-[96px] h-[96px] sm:mb-[40px] mb-[22px]"
          />
          <BaseText
            type="p-sm"
            color="neutral"
            :tone="500"
            :text="t('pages.uploadFiles.successMessage')"
          />
        </div>
        <div class="border-t border-neutral-200 -mx-6 mt-4 pt-5 px-6 flex justify-end">
          <BaseButton
            variant="default"
            :text="t('pages.uploadFiles.done')"
            class="!w-[84px]"
            @onClick="() => handleDone()"
          />
        </div>
      </template>
      <template v-else>
        <BaseDragAndDropFiles
          :text="t('pages.uploadFiles.dragDropText')"
          accept="image/*, video/*, .mp4, .avi, .mov, .wmv, .flv, .webm, .mkv, .m4v, .3gp, .pdf, application/pdf, .zip, application/zip, application/x-zip-compressed"
          :modelValue="selectedFiles"
          multiple
          custom_actions
          @update:model-value="handleFileUpdate"
        >
          <template #customActions>
            <div class="flex items-center mt-[14px] mb-[16px] gap-2 justify-between">
              <BaseText
                :text="t('pages.uploadFiles.uploadFileText')"
                :tone="500"
                color="neutral"
                tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] !text-grey-700 !font-medium"
              />
              <BaseText
                :text="t('pages.uploadFiles.uploadLimit')"
                :tone="500"
                color="neutral"
                tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] !text-grey-700 !font-medium"
              />
            </div>
          </template>
        </BaseDragAndDropFiles>

        <div
          class="space-y-4 overflow-y-auto overflow-x-hidden"
          :class="{ 'h-[200px]': selectedFileInfos.length >= 2 }"
        >
          <div v-if="selectedFiles.length > 0" class="mt-4 space-y-2">
            <div
              class="p-3 rounded-lg"
              :class="
                isOverLimit
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              "
            >
              <div class="flex items-center justify-between mb-2">
                <BaseText
                  :text="t('pages.uploadFiles.totalSize')"
                  color="neutral"
                  :tone="600"
                  tailwind-css="!text-[13px] leading-[16px] !font-medium"
                />
                <div class="flex items-center gap-2">
                  <BaseText
                    :text="`${formatSizeLabel(totalSize)} / ${MAX_SIZE_MB} MB`"
                    :color="isOverLimit ? 'error' : 'primary'"
                    :tone="700"
                    tailwind-css="!text-[13px] leading-[16px] !font-semibold"
                  />
                  <BaseIcon v-if="isOverLimit" name="clear-circle" color="error" size="xs" />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <BaseProgressBar
                  :value="fileSizeLimitProgress"
                  :max="100"
                  size="sm"
                  :color="isOverLimit ? 'error' : 'primary'"
                />
                <BaseText
                  :text="`${fileSizeLimitProgress}%`"
                  type="p-sm"
                  color="neutral"
                  :tone="800"
                  class="!text-[13px] !leading-[16px] !font-semibold !text-neutral-700 min-w-[40px] text-right"
                />
              </div>
            </div>

            <BaseText
              v-if="isOverLimit"
              :text="t('pages.uploadFiles.sizeExceeded')"
              color="error"
              :tone="600"
              tailwind-css="!text-[12px] leading-[15px]"
            />
          </div>

          <div
            v-for="(item, index) in selectedFileInfos"
            :key="`${item.file.name}-${index}`"
            class="mt-4 rounded-[12px] bg-grey-50 px-5 py-[16px]"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-4 flex-1">
                <div
                  class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0"
                >
                  <BaseIcon name="file" color="error" size="sm" />
                </div>
                <div class="flex-1 min-w-0">
                  <BaseText
                    :text="item.file.name"
                    color="neutral"
                    tailwind-css="mb-[2px] !text-[14px] leading-[17px] !font-medium tracking-[-0.016px] !text-black/85 truncate"
                  />
                  <BaseText
                    :text="item.sizeLabel"
                    color="neutral"
                    :tone="500"
                    tailwind-css="!text-[12px] leading-[15px] !font-medium tracking-[-0.016px] text-grey-700"
                  />
                </div>
              </div>
              <button
                @click="handleRemoveFile(index)"
                class="ml-2 flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                type="button"
              >
                <BaseIcon name="clear" color="neutral" :tone="600" size="sm" />
              </button>
            </div>
          </div>
        </div>
        <BaseSelect
          v-model="courseVisibility"
          :label="t('pages.course.settings.general.visibility')"
          :placeholder="t('pages.course.settings.general.visibilityPlaceholder')"
          :options="visibilityOptions"
        />
      </template>
    </div>
    <div v-if="!showSuccess" class="px-6 border-t py-5 border-grey-150">
      <div class="flex items-center justify-end gap-2">
        <BaseButton
          variant="link"
          :text="t('pages.uploadFiles.cancel')"
          color="primary"
          size="sm"
          @onClick="() => emit('close')"
          class="max-w-[95px] !font-medium"
        />
        <BaseButton
          variant="default"
          color="primary"
          size="sm"
          :text="t('pages.uploadFiles.upload')"
          :disabled="selectedFiles.length === 0 || isOverLimit"
          @onClick="() => handleUpload()"
          class="max-w-[96px] !font-medium"
        />
      </div>
    </div>
  </BasePopupModal>
</template>
