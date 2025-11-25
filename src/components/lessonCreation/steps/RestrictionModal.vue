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
const activityCompletion = ref(false)
const gradeType = ref('percentage')
const gradeMinEnabled = ref(false)
const gradeMaxEnabled = ref(false)
const gradeMinValue = ref('')
const gradeMaxValue = ref('')
const dateValue = ref('')
const userProfileField = ref('')
const relativeDateValue = ref('')
const cohortValue = ref<string | number>('')

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
  emit('close')
  // Reset form data
  selectedLanguage.value = ''
  languageRestrictions.value = []
  modalType.value = 'restrictions'
  activityCompletion.value = false
  gradeType.value = 'percentage'
  gradeMinEnabled.value = false
  gradeMaxEnabled.value = false
  gradeMinValue.value = ''
  gradeMaxValue.value = ''
  dateValue.value = ''
  userProfileField.value = ''
  relativeDateValue.value = ''
  cohortValue.value = '' as string | number
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
      emit('save', { type: RestrictionType.ACTIVITY, value: activityCompletion.value })
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
      emit('save', { type: RestrictionType.RESTRICTION_SET, value: '' })
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

// Watch for modal opening to load existing restrictions
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen && modalType.value === 'restrictions') {
      // Clear any previous data
      languageRestrictions.value = []

      // Load existing language restrictions
      const existingLanguageRestrictions = props.existingRestrictions.filter(
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
            isExpanded: false,
          })
        })
      }
    }
  },
)

// Watch for selecting language type to load existing data
watch(
  () => modalType.value,
  (newType) => {
    if (newType === 'language' && languageRestrictions.value.length === 0) {
      // Load existing language restrictions when entering language mode
      const existingLanguageRestrictions = props.existingRestrictions.filter(
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
            isExpanded: true,
          })
        })
      }
    } else if (newType === 'activity') {
      // Load existing activity restriction
      const existingActivity = props.existingRestrictions.find(
        (r) => r.type === RestrictionType.ACTIVITY,
      )
      if (existingActivity) {
        activityCompletion.value = Boolean(existingActivity.value)
      }
    } else if (newType === 'grade') {
      // Load existing grade restriction
      const existingGrade = props.existingRestrictions.find((r) => r.type === RestrictionType.GRADE)
      if (existingGrade) {
        gradeType.value = String(existingGrade.value)
      }
    } else if (newType === 'date') {
      // Load existing date restriction
      const existingDate = props.existingRestrictions.find((r) => r.type === RestrictionType.DATE)
      if (existingDate) {
        dateValue.value = String(existingDate.value)
      }
    } else if (newType === 'userProfile') {
      // Load existing user profile restriction
      const existingUserProfile = props.existingRestrictions.find(
        (r) => r.type === RestrictionType.USER_PROFILE,
      )
      if (existingUserProfile) {
        userProfileField.value = String(existingUserProfile.value)
      }
    } else if (newType === 'cohort') {
      // Load existing cohort restriction
      const existingCohort = props.existingRestrictions.find(
        (r) => r.type === RestrictionType.COHORT,
      )
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
        <div class="w-6 h-6 mt-0.5 text-neutral-600">
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
            text="Add restriction"
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
                text="No items available to restrict"
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
      <BaseText
        :text="t('pages.course.restrictions.addModal.activity.desc')"
        :tone="500"
        color="neutral"
        font="regular"
        type="p-sm"
        class="mb-6"
      />

      <div class="mb-6">
        <div class="flex items-start gap-3 mb-2">
          <BaseToggle v-model="activityCompletion" />
          <BaseText
            text="Previous content must be marked as completed"
            :tone="700"
            color="neutral"
            font="medium"
            type="p-sm"
            class="leading-4 !text-black/85"
          />
        </div>
        <BaseText
          text="This content is only visible to those who have marked the previous section as completed."
          :tone="400"
          color="neutral"
          font="medium"
          type="p-xs"
          class="ml-[44px] !text-black/50"
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
          text="Select Grade"
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
            text="Must be >"
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
            text="Must be <"
            :tone="700"
            color="neutral"
            font="medium"
            type="p-sm"
            class="ml-10"
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
          text="Select Date and Time"
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
          text="Select Profile Field"
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
          text="Select Cohort"
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

    <div
      v-if="modalType !== 'restrictions'"
      class="lg:px-6 px-4 border-t pt-5 sm:pb-0 pb-[15px] border-grey-150"
    >
      <!-- <div class="flex justify-end gap-3 p-4">
        <BaseButton text="Cancel" color="primary" variant="link" size="sm" @on-click="closeModal" />
        <BaseButton
          text="Save"
          color="primary"
          variant="default"
          size="sm"
          @on-click="saveRestriction"
        />
      </div> -->
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
          text="Save"
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
