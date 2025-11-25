<template>
  <div>
    <!-- Report Type -->
    <div class="mb-6">
      <BaseSelect
        :model-value="modelValue.reportType"
        @update:model-value="updateFilter('reportType', $event)"
        :label="t('pages.reportBuilder.filters.reportType.label')"
        :placeholder="t('pages.reportBuilder.filters.reportType.placeholder')"
        :options="reportTypeOptions"
        option-label="label"
        option-value="value"
      />
    </div>

    <!-- Divider -->
    <div class="border-t border-grey-150 my-6"></div>

    <!-- Filters Section Title -->
    <BaseText
      :text="t('pages.reportBuilder.sidebar.filters')"
      class="!text-[16px] !leading-[24px] !text-black/85 !font-semibold mb-6"
    />

    <!-- Course -->
    <div class="mb-6">
      <BaseSelect
        :model-value="modelValue.course"
        @update:model-value="updateFilter('course', $event)"
        :label="t('pages.reportBuilder.filters.course.label')"
        :placeholder="t('pages.reportBuilder.filters.course.placeholder')"
        :options="courseOptions"
        option-label="label"
        option-value="value"
      />
    </div>

    <!-- Lesson / Quiz -->
    <div class="mb-6">
      <BaseSelect
        :model-value="modelValue.lessonQuiz"
        @update:model-value="updateFilter('lessonQuiz', $event)"
        :label="t('pages.reportBuilder.filters.lessonQuiz.label')"
        :placeholder="t('pages.reportBuilder.filters.lessonQuiz.placeholder')"
        :options="lessonQuizOptions"
        option-label="label"
        option-value="value"
      />
    </div>

    <!-- Date Range -->
    <div class="mb-6">
      <BaseDatepicker
        :model-value="modelValue.dateRange"
        @update:model-value="updateFilter('dateRange', $event)"
        :label="t('pages.reportBuilder.filters.dateRange.label')"
        :placeholder="t('pages.reportBuilder.filters.dateRange.placeholder')"
        :range="true"
        :enable-time-picker="false"
        format="dd/MM/yyyy"
        model-type="yyyy-MM-dd"
      />
    </div>

    <!-- User Scope -->
    <div class="mb-6">
      <BaseText
        :text="t('pages.reportBuilder.filters.userScope.label')"
        class="!text-[12px] !leading-[18px] !text-black/85 !font-medium mb-3"
      />
      <div class="flex flex-col gap-3">
        <BaseRadioButton
          :model-value="modelValue.userScope"
          @update:model-value="updateFilter('userScope', $event)"
          :label="t('pages.reportBuilder.filters.userScope.allUsers')"
          value="all"
          name="userScope"
          label-class="!text-neutral-500 !text-[14px] !font-medium"
          label-active-class="!text-black/85 !text-[14px] !font-medium"
        />
        <BaseRadioButton
          :model-value="modelValue.userScope"
          @update:model-value="updateFilter('userScope', $event)"
          :label="t('pages.reportBuilder.filters.userScope.byGroup')"
          value="byGroup"
          name="userScope"
          label-class="!text-neutral-500 !text-[14px] !font-medium"
          label-active-class="!text-black/85 !text-[14px] !font-medium"
        />
      </div>
    </div>

    <!-- Completion Status -->
    <div class="mb-6">
      <BaseText
        :text="t('pages.reportBuilder.filters.completionStatus.label')"
        class="!text-[12px] !leading-[18px] !text-black/85 !font-medium mb-3"
      />
      <div class="flex flex-col gap-3">
        <BaseCheckbox
          :model-value="modelValue.completionStatus"
          @update:model-value="updateFilter('completionStatus', $event)"
          :label="t('pages.reportBuilder.filters.completionStatus.completed')"
          value="completed"
          label-class="!text-neutral-500 !text-[14px] !font-medium"
          label-active-class="!text-black/85 !text-[14px] !font-medium"
        />
        <BaseCheckbox
          :model-value="modelValue.completionStatus"
          @update:model-value="updateFilter('completionStatus', $event)"
          :label="t('pages.reportBuilder.filters.completionStatus.inProgress')"
          value="inProgress"
          label-class="!text-neutral-500 !text-[14px] !font-medium"
          label-active-class="!text-black/85 !text-[14px] !font-medium"
        />
        <BaseCheckbox
          :model-value="modelValue.completionStatus"
          @update:model-value="updateFilter('completionStatus', $event)"
          :label="t('pages.reportBuilder.filters.completionStatus.notScheduled')"
          value="notScheduled"
          label-class="!text-neutral-500 !text-[14px] !font-medium"
          label-active-class="!text-black/85 !text-[14px] !font-medium"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BaseSelect,
  BaseDatepicker,
  BaseRadioButton,
  BaseCheckbox,
  BaseText,
} from '@/components/common'
import { t } from '@/utils/i18n'

interface FilterValues {
  reportType: string
  course: string
  lessonQuiz: string
  dateRange: any
  userScope: string
  completionStatus: string[]
}

const props = defineProps<{
  modelValue: FilterValues
  reportTypeOptions: Array<{ label: string; value: string }>
  courseOptions: Array<{ label: string; value: string }>
  lessonQuizOptions: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterValues]
}>()

const updateFilter = (key: keyof FilterValues, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value } as FilterValues)
}
</script>
