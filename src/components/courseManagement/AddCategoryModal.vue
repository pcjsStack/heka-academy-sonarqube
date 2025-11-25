<template>
  <BasePopupModal
    v-if="show"
    :title="props.categoryId ? t('pages.editCategory.title') : t('pages.addCategory.title')"
    :close-button="false"
    fullscreen
    size="full"
    @onClose="handleCancel"
  >
    <template #header-actions>
      <div class="flex items-center gap-2 md:gap-1.5 lg:gap-2">
        <BaseButton
          :text="t('pages.manageCourses.buttons.cancel')"
          :variant="isFirstStep ? 'default' : 'link'"
          :color="isFirstStep ? 'neutral' : 'primary'"
          size="sm"
          @on-click="handleCancel"
          class="!min-w-[95px] md:!min-w-[85px] lg:!min-w-[95px] !font-medium"
        />
        <BaseButton
          v-if="!isFirstStep"
          :text="t('pages.course.create.buttons.previous')"
          color="neutral"
          variant="default"
          size="sm"
          @on-click="handlePrevious"
          class="!min-w-[106px] md:!min-w-[95px] lg:!min-w-[106px] !font-medium"
        />
        <BaseButton
          v-if="!isLastStep"
          :text="t('pages.course.create.buttons.next')"
          color="primary"
          variant="default"
          size="sm"
          :disabled="!canProceed"
          @on-click="handleNext"
          class="!min-w-[80px] md:!min-w-[70px] lg:!min-w-[80px] !font-medium"
        />
        <BaseButton
          v-else
          :text="
            props.categoryId
              ? t('pages.manageCourses.buttons.update')
              : t('pages.manageCourses.buttons.save')
          "
          color="primary"
          variant="default"
          size="sm"
          @on-click="handleCreate"
        />
      </div>
    </template>

    <div class="p-8 md:p-4 lg:p-8">
      <BaseStepper :steps="steps" :current-step="currentStep" />

      <BaseText
        v-show="currentStep === 1"
        :text="t('pages.categorySettings.general.settings')"
        font="semibold"
        class="mt-8 mb-8 md:mt-6 md:mb-6 lg:mt-8 lg:mb-8 !text-black/85 !text-[18px] md:!text-[16px] lg:!text-[18px] !leading-[18px] !tracking-[-0.02em] max-w-[816px] mx-auto"
      />

      <div class="mt-[48px] md:mt-8 lg:mt-[48px]">
        <!-- Step 1: Settings -->
        <CategorySettingsStep
          v-show="currentStep === 1"
          ref="settingsRef"
          :initial-full-name="categoryStore.selectedCategoryDetail?.name || ''"
          :initial-short-name="categoryStore.selectedCategoryDetail?.shortName || ''"
          :initial-id-number="categoryStore.selectedCategoryDetail?.idNumber || ''"
          :initial-visibility="
            categoryStore.selectedCategoryDetail?.visibility || VisibilityStatus.SHOW
          "
          @validation-change="handleSettingsValidationChange"
        />

        <!-- Step 2: Associations -->
        <CategoryAssociationsStep v-show="currentStep === 2" ref="associationsRef" />

        <!-- Step 3: Participants -->
        <CategoryParticipantsStep
          v-show="currentStep === 3"
          ref="participantsStepRef"
          :is-edit="!!props.categoryId"
          :existing-participants="formattedParticipants"
        />
      </div>
    </div>
  </BasePopupModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { t } from '@/utils/i18n'
import { BasePopupModal, BaseStepper, BaseButton, BaseText } from '@/components/common'
import CategoryAssociationsStep from './steps/CategoryAssociationsStep.vue'
import CategorySettingsStep from './steps/CategorySettingsStep.vue'
import CategoryParticipantsStep from './steps/CategoryParticipantsStep.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { buildCreateCategoryPayload } from '@/utils/categoryPayload'
import type { AssociationItem } from '@/types/Course'
import { VisibilityStatus } from '@/types/Course'

const categoryStore = useCategoryStore()

