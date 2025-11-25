<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BaseSideModal, BaseText, BaseCheckbox, BaseButton, BaseInput } from '@/components/common'
import { t } from '@/utils/i18n'
import type { FilterState } from '@/types/uploadFiles'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'applyFilters', filters: FilterState): void
  (e: 'clear'): void
  (e: 'update:filters', filters: FilterState): void
}>()

const props = defineProps<{
  filters: FilterState
}>()

// Local state for "Other" input
const otherMimeType = ref('')

// Filter options
const visibilityOptions = [
  { value: 'show', label: t('pages.uploadFiles.filters.visibility.show') },
  { value: 'hide', label: t('pages.uploadFiles.filters.visibility.hide') },
  { value: 'maintenance', label: t('pages.uploadFiles.filters.visibility.maintenance') },
]

const fileTypeOptions = [
  { value: 'all', label: t('pages.uploadFiles.filters.fileTypes.all') },
  { value: 'image', label: t('pages.uploadFiles.filters.fileTypes.image') },
  { value: 'video', label: t('pages.uploadFiles.filters.fileTypes.video') },
  { value: 'audio', label: t('pages.uploadFiles.filters.fileTypes.audio') },
  { value: 'pdf', label: t('pages.uploadFiles.filters.fileTypes.pdf') },
  { value: 'text', label: t('pages.uploadFiles.filters.fileTypes.text') },
  { value: 'scorm', label: t('pages.uploadFiles.filters.fileTypes.scorm') },
  { value: 'other', label: t('pages.uploadFiles.filters.fileTypes.other') },
]

// Computed to check if "All" is selected
const isAllSelected = computed(() => props.filters.fileTypes.includes('all'))

// Computed to check if "Other" is selected
const isOtherSelected = computed(() => props.filters.fileTypes.includes('other'))

// Computed to check if "Other" input should be shown
const showOtherInput = computed(() => isOtherSelected.value && !isAllSelected.value)

// Computed to get the effective file types for display
const effectiveFileTypes = computed(() => {
  // When "All" is selected, show all options as selected including "other"
  if (isAllSelected.value) {
    return [...props.filters.fileTypes, 'other']
  }
  // Otherwise, return the actual filter state
  return props.filters.fileTypes
})

// Active filter count
const activeFilterCount = computed(() => {
  return props.filters.visibility.length + props.filters.fileTypes.length
})

const applyFilters = () => {
  emit('applyFilters', props.filters)
}

const clearAll = () => {
  otherMimeType.value = ''
  emit('clear')
}

// Handle file type selection with "All" logic
const handleFileTypeChange = (selectedTypes: string[]) => {
  let newTypes = [...selectedTypes]

  // Define standard types (excluding "other" and custom types)
  const standardTypes = ['image', 'video', 'audio', 'pdf', 'text', 'scorm']

  // Check if "All" was just selected
  const allJustSelected = selectedTypes.includes('all') && !props.filters.fileTypes.includes('all')

  // Check if "All" was just deselected
  const allJustDeselected =
    !selectedTypes.includes('all') && props.filters.fileTypes.includes('all')

  if (allJustSelected) {
    // Case 1: "All" was just selected - select all standard types + keep "other" if it was selected
    const otherTypes = props.filters.fileTypes.filter(
      (type) => type === 'other' || type.startsWith('other:'),
    )
    newTypes = ['all', ...standardTypes, ...otherTypes]
  } else if (allJustDeselected) {
    // Case 2: "All" was just deselected - deselect all standard types, keep only "other" types
    const otherTypes = selectedTypes.filter((type) => type === 'other' || type.startsWith('other:'))
    newTypes = otherTypes
  } else if (selectedTypes.includes('all')) {
    // Case 3: "All" is currently selected - check if any standard type was deselected
    const selectedStandardTypes = selectedTypes.filter((type) => standardTypes.includes(type))
    const hasAllStandardTypes = standardTypes.every((type) => selectedStandardTypes.includes(type))

    if (!hasAllStandardTypes) {
      // Some standard types were deselected, remove "All" and keep only selected types
      const otherTypes = selectedTypes.filter(
        (type) => type === 'other' || type.startsWith('other:'),
      )
      newTypes = [...selectedStandardTypes, ...otherTypes]
    }
    // If all standard types are still selected, keep "All" and all types
  } else {
    // Case 4: "All" is not selected - check if all standard types are now selected
    const selectedStandardTypes = selectedTypes.filter((type) => standardTypes.includes(type))
    const hasAllStandardTypes = standardTypes.every((type) => selectedStandardTypes.includes(type))

    if (hasAllStandardTypes && selectedStandardTypes.length === standardTypes.length) {
      // All standard types are selected, auto-select "All"
      newTypes = ['all', ...selectedTypes]
    }
    // Otherwise, just use the selected types as they are
  }

  emit('update:filters', { ...props.filters, fileTypes: newTypes })
}

