<template>
  <div class="w-full">
    <div
      class="border-2 border-dashed border-primary-550 rounded-[16px] p-[15px] transition-colors cursor-pointer"
      @click="handleAddBlock"
    >
      <div class="flex gap-3 items-center justify-center text-primary-550">
        <BaseIcon name="add" size="xs" color="default" />
        <BaseText
          :text="t('pages.learning.addBlock.title')"
          font="medium"
          class="!text-[14px] leading-[17px] tracking-[-0.016px] !text-primary-550 !font-medium"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseIcon, BaseText } from '@/components/common'
import { t } from '@/utils/i18n'

// Emits
const emit = defineEmits<{
  'add-block': []
}>()

// Methods
const handleAddBlock = () => {
  emit('add-block')
}
</script>
