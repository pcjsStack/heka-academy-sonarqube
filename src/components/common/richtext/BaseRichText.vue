<template>
  <div class="flex w-full flex-col gap-1.5">
    <div v-if="label" class="flex items-center space-x-1">
      <BaseText
        :text="`${label}`"
        :tone="700"
        color="neutral"
        font="medium"
        type="p-sm"
        :class="labelClass"
      />
      <span v-if="required" class="text-pink !ml-0 text-[12px] tracking-[-0.01em] leading-tight">
        *
      </span>
    </div>
    <div
      :class="{
        default: (status ?? 'default') == 'default',
        error: (status ?? 'default') == 'error',
        success: (status ?? 'default') == 'success',
      }"
      class="relative"
    >
      <component
        :is="CKEditor.component"
        :editor="ClassicEditor"
        :config="editorConfig"
        :model-value="modelValue"
        :disabled="disabled || readonly"
        @update:model-value="saveOnChange"
        @blur="saveOnBlur"
      />
    </div>
    <div v-if="Array.isArray(hintMessage)">
      <BaseText
        v-for="(message, i) in hintMessage"
        :key="`hint-message-${i}`"
        :color="status == 'error' ? 'error' : status == 'success' ? 'success' : 'neutral'"
        :text="message"
        font="medium"
        :type="textType"
      />
    </div>
    <div v-else-if="hintMessage">
      <BaseText
        :color="status == 'error' ? 'error' : status == 'success' ? 'success' : 'neutral'"
        :text="hintMessage"
        font="medium"
        :type="textType"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
import CKEditor from '@ckeditor/ckeditor5-vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { ref } from 'vue'
import BaseText from '../text/BaseText.vue'
import type { BaseTextType } from '@/types/BaseTextTypes'

const props = withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    modelValue: any
    hintMessage?: string | string[]
    placeholder?: string
    updateOnBlur?: boolean
    textType?: BaseTextType
    status?: 'default' | 'error' | 'success'
    labelClass?: string
  }>(),
  {
    textType: 'p-sm',
  },
)

const emit = defineEmits<{
  'update:modelValue': [files: []]
}>()

const saveOnBlur = (value: any, editor: any) => {
  if (props.updateOnBlur) {
    setValue(editor.getData())
  }
}

const saveOnChange = (value: any) => {
  if (!props.updateOnBlur) {
    setValue(value)
  }
}

const setValue = (value: any) => {
  emit('update:modelValue', value)
}

const editorConfig = ref({
  licenseKey: 'GPL',
  alignment: {
    options: ['left', 'center', 'right'],
  },
  placeholder: props.placeholder,
  toolbar: {
    items: [
      'undo',
      'redo',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'imageUpload',
      'blockQuote',
    ],
  },
  image: {
    toolbar: [
      'imageTextAlternative',
      '|',
      'imageStyle:alignLeft',
      'imageStyle:alignRight',
      'imageStyle:alignCenter',
    ],
  },
})
</script>

<style>
.ck-editor__editable {
  min-height: 104px;
}
.ck-editor__editable.ck-focused {
  --tw-border-opacity: 1;
  border-color: rgb(99 112 131 / var(--tw-border-opacity, 1)) !important;
}
.ck.ck-powered-by {
  display: none;
}
.ck.ck-sticky-panel__content,
.ck.ck-toolbar.ck-toolbar_grouping {
  border-radius: 8px 8px 0 0 !important;
}
.ck-rounded-corners.ck-editor__editable_inline {
  border-radius: 0 0 8px 8px !important;
}
.ck .ck-placeholder:before,
.ck.ck-placeholder:before {
  @apply: !text-neutral-500;
}

ul {
  padding-left: 2rem;
  list-style: disc;
}

ol {
  padding-left: 2rem;
  list-style: normal;
}

.ck h2 {
  @apply text-2xl font-bold;
}
.ck h3 {
  @apply text-xl font-bold;
}
.ck h4 {
  @apply text-lg font-bold;
}

.default .ck.ck-editor__main > .ck-editor__editable:not(.ck-focused) {
  @apply border-neutral-300 focus:border-primary-400 focus:ring-blue-200 disabled:border-neutral-300;
}

.error .ck.ck-editor__main > .ck-editor__editable:not(.ck-focused) {
  @apply border-error-300 focus:border-error-400 focus:ring-error-200;
}

.success .ck.ck-editor__main > .ck-editor__editable:not(.ck-focused) {
  @apply border-success-300 focus:border-success-400 focus:ring-success-200;
}
</style>
