<template>
  <BaseSideModal
    v-if="show"
    :title="t('pages.section.create.title')"
    size="md"
    :close-button="true"
    custom-class="left-0"
    :z-index="9999999"
    @onClose="handleClose"
  >
    <div class="py-6 px-4">
      <div class="space-y-2">
        <BaseInput
          id-name="sectionName"
          label-class="custom-label-text text-xs-custom"
          :label="t('pages.section.create.sectionName')"
          v-model="sectionName"
          type="text"
          :placeholder="t('pages.section.create.sectionNamePlaceholder')"
        />
      </div>

      <div class="space-y-4 overflow-y-auto sm:h-[calc(100vh-252px)] mt-4">
        <div class="space-y-2">
          <BaseText
            :text="t('pages.section.create.associateLesson')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="medium"
          />
          <BaseSelect
            v-model="selectedLesson"
            :options="lessonOptions"
            multiple
            :placeholder="t('pages.section.create.selectLesson')"
          />
        </div>
      </div>

      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <BaseButton
          :text="t('pages.section.create.buttons.cancel')"
          variant="outline"
          color="neutral"
          size="md"
          @onClick="handleClose"
          class="!w-auto !px-6"
        />
        <BaseButton
          :text="t('pages.section.create.buttons.next')"
          variant="default"
          color="primary"
          size="md"
          @onClick="handleNext"
          class="!w-auto !px-6 bg-blue-600 text-white hover:bg-blue-700"
        />
      </div>
    </div>
  </BaseSideModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BaseSideModal, BaseText, BaseInput, BaseSelect, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'

interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  next: [data: { name: string; lesson: string[] }]
}>()

const sectionName = ref('License')
const selectedLesson = ref<string[]>(['1'])

const lessonOptions = ref([
  { value: '1', label: 'Skill Development' },
  { value: '2', label: 'Product Training' },
  { value: '3', label: 'Customer Service' },
])

const handleClose = () => {
  emit('close')
}

const handleNext = () => {
  emit('next', { name: sectionName.value, lesson: selectedLesson.value })
}
</script>
