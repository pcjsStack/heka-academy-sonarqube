<script setup lang="ts">
import { computed, watch, withDefaults } from 'vue'
import {
  BaseInput,
  BaseText,
  BaseSelect,
  BaseButton,
  BaseIcon,
  BaseTooltipIcon,
} from '@/components/common'
import { t } from '@/utils/i18n'
import type { SkillsFormData, SkillsFormValidation, AssociationOption } from '@/types/BadgeAndSkill'

const props = withDefaults(
  defineProps<{
    modelValue: SkillsFormData
    associationOptions: {
      file: AssociationOption[]
      course: AssociationOption[]
      lessons: AssociationOption[]
      quiz: AssociationOption[]
    }
    isEditMode?: boolean
  }>(),
  {
    isEditMode: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: SkillsFormData]
  'validation-change': [validation: SkillsFormValidation]
  'scroll-bottom': [type: 'file' | 'course' | 'lessons' | 'quiz']
  search: [type: 'file' | 'course' | 'lessons' | 'quiz', query: string]
}>()

const skillsData = computed({
  get: () => props.modelValue,
  set: (value: SkillsFormData) => emit('update:modelValue', value),
})

// Validation computed properties
const validation = computed((): SkillsFormValidation => {
  const validSkills = skillsData.value.names.filter((skill) => skill.trim() !== '')
  const hasValidSkills = validSkills.length > 0

  // Check if at least one association is selected
  const hasAssociation =
    skillsData.value.associations.fileIds.length > 0 ||
    skillsData.value.associations.courseIds.length > 0 ||
    skillsData.value.associations.lessonIds.length > 0 ||
    skillsData.value.associations.quizIds.length > 0

  // If skill name is entered, association is required
  // If association is selected, skill name is required
  const isAssociationValid = !hasValidSkills || hasAssociation
  const isSkillNameValid = !hasAssociation || hasValidSkills

  // Form is valid if:
  // - No skill name and no association (skip skill creation)
  // - OR both skill name and association are present
  const isFormValid = (!hasValidSkills && !hasAssociation) || (hasValidSkills && hasAssociation)

  return {
    hasValidSkills: isSkillNameValid,
    isAssociationValid,
    isFormValid,
  }
})

// Watch for validation changes
watch(
  validation,
  (newValidation) => {
    emit('validation-change', newValidation)
  },
  { deep: true, immediate: true },
)

const handleSkillChange = (index: number, value: string) => {
  const newSkills = [...skillsData.value.names]
  newSkills[index] = value
  skillsData.value = {
    ...skillsData.value,
    names: newSkills,
  }
}

const handleAddMoreSkills = () => {
  skillsData.value = {
    ...skillsData.value,
    names: [...skillsData.value.names, ''],
  }
}

const handleRemoveSkill = (index: number) => {
  if (skillsData.value.names.length > 1) {
    const newSkills = skillsData.value.names.filter((_, i) => i !== index)
    skillsData.value = {
      ...skillsData.value,
      names: newSkills,
    }
  }
}

const handleAssociationChange = (
  type: 'file' | 'course' | 'lessons' | 'quiz',
  values: string[],
) => {
  const mapping = {
    file: 'fileIds',
    course: 'courseIds',
    lessons: 'lessonIds',
    quiz: 'quizIds',
  } as const

  skillsData.value = {
    ...skillsData.value,
    associations: {
      ...skillsData.value.associations,
      [mapping[type]]: values,
    },
  }
}

const getAssociationOptions = (type: 'file' | 'course' | 'lessons' | 'quiz') => {
  const mapping = {
    file: 'file',
    course: 'course',
    lessons: 'lessons',
    quiz: 'quiz',
  } as const

  return props.associationOptions[mapping[type]]
}

const handleScrollBottom = (type: 'file' | 'course' | 'lessons' | 'quiz') => {
  emit('scroll-bottom', type)
}

const handleSearch = (type: 'file' | 'course' | 'lessons' | 'quiz', query: string) => {
  emit('search', type, query)
}
</script>

