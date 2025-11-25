<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import moment from 'moment'
import {
  BaseText,
  BaseSelect,
  BaseIcon,
  BaseDatepicker,
  BaseButton,
  BaseSideModal,
  BaseCheckbox,
  BaseToggle,
  BaseInput,
} from '@/components/common'
import { useCohortStore } from '@/stores/Cohort'
import { useLanguageStore } from '@/stores/Language'
import { t } from '@/utils/i18n'
import { getRestrictionOptions } from '@/utils/courseRestrictionsUtils'
import type { Restriction, AssociationItem } from '@/types/Course'
import { RestrictionType } from '@/types/Course'

const cohortStore = useCohortStore()
const languageStore = useLanguageStore()

// Association item type - flexible to accept different structures

// Language restriction structure
type LanguageRestriction = {
  id: string
  language: string
  languageLabel: string
  selectedIndices: number[] // Store item indices instead of IDs
  isExpanded: boolean
}

// Props
interface Props {
  show: boolean
  leftItems: AssociationItem[]
  existingRestrictions: Restriction[]
  editingRestrictions?: Restriction[]
  editingType?: Restriction['type'] | null
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  leftItems: () => [],
  existingRestrictions: () => [],
  editingRestrictions: () => [],
  editingType: null,
})

// Emits
const emit = defineEmits<{
  close: []
  save: [restriction: Restriction | Restriction[]]
}>()

// Modal state
const modalType = ref<
  | Restriction['type']
  | 'restrictions'
  | 'language'
  | 'activity'
  | 'grade'
  | 'date'
  | 'userProfile'
  | 'restrictionSet'
  | 'cohort'
>('restrictions')

// Form data for different restriction types
const selectedLanguage = ref('')
const languageRestrictions = ref<LanguageRestriction[]>([])
const selectedRequiredActivity = ref('')
const markAsPrerequisite = ref(false)
const gradeType = ref('percentage')
const gradeMinEnabled = ref(false)
const gradeMaxEnabled = ref(false)
const gradeMinValue = ref('')
const gradeMaxValue = ref('')
const dateValue = ref('')
const userProfileField = ref('')
const relativeDateValue = ref('')
const cohortValue = ref<string | number>('')

// Restriction Set data
const restrictionSetLogicType = ref<'AND' | 'OR'>('AND')
const restrictionSetConditions = ref<
  Array<{
    id: string
    type: string
    label: string
  }>
>([])
const selectedConditionType = ref('')

// Options
const restrictionOptions = getRestrictionOptions()

const gradeTypeOptions = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'points', label: 'Points' },
  { value: 'letter', label: 'Letter Grade' },
]

const userProfileOptions = [
  { value: 'department', label: 'Department' },
  { value: 'role', label: 'Role' },
  { value: 'experience', label: 'Experience Level' },
]

// Logic type options for restriction set
const logicTypeOptions = computed(() => [
  {
    value: 'AND',
    label: t('pages.course.restrictions.addModal.restrictionSet.logicTypeAnd'),
  },
  {
    value: 'OR',
    label: t('pages.course.restrictions.addModal.restrictionSet.logicTypeOr'),
  },
])

// Available restriction types for restriction set conditions
const restrictionTypeOptions = computed(() => [
  {
    value: 'cohort',
    label: t('pages.course.restrictions.addModal.restrictionSet.conditionCohort'),
  },
  {
    value: 'grade',
    label: t('pages.course.restrictions.addModal.restrictionSet.conditionGrade'),
  },
  {
    value: 'activity',
    label: t('pages.course.restrictions.addModal.restrictionSet.conditionActivity'),
  },
])

// Available activities for activity completion restriction
const availableActivities = computed(() => {
  // Transform leftItems into select options
  return props.leftItems.map((item) => ({
    value: item.id,
    label: `${item.type || 'Activity'} - ${item.title || 'Untitled'}`,
  }))
})

