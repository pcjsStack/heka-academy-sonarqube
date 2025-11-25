<template>
  <BaseSideModal
    v-if="show"
    :title="t('pages.linkQuiz.title')"
    size="md"
    :close-button="true"
    custom-class="left-0"
    :z-index="9999999"
    @onClose="handleClose"
  >
    <div class="py-8 px-6 overflow-y-auto h-[calc(100svh-144px)]">
      <!-- Instruction Text -->
      <BaseText
        :text="t('pages.linkQuiz.instruction')"
        color="neutral"
        class="!text-[14px] !leading-[17px] !text-black/85 !font-medium mb-3"
      />

      <!-- Linking Options -->
      <div>
        <!-- File Option -->
        <div class="flex items-center justify-between gap-2 my-1.5">
          <BaseRadioButton
            v-model="selectedLinkType"
            :value="LinkType.FILE"
            name="linkType"
            :label="t('pages.linkQuiz.options.file')"
            customInputStyles="w-[16px] h-[16px]"
            wrapperClass="!gap-[12px]"
            labelClass="!text-black/50"
            labelActiveClass="!text-black/85"
          />
          <BaseSelect
            v-model="selectedFile"
            :options="fileOptions"
            :placeholder="t('pages.linkQuiz.placeholders.select')"
            :disabled="selectedLinkType !== LinkType.FILE"
            size="md"
            class="flex-1 max-w-[352px]"
          />
        </div>

        <!-- Course Option -->
        <div class="flex items-center justify-between gap-2 my-1.5">
          <BaseRadioButton
            v-model="selectedLinkType"
            :value="LinkType.COURSE"
            name="linkType"
            :label="t('pages.linkQuiz.options.course')"
            customInputStyles="w-[16px] h-[16px]"
            wrapperClass="!gap-[12px]"
            labelClass="!text-black/50"
            labelActiveClass="!text-black/85"
          />
          <BaseSelect
            v-model="selectedCourse"
            :options="courseOptions"
            multiple
            :placeholder="t('pages.linkQuiz.placeholders.select')"
            :disabled="selectedLinkType !== LinkType.COURSE"
            size="md"
            class="flex-1 max-w-[352px]"
          />
        </div>

        <!-- Lessons Option -->
        <div class="flex items-center justify-between gap-2 my-1.5">
          <BaseRadioButton
            v-model="selectedLinkType"
            :value="LinkType.LESSONS"
            name="linkType"
            :label="t('pages.linkQuiz.options.lessons')"
            customInputStyles="w-[16px] h-[16px]"
            wrapperClass="!gap-[12px]"
            labelClass="!text-black/50"
            labelActiveClass="!text-black/85"
          />
          <BaseSelect
            v-model="selectedLesson"
            :options="lessonOptions"
            :placeholder="t('pages.linkQuiz.placeholders.select')"
            :disabled="selectedLinkType !== LinkType.LESSONS"
            size="md"
            class="flex-1 max-w-[352px]"
          />
        </div>

        <!-- Sub-Lesson Option -->
        <div class="flex items-center justify-between gap-2 my-1.5">
          <BaseRadioButton
            v-model="selectedLinkType"
            :value="LinkType.SUB_LESSON"
            name="linkType"
            :label="t('pages.linkQuiz.options.subLesson')"
            customInputStyles="w-[16px] h-[16px]"
            wrapperClass="!gap-[12px]"
            labelClass="!text-black/50"
            labelActiveClass="!text-black/85"
          />
          <BaseSelect
            v-model="selectedSubLesson"
            :options="subLessonOptions"
            :placeholder="t('pages.linkQuiz.placeholders.select')"
            :disabled="selectedLinkType !== LinkType.SUB_LESSON"
            size="md"
            class="flex-1 max-w-[352px]"
          />
        </div>
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="border-t border-neutral-200 pt-5 px-6 flex justify-end">
      <div class="flex justify-end gap-2">
        <BaseButton
          :text="t('pages.linkQuiz.buttons.cancel')"
          variant="link"
          size="sm"
          @onClick="handleClose"
          class="!w-[95px] !font-medium"
        />
        <BaseButton
          :text="t('pages.linkQuiz.buttons.publish')"
          variant="default"
          color="primary"
          size="sm"
          @onClick="handlePublish"
          class="!w-[97px] !font-medium"
        />
      </div>
    </div>
  </BaseSideModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  BaseSideModal,
  BaseText,
  BaseRadioButton,
  BaseSelect,
  BaseButton,
} from '@/components/common'
import { t } from '@/utils/i18n'
import type { LinkQuizData } from '@/types/LinkQuiz'
import { LinkType } from '@/types/LinkQuiz'

