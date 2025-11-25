<script setup lang="ts">
import { BaseInput, BaseButtonIcon, BaseText, BaseTooltipIcon } from '@/components/common'
import { t } from '@/utils/i18n'
import type { QuestionOption } from '@/types/QuizCreation'

interface Props {
  options: QuestionOption[]
  error?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:options': [options: QuestionOption[]]
  'add-option': []
  'remove-option': [index: number]
}>()

const addOption = () => emit('add-option')

const removeOption = (index: number) => emit('remove-option', index)

const updateOptionText = (index: number, text: string) => {
  const updatedOptions: QuestionOption[] = props.options.map((option, i) =>
    i === index ? { text, value: option.value } : option,
  )
  emit('update:options', updatedOptions)
}

const updateOptionValue = (index: number, value: string) => {
  const updatedOptions: QuestionOption[] = props.options.map((option, i) =>
    i === index ? { text: option.text, value: Number(value) } : option,
  )
  emit('update:options', updatedOptions)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        @click="addOption"
        class="text-primary-500 underline text-[14px] font-medium hover:text-primary-600"
      >
        Add options
      </button>
      <BaseTooltipIcon :text="t('pages.quizCreation.addQuestion.optionsInfo')" placement="top" />
    </div>

    <div v-for="(option, index) in options" :key="index" class="grid grid-cols-10 w-full gap-x-4">
      <div class="col-span-6">
        <BaseInput
          :model-value="option.text"
          @update:model-value="(val) => updateOptionText(index, val)"
          :placeholder="`Option ${index + 1}`"
          type="text"
        />
      </div>
      <div class="col-span-3">
        <BaseInput
          :model-value="option.value"
          @update:model-value="(val) => updateOptionValue(index, val)"
          type="number"
        />
      </div>
      <div class="col-span-1 flex items-center">
        <div class="cursor-pointer" @click="removeOption(index)">
          <BaseButtonIcon
            icon="delete-outline"
            iconClass="!text-pink !w-[12px]"
            size="sm"
            variant="default"
            class="!bg-pink/10"
          />
        </div>
      </div>
    </div>
    <BaseText v-if="error" :text="error" class="!text-error-500 !text-[12px] !leading-[15px]" />
  </div>
</template>