// Computed properties
const modalTitle = computed(() => {
  switch (modalType.value) {
    case 'restrictions':
      return t('pages.course.restrictions.access.addRestriction')
    case 'language':
      return t('pages.course.restrictions.language.title')
    case 'activity':
      return t('pages.course.restrictions.addModal.activity.title')
    case 'grade':
      return t('pages.course.restrictions.addModal.grade.title')
    case 'date':
      return t('pages.course.restrictions.addModal.date.title')
    case 'userProfile':
      return t('pages.course.restrictions.addModal.userProfile.title')
    case 'restrictionSet':
      return t('pages.course.restrictions.addModal.restrictionSet.title')
    case 'cohort':
      return t('pages.course.restrictions.addModal.cohort.title')
    default:
      return ''
  }
})

const showBackButton = computed(() => modalType.value !== 'restrictions')

// Methods
const handleSelectRestriction = (value: string) => {
  modalType.value = value as
    | 'restrictions'
    | 'language'
    | 'activity'
    | 'grade'
    | 'date'
    | 'userProfile'
    | 'restrictionSet'
    | 'cohort'
}

const goBackToRestrictions = () => {
  modalType.value = 'restrictions'
}

const closeModal = () => {
  // Reset form data
  selectedLanguage.value = ''
  languageRestrictions.value = []
  modalType.value = 'restrictions'
  selectedRequiredActivity.value = ''
  markAsPrerequisite.value = false
  gradeType.value = 'percentage'
  gradeMinEnabled.value = false
  gradeMaxEnabled.value = false
  gradeMinValue.value = ''
  gradeMaxValue.value = ''
  dateValue.value = ''
  userProfileField.value = ''
  relativeDateValue.value = ''
  cohortValue.value = '' as string | number
  // Reset restriction set data
  restrictionSetLogicType.value = 'AND'
  restrictionSetConditions.value = []
  selectedConditionType.value = ''
  emit('close')
}

const saveRestriction = () => {
  switch (modalType.value) {
    case 'language':
      // Create an array of restriction objects for each selected item in each language
      const languageRestrictionsArray = languageRestrictions.value.flatMap((lr) =>
        lr.selectedIndices.map((index) => ({
          type: RestrictionType.LANGUAGE,
          value: lr.language,
          assignationIndex: index,
        })),
      )

      // Emit the array of all language restrictions
      if (languageRestrictionsArray.length > 0) {
        emit('save', languageRestrictionsArray)
      }
      break
    case 'activity':
      if (selectedRequiredActivity.value) {
        // Store both values as a JSON string
        const activityData = {
          activityId: selectedRequiredActivity.value,
          isPrerequisite: markAsPrerequisite.value,
        }
        emit('save', {
          type: RestrictionType.ACTIVITY,
          value: JSON.stringify(activityData),
        })
      }
      break
    case 'grade':
      emit('save', { type: RestrictionType.GRADE, value: gradeType.value })
      break
    case 'date':
      if (dateValue.value) {
        emit('save', {
          type: RestrictionType.DATE,
          value: moment(dateValue.value).format('YYYY-MM-DD'),
        })
      }
      break
    case 'userProfile':
      if (userProfileField.value) {
        emit('save', { type: RestrictionType.USER_PROFILE, value: userProfileField.value })
      }
      break
    case 'restrictionSet':
      if (restrictionSetConditions.value.length > 0) {
        // Store only condition types (actual restriction values stored separately)
        const restrictionSetData = {
          logicType: restrictionSetLogicType.value,
          conditions: restrictionSetConditions.value.map((c) => c.type),
        }
        emit('save', {
          type: RestrictionType.RESTRICTION_SET,
          value: JSON.stringify(restrictionSetData),
        })
      }
      break
    case 'cohort':
      if (cohortValue.value) {
        emit('save', { type: RestrictionType.COHORT, value: cohortValue.value })
      }
      break
    default:
      emit('save', { type: RestrictionType.RESTRICTION_SET, value: '' })
  }

  closeModal()
}
const addLanguage = () => {
  if (!selectedLanguage.value) return

  // Check if language already exists
  const exists = languageRestrictions.value.some((lr) => lr.language === selectedLanguage.value)
  if (exists) return

  // Get language label
  const languageOption = languageStore.getLanguageOptions.find(
    (opt) => opt.value === selectedLanguage.value,
  )

  const newRestriction: LanguageRestriction = {
    id: `lang_${Date.now()}`,
    language: selectedLanguage.value,
    languageLabel: languageOption?.label || selectedLanguage.value,
    selectedIndices: [],
    isExpanded: true,
  }

  languageRestrictions.value.push(newRestriction)
  selectedLanguage.value = ''
}

