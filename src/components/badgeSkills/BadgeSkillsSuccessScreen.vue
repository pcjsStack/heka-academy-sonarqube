<template>
  <div class="z-50 w-full flex flex-col">
    <!-- Main Content -->
    <div
      class="flex flex-col items-center justify-center text-center py-8 h-[calc(100svh-144px)] px-6"
    >
      <!-- Success GIF -->
      <div class="mb-8">
        <img :src="successGif" alt="Success animation" class="w-32 h-32 object-contain" />
      </div>

      <!-- Success Message -->
      <div class="text-center max-w-[332px]">
        <BaseText
          :text="t('pages.badgeSkills.success.message')"
          color="neutral"
          class="!leading-[25px] !text-[14px] !font-medium !text-neutral-500 tracking-[-0.032px]"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-neutral-200 pt-5 px-6 flex justify-end">
      <BaseButton
        :text="t('pages.badgeSkills.success.done')"
        variant="default"
        class="!w-[84px]"
        @click="handleDone"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseText, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import successGif from '@/assets/gif/success.gif'

// Emits
const emit = defineEmits<{
  close: []
  done: []
}>()

const handleDone = () => {
  emit('done')
}
</script>
