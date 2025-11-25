<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { BaseText, BaseIcon, BaseRadioButton } from '@/components/common'
import SetRecurrence from './SetRecurrence.vue'
import RestrictionModal from './RestrictionModal.vue'
import { t } from '@/utils/i18n'
import { useCohortStore } from '@/stores/Cohort'
import { useLanguageStore } from '@/stores/Language'
import { getRestrictionLabel } from '@/utils/courseRestrictionsUtils'
import type { Restriction, CourseDetails } from '@/types/Course'
import type { AssociationsShape } from '@/utils/coursePayload'

const emit = defineEmits<{
  'update:restrictions': [restrictions: Restriction[]]
}>()
const cohortStore = useCohortStore()
const languageStore = useLanguageStore()
const props = withDefaults(
  defineProps<{
    leftItems?: AssociationsShape['leftItems']
    restrictions?: Restriction[]
    editCourse?: CourseDetails
  }>(),
  {
    leftItems: () => [],
    restrictions: () => [],
    editCourse: undefined,
  },
)

// Collapsible sections state
const accessExpanded = ref(true)
const completionExpanded = ref(true)

// Form data - Restriction Access - Initialize with props.editCourse.rules if editing
const accessRestrictions = ref<Restriction[]>(
  props.editCourse?.rules ? [...props.editCourse.rules] : [...props.restrictions],
)

// Form data - Completion Conditions - Initialize from editCourse if editing
const completionCondition = ref(props.editCourse?.restrictions?.completionCondition || '')

// Form data - Set Recurrence - Initialize from editCourse if editing
const recurrenceData = ref<{
  recurrenceType: string
  recurrenceInterval: string | number
  repeatDay: string
  repeatDate: number
  ends: string
  endDate: string | null
  endAfterOccurrences: string | number
} | null>(null)

// Initialize recurrence data from existing course
const initializeRecurrenceFromCourse = () => {
  if (!props.editCourse?.restrictions) return

  const restrictions = props.editCourse.restrictions

  if (restrictions.recurrenceType) {
    // Determine ends type from API data
    const ends = restrictions.recurrenceEndDate
      ? 'endDate'
      : restrictions.endAfterOccurrences
        ? 'afterOccurrences'
        : 'never'

    // Convert 3-letter day abbreviation back to full day name
    const dayMap: Record<string, string> = {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday',
    }
    const repeatDay = restrictions.repeatOn
      ? dayMap[restrictions.repeatOn.toLowerCase()] || restrictions.repeatOn
      : ''

    // Capitalize first letter of recurrence type for SetRecurrence component
    const recurrenceTypeCapitalized =
      restrictions.recurrenceType.charAt(0).toUpperCase() + restrictions.recurrenceType.slice(1)

    recurrenceData.value = {
      recurrenceType: recurrenceTypeCapitalized, // 'weekly' -> 'Weekly'
      recurrenceInterval: restrictions.recurrenceInterval || 1,
      repeatDay,
      repeatDate: 0,
      ends,
      endDate: restrictions.recurrenceEndDate || null,
      endAfterOccurrences: restrictions.endAfterOccurrences || 0,
    }
  }
}

onMounted(async () => {
  await cohortStore.fetchCohorts({ page: 0 })
  await languageStore.fetchAllLanguages()

  // Initialize form data from editCourse when editing
  initializeRecurrenceFromCourse()
})

// Watch for editCourse changes
watch(
  () => props.editCourse,
  () => {
    if (props.editCourse) {
      // Update access restrictions from rules
      if (props.editCourse.rules) {
        accessRestrictions.value = [...props.editCourse.rules]
      }

      // Update completion condition
      if (props.editCourse.restrictions?.completionCondition) {
        completionCondition.value = props.editCourse.restrictions.completionCondition
      }

      // Initialize recurrence data
      initializeRecurrenceFromCourse()
    }
  },
  { immediate: true },
)
const toggleSection = (section: string) => {
  switch (section) {
    case 'access':
      accessExpanded.value = !accessExpanded.value
      break
    case 'completion':
      completionExpanded.value = !completionExpanded.value
      break
  }
}

const removeRestriction = (restrictionType: Restriction['type']) => {
  accessRestrictions.value = accessRestrictions.value.filter((r) => r.type !== restrictionType)
  emit('update:restrictions', accessRestrictions.value)
}

// Computed property to get unique restriction types for display
const uniqueRestrictionTypes = computed(() => {
  const types = new Set<Restriction['type']>()
  accessRestrictions.value.forEach((r) => types.add(r.type))
  return Array.from(types)
})

// Get restrictions being edited for the modal
const editingRestrictions = computed(() => {
  if (!editingRestrictionType.value) return []
  const filtered = accessRestrictions.value.filter((r) => r.type === editingRestrictionType.value)
  return filtered
})

// Modal state management
const showRestrictionModal = ref(false)
const editingRestrictionType = ref<Restriction['type'] | null>(null)

// Modal functions
const openAddRestrictionModal = () => {
  editingRestrictionType.value = null // Clear editing type when adding new
  showRestrictionModal.value = true
}

const openEditRestrictionModal = (restrictionType: Restriction['type']) => {
  editingRestrictionType.value = restrictionType
  showRestrictionModal.value = true
}

const closeRestrictionModal = () => {
  showRestrictionModal.value = false
  editingRestrictionType.value = null
}

const handleSaveRestriction = (restriction: Restriction | Restriction[]) => {
  const newRestrictions = Array.isArray(restriction) ? restriction : [restriction]
  const newRestrictionType = newRestrictions[0]?.type

  if (!newRestrictionType) {
    closeRestrictionModal()
    return
  }

  // Remove all restrictions of the same type as we're updating
  const otherTypeRestrictions = accessRestrictions.value.filter(
    (r) => r.type !== newRestrictionType,
  )

  // Combine: keep all other types + add/update the new restrictions of this type
  accessRestrictions.value = [...otherTypeRestrictions, ...newRestrictions]

  emit('update:restrictions', accessRestrictions.value)
  closeRestrictionModal()
}