<template>
  <div>
    <BaseText
      :text="t('pages.badgeSkills.skills.title')"
      font="semibold"
      class="!text-[18px] !text-black/85 !leading-[18px] !tracking-[-0.02em] mb-6"
    />

    <!-- Skills Input -->
    <div class="items-start justify-start">
      <div class="space-y-2">
        <BaseInput
          :model-value="skillsData.names[0] || ''"
          :label="t('pages.badgeSkills.skills.input')"
          :placeholder="t('pages.badgeSkills.skills.inputPlaceholder')"
          type="text"
          :error="
            !validation.hasValidSkills &&
            (skillsData.names.length > 0 ||
              skillsData.associations.fileIds.length > 0 ||
              skillsData.associations.courseIds.length > 0 ||
              skillsData.associations.lessonIds.length > 0 ||
              skillsData.associations.quizIds.length > 0)
          "
          :error-message="t('pages.badgeSkills.skills.nameRequired')"
          @update:model-value="(value) => handleSkillChange(0, value)"
        />
      </div>

      <!-- Additional Skills (only show in create mode, not edit mode) -->
      <template v-if="!isEditMode">
        <div
          v-for="(skill, index) in skillsData.names.slice(1)"
          :key="index"
          class="flex items-center space-x-2"
        >
          <BaseInput
            :model-value="skill"
            :placeholder="t('pages.badgeSkills.skills.inputPlaceholder')"
            type="text"
            class="flex-1 mt-1"
            @update:model-value="(value) => handleSkillChange(index + 1, value)"
          />
          <div class="cursor-pointer mt-1" @click="handleRemoveSkill(index + 1)">
            <BaseIcon name="clear" color="error" size="xs" />
          </div>
        </div>

        <BaseButton
          left-icon="add"
          :text="t('pages.badgeSkills.skills.addMore')"
          color="primary"
          variant="link"
          size="sm"
          @on-click="handleAddMoreSkills"
          class="!text-[14px] !font-medium !leading-[17px] mt-2 !justify-start"
        />
      </template>
    </div>

    <!-- Skills Association -->
    <div class="mt-8">
      <div class="flex items-center gap-1 mb-3">
        <BaseText
          :text="t('pages.badgeSkills.skills.associateWith')"
          color="neutral"
          class="!text-[14px] !leading-[17px] !text-black/85 !font-medium"
        />
        <BaseTooltipIcon
          :text="t('pages.badgeSkills.skills.associationRequired')"
          class="!m-[-6px]"
          placement="top"
        />
      </div>

      <!-- Error message for association validation -->
      <div
        v-if="!validation.isAssociationValid && skillsData.names.some((name) => name.trim() !== '')"
        class="mb-3"
      >
        <BaseText
          :text="t('pages.badgeSkills.skills.associationRequired')"
          color="error"
          :tone="600"
          size="sm"
          class="underline"
        />
      </div>

      <div class="space-y-4">
        <div
          v-for="associationType in ['file', 'course', 'lessons', 'quiz'] as const"
          :key="associationType"
          class="flex items-center justify-between gap-2"
        >
          <BaseText
            :text="t(`pages.badgeSkills.associations.${associationType}`)"
            color="neutral"
            class="!text-[14px] !leading-[17px] !text-black/85 !font-medium flex-shrink-0"
          />
          <BaseSelect
            :model-value="
              skillsData.associations[
                associationType === 'file'
                  ? 'fileIds'
                  : associationType === 'course'
                    ? 'courseIds'
                    : associationType === 'lessons'
                      ? 'lessonIds'
                      : 'quizIds'
              ]
            "
            :options="getAssociationOptions(associationType)"
            :placeholder="t('pages.badgeSkills.associations.select')"
            multiple
            searchable
            size="md"
            class="!w-[380px] flex-shrink-0"
            @update:model-value="(values) => handleAssociationChange(associationType, values)"
            @scroll-bottom="() => handleScrollBottom(associationType)"
            @on-search="(query) => handleSearch(associationType, query)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