interface Props {
  show: boolean
  quizData: LinkQuizData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  publish: [linkQuizData: LinkQuizData]
}>()

// Reactive state
const selectedLinkType = ref<LinkType>(LinkType.COURSE)
const selectedFile = ref<string | null>(null)
const selectedCourse = ref<string[] | null>(['1']) // Pre-selected Product Training
const selectedLesson = ref<string | null>(null)
const selectedSubLesson = ref<string | null>(null)

// Mock data for dropdowns
const fileOptions = ref([
  { value: '1', label: 'Training Manual.pdf' },
  { value: '2', label: 'Guidelines.docx' },
  { value: '3', label: 'Handbook.pdf' },
])

const courseOptions = ref([
  { value: '1', label: 'Product Training' },
  { value: '2', label: 'Customer Service' },
  { value: '3', label: 'Sales Techniques' },
])

const lessonOptions = ref([
  { value: '1', label: 'Introduction to Products' },
  { value: '2', label: 'Product Features' },
  { value: '3', label: 'Best Practices' },
])

const subLessonOptions = ref([
  { value: '1', label: 'Basic Concepts' },
  { value: '2', label: 'Advanced Topics' },
  { value: '3', label: 'Practical Exercises' },
])

// Helper functions
const getCourseName = (courseId: string) => {
  const course = courseOptions.value.find((opt) => opt.value === courseId)
  return course ? course.label : ''
}

const getFileName = (fileId: string) => {
  const file = fileOptions.value.find((opt) => opt.value === fileId)
  return file ? file.label : ''
}

const getLessonName = (lessonId: string) => {
  const lesson = lessonOptions.value.find((opt) => opt.value === lessonId)
  return lesson ? lesson.label : ''
}

const getSubLessonName = (subLessonId: string) => {
  const subLesson = subLessonOptions.value.find((opt) => opt.value === subLessonId)
  return subLesson ? subLesson.label : ''
}

// Methods
const handleClose = () => {
  emit('close')
}

const getSelectedItem = () => {
  switch (selectedLinkType.value) {
    case LinkType.FILE:
      return selectedFile.value
        ? {
            id: selectedFile.value,
            name: getFileName(selectedFile.value),
            type: LinkType.FILE,
          }
        : null
    case LinkType.COURSE:
      return selectedCourse.value && selectedCourse.value[0]
        ? {
            id: selectedCourse.value[0],
            name: getCourseName(selectedCourse.value[0]),
            type: LinkType.COURSE,
          }
        : null
    case LinkType.LESSONS:
      return selectedLesson.value
        ? {
            id: selectedLesson.value,
            name: getLessonName(selectedLesson.value),
            type: LinkType.LESSONS,
          }
        : null
    case LinkType.SUB_LESSON:
      return selectedSubLesson.value
        ? {
            id: selectedSubLesson.value,
            name: getSubLessonName(selectedSubLesson.value),
            type: LinkType.SUB_LESSON,
          }
        : null
    default:
      return null
  }
}

const handlePublish = () => {
  const selectedItem = getSelectedItem()

  const linkQuizData: LinkQuizData = {
    ...props.quizData,
    linkType: selectedLinkType.value,
    linkedItem: selectedItem
      ? {
          id: selectedItem.id,
          name: selectedItem.name,
          type: selectedItem.type,
        }
      : undefined,
  }

  emit('publish', linkQuizData)
}
</script>
