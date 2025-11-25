<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { BasePopupModal, BaseStepper, BaseButton } from '@/components/common'
import {
  LessonFilesStep,
  LessonSettingsStep,
  LessonAssociationsStep,
  LessonRestrictionsStep,
  LessonParticipantsStep,
  LessonPublishSuccessModal,
} from './'
import { useLessonsStore } from '@/stores/lessonsStore'
import { t } from '@/utils/i18n'
import type { Media } from '@/types/Media'
import { buildCreateLessonPayload, type AssociationsShape } from '@/utils/lessonPayload'
import type { LessonDetails } from '@/types/Lessons'
import type { Restriction } from '@/types/Course'

interface Props {
  show?: boolean
  editLesson?: LessonDetails | null
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  editLesson: null,
})

const emit = defineEmits<{ close: [] }>()

const lessonsStore = useLessonsStore()
const currentStep = ref(1)
const totalSteps = 5
const uploadedFiles = ref<Media[]>([])
const currentGroupSettings = ref({ enabled: false, force: false })

// Child refs to collect data from steps
type SettingsExpose = { getSettings: () => Record<string, unknown> }
type AssociationsExpose = { getAssociations: () => { leftItems: Array<Record<string, unknown>> } }
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
const isEditing = computed(() => Boolean(props.editLesson))
const pendingSettings = ref<Record<string, unknown> | null>(null)
const filesStepValidation = ref<{ isValid: boolean; errors: string[] }>({
  isValid: true,
  errors: [],
})
const settingsStepValidation = ref<{ isValid: boolean; errors: string[] }>({
  isValid: true,
  errors: [],
})

