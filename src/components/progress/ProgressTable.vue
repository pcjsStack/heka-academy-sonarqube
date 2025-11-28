<script setup lang="ts">
import { BaseSideModal } from '@/components/common'
import ProgressTableContent from './ProgressTableContent.vue'
import { useCourseStore } from '@/stores/courseStore'
import { CourseExecutionType } from '@/types/Course'
import { t } from '@/utils/i18n'

withDefaults(
  defineProps<{
    isOpen: boolean
    id: number
    type: CourseExecutionType
  }>(),
  {
    type: CourseExecutionType.COURSE,
  },
)

const emit = defineEmits<{
  (e: 'onClose'): void
}>()
const courseStore = useCourseStore()
const handleClose = () => {
  courseStore.resetCourseParticipants()
  emit('onClose')
}
</script>

<template>
  <BaseSideModal
    @onClose="handleClose"
    @onBackgroundClick="handleClose"
    :closeButton="true"
    :title="t('pages.progress.title')"
    custom-class="left-0"
    :z-index="9999999"
    size="lg"
  >
    <div class="lg:px-6 px-4 pt-8 pb-[48px] h-[calc(100svh-140px)] overflow-y-auto">
      <ProgressTableContent :course-id="id" :type="type" />
    </div>
  </BaseSideModal>
</template>
