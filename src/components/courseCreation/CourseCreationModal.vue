<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { BasePopupModal, BaseStepper, BaseButton } from '@/components/common'
import {
  CourseFilesStep,
  CourseSettingsStep,
  CourseAssociationsStep,
  CourseRestrictionsStep,
  CourseParticipantsStep,
  CoursePublishSuccessModal,
} from './'
import { useCourseStore } from '@/stores/courseStore'
import { t } from '@/utils/i18n'
import { buildCreateCoursePayload, type AssociationsShape } from '@/utils/coursePayload'
import type { Media } from '@/types/Media'
import type { CourseDetails, Restriction, ParticipantShape } from '@/types/Course'

interface Props {
  title?: string
  editCourse?: CourseDetails
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  editCourse: undefined,
})

const emit = defineEmits<{
  close: []
}>()
const courseStore = useCourseStore()
const currentStep = ref(1)
const totalSteps = 5
const uploadedFiles = ref<Media[]>([])
const isEditing = computed(() => !!props.editCourse)
const pendingSettings = ref<Record<string, unknown> | null>(null)
const currentGroupSettings = ref({ enabled: false, force: false })

const formattedParticipants = computed(() => {
  if (!props.editCourse?.participants || props.editCourse.participants.length === 0) {
    return []
  }

  const participantsMap = props.editCourse.participants

  return participantsMap
    .filter((p: ParticipantShape) => p && p.relatedId && p.relatedType)
    .map((p: ParticipantShape, index: number) => {
      // Convert relatedType to lowercase for component compatibility
      let type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles' = 'users'
      const typeUpper = String(p.relatedType).toUpperCase()
      if (typeUpper === 'USERS') type = 'users'
      else if (typeUpper === 'GROUPS') type = 'groups'
      else if (typeUpper === 'STORES') type = 'stores'
      else if (typeUpper === 'CLUSTERS') type = 'clusters'
      else if (typeUpper === 'ROLES') type = 'roles'

      // Return formatted participant with just ID and type
      // The CourseParticipantsStep component will handle displaying them
      // and can fetch details from API if needed when loading the right lists
      return {
        index: p.order ?? index,
        id: p.relatedId, // Use relatedId as the actual participant ID
        type: type,
        // Optional fields - component will work with just ID and type
        name: undefined,
        surname: undefined,
        fullName: undefined,
        email: undefined,
        title: undefined,
      }
    })
})

// Child refs to keep parity with CreateLessonModal
type SettingsExpose = { getSettings?: () => Record<string, unknown> }
type AssociationsExpose = { getAssociations?: () => { leftItems: Array<Record<string, unknown>> } }
type RestrictionsExpose = {
  getRestrictions?: () => Restriction[]
  getRecurrence?: () => Record<string, unknown> | null
  getCompletionCondition?: () => string
}
type ParticipantsExpose = {
  getParticipants?: () => { participants: Array<Record<string, unknown>> }
}
const settingsRef = ref<SettingsExpose | null>(null)
const associationsRef = ref<AssociationsExpose | null>(null)
const restrictionsRef = ref<RestrictionsExpose | null>(null)
const participantsRef = ref<ParticipantsExpose | null>(null)
const showSuccessModal = ref(false)
const filesStepValidation = ref<{ isValid: boolean; errors: string[] }>({
  isValid: true,
  errors: [],
})
const settingsStepValidation = ref<{ isValid: boolean; errors: string[] }>({
  isValid: true,
  errors: [],
})

const steps = computed(() => [
  { label: t('pages.course.create.steps.files') },
  { label: t('pages.course.create.steps.settings') },
  { label: t('pages.course.create.steps.associations') },
  { label: t('pages.course.create.steps.restrictions') },
  { label: t('pages.course.create.steps.participants') },
])

