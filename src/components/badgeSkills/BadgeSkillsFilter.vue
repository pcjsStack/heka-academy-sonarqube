<script setup lang="ts">
import { computed } from 'vue'
import { BaseSideModal, BaseText, BaseCheckbox, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import type { BadgeSkillsFilters } from '@/types/BadgeAndSkill'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'applyFilters', filters: BadgeSkillsFilters): void
  (e: 'clear'): void
  (e: 'update:filters', filters: BadgeSkillsFilters): void
}>()

const props = defineProps<{
  filters: BadgeSkillsFilters
  activeTab: 'badges' | 'skills'
}>()

// Active filter count
const activeFilterCount = computed(() => {
  let count = 0
  if (props.filters.deleted) {
    count++
  }
  return count
})

const applyFilters = () => {
  emit('applyFilters', props.filters)
}

const clearAll = () => {
  emit('clear')
}

const handleClose = () => {
  try {
    emit('close')
  } catch (error) {
    console.error('Error closing filter modal:', error)
  }
}

const handleDeletedChange = (value: boolean) => {
  emit('update:filters', {
    ...props.filters,
    deleted: value,
  })
}
</script>

<template>
  <BaseSideModal
    size="sm"
    :title="t('pages.course.filter.title')"
    close-button
    closeButtonColor="neutral"
    @onClose="handleClose"
    containerTailwindCss="!p-0"
    customClass="left-0"
    :zIndex="1000"
    customTitle
  >
    <template #custom-title>
      <div class="flex items-center gap-2">
        <BaseText
          :text="t('pages.course.filter.title')"
          type="h6"
          color="neutral"
          font="semibold"
          class="text-lg"
        />
        <BaseText
          v-if="activeFilterCount > 0"
          :text="activeFilterCount.toString()"
          class="!w-[24px] !bg-[rgba(233,0,98,0.1)] !text-pink !h-[20px] ml-[2px] !rounded-[150px] flex justify-center !text-[12px] !font-medium"
        />
      </div>
    </template>
    <div
      class="lg:px-6 px-4 pt-8 sm:pb-[56px] pb-[32px] sm:h-[calc(100vh-155px)] h-[calc(100svh-155px)] overflow-y-auto"
    >
      <div class="flex flex-col gap-6 overflow-y-auto flex-1 h-full min-h-0">
        <!-- Deleted Section -->
        <div>
          <BaseText
            :text="t('pages.badgeSkills.filter.deleted.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <div class="flex items-center gap-3">
            <BaseCheckbox
              :model-value="[filters.deleted ? 'deleted' : '']"
              value="deleted"
              :label="t('pages.badgeSkills.filter.deleted.label')"
              uncheckedStroke="#637083"
              :checkbox-width="16"
              :checkbox-height="16"
              wrapperClass="w-full"
              @update:model-value="(values) => handleDeletedChange(values.includes('deleted'))"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :fullSize="false"
          text="Reset"
          color="primary"
          size="sm"
          variant="link"
          class="md:max-w-[102px] max-w-[50%] !font-medium"
          @on-click="clearAll"
        />
        <BaseButton
          :fullSize="false"
          text="Search"
          color="primary"
          size="sm"
          variant="default"
          class="md:max-w-[129px] max-w-[50%] !font-medium"
          @on-click="applyFilters"
        />
      </div>
    </div>
  </BaseSideModal>
</template>