const toggleLanguageExpansion = (restrictionId: string) => {
  const restriction = languageRestrictions.value.find((lr) => lr.id === restrictionId)
  if (restriction) {
    restriction.isExpanded = !restriction.isExpanded
  }
}

const deleteLanguageRestriction = (restrictionId: string) => {
  languageRestrictions.value = languageRestrictions.value.filter((lr) => lr.id !== restrictionId)
}

const toggleItemSelection = (restrictionId: string, itemIndex: number) => {
  const restriction = languageRestrictions.value.find((lr) => lr.id === restrictionId)
  if (!restriction) {
    return
  }

  // Check if this itemIndex is already in the selectedIndices array
  const indexInArray = restriction.selectedIndices.indexOf(itemIndex)
  if (indexInArray > -1) {
    // Remove it
    restriction.selectedIndices.splice(indexInArray, 1)
  } else {
    // Add it
    restriction.selectedIndices.push(itemIndex)
  }
}

const isItemSelected = (restrictionId: string, itemIndex: number): boolean => {
  const restriction = languageRestrictions.value.find((lr) => lr.id === restrictionId)
  const isSelected = restriction ? restriction.selectedIndices.includes(itemIndex) : false

  return isSelected
}

const handleScrollCohort = () => {
  cohortStore.loadMoreCohorts({ perPage: 10, order: 'desc', orderColumn: 'id', search: '' })
}

const getItemTypeBadge = (type: string): string => {
  switch (type) {
    case 'course':
      return 'Course'
    case 'lesson':
      return 'Lesson'
    case 'file':
      return 'File'
    case 'quiz':
      return 'Quiz'
    default:
      return type
  }
}

// Restriction Set functions
const addCondition = () => {
  if (!selectedConditionType.value) return

  // Check if this condition type already exists
  const exists = restrictionSetConditions.value.some((c) => c.type === selectedConditionType.value)

  if (exists) {
    // Don't add duplicate
    selectedConditionType.value = ''
    return
  }

  const typeOption = restrictionTypeOptions.value.find(
    (opt) => opt.value === selectedConditionType.value,
  )

  if (typeOption) {
    restrictionSetConditions.value.push({
      id: `condition_${Date.now()}`,
      type: selectedConditionType.value,
      label: typeOption.label,
    })

    // Reset selection
    selectedConditionType.value = ''
  }
}

const removeCondition = (conditionId: string) => {
  restrictionSetConditions.value = restrictionSetConditions.value.filter(
    (c) => c.id !== conditionId,
  )
}

// Helper function to load language restrictions
const loadLanguageRestrictions = (restrictions: Restriction[]) => {
  // Clear first to avoid duplicates
  languageRestrictions.value = []

  const existingLanguageRestrictions = restrictions.filter(
    (r) => r.type === RestrictionType.LANGUAGE,
  )

  if (existingLanguageRestrictions.length > 0) {
    // Group by language
    const languageMap = new Map<string, number[]>()

    existingLanguageRestrictions.forEach((restriction) => {
      const lang = String(restriction.value)
      if (!languageMap.has(lang)) {
        languageMap.set(lang, [])
      }
      if (restriction.assignationIndex !== undefined) {
        languageMap.get(lang)!.push(restriction.assignationIndex)
      }
    })

    // Reconstruct languageRestrictions array
    languageMap.forEach((indices, lang) => {
      const languageOption = languageStore.getLanguageOptions.find((opt) => opt.value === lang)

      languageRestrictions.value.push({
        id: `lang_${Date.now()}_${lang}`,
        language: lang,
        languageLabel: languageOption?.label || lang,
        selectedIndices: indices,
        isExpanded: true, // Expand when editing
      })
    })
  }
}

