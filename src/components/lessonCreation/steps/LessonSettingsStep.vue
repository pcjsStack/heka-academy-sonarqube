<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import moment from 'moment'
import {
  BaseInput,
  BaseSelect,
  BaseRichText,
  BaseText,
  BaseDragAndDropFiles,
  BaseIcon,
  BaseDatepicker,
  BaseRadioButton,
  BaseButtonIcon,
} from '@/components/common'
import { t } from '@/utils/i18n'
import type { Media } from '@/types/Media'
import { VisibilityStatus } from '@/types/Course'
import { getFileUrl, getFileType, fileSizeConvert } from '@/utils/generalUtils'
import { visibilityOptions, yesNoOptions, groupSettingOptions } from '@/utils/defaultOption'

// Form data - General Section
const FullName = ref('')
const ShortName = ref('')
const Category = ref('')
const Visibility = ref<string>(VisibilityStatus.SHOW)
const StartDate = ref('')
const EndDate = ref('')
const alwaysAvailable = ref(false)
const IdNumber = ref('')

// Form data - Description Section
const Summary = ref('')
const Image = ref<Media[]>([])

// Form data - Completion Tracking Section
const enableCompletionTracking = ref('yes')
const showActivityCompletionConditions = ref('yes')

const groupSettings = ref({
  enabled: false,
  force: false,
})
const groupEnabled = ref('no')
const groupMode = ref<'group' | 'force'>('group')

// Collapsible sections state
const generalExpanded = ref(true)
const descriptionExpanded = ref(true)
const completionExpanded = ref(true)
const groupsExpanded = ref(true)

// Options

const toggleSection = (section: string) => {
  switch (section) {
    case 'general':
      generalExpanded.value = !generalExpanded.value
      break
    case 'description':
      descriptionExpanded.value = !descriptionExpanded.value
      break
    case 'completion':
      completionExpanded.value = !completionExpanded.value
      break
    case 'groups':
      groupsExpanded.value = !groupsExpanded.value
      break
  }
}

// Validation state and flow (required: full name, short name, image)
const emit = defineEmits<{
  'validation-change': [isValid: boolean, errors: string[]]
}>()

const errors = ref<string[]>([])

const isFullNameValid = computed(() => !!FullName.value && FullName.value.trim().length > 0)
const isShortNameValid = computed(() => !!ShortName.value && ShortName.value.trim().length > 0)
const isImageValid = computed(() => Array.isArray(Image.value) && Image.value.length > 0)

const validateSettings = () => {
  const newErrors: string[] = []
  if (!isFullNameValid.value) newErrors.push('Full name is required.')
  if (!isShortNameValid.value) newErrors.push('Short name is required.')
  if (!isImageValid.value) newErrors.push('Image is required.')
  errors.value = newErrors
  emit('validation-change', newErrors.length === 0, newErrors)
}

watch(
  [FullName, ShortName, Image],
  () => {
    validateSettings()
  },
  { immediate: true, deep: true },
)

const removeImage = (index: number) => {
  Image.value.splice(index, 1)
}

// Clear dates when Always Available is turned on
watch(
  () => alwaysAvailable.value,
  (val) => {
    if (val) {
      StartDate.value = ''
      EndDate.value = ''
    }
  },
)
// Sync groupSettings object with individual refs
watch(
  [groupEnabled, groupMode],
  () => {
    groupSettings.value = {
      enabled: groupEnabled.value === 'yes',
      force: groupMode.value === 'force',
    }
  },
  { immediate: true },
)

