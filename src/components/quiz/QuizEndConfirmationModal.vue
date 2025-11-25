<template>
  <BasePopupModal
    v-if="show"
    :title="t('pages.quiz.endQuiz.title')"
    :close-button="true"
    :is-header="true"
    size="sm"
    @on-close="handleClose"
  >
    <div class="px-6 py-4">
      <BaseText
        :text="t('pages.quiz.endQuiz.description')"
        color="neutral"
        :tone="600"
        font="regular"
        type="p-md"
        class="mb-6"
      />

      <div class="flex justify-end gap-3">
        <BaseButton
          :text="t('pages.quiz.endQuiz.cancel')"
          variant="default"
          color="neutral"
          size="sm"
          class="!w-[100px]"
          @onClick="handleClose"
        />
        <BaseButton
          :text="t('pages.quiz.endQuiz.confirm')"
          variant="default"
          color="success"
          size="sm"
          class="!w-[100px]"
          @onClick="handleConfirm"
        />
      </div>
    </div>
  </BasePopupModal>
</template>

<script setup lang="ts">
import { BasePopupModal, BaseText, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'

interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>
