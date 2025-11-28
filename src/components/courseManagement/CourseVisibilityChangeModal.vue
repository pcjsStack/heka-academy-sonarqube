<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BaseButton, BaseText, BasePopupModal, BaseSelect } from '@/components/common'
import { t } from '@/utils/i18n'
import { VisibilityStatus, VisibilityType } from '@/types/Course'
import { useCourseStore } from '@/stores/courseStore'
import { useToaster } from '@/composables/useToaster'

interface Props {
  isOpen: boolean
  itemId: number
  currentVisibility: VisibilityStatus
  type: VisibilityType
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  type: VisibilityType.COURSE,
})

const emit = defineEmits<{
  onClose: []
  onSave: []
  onEdit: []
}>()

const courseStore = useCourseStore()
const { showToast } = useToaster()

const selectedVisibility = ref<VisibilityStatus>(props.currentVisibility)
const isSaving = ref(false)

// Watch for prop changes
watch(
  () => props.currentVisibility,
  (newVisibility) => {
    selectedVisibility.value = newVisibility
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      selectedVisibility.value = props.currentVisibility
    }
  },
)

// Visibility options
const visibilityOptions = [
  {
    value: VisibilityStatus.SHOW,
    label: t('pages.course.settings.visibility.show'),
  },
  {
    value: VisibilityStatus.HIDE,
    label: t('pages.course.settings.visibility.hide'),
  },
  {
    value: VisibilityStatus.MAINTENANCE,
    label: t('pages.course.settings.visibility.maintenance'),
  },
]

// Check if visibility has changed
const hasVisibilityChanged = computed(() => {
  return selectedVisibility.value !== props.currentVisibility
})

const handleCancel = () => {
  selectedVisibility.value = props.currentVisibility
  emit('onClose')
}

const handleSave = async () => {
  if (!hasVisibilityChanged.value) {
    emit('onClose')
    return
  }

  isSaving.value = true
  try {
    await courseStore.updateCourseVisibilityDetails(
      props.itemId,
      selectedVisibility.value,
      props.type,
    )
    showToast({
      tone: 'success',
      message: t('types.success.updatingCourseVisibility', { type: props.type }),
    })
    emit('onSave')
  } catch (error) {
    console.error('Failed to update course visibility:', error)
  } finally {
    isSaving.value = false
  }
}

const handleEdit = async () => {
  // First update visibility if it has changed
  if (hasVisibilityChanged.value) {
    isSaving.value = true
    try {
      await courseStore.updateCourseVisibilityDetails(
        props.itemId,
        selectedVisibility.value,
        props.type,
      )
      showToast({
        tone: 'success',
        message: t('types.success.updatingCourseVisibility', { type: props.type }),
      })
    } catch (error) {
      console.error('Failed to update course visibility:', error)
      isSaving.value = false
      return
    } finally {
      isSaving.value = false
    }
  }

  // Then proceed to edit
  emit('onEdit')
}
</script>

<template>
  <BasePopupModal
    v-if="isOpen"
    :showBackButton="false"
    :closeButton="true"
    :width="'524px'"
    :maxWidth="'90%'"
    :title="t('pages.courseAdmin.changeVisibility.title', { type: type })"
    @onClose="handleCancel"
  >
    <div class="lg:p-6 p-4 min-h-[120px]">
      <BaseText
        type="p-md"
        color="neutral"
        class="!text-[14px] tracking-[-0.032px] leading-6 mb-4"
        :text="t('pages.courseAdmin.changeVisibility.description', { type: type })"
      />
      <BaseSelect
        v-model="selectedVisibility"
        :options="visibilityOptions"
        :placeholder="t('pages.course.settings.general.visibilityPlaceholder')"
        :label="t('pages.course.settings.general.type.visibility', { type: type })"
        class="w-full"
      />
    </div>
    <div class="flex justify-end gap-[8px] lg:px-6 px-4 lg:py-5 py-4 border-t border-grey-150">
      <div class="flex justify-end gap-2 sm:w-[auto] w-full">
        <BaseButton
          :text="t('pages.baseDeleteModal.cancel')"
          :variant="'link'"
          size="sm"
          @click="handleCancel"
          :disabled="isSaving"
          tailwindCss="min-w-[95px] !text-primary-550 !font-medium sm-w-[auto] w-[50%]"
        />
        <BaseButton
          color="primary"
          :text="t('pages.courseAdmin.changeVisibility.save')"
          variant="default"
          size="md"
          :disabled="isSaving || !hasVisibilityChanged"
          @click="handleSave"
          tailwindCss="min-w-[92px] !py-2 !font-medium sm-w-[auto] w-[50%]"
        />
        <BaseButton
          color="primary"
          :text="t('pages.courseAdmin.changeVisibility.edit')"
          variant="default"
          size="md"
          :disabled="isSaving || !hasVisibilityChanged"
          @click="handleEdit"
          tailwindCss="min-w-[92px] !py-2 !font-medium sm-w-[auto] w-[50%]"
        />
      </div>
    </div>
  </BasePopupModal>
</template>
