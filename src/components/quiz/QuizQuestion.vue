<template>
  <div>
    <!-- Question Text with Required Indicator -->
    <div class="flex items-start gap-1">
      <div
        class="flex items-start gap-1 !text-[14px] !leading-[24px] !text-neutral-700 !font-medium"
      >
        <span>{{ questionNumber }}. </span>
        <span v-safe-html="question.title" />
      </div>
      <span v-if="question.isRequired" class="text-error-600 text-[14px]">*</span>
    </div>

    <!-- Question Attachments/Images -->
    <div
      v-if="question.attachments && question.attachments.length > 0"
      class="mt-4 md:mt-3 lg:mt-4 ml-[14px] md:ml-3 lg:ml-[14px] flex gap-3 md:gap-2.5 lg:gap-3 flex-wrap"
    >
      <div
        v-for="attachment in question.attachments"
        :key="attachment.id"
        class="cursor-pointer hover:opacity-80 transition-opacity"
        @click="handleAttachmentClick(attachment)"
      >
        <!-- Image Preview -->
        <img
          v-if="getAttachmentContentType(attachment) === CourseContentType.IMAGE"
          :src="attachment.url"
          :alt="attachment.fileName"
          class="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-grey-200"
        />
        <!-- Video Preview -->
        <div
          v-else-if="getAttachmentContentType(attachment) === CourseContentType.VIDEO"
          class="max-w-[200px] max-h-[200px] min-w-[150px] min-h-[150px] rounded-lg border border-grey-200 bg-grey-50 flex flex-col items-center justify-center p-4 relative"
        >
          <BaseIcon name="video" size="lg" color="neutral" :tone="500" class="mb-2" />
          <BaseText
            :text="attachment.fileName || attachment.customFileName || 'Video'"
            class="!text-[12px] !leading-[15px] !text-neutral-700 !font-medium text-center line-clamp-2"
            tailwind-css="max-w-full"
          />
          <!-- Play icon overlay to indicate it's clickable -->
          <div
            class="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity"
          >
            <BaseIcon
              name="play"
              size="xl"
              color="primary"
              :tone="500"
              class="bg-white/90 rounded-full p-2"
            />
          </div>
        </div>
        <!-- PDF or Other File Preview -->
        <div
          v-else
          class="max-w-[200px] max-h-[200px] min-w-[150px] min-h-[150px] rounded-lg border border-grey-200 bg-grey-50 flex flex-col items-center justify-center p-4"
        >
          <BaseIcon
            :name="getAttachmentContentType(attachment) === CourseContentType.PDF ? 'file' : 'file'"
            size="lg"
            color="neutral"
            :tone="500"
            class="mb-2"
          />
          <BaseText
            :text="attachment.fileName || attachment.customFileName || 'File'"
            class="!text-[12px] !leading-[15px] !text-neutral-700 !font-medium text-center line-clamp-2"
            tailwind-css="max-w-full"
          />
        </div>
      </div>
    </div>

    <!-- Text Input (OPEN type) -->
    <div
      v-if="getQuestionUIType() === 'text'"
      class="max-w-[612px] mt-2 md:mt-1.5 lg:mt-2 ml-[14px] md:ml-3 lg:ml-[14px]"
    >
      <BaseRichText
        v-model="textAnswer"
        :placeholder="t('pages.quiz.placeholders.textAnswer')"
        :disabled="disabled"
      />
    </div>

    <!-- Rating Input (0-10) -->
    <div
      v-else-if="getQuestionUIType() === 'rating'"
      class="mt-[10px] md:mt-2.5 lg:mt-[10px] ml-[16px] md:ml-4 lg:ml-[16px]"
    >
      <div class="flex items-center gap-[6px] md:gap-1.5 lg:gap-[6px] flex-wrap">
        <BaseButton
          v-for="rating in 11"
          :key="rating - 1"
          :text="(rating - 1).toString()"
          :variant="isRatingSelected(rating - 1) ? 'default' : 'link'"
          size="sm"
          :color="isRatingSelected(rating - 1) ? 'primary' : 'neutral'"
          :disabled="disabled"
          @onClick="() => !disabled && handleRatingChange(rating - 1)"
          class="!min-w-[32px] !w-[32px] !h-[32px] !p-0 !rounded-full bg-grey-50"
        />
      </div>
    </div>

    <!-- Radio Buttons (SELECT_SINGLE or YES_NO) -->
    <div
      v-else-if="getQuestionUIType() === 'radio'"
      class="mt-4 md:mt-3 lg:mt-4 ml-[16px] md:ml-4 lg:ml-[16px]"
    >
      <div
        :class="[
          'flex',
          getQuestionOptions().length <= 2
            ? 'items-center space-x-[55px] md:space-x-[45px] lg:space-x-[55px]'
            : 'flex-col space-y-3 md:space-y-2.5 lg:space-y-3',
        ]"
      >
        <div v-for="option in getQuestionOptions()" :key="option.id" class="flex items-center">
          <BaseRadioButton
            :id="`${question.id}-${option.id}`"
            :model-value="selectedRadio !== null ? selectedRadio : -1"
            :value="option.id"
            :disabled="disabled"
            @update:model-value="handleRadioChange"
            :label="option.title"
            customInputStyles="w-[16px] h-[16px]"
            wrapperClass="!gap-[12px]"
            labelClass="!text-neutral-500 !text-[14px] !font-medium"
            labelActiveClass="!text-black/85 !text-[14px] !font-medium"
          />
        </div>
      </div>
    </div>

    <!-- Checkboxes (SELECT_MULTIPLE) -->
    <div
      v-else-if="getQuestionUIType() === 'checkbox'"
      class="mt-4 md:mt-3 lg:mt-4 ml-[16px] md:ml-4 lg:ml-[16px] space-y-3 md:space-y-2.5 lg:space-y-3"
    >
      <div
        v-for="option in getQuestionOptions()"
        :key="option.id"
        :class="['flex items-center', !disabled && 'cursor-pointer']"
        @click="() => !disabled && handleCheckboxChange(option.id, !isCheckboxSelected(option.id))"
      >
        <BaseCheckbox
          :id="`${question.id}-${option.id}`"
          :model-value="isCheckboxSelected(option.id)"
          :disabled="disabled"
          @update:model-value="(checked) => !disabled && handleCheckboxChange(option.id, checked)"
          class="!w-[16px] !h-[16px] mr-2 checkbox"
          defaultStyle="!border-neutral-300"
          uncheckedStroke="#CED2DA"
          :checkbox-width="16"
          :checkbox-height="16"
        />
        <BaseText
          :text="option.title"
          type="p-md"
          color="neutral"
          :tone="500"
          class="!text-[14px] !leading-[17px] !font-medium !text-neutral-500"
        />
      </div>
    </div>

    <!-- Photo Upload (PHOTO type or photoRequired) -->
    <div
      v-if="getQuestionUIType() === 'photo' || question.photoRequired"
      class="mt-6 md:mt-5 lg:mt-6 ml-[14px] md:ml-3 lg:ml-[14px]"
    >
      <div class="flex items-center space-x-1">
        <BaseText
          :text="t('pages.quiz.fields.photoLabel')"
          :tone="700"
          color="neutral"
          font="medium"
          type="p-sm"
          class="!text-xs-custom !text-custom-label-text"
        />
        <span
          v-if="question.photoRequired"
          class="text-pink !ml-0 text-xs-custom tracking-[-0.01em] leading-tight self-start"
        >
          *
        </span>
      </div>

      <!-- Show existing uploaded photo from execution if available -->
      <div
        v-if="question.execution?.attachmentUrl && photoAttachments.length === 0"
        class="mb-3 mt-2"
      >
        <img
          :src="question.execution.attachmentUrl"
          alt="Existing photo"
          class="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-grey-200"
        />
      </div>

      <BaseDragAndDropFiles
        :text="t('pages.quiz.fields.photoDragDrop')"
        accept=".jpg,.jpeg,.png,.svg,.pdf,.mp4,.mov,.avi,.webm,.mkv,.flv,.wmv,.m4v,.3gp"
        :multiple="false"
        :show-history="true"
        :hide-search-text="true"
        :disabled="disabled"
        :model-value="photoAttachments"
        :max-size="1024"
        @update:model-value="handlePhotoUpdate"
      />
      <BaseText
        :text="t('pages.quiz.fields.photoMaxSize')"
        class="!text-neutral-500 !text-[12px] md:!text-[11px] lg:!text-[12px] !leading-[15px] mt-2 md:mt-1.5 lg:mt-2"
      />
    </div>

    <!-- Comment Field -->
    <div
      v-if="question.commentRequired"
      class="mt-6 md:mt-5 lg:mt-6 ml-[14px] md:ml-3 lg:ml-[14px]"
    >
      <BaseInput
        v-model="commentText"
        :required="question.commentRequired"
        :label="t('pages.quiz.fields.commentLabel')"
        type="textArea"
        :input-rows="4"
        :disabled="disabled"
      />
    </div>

    <!-- File Viewer Modal -->
    <FileViewerModal
      v-if="isFileViewerOpen && currentFile"
      :isOpen="isFileViewerOpen"
      :file="currentFile"
      @close="handleCloseFileViewer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  BaseText,
  BaseRichText,
  BaseButton,
  BaseRadioButton,
  BaseCheckbox,
  BaseInput,
  BaseDragAndDropFiles,
  BaseIcon,
} from '@/components/common'
import FileViewerModal from '@/components/modal/FileViewerModal.vue'
import { t } from '@/utils/i18n'
import { QuizQuestionType } from '@/types/QuizPayload'
import type { QuizInfoQuestion, QuizOption, QuizAnswerValue, QuizAttachment } from '@/types/Quiz'
import type { Media } from '@/types/Media'
import { getContentTypeFromFile } from '@/utils/utils'
import { CourseContentType } from '@/types/Course'

