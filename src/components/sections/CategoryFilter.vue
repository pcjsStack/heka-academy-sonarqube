<script setup lang="ts">
import { computed } from 'vue'
import { BaseSideModal, BaseText, BaseCheckbox, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import type { GetCategoriesParams } from '@/types/Category'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'applyFilters'): void
  (e: 'clear'): void
  (e: 'update:filters', filters: GetCategoriesParams): void
}>()

const props = defineProps<{
  filters: GetCategoriesParams
  isAdmin: boolean
}>()

// Filter options
const visibilityOptions = [
  { value: 'all', label: t('pages.categories.filter.visibility.all') },
  {
    value: 'show',
    label: t('pages.categories.filter.visibility.showActivityCompletion'),
  },
  { value: 'hide', label: t('pages.categories.filter.visibility.hide') },
  { value: 'maintenance', label: t('pages.categories.filter.visibility.maintenance') },
]

// Active filter count for badge
const activeFilterCount = computed(() => {
  let count = 0
  if (props.isAdmin) {
    // Count visibility filters (excluding 'all')
    const vis = props.filters.visibility
    if (vis) {
      if (Array.isArray(vis)) {
        count += vis.filter((v) => String(v) !== 'all').length
      } else {
        // Handle single value case
        if (String(vis) !== 'all') count++
      }
    }
  }
  return count
})

const applyFilters = () => {
  emit('applyFilters')
}

const clearAll = () => {
  emit('clear')
}

const handleClose = () => {
  emit('close')
}

// Specific visibility options (excluding 'all')
const specificOptions = ['show', 'hide', 'maintenance']

const handleVisibilityUpdate = (optionValue: string, selectedValues: string[]) => {
  const newSelection = Array.isArray(selectedValues) ? [...selectedValues] : []
  const currentVisibility = props.filters.visibility
  const currentSelection = Array.isArray(currentVisibility)
    ? currentVisibility
    : currentVisibility
      ? [currentVisibility]
      : []
  const wasAllSelected = currentSelection.includes('all')
  const isAllSelected = newSelection.includes('all')

  if (optionValue === 'all') {
    // User clicked on 'all' checkbox
    if (isAllSelected && !wasAllSelected) {
      // 'all' is being selected - automatically select all specific options
      emit('update:filters', {
        ...props.filters,
        visibility: ['all', 'show', 'hide', 'maintenance'] as string[],
      })
    } else if (!isAllSelected && wasAllSelected) {
      // 'all' is being deselected - automatically deselect all specific options
      emit('update:filters', {
        ...props.filters,
        visibility: undefined,
      })
    } else {
      // Fallback: just use the new selection
      emit('update:filters', {
        ...props.filters,
        visibility: newSelection as string[],
      })
    }
    return
  }

  // User clicked on a specific option (show, hide, or maintenance)
  // Remove 'all' from the selection first (we'll add it back if needed)
  let finalSelection = newSelection.filter((v) => v !== 'all')

  // Check if all specific options are now selected
  const allSpecificSelected = specificOptions.every((opt) => finalSelection.includes(opt))

  // If all specific options are selected, automatically add 'all'
  if (allSpecificSelected) {
    finalSelection = ['all', ...specificOptions]
  }

  emit('update:filters', {
    ...props.filters,
    visibility: finalSelection.length > 0 ? (finalSelection as string[]) : undefined,
  })
}
</script>

<template>
  <BaseSideModal
    size="sm"
    :title="t('pages.categories.filter.title')"
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
          :text="t('pages.categories.filter.title')"
          type="h6"
          color="neutral"
          font="semibold"
          class="text-lg"
        />
        <BaseText
          :text="activeFilterCount.toString()"
          class="!w-[24px] !bg-pink/10 !text-pink !h-[20px] ml-[2px] !rounded-[150px] flex justify-center !text-[12px] !font-medium"
        />
      </div>
    </template>
    <div
      class="lg:px-6 px-4 pt-8 sm:pb-[56px] pb-[32px] sm:h-[calc(100vh-155px)] h-[calc(100svh-155px)] overflow-y-auto"
    >
      <div class="flex flex-col gap-6 overflow-y-auto flex-1 h-full min-h-0">
        <!-- Visibility Checkboxes Section -->
        <div>
          <BaseText
            :text="t('pages.categories.filter.visibility.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <div class="flex flex-col gap-2">
            <div
              v-for="option in visibilityOptions"
              :key="option.value"
              class="flex items-center gap-3"
            >
              <BaseCheckbox
                :model-value="
                  Array.isArray(filters.visibility)
                    ? filters.visibility
                    : filters.visibility
                      ? [filters.visibility]
                      : []
                "
                :value="option.value"
                :label="option.label"
                uncheckedStroke="#637083"
                :checkbox-width="16"
                :checkbox-height="16"
                wrapperClass="w-full"
                @update:model-value="(vals) => handleVisibilityUpdate(option.value, vals)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :fullSize="false"
          :text="t('pages.categories.filter.clear')"
          color="primary"
          size="sm"
          variant="link"
          class="md:max-w-[102px] max-w-[50%] !font-medium"
          @on-click="clearAll"
        />
        <BaseButton
          :fullSize="false"
          :text="t('pages.categories.filter.applyFilters')"
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
