<script lang="ts" setup>
import { BaseButton, BaseText, BasePopupModal } from '@/components/common'
import { t } from '@/utils/i18n'
const emit = defineEmits(['onCancel', 'onDelete'])
defineProps<{
  text: string
  description: string
}>()
</script>

<template>
  <BasePopupModal
    :showBackButton="false"
    :closeButton="true"
    :width="'524px'"
    :maxWidth="'90%'"
    :title="text"
    @onClose="emit('onCancel')"
  >
    <div class="lg:p-6 p-4 min-h-[120px]" id="survey-type-modal">
      <BaseText
        type="p-md"
        color="neutral"
        class="!text-[14px] tracking-[-0.032px] leading-6"
        :text="description"
      />
    </div>
    <div class="flex justify-end gap-[8px] lg:px-6 px-4 lg:py-5 py-4 border-t border-grey-150">
      <div class="flex justify-end gap-2 sm:w-[auto] w-full">
        <BaseButton
          :text="t('pages.baseDeleteModal.cancel')"
          :variant="'link'"
          size="sm"
          @click="emit('onCancel')"
          tailwindCss="min-w-[95px] !text-primary-550  !font-medium sm-w-[auto] w-[50%]"
        />
        <BaseButton
          color="error"
          :text="t('pages.baseDeleteModal.delete')"
          variant="default"
          size="md"
          :disabled="false"
          @click="emit('onDelete')"
          tailwindCss="min-w-[92px] !bg-error-500 !py-2 !font-medium sm-w-[auto] w-[50%]"
        />
      </div>
    </div>
  </BasePopupModal>
</template>