// Watch for modal opening to load existing restrictions
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      // Always clear languageRestrictions first to avoid duplicates
      languageRestrictions.value = []

      // If editing a specific restriction type, set modalType directly
      if (props.editingType) {
        modalType.value = props.editingType

        // Load data for the specific restriction type being edited
        const restrictionsToLoad = props.editingRestrictions

        if (props.editingType === RestrictionType.LANGUAGE) {
          // Load language restrictions using helper
          loadLanguageRestrictions(restrictionsToLoad)
        } else {
          // Load other restriction types
          const editingRestriction = restrictionsToLoad[0]

          if (editingRestriction) {
            if (props.editingType === RestrictionType.ACTIVITY) {
              try {
                const activityData = JSON.parse(String(editingRestriction.value))
                selectedRequiredActivity.value = activityData.activityId || ''
                markAsPrerequisite.value = activityData.isPrerequisite || false
              } catch {
                selectedRequiredActivity.value = ''
                markAsPrerequisite.value = Boolean(editingRestriction.value)
              }
            } else if (props.editingType === RestrictionType.GRADE) {
              gradeType.value = String(editingRestriction.value)
            } else if (props.editingType === RestrictionType.DATE) {
              dateValue.value = String(editingRestriction.value)
            } else if (props.editingType === RestrictionType.USER_PROFILE) {
              userProfileField.value = String(editingRestriction.value)
            } else if (props.editingType === RestrictionType.COHORT) {
              cohortValue.value =
                typeof editingRestriction.value === 'number'
                  ? editingRestriction.value
                  : Number(editingRestriction.value)
            }
          }
        }
      } else {
        // Opening for adding new restriction
        modalType.value = 'restrictions'

        // Check if there's an existing Restriction Set
        const existingSet = props.existingRestrictions.find(
          (r) => r.type === RestrictionType.RESTRICTION_SET,
        )

        if (existingSet) {
          modalType.value = 'restrictionSet'

          // Load the set data
          try {
            const setData = JSON.parse(String(existingSet.value))
            restrictionSetLogicType.value = setData.logicType || 'AND'

            // Reconstruct conditions
            restrictionSetConditions.value = (setData.conditions || []).map(
              (type: string, index: number) => {
                const typeOption = restrictionTypeOptions.value.find((opt) => opt.value === type)
                return {
                  id: `condition_${Date.now()}_${index}`,
                  type: type,
                  label: typeOption?.label || type,
                }
              },
            )
          } catch {
            restrictionSetLogicType.value = 'AND'
            restrictionSetConditions.value = []
          }
        }
      }
    }
  },
)

