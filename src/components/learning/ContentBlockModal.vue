<template>
  <BaseSideModal
    :title="t('pages.contentBlock.title')"
    size="md"
    :close-button="true"
    custom-class="left-0"
    :z-index="99999999"
    @on-close="handleClose"
  >
    <ContentBlockForm
      ref="contentBlockFormRef"
      :initial-data="initialData"
      @save="handleSave"
      @cancel="handleCancel"
    />

    <div class="px-6 border-t py-5 border-grey-150">
      <div class="flex items-center justify-end gap-2">
        <BaseButton
          :text="t('pages.contentBlock.buttons.cancel')"
          variant="blank"
          size="sm"
          @onClick="handleCancel"
          class="max-w-[95px] !font-medium"
        />
        <BaseButton
          :text="t('pages.contentBlock.buttons.save')"
          variant="default"
          size="sm"
          @onClick="handleSaveClick"
          class="max-w-[81px] !font-medium"
        />
      </div>
    </div>
  </BaseSideModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BaseSideModal, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import ContentBlockForm from './ContentBlockForm.vue'
import type { ContentBlockData } from '@/types/ContentBlock'
import type { Media } from '@/types/Media'

// Props
defineProps<{
  initialData?: {
    description?: string
    backgroundColor?: string
    video?: File[] | Media[] | null
  }
}>()

// Emits
const emit = defineEmits<{
  close: []
  save: [data: ContentBlockData]
}>()

// Template refs
const contentBlockFormRef = ref()

// Methods
const handleClose = () => {
  emit('close')
}

const handleSave = (data: ContentBlockData) => {
  emit('save', data)
}

const handleCancel = () => {
  emit('close')
}

const handleSaveClick = () => {
  // Only trigger save if video is selected
  if (contentBlockFormRef.value) {
    contentBlockFormRef.value.handleSave()
  }
}
</script>
