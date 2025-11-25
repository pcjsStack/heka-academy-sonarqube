<template>
  <div class="border border-neutral-200 rounded-t-[8px] rounded-b-none bg-white mt-6 first:mt-0">
    <div
      class="flex md:flex-row flex-col justify-between md:items-center md:px-[24px] px-[16px] py-[8px] bg-neutral-50 rounded-t-[8px] border-b border-neutral-200 lg-gap-[0px] gap-[8px]"
    >
      <div class="flex sm:flex-row flex-col sm:items-center lg:justify-normal justify-between">
        <div
          class="text-[14px] font-semibold leading-[20px] tracking-[-0.016px] text-neutral-800 sm:mr-[20px] mr-[10px]"
        >
          {{ t('pages.quizCreation.question.label') }} 0{{ questionNumber }}
        </div>
        <div class="flex items-center sm:mt-0 sm:mb-0 mt-[8px]">
          <BaseSelect
            v-model="local.type"
            update-on-blur
            :placeholder="t('pages.quizCreation.questionTypes.yesNo')"
            :options="questionTypeOptions"
            class="min-w-[103px] black-icon bg-white !h-[32px] question-select"
            dropdown-class="min-w-[190px] border-0 text-[14px] text-grey-800 tracking-[-0.016px] leading-[20px]"
          />
        </div>
      </div>
      <div class="flex items-center gap-[16px] lg:justify-normal justify-between">
        <div class="flex items-center gap-[16px]">
          <BaseIcon
            name="arrow-down"
            @click="handleSwap('down')"
            class="w-auto h-5 text-black cursor-pointer"
          />
          <BaseIcon
            name="arrow-up"
            @click="handleSwap('up')"
            class="w-auto h-5 text-black cursor-pointer"
          />
          <div class="min-w-[2px] h-[14px] bg-black/20"></div>
          <BaseIcon
            name="file-copy"
            @click="handleClone"
            class="w-auto h-5 text-black cursor-pointer"
          />
          <BaseIcon
            name="delete-outline"
            class="w-auto h-5 text-black cursor-pointer"
            color="text-black/65"
            @click="$emit('delete')"
          />
        </div>
      </div>
    </div>

    <div class="lg:p-[24px] p-[16px]">
      <div class="mb-5">
        <BaseInput
          id="question"
          :placeholder="t('pages.quizCreation.placeholders.question')"
          :label="t('pages.quizCreation.question.label')"
          type="text"
          v-model="local.question"
          labelClass="!text-[12px] tracking-[-0.01em] !text-neutral-700"
        />
      </div>
      <div class="mb-5">
        <div>
          <BaseRichText
            :label="`${t('pages.quizCreation.question.description')} <span class=text-black/50>(${t('pages.quizCreation.question.optional')})</span>`"
            v-model="local.description"
            base-label-class="!text-[14px] tracking-[-0.01em]"
            :placeholder="t('pages.quizCreation.placeholders.description')"
          />
        </div>
      </div>
      <div class="mb-5">
        <BaseCheckbox
          :id="`media-${local.id}`"
          :model-value="local.hasMedia || false"
          :label="t('pages.quizCreation.question.addMedia')"
          @update:model-value="(value) => (local.hasMedia = value)"
        />
      </div>
    </div>

    <div class="lg:px-[24px] px-[16px] py-[20px] border-t border-neutral-200">
      <div v-if="getActiveType('yes-no')" class="flex items-center gap-[16px]">
        <BaseButton
          :text="t('pages.quizCreation.placeholders.yesOption')"
          color="transparent"
          variant="outline"
          size="sm"
          :class="[
            'px-[14px] py-1 h-[40px] border border-neutral-300 rounded-[8px] w-full text-left !justify-start',
          ]"
        />
        <BaseButton
          :text="t('pages.quizCreation.placeholders.noOption')"
          color="transparent"
          variant="outline"
          size="sm"
          :class="[
            'px-[14px] py-1 h-[40px] border border-neutral-300 rounded-[8px] w-full text-left !justify-start',
          ]"
        />
      </div>

      <div v-if="getActiveType('multiple-choice')" class="flex flex-col gap-2">
        <VueDraggable
          ref="el"
          v-model="local.options"
          :handle="'.drag-handle'"
          class="flex flex-col gap-2"
        >
          <div
            v-for="(option, i) in local.options || []"
            :key="option.id"
            class="flex items-center gap-2"
          >
            <BaseIcon
              name="arrow-compress-1"
              class="!w-[14px] !h-[14px] drag-handle text-grey-800 mr-[7px] cursor-move"
            />
            <div
              class="option-input w-full flex items-center gap-[12px] rounded-[8px] border border-neutral-300 py-[7.5px] px-[8px]"
            >
              <div
                class="bg-[rgba(25,117,255,0.1)] w-[28px] h-[25px] rounded-[6px] flex items-center justify-center text-[14px] tracking-[-0.016px] leading-[17px] text-primary-550"
              >
                {{ String.fromCharCode(65 + i) }}
              </div>
              <BaseInput
                type="text"
                :model-value="option.text"
                :placeholder="t('pages.quizCreation.placeholders.option')"
                class="flex-1"
                @update:model-value="(value) => updateOptionText(option.id, value)"
              />
            </div>
            <BaseIcon
              name="clear"
              variant="blank"
              @click="removeOption(i)"
              class="!text-grey-800 !w-[20px] h-[20px] cursor-pointer"
            />
          </div>
        </VueDraggable>

        <div class="text-primary-600 text-sm flex items-center gap-2">
          <BaseIcon
            name="arrow-compress-1"
            variant="blank"
            class="!w-[14px] !h-[14px] text-grey-800 mr-[7px] invisible"
          />
          <div
            class="option-input w-full flex items-center gap-[12px] rounded-[8px] border border-neutral-300 py-[7.5px] px-[8px]"
          >
            <div
              class="bg-[rgba(25,117,255,0.1)] w-[28px] h-[25px] rounded-[6px] flex items-center justify-center text-[14px] tracking-[-0.016px] leading-[17px] text-primary-550"
            >
              <BaseIcon name="add" class="!w-4 h-4 cursor-pointer" @click="addOption" />
            </div>
            <BaseInput
              type="text"
              :placeholder="t('pages.quizCreation.options.typeHere')"
              v-model="optionValue"
              @keydown="handleKeyDown"
            />
          </div>
          <BaseIcon
            name="clear"
            variant="blank"
            class="!w-[20px] h-[20px] !text-grey-800 invisible"
          />
        </div>
      </div>

      <!-- Text Field Type - No additional UI needed, just shows the question and description -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, reactive, ref, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import {
  BaseButton,
  BaseSelect,
  BaseIcon,
  BaseInput,
  BaseRichText,
  BaseCheckbox,
} from '@/components/common'
import type { QuizCreationQuestion } from '@/types/QuizCreation'
import { QuizCreationQuestionType } from '@/types/QuizCreation'
import { t } from '@/utils/i18n'