// Expose getter for parent to collect form data
defineExpose({
  getSettings: () => ({
    fullName: FullName.value,
    shortName: ShortName.value,
    category: Category.value,
    visibility: Visibility.value,
    startDate: StartDate.value,
    endDate: EndDate.value,
    alwaysAvailable: alwaysAvailable.value,
    idNumber: IdNumber.value,
    summary: Summary.value,
    image: Image.value,
    enableCompletionTracking: enableCompletionTracking.value,
    showActivityCompletionConditions: showActivityCompletionConditions.value,
    groupSettings: groupSettings.value,
  }),
  setSettings: (vals: Record<string, unknown>) => {
    if (!vals) return
    if (typeof vals.fullName === 'string') FullName.value = vals.fullName
    if (typeof vals.shortName === 'string') ShortName.value = vals.shortName
    if (typeof vals.category === 'string') Category.value = vals.category
    if (typeof vals.visibility === 'string') Visibility.value = vals.visibility
    if (typeof vals.startDate === 'string')
      StartDate.value = moment(vals.startDate).format('YYYY-MM-DD HH:mm')
    if (typeof vals.endDate === 'string')
      EndDate.value = moment(vals.endDate).format('YYYY-MM-DD HH:mm')
    if (typeof vals.alwaysAvailable === 'boolean') alwaysAvailable.value = vals.alwaysAvailable
    if (typeof vals.idNumber === 'string') IdNumber.value = vals.idNumber
    if (typeof vals.summary === 'string') Summary.value = vals.summary
    if (Array.isArray(vals.image)) Image.value = vals.image as Media[]
    if (typeof vals.enableCompletionTracking !== 'undefined')
      enableCompletionTracking.value = (vals.enableCompletionTracking as boolean) ? 'yes' : 'no'
    if (typeof vals.showActivityCompletionConditions !== 'undefined')
      showActivityCompletionConditions.value = (vals.showActivityCompletionConditions as boolean)
        ? 'yes'
        : 'no'
    if (vals.groupSettings && typeof vals.groupSettings === 'object') {
      const settings = vals.groupSettings as { enabled: boolean; force: boolean }
      groupEnabled.value = settings.enabled ? 'yes' : 'no'
      groupMode.value = settings.force ? 'force' : 'group'
    }
  },
})
</script>