// Handle "Other" input change
const handleOtherInputChange = (value: string) => {
  otherMimeType.value = value

  if (value.trim()) {
    // Add the custom mime type to fileTypes if it's not already there
    const customType = `other:${value.trim()}`
    if (!props.filters.fileTypes.includes(customType)) {
      const newTypes = [
        ...props.filters.fileTypes.filter((type) => !type.startsWith('other:')),
        customType,
      ]
      emit('update:filters', { ...props.filters, fileTypes: newTypes })
    }
  } else {
    // Input is empty - remove all "other" related selections
    const newTypes = props.filters.fileTypes.filter(
      (type) => type !== 'other' && !type.startsWith('other:'),
    )
    emit('update:filters', { ...props.filters, fileTypes: newTypes })
  }
}

// Watch for changes in fileTypes to sync otherMimeType
watch(
  () => props.filters.fileTypes,
  (newTypes) => {
    const otherType = newTypes.find((type) => type.startsWith('other:'))
    if (otherType) {
      otherMimeType.value = otherType.replace('other:', '')
    } else {
      otherMimeType.value = ''
    }
  },
  { immediate: true },
)

// Watch for changes in otherMimeType to handle empty input
watch(otherMimeType, (newValue) => {
  if (!newValue.trim()) {
    // If input is cleared, remove "other" selection
    const newTypes = props.filters.fileTypes.filter(
      (type) => type !== 'other' && !type.startsWith('other:'),
    )
    if (newTypes.length !== props.filters.fileTypes.length) {
      emit('update:filters', { ...props.filters, fileTypes: newTypes })
    }
  }
})
</script>

<template>
  <BaseSideModal
    size="sm"
    :title="t('pages.uploadFiles.filters.title')"
    close-button
    closeButtonColor="neutral"
    @onClose="emit('close')"
    containerTailwindCss="!p-0"
    customClass="left-0"
    :zIndex="1000"
    customTitle
  >
    <template #custom-title>
      <div class="flex items-center gap-2">
        <BaseText
          :text="t('pages.uploadFiles.filters.title')"
          type="h6"
          color="neutral"
          font="semibold"
          class="text-lg"
        />
        <BaseText
          :text="activeFilterCount.toString()"
          class="!w-[24px] !bg-[rgba(233,0,98,0.1)] !text-pink !h-[20px] ml-[2px] !rounded-[150px] flex justify-center !text-[12px] !font-medium"
        />
      </div>
    </template>
    <div
      class="lg:px-6 px-4 pt-8 sm:pb-[56px] pb-[32px] sm:h-[calc(100vh-155px)] h-[calc(100svh-155px)] overflow-y-auto"
    >
      <div class="flex flex-col gap-6 overflow-y-auto flex-1 h-full min-h-0">
        <!-- Visibility Section -->
        <div>
          <BaseText
            :text="t('pages.uploadFiles.filters.visibility.title')"
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
                :model-value="props.filters.visibility"
                :value="option.value"
                :label="option.label"
                uncheckedStroke="#637083"
                :checkbox-width="16"
                :checkbox-height="16"
                wrapperClass="w-full"
                labelClass="text-sm text-neutral-700 font-medium"
                @update:model-value="
                  emit('update:filters', { ...props.filters, visibility: $event })
                "
              />
            </div>
          </div>
        </div>

        <!-- File Types Section -->
        <div>
          <BaseText
            :text="t('pages.uploadFiles.filters.fileTypes.title')"
            type="p-sm"
            color="neutral"
            :tone="700"
            font="semibold"
            class="mb-3"
          />
          <div class="flex flex-col gap-2">
            <div
              v-for="option in fileTypeOptions"
              :key="option.value"
              class="flex items-center gap-3"
            >
              <BaseCheckbox
                :model-value="effectiveFileTypes"
                :value="option.value"
                :label="option.label"
                uncheckedStroke="#637083"
                :checkbox-width="16"
                :checkbox-height="16"
                wrapperClass="w-full"
                labelClass="text-sm text-neutral-700 font-medium"
                @update:model-value="handleFileTypeChange($event)"
              />
            </div>
          </div>

          <!-- Other MIME Type Input -->
          <div v-if="showOtherInput" class="mt-3 ml-6">
            <BaseInput
              v-model="otherMimeType"
              :placeholder="t('pages.uploadFiles.filters.fileTypes.otherPlaceholder')"
              type="text"
              tailwind-css="text-sm border border-neutral-300 rounded-lg px-3 py-2"
              @input="handleOtherInputChange($event.target.value)"
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
          :text="t('pages.uploadFiles.filters.clear')"
          color="primary"
          size="sm"
          variant="link"
          class="md:max-w-[102px] max-w-[50%] !font-medium"
          @on-click="clearAll"
        />
        <BaseButton
          :fullSize="false"
          :text="t('pages.uploadFiles.filters.applyFilters')"
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
