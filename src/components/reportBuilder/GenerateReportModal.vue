<template>
  <BaseSideModal
    v-if="show"
    :title="t('pages.reportBuilder.generateReport.title')"
    size="md"
    :close-button="true"
    close-button-color="primary"
    :zIndex="1000"
    containerTailwindCss="!p-0"
    customClass="left-0"
    @on-close="handleClose"
  >
    <div class="px-6 pt-8 pb-6 h-[calc(100svh-140px)] overflow-y-auto">
      <div class="flex flex-col gap-6">
        <!-- Report Type - Moved to top -->
        <BaseSelect
          v-model="formData.reportType"
          :label="t('pages.reportBuilder.generateReport.reportType.label')"
          :placeholder="t('pages.reportBuilder.generateReport.reportType.placeholder')"
          :options="reportTypeOptions"
          option-label="label"
          option-value="value"
        />
        <!-- Report Name -->
        <BaseInput
          v-model="formData.reportName"
          type="text"
          :label="t('pages.reportBuilder.generateReport.reportName.label')"
          :placeholder="t('pages.reportBuilder.generateReport.reportName.placeholder')"
        />

        <!-- Academy Filters - Only shown when filterCategory is 'academy' and reportType is 'course' -->
        <AcademyFilters v-model="formData.academyFilters" :report-type="formData.reportType" />

        <!-- Users Filters -->
        <UsersFilters v-model="formData.usersFilters" />

        <!-- File Creation -->
        <div class="flex flex-col gap-4">
          <BaseToggle
            v-model="formData.fileCreationEnabled"
            :label="t('pages.reportBuilder.generateReport.fileCreation.label')"
          />

          <!-- File Format Radio Buttons - Only PDF, CSV, XLSX -->
          <div v-if="formData.fileCreationEnabled" class="flex flex-wrap gap-4 pl-0">
            <BaseRadioButton
              v-for="format in fileFormatOptions"
              :key="format.value"
              v-model="formData.fileFormat"
              :value="format.value"
              :name="'fileFormat'"
              :label="format.label"
              :label-class="'!text-[14px] !text-neutral-500'"
              :label-active-class="'!text-[14px] !text-primary-600'"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="px-6 border-t pt-5 pb-6 border-grey-150">
        <BaseButton
          :text="t('pages.reportBuilder.generateReport.buttons.generate')"
          variant="default"
          color="neutral"
          size="sm"
          :full-size="true"
          :disabled="formData.reportType !== 'badgesAndSkills'"
          @on-click="handleGenerate"
        />
      </div>
    </template>
  </BaseSideModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  BaseSideModal,
  BaseSelect,
  BaseInput,
  BaseToggle,
  BaseRadioButton,
  BaseButton,
} from '@/components/common'
import AcademyFilters from './AcademyFilters.vue'
import UsersFilters from './UsersFilters.vue'
import { t } from '@/utils/i18n'
import type { GenerateReportFormData } from '@/types/ReportBuilder'

interface Props {
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  generate: [formData: GenerateReportFormData]
}>()

// Form data
const formData = ref({
  reportType: '',
  filterCategory: '',
  academyFilters: {
    courseIds: [] as string[],
    quizIds: [] as string[],
    lessonIds: [] as string[],
    badgeIds: [] as string[],
    skillIds: [] as string[],
    fileIds: [] as string[],
  },
  usersFilters: {
    groupIds: [] as string[],
    clusterIds: [] as string[],
    roleIds: [] as string[],
  },
  reportName: '',
  fileCreationEnabled: true,
  fileFormat: 'pdf',
})

// Report Type Options
const reportTypeOptions = ref([
  { label: t('pages.reportBuilder.generateReport.reportType.options.course'), value: 'course' },
  { label: t('pages.reportBuilder.generateReport.reportType.options.quiz'), value: 'quiz' },
  { label: t('pages.reportBuilder.generateReport.reportType.options.lessons'), value: 'lessons' },
  {
    label: t('pages.reportBuilder.generateReport.reportType.options.badgesAndSkills'),
    value: 'badgesAndSkills',
  },
  { label: t('pages.reportBuilder.generateReport.reportType.options.files'), value: 'files' },
])

// File Format Options - Only PDF, CSV, XLSX
const fileFormatOptions = ref([
  { label: 'PDF', value: 'pdf' },
  { label: 'CSV', value: 'csv' },
  { label: 'XLSX', value: 'xlsx' },
])

const handleClose = () => {
  emit('close')
}

const handleGenerate = () => {
  const payload: GenerateReportFormData = {
    reportType: formData.value.reportType as GenerateReportFormData['reportType'],
    reportName: formData.value.reportName,
    fileCreationEnabled: formData.value.fileCreationEnabled,
    fileFormat: formData.value.fileFormat as GenerateReportFormData['fileFormat'],
  }

  // Add filter category and filters only if Course is selected
  if (formData.value.reportType === 'course' && formData.value.filterCategory) {
    payload.filterCategory = formData.value
      .filterCategory as GenerateReportFormData['filterCategory']

    if (formData.value.filterCategory === 'academy') {
      payload.academyFilters = formData.value.academyFilters
    } else if (formData.value.filterCategory === 'users') {
      payload.usersFilters = formData.value.usersFilters
    }
  }

  emit('generate', payload)
  handleClose()
}

// Reset form when modal closes
watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) {
      formData.value = {
        reportType: '',
        filterCategory: '',
        academyFilters: {
          courseIds: [],
          quizIds: [],
          lessonIds: [],
          badgeIds: [],
          skillIds: [],
          fileIds: [],
        },
        usersFilters: {
          groupIds: [],
          clusterIds: [],
          roleIds: [],
        },
        reportName: '',
        fileCreationEnabled: true,
        fileFormat: 'pdf',
      }
    }
  },
)

// Reset filter category when report type changes
watch(
  () => formData.value.reportType,
  () => {
    formData.value.filterCategory = ''
    formData.value.academyFilters = {
      courseIds: [],
      quizIds: [],
      lessonIds: [],
      badgeIds: [],
      skillIds: [],
      fileIds: [],
    }
    formData.value.usersFilters = {
      groupIds: [],
      clusterIds: [],
      roleIds: [],
    }
  },
)
</script>