interface Props {
  question: QuizInfoQuestion
  questionNumber: number
  modelValue?: QuizAnswerValue
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: QuizAnswerValue]
}>()

// Local state for different input types
const textAnswer = ref('')
const selectedRating = ref<number | null>(null)
const selectedRadio = ref<number | null>(null)
const selectedCheckboxes = ref<number[]>([])
const photoAttachments = ref<Media[]>([])
const commentText = ref('')

const isUpdatingFromParent = ref(false)

// File viewer state
const isFileViewerOpen = ref(false)
const currentFile = ref<Media | null>(null)

// Watch for prop changes and update local state
watch(
  () => props.modelValue,
  (newValue) => {
    isUpdatingFromParent.value = true
    if (newValue) {
      textAnswer.value = newValue.text || ''
      selectedRating.value = newValue.rating ?? null
      selectedRadio.value = newValue.radio ?? null
      selectedCheckboxes.value = newValue.checkbox || []
      commentText.value = newValue.comment || ''
      // Restore photoAttachments if photoFiles exists
      if (newValue.photoFiles) {
        photoAttachments.value = newValue.photoFiles as Media[]
      }
    }
    isUpdatingFromParent.value = false
  },
  { immediate: true },
)

// Watch for textAnswer changes only (rich text editor)
watch(
  () => textAnswer.value,
  () => {
    if (!isUpdatingFromParent.value) {
      emitAnswer()
    }
  },
)

