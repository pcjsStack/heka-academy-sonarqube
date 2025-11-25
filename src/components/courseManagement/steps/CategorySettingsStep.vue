<template>
  <div class="space-y-6 md:space-y-5 lg:space-y-6 w-full max-w-[816px] mx-auto">
    <div class="space-y-[40px] md:space-y-6 lg:space-y-[40px]">
      <!-- General Section -->
      <div class="">
        <button
          @click="toggleSection('general')"
          class="w-full flex items-center justify-start text-left gap-3 md:gap-2.5 lg:gap-3 mb-[23px] md:mb-4 lg:mb-[23px]"
        >
          <BaseIcon
            :name="generalExpanded ? 'chevron-up' : 'chevron-down'"
            size="sm"
            color="neutral"
          />
          <BaseText
            :text="t('pages.course.settings.general.title')"
            font="semibold"
            class="!text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />
        </button>

        <div v-if="generalExpanded">
          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 gap-6 md:gap-5 lg:gap-6">
            <BaseInput
              v-model="fullName"
              :label="t('pages.categorySettings.categoryFullName')"
              :placeholder="t('pages.categorySettings.categoryFullNamePlaceholder')"
              required
              type="text"
            />
            <BaseInput
              v-model="shortName"
              :label="t('pages.categorySettings.categoryShortName')"
              :placeholder="t('pages.categorySettings.categoryShortNamePlaceholder')"
              required
              type="text"
            />
            <BaseInput
              v-model="idNumber"
              :label="t('pages.categorySettings.categoryIdNumber')"
              :placeholder="t('pages.categorySettings.categoryIdPlaceholder')"
              type="text"
            />
            <BaseSelect
              v-model="visibility"
              :label="t('pages.categorySettings.visibility')"
              :options="visibilityOptions"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BaseInput, BaseSelect, BaseText, BaseIcon } from '@/components/common'
import { t } from '@/utils/i18n'
import { visibilityOptions } from '@/utils/defaultOption'
import { VisibilityStatus } from '@/types/Course'

interface Props {
  initialFullName?: string
  initialShortName?: string
  initialIdNumber?: string
  initialVisibility?: VisibilityStatus
}

const props = withDefaults(defineProps<Props>(), {
  initialFullName: '',
  initialShortName: '',
  initialIdNumber: '',
  initialVisibility: VisibilityStatus.SHOW,
})

const emit = defineEmits<{
  'validation-change': [isValid: boolean]
}>()

// Form state
const fullName = ref(props.initialFullName)
const shortName = ref(props.initialShortName)
const idNumber = ref(props.initialIdNumber)
const visibility = ref<VisibilityStatus>(props.initialVisibility)

// Collapsible section state
const generalExpanded = ref(true)

const toggleSection = (section: 'general') => {
  generalExpanded.value = section === 'general' ? !generalExpanded.value : true
}

// Validation
const isFullNameValid = computed(() => fullName.value.trim().length > 0)
const isShortNameValid = computed(() => shortName.value.trim().length > 0)
const isValid = computed(() => isFullNameValid.value && isShortNameValid.value)

// Watch for validation changes
watch(
  [fullName, shortName],
  () => {
    emit('validation-change', isValid.value)
  },
  { immediate: true },
)

// Watch for prop changes (for edit mode)
watch(
  () => props.initialFullName,
  (newVal) => {
    if (newVal !== undefined) fullName.value = newVal
  },
)
watch(
  () => props.initialShortName,
  (newVal) => {
    if (newVal !== undefined) shortName.value = newVal
  },
)
watch(
  () => props.initialIdNumber,
  (newVal) => {
    if (newVal !== undefined) idNumber.value = newVal
  },
)
watch(
  () => props.initialVisibility,
  (newVal) => {
    if (newVal !== undefined) visibility.value = newVal
  },
)

// Expose getter for parent component
defineExpose({
  getSettings: () => ({
    fullName: fullName.value,
    shortName: shortName.value,
    idNumber: idNumber.value,
    visibility: visibility.value,
  }),
  isValid: () => isValid.value,
})
</script>