<template>
  <div class="max-w-[816px] mx-auto">
    <BaseText
      :text="t('pages.lesson.create.steps.settings')"
      font="semibold"
      class="mb-8 md:mb-6 lg:mb-8 !text-black/85 !text-[18px] md:!text-[16px] lg:!text-[18px] !leading-[18px] !tracking-[-0.02em]"
    />

    <div class="space-y-[40px] md:space-y-6 lg:space-y-[40px]">
      <!-- General Section -->
      <div class="">
        <button
          @click="toggleSection('general')"
          class="w-full flex items-center justify-start text-left gap-3 mb-[23px] md:mb-4 lg:mb-[23px]"
        >
          <BaseIcon
            :name="generalExpanded ? 'chevron-up' : 'chevron-down'"
            size="sm"
            color="neutral"
          />
          <BaseText
            :text="t('pages.lesson.settings.general.title')"
            font="semibold"
            class="!text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />
        </button>

        <div v-if="generalExpanded">
          <!-- Two Column Layout -->
          <div class="grid grid-cols-2 gap-6 md:gap-5 lg:gap-6">
            <!-- Left Column -->
            <div class="space-y-[19px] md:space-y-4 lg:space-y-[19px]">
              <!-- Full Name -->
              <BaseInput
                v-model="FullName"
                :label="t('pages.lesson.settings.general.fullName')"
                :placeholder="t('pages.lesson.settings.general.fullNamePlaceholder')"
                required
                type="text"
              />

              <!-- ID Number -->
              <BaseInput
                v-model="IdNumber"
                :label="t('pages.lesson.settings.general.idNumber')"
                :placeholder="t('pages.lesson.settings.general.idNumberPlaceholder')"
                type="text"
              />

              <!-- Start Date and Time -->
              <BaseDatepicker
                v-model="StartDate"
                :min-date="new Date()"
                :label="t('pages.lesson.settings.general.startDate')"
                :placeholder="t('pages.lesson.settings.general.startDatePlaceholder')"
                :disabled="alwaysAvailable"
                format="MMMM dd, yyyy - hh:mm aa"
              />
            </div>

            <!-- Right Column -->
            <div class="space-y-4 md:space-y-3 lg:space-y-4">
              <!-- Short Name -->
              <BaseInput
                v-model="ShortName"
                required
                :label="t('pages.lesson.settings.general.shortName')"
                :placeholder="t('pages.lesson.settings.general.shortNamePlaceholder')"
                type="text"
              />

              <!-- Visibility -->
              <BaseSelect
                v-model="Visibility"
                :label="t('pages.lesson.settings.general.visibility')"
                :placeholder="t('pages.lesson.settings.general.visibilityPlaceholder')"
                :options="visibilityOptions"
              />

              <!-- End Date and Time -->
              <div>
                <div class="flex items-center justify-between gap-2 mb-2 md:mb-1.5 lg:mb-2">
                  <BaseText
                    :text="t('pages.lesson.settings.general.endDate')"
                    :tone="700"
                    color="neutral"
                    font="medium"
                    type="p-sm"
                    class="text-xs-custom text-custom-label-text"
                  />
                  <div class="flex gap-2">
                    <BaseIcon
                      :name="alwaysAvailable ? 'toggle' : 'toggle-off'"
                      class="toggle-icon flex items-center justify-center !w-4 !h-4 mt-1"
                      @click="alwaysAvailable = !alwaysAvailable"
                      :class="alwaysAvailable ? 'text-primary-550' : 'text-black/50'"
                    />
                    <BaseText
                      :text="t('pages.lesson.settings.general.alwaysAvailable')"
                      class="!text-black/50 !text-[14px]"
                    />
                  </div>
                </div>
                <BaseDatepicker
                  v-model="EndDate"
                  :min-date="StartDate ? new Date(StartDate) : new Date()"
                  :placeholder="t('pages.lesson.settings.general.endDatePlaceholder')"
                  :disabled="alwaysAvailable"
                  format="MMMM dd, yyyy - hh:mm aa"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="">
        <button
          @click="toggleSection('description')"
          class="w-full flex items-center justify-start text-left gap-3 mb-[23px] md:mb-4 lg:mb-[23px]"
        >
          <BaseIcon
            :name="descriptionExpanded ? 'chevron-up' : 'chevron-down'"
            size="sm"
            color="neutral"
          />
          <BaseText
            :text="t('pages.lesson.settings.description.title')"
            font="semibold"
            class="!text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />
        </button>

        <div v-if="descriptionExpanded">
          <!-- Two Column Layout -->
          <div class="grid grid-cols-2 gap-6 md:gap-5 lg:gap-6">
            <!-- Left Column - Summary -->
            <div>
              <BaseText
                :text="t('pages.lesson.settings.description.description')"
                :tone="700"
                color="neutral"
                font="medium"
                type="p-sm"
                class="mb-2 md:mb-1.5 lg:mb-2"
              />
              <BaseRichText
                v-model="Summary"
                :placeholder="t('pages.lesson.settings.description.descriptionPlaceholder')"
              />
            </div>

            <!-- Right Column - Image -->
            <div>
              <div class="flex items-center space-x-1 mb-1 md:mb-0.5 lg:mb-1">
                <BaseText
                  :text="t('pages.lesson.settings.description.Image')"
                  :tone="700"
                  color="neutral"
                  font="medium"
                  type="p-sm"
                  class="text-xs-custom text-custom-label-text"
                />
                <span class="text-pink !ml-0 text-xs-custom tracking-[-0.01em] leading-tight">
                  *
                </span>
              </div>
              <BaseDragAndDropFiles
                :text="t('pages.lesson.create.files.dragDropText')"
                accept=".jpg,.jpeg,.png,.svg"
                :multiple="false"
                required
                :show-history="false"
                :model-value="Image"
                :custom_actions="true"
                @update:model-value="(files) => (Image = files as Media[])"
              >
                <template #customActions>
                  <div class="flex justify-between mt-2">
                    <BaseText
                      :text="t('pages.lesson.settings.description.supportedFormats')"
                      :tone="500"
                      color="neutral"
                      type="p-xs"
                      class="!font-medium"
                    />
                    <BaseText
                      :text="t('pages.lesson.settings.description.maxSize')"
                      :tone="500"
                      color="neutral"
                      type="p-xs"
                      class="!font-medium"
                    />
                  </div>
                  <div
                    class="mt-6 md:mt-5 lg:mt-6 flex flex-col gap-2 md:gap-1.5 lg:gap-2"
                    v-if="Image && Image.length"
                  >
                    <div
                      v-for="(file, i) in Image"
                      :key="file.id || i"
                      class="bg-grey-50 flex rounded-[16px] items-center gap-[16px] md:gap-3 lg:gap-[16px] py-[14px] md:py-3 lg:py-[14px] px-[14px] md:px-3 lg:px-[14px]"
                    >
                      <div>
                        <img
                          v-if="getFileType(file).startsWith('image/')"
                          :src="getFileUrl(file)"
                          class="w-8 h-8 md:w-7 md:h-7 lg:w-8 lg:h-8 min-w-[32px] md:min-w-[28px] lg:min-w-[32px] object-cover rounded-[8px]"
                        />
                      </div>
                      <div class="w-full min-w-0">
                        <BaseText
                          :text="(file as any).fileName || file.name"
                          color="neutral"
                          tailwind-css="block mb-[2px] !text-[14px] leading-[17px] !font-medium tracking-[-0.016px] text-neutral-700 max-w-[420px] whitespace-nowrap overflow-hidden text-ellipsis"
                        />
                        <BaseText
                          :text="fileSizeConvert(file.size)"
                          :tone="500"
                          color="neutral"
                          tailwind-css="!text-[12px] leading-[15px] tracking-[-0.016px] text-grey-700"
                        />
                      </div>
                      <div class="text-error-600 cursor-pointer">
                        <div @click="removeImage(i)">
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
                  </div>
                </template>
              </BaseDragAndDropFiles>
            </div>
          </div>
        </div>
      </div>

      <!-- Completion Tracking Section -->
      <div class="">
        <button
          @click="toggleSection('completion')"
          class="w-full flex items-center justify-start text-left gap-3 mb-[23px] md:mb-4 lg:mb-[23px]"
        >
          <BaseIcon
            :name="completionExpanded ? 'chevron-up' : 'chevron-down'"
            size="sm"
            color="neutral"
          />
          <BaseText
            :text="t('pages.lesson.settings.completion.title')"
            font="semibold"
            class="!text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />
        </button>

        <div v-if="completionExpanded">
          <!-- Two Column Layout -->
          <div class="grid grid-cols-2 gap-6 md:gap-5 lg:gap-6">
            <!-- Left Column - Enable Completion Tracking -->
            <div>
              <BaseSelect
                v-model="enableCompletionTracking"
                :label="t('pages.course.settings.completion.enable')"
                :options="yesNoOptions"
              />
            </div>

            <!-- Right Column - Show Activity Completion Conditions -->
            <div>
              <BaseSelect
                v-model="showActivityCompletionConditions"
                :label="t('pages.course.settings.completion.showConditions')"
                :options="yesNoOptions"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Groups Section -->
      <div class="">
        <button
          @click="toggleSection('groups')"
          class="w-full flex items-center justify-start text-left gap-3 mb-[23px] md:mb-4 lg:mb-[23px]"
        >
          <BaseIcon
            :name="groupsExpanded ? 'chevron-up' : 'chevron-down'"
            size="sm"
            color="neutral"
          />
          <BaseText
            :text="t('pages.lesson.settings.groups.title')"
            font="semibold"
            class="!text-black/85 !text-[16px] md:!text-[14px] lg:!text-[16px] !tracking-[-0.02em]"
          />
        </button>

        <div v-if="groupsExpanded">
          <div class="grid grid-cols-1 gap-6 md:gap-5 lg:gap-6">
            <div>
              <BaseText
                :text="t('pages.course.settings.groups.mode')"
                :tone="700"
                color="neutral"
                font="medium"
                type="p-sm"
                class="mb-2 md:mb-1.5 lg:mb-2 text-xs-custom text-custom-label-text"
              />
              <div class="grid grid-cols-1 gap-2 mb-5 md:mb-4 lg:mb-5">
                <BaseRadioButton
                  v-for="option in groupSettingOptions"
                  :key="option.value"
                  v-model="groupMode"
                  :value="option.value"
                  :label="option.label"
                  wrapperClass="w-full"
                />
              </div>
              <div class="grid grid-cols-2 gap-2 md:gap-1.5 lg:gap-2 mt-4 md:mt-3 lg:mt-4">
                <BaseSelect
                  v-model="groupEnabled"
                  :label="t('pages.course.settings.groups.enable')"
                  :options="yesNoOptions"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