// Format existing participants from participants array (without participantsView)
// The participants array contains: { id, relatedId, relatedType, order }
// We use relatedId as the participant ID and relatedType to determine the type
const formattedParticipants = computed(() => {
  const lesson = props.editLesson as unknown as {
    participants?: Array<{ relatedId: number; relatedType: string; order?: number }>
  }

  if (!lesson?.participants || lesson.participants.length === 0) {
    return []
  }

  const participantsMap = lesson.participants

  return participantsMap
    .filter((p: { relatedId: number; relatedType: string }) => p && p.relatedId && p.relatedType)
    .map((p: { relatedId: number; relatedType: string; order?: number }, index: number) => {
      // Convert relatedType to lowercase for component compatibility
      let type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles' = 'users'
      const typeUpper = String(p.relatedType).toUpperCase()
      if (typeUpper === 'USERS') type = 'users'
      else if (typeUpper === 'GROUPS') type = 'groups'
      else if (typeUpper === 'STORES') type = 'stores'
      else if (typeUpper === 'CLUSTERS') type = 'clusters'
      else if (typeUpper === 'ROLES') type = 'roles'

      // Return formatted participant with just ID and type
      // The LessonParticipantsStep component will handle displaying them
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

const steps = computed(() => [
  { label: t('pages.lesson.create.steps.files') },
  { label: t('pages.lesson.create.steps.settings') },
  { label: t('pages.lesson.create.steps.associations') },
  { label: t('pages.lesson.create.steps.restrictions') },
  { label: t('pages.lesson.create.steps.participants') },
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

const handleCreate = async () => {
  const settings = (settingsRef.value?.getSettings?.() || {}) as Record<string, unknown>
  const associations = associationsRef.value?.getAssociations?.() || { leftItems: [] }
  const participantsData = participantsRef.value?.getParticipants?.() || { participants: [] }

  // Get restrictions data
  const accessRestrictions = restrictionsRef.value?.getRestrictions?.() || []
  const recurrence = restrictionsRef.value?.getRecurrence?.() || null
  const completionCondition = restrictionsRef.value?.getCompletionCondition?.() || ''

  // Derive associations by type
  const assocLeft: Array<Record<string, unknown>> = Array.isArray(associations.leftItems)
    ? (associations.leftItems as Array<Record<string, unknown>>)
    : []
  const payload = buildCreateLessonPayload({
    settings,
    uploadedFiles: uploadedFiles.value,
    associations: { leftItems: assocLeft as unknown as AssociationsShape['leftItems'] },
    accessRestrictions,
    recurrence,
    completionCondition,
    participants: participantsData.participants as unknown as Array<Record<string, unknown>>,
  })

  console.log('payload: Lesson Creation', payload)
  const formData = new FormData()
  // formData.append('request', JSON.stringify(payload))
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
      // Creating new lesson - append even if it's Media (shouldn't happen, but safety check)
      formData.append('attachment', imageItem as unknown as File)
    }
    // If editing and imageItem is Media (existing), don't append - backend will use existing
  }

  if (isEditing.value) {
    await lessonsStore.updateLessonDetails(props.editLesson?.id as number, formData as FormData)
  } else {
    await lessonsStore.createLesson(formData)
  }
  showSuccessModal.value = true
}

// Prefill modal when editLesson provided
watch(
  () => props.editLesson,
  async (val) => {
    if (!val) return
    const ct = val.completionTracking as { enabled?: boolean; show?: boolean } | undefined
    const attachmentArr = val.attachment ? ([val.attachment] as unknown as Media[]) : []
    const initial = {
      fullName: val.name,
      shortName: val.shortName,
      visibility: val.visibility,
      startDate: val.startDate,
      endDate: val.endDate,
      alwaysAvailable: val.alwaysAvailable,
      idNumber: val.idNumber,
      summary: val.description,
      image: attachmentArr,
      enableCompletionTracking: ct?.enabled,
      showActivityCompletionConditions: ct?.show,
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
  () => props.editLesson,
  async (val, oldVal) => {
    if (!val) {
      // When editLesson becomes null/undefined, clear associations if we were editing
      // Check oldVal instead of isEditing.value since isEditing becomes false when editLesson is null
      if (oldVal) {
        await nextTick()
        const assocApi = associationsRef.value as unknown as {
          setLeftItems?: (items: Array<Record<string, unknown>>) => void
        }
        assocApi?.setLeftItems?.([])
      }
      return
    }
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

watch(
  () => settingsRef.value,
  async () => {
    if (pendingSettings.value) {
      await nextTick()
      const api = settingsRef.value as unknown as {
        setSettings?: (v: Record<string, unknown>) => void
      }
      if (api?.setSettings) {
        api.setSettings(pendingSettings.value)
        pendingSettings.value = null
      }
    }
  },
)

// Watch for navigation to participants step to update group settings
watch(
  () => currentStep.value,
  (step) => {
    if (step === 5) {
      // Entering participants step - update group settings
      const settings = settingsRef.value?.getSettings?.() || {}
      const gs = settings.groupSettings as { enabled: boolean; force: boolean } | undefined
      if (gs) {
        currentGroupSettings.value = { ...gs }
      }
    }
  },
)

const handleSuccessModalClose = () => {
  lessonsStore.fetchLessons({ isAdmin: true })
  lessonsStore.clearLessonDetails()
  showSuccessModal.value = false
  emit('close')
}

const handleCancel = () => {
  // Clear associations before clearing lesson details to ensure proper cleanup
  if (isEditing.value && associationsRef.value) {
    const assocApi = associationsRef.value as unknown as {
      setLeftItems?: (items: Array<Record<string, unknown>>) => void
    }
    assocApi?.setLeftItems?.([])
  }
  lessonsStore.clearLessonDetails()
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
</script>

<template>
  <BasePopupModal
    :title="isEditing ? t('pages.lesson.edit.title') : t('pages.lesson.create.title')"
    :fullscreen="true"
    :close-button="false"
    :enable-scroll="true"
  >
    <template #header-actions>
      <div class="flex items-center gap-2">
        <BaseButton
          :text="t('pages.lesson.create.buttons.cancel')"
          :variant="isFirstStep ? 'default' : 'link'"
          :color="isFirstStep ? 'neutral' : 'primary'"
          size="sm"
          @on-click="handleCancel"
          class="!min-w-[95px] !font-medium"
        />
        <BaseButton
          v-if="!isFirstStep"
          :text="t('pages.course.create.buttons.previous')"
          color="neutral"
          variant="default"
          size="sm"
          @on-click="handlePrevious"
          class="!min-w-[106px] !font-medium"
        />
        <BaseButton
          v-if="!isLastStep"
          :text="t('pages.course.create.buttons.next')"
          color="primary"
          variant="default"
          size="sm"
          :disabled="!canProceed"
          @on-click="handleNext"
          class="!min-w-[80px] !font-medium"
        />
        <BaseButton
          v-else
          :text="
            isEditing
              ? t('pages.manageCourses.buttons.update')
              : t('pages.course.create.buttons.publish')
          "
          color="primary"
          variant="default"
          size="sm"
          @on-click="handleCreate"
        />
      </div>
    </template>

    <div class="p-8 md:p-4 lg:p-8">
      <!-- Stepper -->
      <BaseStepper :steps="steps" :current-step="currentStep" />

      <div class="mt-[48px] md:mt-8 lg:mt-[48px]">
        <LessonFilesStep
          v-show="currentStep === 1"
          :uploaded-files="uploadedFiles"
          @update:uploaded-files="handleFileUpdate"
          @validation-change="handleFilesValidationChange"
        />
        <LessonSettingsStep
          v-show="currentStep === 2"
          ref="settingsRef"
          @validation-change="handleSettingsValidationChange"
        />
        <LessonAssociationsStep
          v-show="currentStep === 3"
          ref="associationsRef"
          :uploaded-files="uploadedFiles"
          :lesson-id="editLesson?.id"
          :edit-lesson="editLesson || undefined"
        />
        <LessonRestrictionsStep
          v-show="currentStep === 4"
          :leftItems="
            (associationsRef?.getAssociations?.()?.leftItems ||
              []) as AssociationsShape['leftItems']
          "
          :restrictions="restrictionsRef?.getRestrictions?.() || []"
          :edit-lesson="editLesson || undefined"
          ref="restrictionsRef"
        />
        <LessonParticipantsStep
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
  <LessonPublishSuccessModal
    v-if="showSuccessModal"
    :is-edit="isEditing"
    @close="handleSuccessModalClose"
  />
</template>
`