// Expose methods for parent component
defineExpose({
  getRestrictions: () => accessRestrictions.value,
  getRecurrence: () => recurrenceData.value,
  getCompletionCondition: () => completionCondition.value,
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <BaseText
      :text="t('pages.course.create.steps.restrictions')"
      :tone="900"
      color="neutral"
      font="semibold"
      type="p-lg"
      class="mb-6 md:mb-5 lg:mb-6"
    />

    <div class="space-y-6 md:space-y-5 lg:space-y-6">
      <!-- Restriction Access Section -->
      <div class="">
        <button
          @click="toggleSection('access')"
          class="w-full flex items-center justify-start text-left gap-3 mb-[23px] md:mb-4 lg:mb-[23px]"
        >
          <BaseIcon
            :name="accessExpanded ? 'chevron-up' : 'chevron-down'"
            size="sm"
            color="neutral"
          />
          <BaseText
            :text="t('pages.course.restrictions.access.title')"
            font="semibold"
            class="!text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />
        </button>

        <div v-if="accessExpanded" class="pb-4 md:pb-3 lg:pb-4">
          <div class="flex gap-2 md:gap-1.5 lg:gap-2">
            <BaseText
              :text="t('pages.course.restrictions.access.restriction')"
              :tone="700"
              color="neutral"
              font="medium"
              type="p-sm"
              class="!text-black/50 mb-3 md:mb-2.5 lg:mb-3 flex items-center"
            />

            <!-- Access Restriction Tags -->
            <div class="flex flex-wrap gap-2 md:gap-1.5 lg:gap-2 mb-4 md:mb-3 lg:mb-4">
              <span
                v-for="restrictionType in uniqueRestrictionTypes"
                :key="restrictionType"
                class="inline-flex items-center gap-1 md:gap-0.5 lg:gap-1 px-3 md:px-2.5 lg:px-3 py-1 rounded-[10px] text-sm md:text-xs lg:text-sm font-medium border border-primary-550-50 bg-primary-550-10 text-primary-550 cursor-pointer hover:bg-primary-550-20 transition-colors"
                @click="openEditRestrictionModal(restrictionType)"
              >
                {{ getRestrictionLabel(restrictionType) }}
                <BaseIcon
                  name="clear"
                  size="xs"
                  class="cursor-pointer hover:text-primary-700"
                  @click.stop="removeRestriction(restrictionType)"
                />
              </span>
            </div>
          </div>

          <!-- Add Restriction Link -->
          <div class="flex justify-start">
            <button
              @click="openAddRestrictionModal"
              class="text-primary-550 hover:text-blue-800 text-sm md:text-xs lg:text-sm font-medium"
            >
              {{ t('pages.course.restrictions.access.addRestriction') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Completion Conditions Section -->
      <div class="">
        <button
          @click="toggleSection('completion')"
          class="w-full flex items-center justify-start text-left gap-3 mb-[23px] md:mb-4 lg:mb-[23px]"
        >
          <BaseIcon
            :name="completionExpanded ? 'chevron-up' : 'chevron-down'"
            size="sm"
            color="neutral"
          />
          <BaseText
            :text="t('pages.course.restrictions.completion.title')"
            font="semibold"
            class="!text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />
        </button>

        <div v-if="completionExpanded" class="pb-4 md:pb-3 lg:pb-4">
          <div class="flex flex-col gap-3 md:gap-2.5 lg:gap-3">
            <!-- None Option -->
            <BaseRadioButton
              v-model="completionCondition"
              value="none"
              :label="t('pages.course.restrictions.completion.none')"
              customInputStyles="w-[16px] h-[16px]"
              wrapperClass="!gap-[12px]"
              labelClass="!text-neutral-500 !text-[14px] !font-medium"
              labelActiveClass="!text-black/85 !text-[14px] !font-medium"
            />

            <!-- Manual Option -->
            <BaseRadioButton
              v-model="completionCondition"
              value="manual"
              :label="t('pages.course.restrictions.completion.manual')"
              customInputStyles="w-[16px] h-[16px]"
              wrapperClass="!gap-[12px]"
              labelClass="!text-neutral-500 !text-[14px] !font-medium"
              labelActiveClass="!text-black/85 !text-[14px] !font-medium"
            />

            <!-- Add Requirements Option -->
            <BaseRadioButton
              v-model="completionCondition"
              value="addRequirements"
              :label="t('pages.course.restrictions.completion.addRequirements')"
              customInputStyles="w-[16px] h-[16px]"
              wrapperClass="!gap-[12px]"
              labelClass="!text-neutral-500 !text-[14px] !font-medium"
              labelActiveClass="!text-black/85 !text-[14px] !font-medium"
            />
          </div>
        </div>
      </div>

      <!-- Set reminder in Timeline Section -->
      <div class="">
        <div>
          <BaseText
            :text="t('pages.course.restrictions.reminder.title')"
            font="semibold"
            class="mb-4 md:mb-3 lg:mb-4 !text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />

          <SetRecurrence v-model="recurrenceData" />
        </div>
      </div>
    </div>

    <!-- Restriction Modal Component -->
    <RestrictionModal
      :show="showRestrictionModal"
      v-if="showRestrictionModal"
      :left-items="leftItems"
      :existing-restrictions="accessRestrictions"
      :editing-restrictions="editingRestrictions"
      :editing-type="editingRestrictionType"
      @close="closeRestrictionModal"
      @save="handleSaveRestriction"
    />
  </div>
</template>