// Watch for selecting language type to load existing data
// This watcher only handles navigation from restrictions screen to specific type (not editing)
watch(
  () => modalType.value,
  (newType) => {
    // Skip if we're in editing mode - data already loaded in show watcher
    if (props.editingType) return

    // Use existing restrictions when navigating from main screen
    const restrictionsSource = props.existingRestrictions

    if (newType === 'language') {
      // Load existing language restrictions when navigating from main restrictions screen
      const existingLanguageRestrictions = restrictionsSource.filter(
        (r) => r.type === RestrictionType.LANGUAGE,
      )

      if (existingLanguageRestrictions.length > 0 && languageRestrictions.value.length === 0) {
        loadLanguageRestrictions(restrictionsSource)
      }
    } else if (newType === 'activity') {
      // Load existing activity restriction
      const existingActivity = restrictionsSource.find((r) => r.type === RestrictionType.ACTIVITY)
      if (existingActivity) {
        try {
          // Try to parse as JSON (new format)
          const activityData = JSON.parse(String(existingActivity.value))
          selectedRequiredActivity.value = activityData.activityId || ''
          markAsPrerequisite.value = activityData.isPrerequisite || false
        } catch {
          // Fallback for old format (if value is just a boolean)
          selectedRequiredActivity.value = ''
          markAsPrerequisite.value = Boolean(existingActivity.value)
        }
      }
    } else if (newType === 'grade') {
      // Load existing grade restriction
      const existingGrade = restrictionsSource.find((r) => r.type === RestrictionType.GRADE)
      if (existingGrade) {
        gradeType.value = String(existingGrade.value)
      }
    } else if (newType === 'date') {
      // Load existing date restriction
      const existingDate = restrictionsSource.find((r) => r.type === RestrictionType.DATE)
      if (existingDate) {
        dateValue.value = String(existingDate.value)
      }
    } else if (newType === 'userProfile') {
      // Load existing user profile restriction
      const existingUserProfile = restrictionsSource.find(
        (r) => r.type === RestrictionType.USER_PROFILE,
      )
      if (existingUserProfile) {
        userProfileField.value = String(existingUserProfile.value)
      }
    } else if (newType === 'restrictionSet') {
      const existingSet = restrictionsSource.find((r) => r.type === RestrictionType.RESTRICTION_SET)

      if (existingSet) {
        try {
          const setData = JSON.parse(String(existingSet.value))
          restrictionSetLogicType.value = setData.logicType || 'AND'

          // Reconstruct conditions with labels
          restrictionSetConditions.value = (setData.conditions || []).map(
            (type: string, index: number) => {
              const typeOption = restrictionTypeOptions.value.find((opt) => opt.value === type)
              return {
                id: index + 1,
                type: type,
                label: typeOption?.label || type,
              }
            },
          )
        } catch {
          // Fallback for invalid data
          restrictionSetLogicType.value = 'AND'
          restrictionSetConditions.value = []
        }
      } else {
        if (restrictionsSource.length > 0) {
          // Pre-populate with existing restrictions
          restrictionSetLogicType.value = 'AND'

          restrictionSetConditions.value = restrictionsSource.map((r, index) => {
            const typeOption = restrictionTypeOptions.value.find((opt) => opt.value === r.type)
            return {
              id: `condition_${Date.now()}_${index}`,
              type: r.type,
              label: typeOption?.label || r.type,
            }
          })
        } else {
          // Fresh start - empty set
          restrictionSetLogicType.value = 'AND'
          restrictionSetConditions.value = []
        }
      }
    } else if (newType === 'cohort') {
      // Load existing cohort restriction
      const existingCohort = restrictionsSource.find((r) => r.type === RestrictionType.COHORT)
      if (existingCohort) {
        // Ensure cohorts are loaded first, then set the value
        const setCohortValue = async () => {
          // If cohorts aren't loaded yet, load them
          if (cohortStore.cohorts.length === 0) {
            await cohortStore.fetchCohorts({ page: 0 })
          }
          // Set the cohort value (keep as number if it's a number, as that's what the select expects)
          const valueToSet =
            typeof existingCohort.value === 'number'
              ? existingCohort.value
              : Number(existingCohort.value)
          cohortValue.value = valueToSet
        }
        setCohortValue()
      }
    }
  },
)