// Watch for commentText changes
watch(
  () => commentText.value,
  () => {
    if (!isUpdatingFromParent.value) {
      emitAnswer()
    }
  },
)

const emitAnswer = () => {
  // Don't emit changes if disabled
  if (props.disabled) return

  const answer: QuizAnswerValue = {}

  if (textAnswer.value) answer.text = textAnswer.value
  if (selectedRating.value !== null) answer.rating = selectedRating.value
  if (selectedRadio.value !== null) answer.radio = selectedRadio.value
  if (selectedCheckboxes.value.length > 0) answer.checkbox = selectedCheckboxes.value
  if (commentText.value) answer.comment = commentText.value
  if (photoAttachments.value.length > 0) {
    answer.photo = photoAttachments.value.map(
      (file) => file.fileName || file.customFileName || file.name || '',
    )
    answer.photoFiles = photoAttachments.value // Store actual Media objects for FormData
  }

  emit('update:modelValue', answer)
}

const getQuestionUIType = (): string => {
  const questionType = props.question.type.toLowerCase()

  switch (questionType) {
    case QuizQuestionType.OPEN.toLowerCase():
      return 'text'
    case QuizQuestionType.RATING.toLowerCase():
      return 'rating'
    case QuizQuestionType.YES_NO.toLowerCase():
      return 'radio'
    case QuizQuestionType.SELECT_SINGLE.toLowerCase():
      return 'radio'
    case QuizQuestionType.SELECT_MULTIPLE.toLowerCase():
      return 'checkbox'
    case QuizQuestionType.PHOTO.toLowerCase():
      return 'photo'
    default:
      return 'text'
  }
}