const props = withDefaults(
  defineProps<{
    isDashboard?: boolean
    categoryId?: number | null
    show?: boolean
  }>(),
  {
    isDashboard: false,
    categoryId: null,
    show: true,
  },
)

const emit = defineEmits<{
  close: []
}>()

const currentStep = ref(1)
const totalSteps = 3

type SettingsExpose = {
  getSettings?: () => {
    fullName: string
    shortName: string
    idNumber: string
    visibility: string
  }
  isValid?: () => boolean
}
type AssociationsExpose = {
  getAssociations?: () => { leftItems: AssociationItem[] }
  setLeftItems?: (items: AssociationItem[]) => void
}

const settingsRef = ref<SettingsExpose | null>(null)
const associationsRef = ref<AssociationsExpose | null>(null)
const participantsStepRef = ref<InstanceType<typeof CategoryParticipantsStep> | null>(null)

// Settings validation state
const isSettingsValid = ref(false)

// Store current category ID for edit mode
const currentCategoryId = ref<number | null>(null)

const steps = computed(() => [
  { label: 'Settings' },
  { label: 'Associations' },
  { label: 'Participants' },
])

const isFirstStep = computed(() => currentStep.value === 1)
const isLastStep = computed(() => currentStep.value === totalSteps)
const canProceed = computed(() => {
  if (currentStep.value === 1) return isSettingsValid.value
  return true
})

const handleSettingsValidationChange = (isValid: boolean) => {
  isSettingsValid.value = isValid
}

const handleNext = () => {
  if (currentStep.value < totalSteps) currentStep.value++
}
const handlePrevious = () => {
  if (currentStep.value > 1) currentStep.value--
}
const handleCancel = () => {
  categoryStore.selectedCategoryDetail = null
  emit('close')
}

// Format existing participants for edit mode (similar to CourseCreationModal)
interface ExistingParticipant {
  index: number
  id: string | number
  type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles'
  name?: string
  fullName?: string
  email?: string
  surname?: string
  title?: string
}

const formattedParticipants = computed<ExistingParticipant[]>(() => {
  const categoryDetail = categoryStore.selectedCategoryDetail
  if (!categoryDetail?.participants) {
    return []
  }

  return categoryDetail.participants
    .filter((p) => p && p.relatedId && p.relatedType)
    .map((p, index: number) => {
      // Convert relatedType to uppercase for comparison (API returns uppercase like "USERS", "ROLES", etc.)
      // Similar to CourseCreationModal.vue pattern
      let type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles' = 'users'
      const typeUpper = String(p.relatedType || '').toUpperCase()

      if (typeUpper === 'USERS') type = 'users'
      else if (typeUpper === 'GROUPS') type = 'groups'
      else if (typeUpper === 'STORES') type = 'stores'
      else if (typeUpper === 'CLUSTERS') type = 'clusters'
      else if (typeUpper === 'ROLES') type = 'roles'

      return {
        index: p.order || index,
        id: p.relatedId,
        type: type,
        name: '',
        surname: '',
        fullName: '',
        email: '',
      }
    })
})

// Settings are handled via props in CategorySettingsStep (it watches props)
// No need for a separate watcher since props are reactive