const handleNext = () => {
  // Update group settings when leaving settings step
  if (currentStep.value === 2) {
    const settings = settingsRef.value?.getSettings?.() || {}
    const gs = settings.groupSettings as { enabled: boolean; force: boolean } | undefined
    if (gs) {
      currentGroupSettings.value = { ...gs }
    }
  }

  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const handlePrevious = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Watch for navigation to participants step to update group settings and initialize participants
watch(
  () => currentStep.value,
  async (step) => {
    if (step === 5) {
      // Entering participants step - update group settings
      const settings = settingsRef.value?.getSettings?.() || {}
      const gs = settings.groupSettings as { enabled: boolean; force: boolean } | undefined
      if (gs) {
        currentGroupSettings.value = { ...gs }
      }

      // Initialize participants if editing and we have formatted participants
      // The existingParticipants prop should handle this via watch, but we ensure it's set
      if (isEditing.value && formattedParticipants.value.length > 0) {
        await nextTick()
      }
    }
  },
)

const handleCreate = async () => {
  const settings = (settingsRef.value?.getSettings?.() || {}) as Record<string, unknown>
  const associations = associationsRef.value?.getAssociations?.() || { leftItems: [] }
  const participantsData = participantsRef.value?.getParticipants?.() || { participants: [] }

  // Get restrictions data
  const accessRestrictions = restrictionsRef.value?.getRestrictions?.() || []
  const recurrence = restrictionsRef.value?.getRecurrence?.() || null
  const completionCondition = restrictionsRef.value?.getCompletionCondition?.() || ''

  const payload = buildCreateCoursePayload({
    settings,
    uploadedFiles: uploadedFiles.value,
    associations: {
      leftItems: associations.leftItems as unknown as AssociationsShape['leftItems'],
    },
    accessRestrictions,
    recurrence,
    completionCondition,
    participants: participantsData.participants as unknown as ParticipantShape[],
  })
  // return
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  uploadedFiles.value.forEach((file) => {
    formData.append('files', file as unknown as Blob)
  })

  // Only append attachment if it's a new File upload (not existing Media)
  const imageArray = settings.image as unknown as Media[] | File[]
  if (imageArray && imageArray.length > 0) {
    const imageItem = imageArray[0]
    // Check if it's a File instance (new upload) or Media object (existing)
    if (imageItem instanceof File) {
      // New file uploaded - append to formData
      formData.append('attachment', imageItem)
    } else if (!isEditing.value) {
      // Creating new course - append even if it's Media (shouldn't happen, but safety check)
      formData.append('attachment', imageItem as unknown as File)
    }
    // If editing and imageItem is Media (existing), don't append - backend will use existing
  }

  if (props.editCourse?.id) {
    await courseStore.updateCourse(props.editCourse.id, formData as FormData)
  } else {
    await courseStore.createCourse(formData)
  }
  showSuccessModal.value = true
}

const handleSuccessModalClose = async () => {
  courseStore.clearCourseDetails()
  await courseStore.fetchCourses({ page: 0, perPage: 12, isAdmin: true })
  showSuccessModal.value = false
  emit('close')
}

const handleCancel = () => {
  courseStore.clearCourseDetails()
  emit('close')
}

// Dynamic component selector not used anymore due to KeepAlive v-show strategy

const isFirstStep = computed(() => currentStep.value === 1)
const isLastStep = computed(() => currentStep.value === totalSteps)
const canProceed = computed(() => {
  if (currentStep.value === 1) return filesStepValidation.value.isValid
  if (currentStep.value === 2) return settingsStepValidation.value.isValid
  return true
})

const handleFileUpdate = (files: Media[]) => {
  uploadedFiles.value = files
}

const handleFilesValidationChange = (isValid: boolean, errors: string[]) => {
  filesStepValidation.value = { isValid, errors }
}

const handleSettingsValidationChange = (isValid: boolean, errors: string[]) => {
  settingsStepValidation.value = { isValid, errors }
}

// Prefill modal when editLesson provided
watch(
  () => props.editCourse,
  async (val) => {
    if (!val) return
    const attachmentArr = val.attachment ? ([val.attachment] as unknown as Media[]) : []
    const initial = {
      fullName: val.name,
      shortName: val.shortName,
      visibility: val.visibility,
      startDate: val.startDate,
      endDate: val.endDate,
      category: val.categoryId?.toString() || '',
      alwaysAvailable: val.alwaysAvailable,
      idNumber: val.idNumber,
      summary: val.description,
      image: attachmentArr,
      enableCompletionTracking: val.completionTracking?.enabled,
      showActivityCompletionConditions: val.completionTracking?.show,
    }
    pendingSettings.value = initial
    await nextTick()
    const api = settingsRef.value as unknown as {
      setSettings?: (v: Record<string, unknown>) => void
    }
    if (api?.setSettings && pendingSettings.value) {
      api.setSettings(pendingSettings.value)
      pendingSettings.value = null
    }
  },
  { immediate: true },
)
const assignationType = (type: string) => {
  if (type.toLowerCase().includes('lesson')) return 'lesson'
  if (type.toLowerCase().includes('file')) return 'file'
  if (type.toLowerCase().includes('course')) return 'course'
  if (type.toLowerCase().includes('quiz')) return 'quiz'
  return type
}

watch(
  () => props.editCourse,
  async (val) => {
    if (!val) return
    const assignations = (val as unknown as Record<string, unknown>).assignations as
      | Array<Record<string, unknown>>
      | undefined
    const mapped = (assignations || []).map((a, index: number) => {
      const aRec = a as Record<string, unknown>
      const isLesson = a.relatedType === 'lesson'
      const model = aRec.model as Record<string, unknown> | undefined
      const title =
        (model?.name as string) ||
        (model?.customFileName as string) ||
        (model?.fileName as string) ||
        (model?.title as string) ||
        '-'
      const urlVal = model?.url as unknown
      const thumbUrl = typeof urlVal === 'string' ? (urlVal as string) : undefined
      return {
        id: (aRec.relatedId as number) ?? (aRec.id as number) ?? index,
        type: assignationType(a.relatedType as string),
        title,
        iconBg: 'bg-neutral-100',
        iconName: isLesson ? 'lesson' : 'file-outline',
        iconColor: 'neutral',
        isNew: false,
        sourceList: isLesson ? 'lessons' : 'files',
        thumbUrl,
      }
    })
    await nextTick()
    const assocApi = associationsRef.value as unknown as {
      setLeftItems?: (items: Array<Record<string, unknown>>) => void
    }
    assocApi?.setLeftItems?.(mapped)
  },
  { immediate: true },
)
</script>

<template>
  <BasePopupModal
    :title="isEditing ? t('pages.course.edit.title') : t('pages.course.create.title')"
    :fullscreen="true"
    :close-button="false"
    :enable-scroll="true"
  >
    <template #header-actions>
      <div class="flex items-center gap-2 md:gap-1.5 lg:gap-2">
        <BaseButton
          :text="t('pages.course.create.buttons.cancel')"
          :variant="isFirstStep ? 'default' : 'link'"
          :color="isFirstStep ? 'neutral' : 'primary'"
          size="sm"
          @on-click="handleCancel"
          class="!min-w-[95px] md:!min-w-[85px] lg:!min-w-[95px] !font-medium whitespace-nowrap"
        />
        <BaseButton
          v-if="!isFirstStep"
          :text="t('pages.course.create.buttons.previous')"
          color="neutral"
          variant="default"
          size="sm"
          @on-click="handlePrevious"
          class="!min-w-[106px] md:!min-w-[95px] lg:!min-w-[106px] !font-medium whitespace-nowrap"
        />
        <BaseButton
          v-if="!isLastStep"
          :text="t('pages.course.create.buttons.next')"
          color="primary"
          variant="default"
          size="sm"
          :disabled="!canProceed"
          @on-click="handleNext"
          class="!min-w-[80px] md:!min-w-[70px] lg:!min-w-[80px] !font-medium whitespace-nowrap"
        />
        <BaseButton
          v-else
          :text="t('pages.course.create.buttons.publish')"
          color="primary"
          variant="default"
          size="sm"
          @on-click="handleCreate"
          class="whitespace-nowrap"
        />
      </div>
    </template>

    <div class="p-8 md:p-4 lg:p-8">
      <!-- Stepper -->
      <BaseStepper :steps="steps" :current-step="currentStep" />

      <!-- Step Content (v-show preserves state while toggling visibility) -->
      <div class="mt-[48px] md:mt-8 lg:mt-[48px]">
        <CourseFilesStep
          v-show="currentStep === 1"
          :uploaded-files="uploadedFiles"
          @update:uploaded-files="handleFileUpdate"
          @validation-change="handleFilesValidationChange"
        />
        <CourseSettingsStep
          v-show="currentStep === 2"
          ref="settingsRef"
          @validation-change="handleSettingsValidationChange"
        />
        <CourseAssociationsStep
          v-show="currentStep === 3"
          ref="associationsRef"
          :uploaded-files="uploadedFiles"
          :courseId="editCourse?.id"
          :editCourse="editCourse"
        />
        <CourseRestrictionsStep
          v-show="currentStep === 4"
          :leftItems="
            (associationsRef?.getAssociations?.()?.leftItems ||
              []) as AssociationsShape['leftItems']
          "
          :restrictions="restrictionsRef?.getRestrictions?.() || []"
          :editCourse="editCourse"
          ref="restrictionsRef"
        />
        <CourseParticipantsStep
          v-show="currentStep === 5"
          ref="participantsRef"
          :is-edit="true"
          :group-settings="currentGroupSettings"
          :existing-participants="formattedParticipants"
        />
      </div>
    </div>
  </BasePopupModal>

  <!-- Success Modal -->
  <CoursePublishSuccessModal v-if="showSuccessModal" @close="handleSuccessModalClose" />
</template>