// Watch for editingRestrictions changes (in case computed property updates after modal opens)
watch(
  () => props.editingRestrictions,
  (newRestrictions) => {
    // Only reload if modal is open and we're editing
    if (
      props.show &&
      props.editingType === RestrictionType.LANGUAGE &&
      newRestrictions.length > 0
    ) {
      loadLanguageRestrictions(newRestrictions)
    }
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <BaseSideModal
    v-if="show"
    :title="modalTitle"
    size="md"
    :close-button="true"
    :prev-button="showBackButton"
    :z-index="99999999"
    custom-class="left-0 right-0"
    @onClose="closeModal"
    @onBackgroundClick="closeModal"
    @onClickPrev="goBackToRestrictions"
  >
    <!-- Restriction Options List -->
    <div
      v-if="modalType === 'restrictions'"
      class="divide-y divide-gray-100 sm:h-[calc(100vh-140px)]"
    >
      <div
        v-for="opt in restrictionOptions"
        :key="opt.value"
        class="w-full flex items-start gap-3 px-6 py-3 hover:bg-gray-50 text-left cursor-pointer"
        @click="handleSelectRestriction(opt.value)"
      >
        <div class="w-6 h-6 mt-0.5 text-neutral-500">
          <BaseIcon :name="opt.icon" size="sm" />
        </div>
        <div class="flex-1">
          <BaseText
            :text="t(opt.titleKey)"
            color="black"
            type="p-sm"
            class="text-black/85 !font-medium"
          />
          <BaseText :text="t(opt.descKey)" :tone="500" color="neutral" font="regular" type="p-xs" />
        </div>
      </div>
    </div>

    <!-- Language Selection -->
    <div v-if="modalType === 'language'" class="p-6 sm:h-[calc(100vh-140px)] overflow-y-auto">
      <div class="mb-6">
        <div class="flex items-center gap-2 justify-between mb-6">
          <BaseSelect
            v-model="selectedLanguage"
            :options="languageStore.getLanguageOptions"
            :placeholder="t('pages.course.restrictions.language.selectLanguage')"
          />
          <BaseButton
            :text="t('pages.course.restrictions.language.addRestriction')"
            color="primary"
            variant="default"
            size="md"
            class="!w-[195px]"
            font="bold"
            :disabled="!selectedLanguage"
            @onClick="addLanguage"
          />
        </div>
      </div>

      <!-- Language Restrictions List -->
      <div class="space-y-4">
        <div
          v-for="restriction in languageRestrictions"
          :key="restriction.id"
          class="border border-gray-200 rounded-lg"
        >
          <!-- Language Header -->
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
            <button
              @click="toggleLanguageExpansion(restriction.id)"
              class="flex items-center gap-2 flex-1"
            >
              <BaseIcon
                :name="restriction.isExpanded ? 'chevron-up' : 'chevron-down'"
                size="sm"
                color="neutral"
              />
              <BaseText
                :text="restriction.languageLabel"
                :tone="800"
                color="neutral"
                font="semibold"
                type="p-sm"
              />
            </button>
            <button
              @click="deleteLanguageRestriction(restriction.id)"
              class="text-red-500 hover:text-red-700"
            >
              <BaseIcon name="delete-1" size="sm" />
            </button>
          </div>

          <!-- Language Items List -->
          <div v-if="restriction.isExpanded" class="p-4 space-y-3">
            <div
              v-for="(item, index) in leftItems"
              :key="index"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <!-- Checkbox -->
              <BaseCheckbox
                :model-value="isItemSelected(restriction.id, index)"
                @update:model-value="toggleItemSelection(restriction.id, index)"
              />

              <!-- Item Icon/Thumbnail -->
              <div v-if="item.thumbUrl" class="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <img
                  :src="item.thumbUrl"
                  :alt="item.title || 'Item'"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                :class="[
                  'w-10 h-10 rounded flex items-center justify-center flex-shrink-0',
                  item.iconBg || 'bg-gray-100',
                ]"
              >
                <BaseIcon
                  :name="item.iconName || 'file-outline'"
                  size="sm"
                  :color="item.iconColor || 'neutral'"
                />
              </div>

              <!-- Item Info -->
              <div class="flex-1 min-w-0">
                <BaseText
                  :text="item.title || `Item ${item.id}`"
                  :tone="800"
                  color="neutral"
                  font="medium"
                  type="p-sm"
                  class="truncate"
                />
                <span
                  class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                >
                  {{ getItemTypeBadge(item.type) }}
                </span>
              </div>

              <!-- Eye Icon - Only show for lesson and course -->
              <button
                v-if="item.type === 'lesson' || item.type === 'course'"
                class="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <BaseIcon name="eye" size="sm" />
              </button>
            </div>

            <!-- No items message -->
            <div v-if="leftItems.length === 0" class="text-center py-8">
              <BaseText
                :text="t('pages.course.restrictions.language.noItemsAvailable')"
                :tone="500"
                color="neutral"
                font="regular"
                type="p-sm"
              />
            </div>
          </div>
        </div>

        <!-- No restrictions message -->
        <div v-if="languageRestrictions.length === 0" class="flex items-center gap-2">
          <BaseIcon name="info-fill" size="xs" class="!text-primary-600" />
          <BaseText
            :text="t('pages.course.restrictions.language.requireLanguage')"
            :tone="600"
            color="primary"
            font="medium"
            type="p-xs"
            class="!leading-[100%] !tracking-[-0.01em]"
          />
        </div>
      </div>
    </div>

    <!-- Activity Completion -->
    <div v-if="modalType === 'activity'" class="p-6 sm:h-[calc(100vh-140px)]">
      <!-- Activity Completion Restriction Title -->
      <BaseText
        :text="t('pages.course.restrictions.addModal.activity.sectionTitle')"
        color="neutral"
        :tone="900"
        font="semibold"
        type="p-lg"
        class="mb-6"
      />

      <!-- Select Required Activity -->
      <div class="mb-6">
        <BaseText
          :text="t('pages.course.restrictions.addModal.activity.selectLabel')"
          color="neutral"
          :tone="700"
          font="semibold"
          type="p-sm"
          class="mb-2"
        />
        <BaseSelect
          v-model="selectedRequiredActivity"
          :options="availableActivities"
          :placeholder="t('pages.course.restrictions.addModal.activity.selectPlaceholder')"
          class="w-full"
        />
      </div>

      <!-- Mark as Prerequisite Toggle -->
      <div class="mb-6">
        <BaseToggle
          v-model="markAsPrerequisite"
          :label="t('pages.course.restrictions.addModal.activity.prerequisiteLabel')"
        />
      </div>
    </div>

    <!-- Grade Restriction -->
    <div v-if="modalType === 'grade'" class="p-6 sm:h-[calc(100vh-140px)]">
      <BaseText
        :text="t('pages.course.restrictions.addModal.grade.desc')"
        :tone="500"
        color="neutral"
        font="regular"
        type="p-sm"
        class="mb-6"
      />

      <div class="mb-6">
        <BaseText
          :text="t('pages.course.restrictions.addModal.grade.selectGradeLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-xs"
          class="mb-3 !leading-[100%] !tracking-[-0.02em]"
        />
        <BaseSelect v-model="gradeType" :options="gradeTypeOptions" placeholder="Percentage" />
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <BaseText
            :text="t('pages.course.restrictions.addModal.grade.mustBeGreaterThan')"
            :tone="700"
            color="neutral"
            font="medium"
            type="p-sm"
            class="ml-10"
          />
          <div class="flex items-center mb-2 gap-2">
            <BaseCheckbox v-model="gradeMinEnabled" />
            <BaseInput v-model="gradeMinValue" type="number" placeholder="60" prefixRightText="%" />
          </div>
        </div>

        <div>
          <BaseText
            :text="t('pages.course.restrictions.addModal.grade.mustBeLessThan')"
            :tone="700"
            color="neutral"
            font="medium"
            type="p-sm"
          />
          <div class="flex items-center mb-2 gap-2">
            <BaseCheckbox v-model="gradeMaxEnabled" />
            <BaseInput
              v-model="gradeMaxValue"
              type="number"
              placeholder="60"
              prefixRightText="%"
              prefixLeftText="-"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Date Restriction -->
    <div v-if="modalType === 'date'" class="p-6 sm:h-[calc(100vh-140px)]">
      <BaseText
        :text="t('pages.course.restrictions.addModal.date.desc')"
        :tone="500"
        color="neutral"
        font="regular"
        type="p-sm"
        class="mb-6"
      />

      <div class="mb-6">
        <BaseText
          :text="t('pages.course.restrictions.addModal.date.selectDateLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-sm"
          class="mb-3"
        />
        <BaseDatepicker
          v-model="dateValue"
          placeholder="Select date"
          :min-date="new Date()"
          format="yyyy-MM-dd"
        />
      </div>
    </div>

    <!-- User Profile Restriction -->
    <div v-if="modalType === 'userProfile'" class="p-6 sm:h-[calc(100vh-140px)]">
      <BaseText
        :text="t('pages.course.restrictions.addModal.userProfile.desc')"
        :tone="500"
        color="neutral"
        font="regular"
        type="p-sm"
        class="mb-6"
      />

      <div class="mb-6">
        <BaseText
          :text="t('pages.course.restrictions.addModal.userProfile.selectFieldLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-sm"
          class="mb-3"
        />
        <BaseSelect
          v-model="userProfileField"
          :options="userProfileOptions"
          placeholder="Select field"
        />
      </div>
    </div>

    <!-- Cohort Restriction -->
    <div v-if="modalType === 'cohort'" class="p-6 sm:h-[calc(100vh-140px)]">
      <BaseText
        :text="t('pages.course.restrictions.addModal.cohort.desc')"
        :tone="500"
        color="neutral"
        font="regular"
        type="p-sm"
        class="mb-6"
      />

      <div class="mb-6">
        <BaseText
          :text="t('pages.course.restrictions.addModal.cohort.selectCohortLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-sm"
          class="mb-3"
        />
        <BaseSelect
          v-model="cohortValue"
          :options="cohortStore.getCohortsList"
          :placeholder="t('pages.course.restrictions.addModal.cohort.placeholder')"
          @scroll-bottom="handleScrollCohort"
        />
      </div>
    </div>

    <!-- Restriction Set -->
    <div v-if="modalType === 'restrictionSet'" class="p-6 sm:h-[calc(100vh-140px)] overflow-y-auto">
      <!-- Logic Type Selection -->
      <div class="mb-6 border border-gray-200 rounded-lg p-4">
        <BaseText
          :text="t('pages.course.restrictions.addModal.restrictionSet.logicTypeLabel')"
          color="neutral"
          :tone="700"
          font="semibold"
          type="p-md"
          class="mb-2"
        />
        <BaseSelect
          v-model="restrictionSetLogicType"
          :options="logicTypeOptions"
          :placeholder="t('pages.course.restrictions.addModal.restrictionSet.logicTypePlaceholder')"
          class="w-full"
        />
      </div>

      <!-- Add Conditions Section -->
      <div class="mb-6 border border-gray-200 rounded-lg p-4">
        <BaseText
          :text="t('pages.course.restrictions.addModal.restrictionSet.addConditionsTitle')"
          color="neutral"
          :tone="700"
          font="semibold"
          type="p-md"
          class="mb-3"
        />

        <div class="items-center gap-2 mb-4">
          <BaseSelect
            v-model="selectedConditionType"
            :options="restrictionTypeOptions"
            :placeholder="
              t('pages.course.restrictions.addModal.restrictionSet.selectRestrictionType')
            "
            class="flex-1"
          />
          <BaseButton
            :text="t('pages.course.restrictions.addModal.restrictionSet.addConditionButton')"
            color="primary"
            variant="default"
            size="md"
            class="!font-medium mt-3 flex-start !w-auto"
            @onClick="addCondition"
          />
        </div>

        <!-- Conditions List -->
        <div v-if="restrictionSetConditions.length > 0" class="space-y-2">
          <div
            v-for="condition in restrictionSetConditions"
            :key="condition.id"
            class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <BaseText
                :text="condition.label"
                :tone="800"
                color="neutral"
                font="medium"
                type="p-sm"
              />
            </div>
            <button
              @click="removeCondition(condition.id)"
              class="text-red-500 hover:text-red-700 transition-colors"
            >
              <BaseIcon name="delete-1" size="sm" />
            </button>
          </div>
        </div>

        <!-- No conditions message -->
        <div v-else class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <BaseText
            :text="t('pages.course.restrictions.addModal.restrictionSet.noConditions')"
            :tone="500"
            color="neutral"
            font="regular"
            type="p-sm"
          />
        </div>
      </div>
    </div>

    <div class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150">
      <div class="flex justify-end gap-2">
        <BaseButton
          :fullSize="false"
          :text="t('pages.badgeSkills.buttons.cancel')"
          color="primary"
          size="sm"
          variant="link"
          class="max-w-[95px] !font-medium"
          @on-click="closeModal"
        />
        <BaseButton
          :fullSize="false"
          :text="t('pages.course.restrictions.buttons.save')"
          color="primary"
          size="sm"
          variant="default"
          class="max-w-[81px] !font-medium"
          @on-click="saveRestriction"
        />
      </div>
    </div>
  </BaseSideModal>
</template>