// Prefill associations when editing (similar to CourseCreationModal)
watch(
  () => categoryStore.selectedCategoryDetail,
  async (val) => {
    if (!val) return
    const assignations = val.assignations as Array<Record<string, unknown>> | undefined
    const mapped = (assignations || []).map((a, index: number) => {
      const aRec = a as Record<string, unknown>
      const model = aRec.model as Record<string, unknown> | undefined

      // Determine title from model properties
      // For quizzes, use 'title' field; for others, use 'name', 'customFileName', or 'fileName'
      const title =
        (model?.name as string) ||
        (model?.title as string) ||
        (model?.customFileName as string) ||
        (model?.fileName as string) ||
        '-'

      // Get URL for thumbnail
      const urlVal = model?.url as unknown
      const thumbUrl = typeof urlVal === 'string' ? (urlVal as string) : undefined

      // Map API relatedType to component type and set icon properties
      // API returns uppercase values like "CATEGORY", "COURSE", "QUIZ", "LESSONS", "FILE_ASSET"
      const relatedTypeUpper = String(a.relatedType || '').toUpperCase()
      let type: 'category' | 'course' | 'lesson' | 'file' | 'quiz' = 'file'
      let iconBg = 'bg-red-100'
      let iconName: 'grid' | 'course' | 'lesson' | 'file-outline' | 'image' = 'file-outline'
      let iconColor: 'success' | 'primary' | 'error' | 'warning' | 'neutral' = 'error'
      let sourceList: 'categories' | 'courses' | 'lessons' | 'files' | 'quizzes' = 'files'

      if (relatedTypeUpper === 'CATEGORY') {
        type = 'category'
        iconBg = 'bg-purple-100'
        iconName = 'grid'
        iconColor = 'neutral'
        sourceList = 'categories'
      } else if (relatedTypeUpper === 'COURSE') {
        type = 'course'
        iconBg = 'bg-green-100'
        iconName = 'course'
        iconColor = 'success'
        sourceList = 'courses'
      } else if (relatedTypeUpper === 'LESSONS') {
        type = 'lesson'
        iconBg = 'bg-blue-100'
        iconName = 'lesson'
        iconColor = 'primary'
        sourceList = 'lessons'
      } else if (relatedTypeUpper === 'QUIZ') {
        type = 'quiz'
        iconBg = 'bg-blue-100'
        iconName = 'lesson'
        iconColor = 'primary'
        sourceList = 'quizzes'
      } else if (relatedTypeUpper === 'FILE_ASSET') {
        type = 'file'
        // For files, determine icon based on mimeType
        const mimeType = (model?.mimeType as string) || ''
        if (mimeType.startsWith('image')) {
          iconBg = 'bg-green-100'
          iconName = 'image'
          iconColor = 'success'
        } else {
          iconBg = 'bg-red-100'
          iconName = 'file-outline'
          iconColor = 'error'
        }
        sourceList = 'files'
      }

      return {
        id: (aRec.relatedId as number) ?? (aRec.id as number) ?? index,
        type,
        title,
        iconBg,
        iconName,
        iconColor,
        isNew: false,
        sourceList,
        thumbUrl,
        status: (model?.status as string) || undefined,
        visibility: (model?.visibility as string) || undefined,
      }
    })
    await nextTick()
    // Wait for associations component to be mounted
    if (associationsRef.value) {
      const assocApi = associationsRef.value as unknown as {
        setLeftItems?: (items: Array<Record<string, unknown>>) => void
      }
      assocApi?.setLeftItems?.(mapped)
    }
  },
  { immediate: true },
)

// Load category data when editing
watch(
  [() => props.show, () => props.categoryId],
  async ([newShow, newCategoryId]) => {
    if (newShow && newCategoryId) {
      // Edit mode - load category data
      currentCategoryId.value = newCategoryId
      await categoryStore.fetchCategoryDetail(newCategoryId)
    } else if (newShow && !newCategoryId) {
      // Create mode - reset to empty
      currentCategoryId.value = null
      categoryStore.selectedCategoryDetail = null
      if (associationsRef.value?.setLeftItems) {
        associationsRef.value.setLeftItems([])
      }
      currentStep.value = 1
    }
  },
  { immediate: true },
)

const handleCreate = async () => {
  // Collect settings data from step 1
  const settingsData = settingsRef.value?.getSettings?.()

  // Collect associations data from step 2
  const associationsData = associationsRef.value?.getAssociations?.()

  // Collect participants data from step 3
  const participantsData = participantsStepRef.value?.getParticipants?.()

  // Build payload using utility function
  const payload = buildCreateCategoryPayload({
    settings: settingsData || {},
    associations: associationsData || { leftItems: [] },
    participants: participantsData?.participants || [],
  })

  // Call appropriate API based on whether we have a category ID
  const categoryId = currentCategoryId.value
  if (categoryId !== null) {
    // Update existing category
    await categoryStore.updateCategory(categoryId, payload)
  } else {
    // Create new category
    await categoryStore.createCategory(payload)
  }

  await categoryStore.fetchCategories({
    page: 0,
    perPage: 8,
    isAdmin: true,
  })
  handleCancel()
}
</script>
