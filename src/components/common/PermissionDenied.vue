<template>
  <div class="min-h-screen bg-white flex flex-col">
    <HeaderView
      :title="t('pages.common.backToHome')"
      :isBack="true"
      :isSearch="false"
      :backText="t('pages.common.backToHome')"
      @back="handleBack"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-10 lg:py-12">
      <!-- Icon -->
      <div class="mb-6 md:mb-5 lg:mb-6">
        <BaseIcon name="calendar-lock" size="6xl" color="warning" :tone="400" class="opacity-80" />
      </div>

      <!-- Message -->
      <BaseText
        :text="message || t('pages.common.permissionDenied.message')"
        type="p-lg"
        color="warning"
        :tone="400"
        font="medium"
        class="text-center max-w-md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseIcon, BaseText } from '@/components/common'
import HeaderView from '@/components/layouts/HeaderView.vue'
import { t } from '@/utils/i18n'

interface Props {
  message?: string
  backText?: string
  tone?: 50 | 100 | 200 | 300 | 400 | 500 | 550 | 600 | 700 | 800 | 900 | 950
}

withDefaults(defineProps<Props>(), {
  message: undefined,
  backText: undefined,
  tone: 400,
})

const emit = defineEmits<{
  back: []
}>()

const handleBack = () => {
  emit('back')
}
</script>
