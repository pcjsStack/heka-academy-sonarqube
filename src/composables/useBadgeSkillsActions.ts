import { ref, computed } from 'vue'
import { useBadgeAndSkillStore } from '@/stores/BadgeAndSkill'
import { t } from '@/utils/i18n'
import type { BadgeFormData, SkillsFormData } from '@/types/BadgeAndSkill'
import type { GetBadgesParams, GetSkillsParams } from '@/types/BadgeAndSkill'
import type { Assignation } from '@/types/Lessons'

export function useBadgeSkillsActions(
  buildBadgeParams: () => GetBadgesParams,
  buildSkillParams: () => GetSkillsParams,
) {
  const badgeStore = useBadgeAndSkillStore()

  // Delete modal state
  const showDeleteModal = ref(false)
  const deleteType = ref<'badges' | 'skills'>('badges')
  const deleteId = ref<number | null>(null)

  // Edit modal state
  const showEditBadgeModal = ref(false)
  const showEditSkillModal = ref(false)
  const editingBadgeId = ref<number | undefined>(undefined)
  const editingSkillId = ref<number | undefined>(undefined)
  const editingBadgeData = ref<Partial<BadgeFormData> | undefined>(undefined)
  const editingSkillsData = ref<Partial<SkillsFormData> | undefined>(undefined)

  const deleteModalText = computed(() => {
    return deleteType.value === 'badges'
      ? t('pages.badgeSkills.deleteBadge')
      : t('pages.badgeSkills.deleteSkill')
  })

  const deleteModalDescription = computed(() => {
    return deleteType.value === 'badges'
      ? t('pages.badgeSkills.deleteBadgeDescription')
      : t('pages.badgeSkills.deleteSkillDescription')
  })

  const handleEditBadge = async (id: number) => {
    const badge = await badgeStore.fetchBadgeAndSkillDetails('badges', id)
    if (badge) {
      editingBadgeId.value = id
      editingBadgeData.value = {
        name: badge.name,
        image: badge.attachment ? [badge.attachment] : [],
        imageUrl: badge.attachment?.url || undefined,
        associations: {
          fileIds: badge.files.map((file: Assignation) => file.relatedId.toString()),
          courseIds: badge.courses.map((course: Assignation) => course.relatedId.toString()),
          lessonIds: badge.lessons.map((lesson: Assignation) => lesson.relatedId.toString()),
          quizIds: badge.quizzes.map((quiz: Assignation) => quiz.relatedId.toString()),
        },
      }
      console.log('editingBadgeData', editingBadgeData.value)
      showEditBadgeModal.value = true
    }
  }

  const handleEditSkill = async (id: number) => {
    const skill = await badgeStore.fetchBadgeAndSkillDetails('skills', id)
    if (skill) {
      editingSkillId.value = id
      editingSkillsData.value = {
        names: [skill.name],
        associations: {
          fileIds: skill.files.map((file: Assignation) => file.relatedId.toString()),
          courseIds: skill.courses.map((course: Assignation) => course.relatedId.toString()),
          lessonIds: skill.lessons.map((lesson: Assignation) => lesson.relatedId.toString()),
          quizIds: skill.quizzes.map((quiz: Assignation) => quiz.relatedId.toString()),
        },
      }
      showEditSkillModal.value = true
    }
  }

  const handleDeleteBadge = (id: number) => {
    deleteType.value = 'badges'
    deleteId.value = id
    showDeleteModal.value = true
  }

  const handleDeleteSkill = (id: number) => {
    deleteType.value = 'skills'
    deleteId.value = id
    showDeleteModal.value = true
  }

  const handleCancelDelete = () => {
    showDeleteModal.value = false
    deleteId.value = null
  }

  const handleConfirmDelete = async () => {
    if (deleteId.value === null) return

    try {
      // Use 'soft' delete by default (standard in the codebase)
      const deleteTypeParam: 'soft' | 'hard' = 'soft'

      if (deleteType.value === 'badges') {
        const params = buildBadgeParams()
        await badgeStore.deleteBadge(deleteId.value, params, deleteTypeParam)
      } else {
        const params = buildSkillParams()
        await badgeStore.deleteSkill(deleteId.value, params, deleteTypeParam)
      }
      showDeleteModal.value = false
      deleteId.value = null
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleCloseEditBadgeModal = () => {
    showEditBadgeModal.value = false
    editingBadgeId.value = undefined
    editingBadgeData.value = undefined
  }

  const handleCloseEditSkillModal = () => {
    showEditSkillModal.value = false
    editingSkillId.value = undefined
    editingSkillsData.value = undefined
  }

  const handleUpdateBadge = async () => {
    // The EditBadgeModal handles the API call and reloads the list
    // We just need to close the modal and reset state
    showEditBadgeModal.value = false
    editingBadgeId.value = undefined
    editingBadgeData.value = undefined
  }

  const handleUpdateSkill = async () => {
    // The EditSkillModal handles the API call and reloads the list
    // We just need to close the modal and reset state
    showEditSkillModal.value = false
    editingSkillId.value = undefined
    editingSkillsData.value = undefined
  }

  return {
    // Delete state
    showDeleteModal,
    deleteModalText,
    deleteModalDescription,
    handleDeleteBadge,
    handleDeleteSkill,
    handleCancelDelete,
    handleConfirmDelete,
    // Edit state
    showEditBadgeModal,
    showEditSkillModal,
    editingBadgeId,
    editingSkillId,
    editingBadgeData,
    editingSkillsData,
    handleEditBadge,
    handleEditSkill,
    handleCloseEditBadgeModal,
    handleCloseEditSkillModal,
    handleUpdateBadge,
    handleUpdateSkill,
  }
}