interface Props {
  question: QuizCreationQuestion
  questionNumber: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:question': [question: QuizCreationQuestion]
  delete: []
  'move-up': []
  'move-down': []
  duplicate: []
}>()

const optionValue = ref('')
const el = ref()

// Create question type options
const questionTypeOptions = computed(() => [
  { label: t('pages.quizCreation.questionTypes.yesNo'), value: QuizCreationQuestionType.YES_NO },
  {
    label: t('pages.quizCreation.questionTypes.multipleChoice'),
    value: QuizCreationQuestionType.MULTIPLE_CHOICE,
  },
  {
    label: t('pages.quizCreation.questionTypes.textField'),
    value: QuizCreationQuestionType.TEXT_FIELD,
  },
])

// Use reactive local state like the survey component
const local = reactive({
  ...props.question,
  options: props.question.options || [],
})

// Watch for changes and emit updates
watch(
  local,
  () => {
    emit('update:question', { ...local })
  },
  { deep: true },
)

const removeOption = (index: number) => {
  local.options?.splice(index, 1)
}

const updateOptionText = (optionId: string, newText: string) => {
  if (local.options) {
    const option = local.options.find((opt) => opt.id === optionId)
    if (option) {
      option.text = newText
    }
  }
}

const handleSwap = (dir: 'up' | 'down') => {
  if (dir === 'up') {
    emit('move-up')
  } else {
    emit('move-down')
  }
}

const handleClone = () => {
  emit('duplicate')
}

const addOption = () => {
  if (optionValue.value.trim()) {
    if (!local.options) {
      local.options = []
    }
    local.options.push({
      id: `option-${Date.now()}`,
      text: optionValue.value.trim(),
      order: local.options.length + 1,
    })
    optionValue.value = ''
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    addOption()
  }
}

const getActiveType = (type: string) => {
  return local.type === type
}

// Watch for type changes and initialize options
watch(
  () => local.type,
  (newType) => {
    if (newType === QuizCreationQuestionType.YES_NO) {
      local.options = [
        { id: `yes-${Date.now()}`, text: t('pages.quizCreation.placeholders.yesOption'), order: 1 },
        { id: `no-${Date.now()}`, text: t('pages.quizCreation.placeholders.noOption'), order: 2 },
      ]
    } else if (newType === QuizCreationQuestionType.MULTIPLE_CHOICE) {
      local.options = [
        { id: `option-${Date.now()}-1`, text: '', order: 1 },
        { id: `option-${Date.now()}-2`, text: '', order: 2 },
        { id: `option-${Date.now()}-3`, text: '', order: 3 },
      ]
    } else {
      local.options = []
    }
  },
)

// Watch for prop changes
watch(
  () => props.question,
  (newQuestion) => {
    Object.assign(local, newQuestion)
  },
  { deep: true },
)

// Watch for options reordering and update the order property
watch(
  () => local.options,
  (newOptions) => {
    if (newOptions) {
      newOptions.forEach((option, index) => {
        option.order = index + 1
      })
    }
  },
  { deep: true },
)
</script>

<style>
.question-select .h-\[auto\] {
  padding-right: 35px;
}
</style>