const getQuestionOptions = (): QuizOption[] => {
  const questionType = props.question.type.toLowerCase()

  if (questionType === QuizQuestionType.YES_NO.toLowerCase()) {
    return [
      { id: 1, title: t('pages.quiz.options.yes'), weight: 0, createdAt: '' },
      { id: 0, title: t('pages.quiz.options.no'), weight: 0, createdAt: '' },
    ]
  }

  return props.question.options || []
}

const handleRatingChange = (rating: number) => {
  if (props.disabled) return
  selectedRating.value = rating
  emitAnswer()
}

const handleRadioChange = (value: number) => {
  if (props.disabled) return
  selectedRadio.value = value
  emitAnswer()
}

const handleCheckboxChange = (optionId: number, checked: boolean) => {
  if (props.disabled) return
  if (checked) {
    if (!selectedCheckboxes.value.includes(optionId)) {
      selectedCheckboxes.value.push(optionId)
    }
  } else {
    const index = selectedCheckboxes.value.indexOf(optionId)
    if (index > -1) {
      selectedCheckboxes.value.splice(index, 1)
    }
  }
  emitAnswer()
}

const handlePhotoUpdate = (files: Media[]) => {
  if (props.disabled) return
  photoAttachments.value = files
  emitAnswer()
}

const isRatingSelected = (rating: number): boolean => {
  return selectedRating.value !== null && selectedRating.value >= rating
}

const isCheckboxSelected = (optionId: number): boolean => {
  return selectedCheckboxes.value.includes(optionId)
}

// Convert QuizAttachment to Media-like object for utility functions
const convertAttachmentToMedia = (attachment: QuizAttachment): Media => {
  return {
    id: attachment.id,
    uuid: '', // Not available in QuizAttachment
    fileName: attachment.fileName,
    name: attachment.customFileName || attachment.fileName,
    collectionName: '',
    mimeType: attachment.mimeType,
    size: attachment.size,
    url: attachment.url,
    customFileName: attachment.customFileName,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
  }
}

// Get content type from QuizAttachment
const getAttachmentContentType = (attachment: QuizAttachment): CourseContentType => {
  const mediaLike = convertAttachmentToMedia(attachment)
  return getContentTypeFromFile(mediaLike)
}

const handleAttachmentClick = (attachment: QuizAttachment) => {
  if (props.disabled) return

  // Check if attachment is image, PDF, or video
  const contentType = getAttachmentContentType(attachment)
  if (
    contentType === CourseContentType.IMAGE ||
    contentType === CourseContentType.PDF ||
    contentType === CourseContentType.VIDEO
  ) {
    // Convert QuizAttachment to Media for FileViewerModal
    currentFile.value = convertAttachmentToMedia(attachment)
    isFileViewerOpen.value = true
  }
}

const handleCloseFileViewer = () => {
  isFileViewerOpen.value = false
  currentFile.value = null
  // Note: FileViewerModal emits payload with filetype and percentage, but we don't need it here
}
</script>
