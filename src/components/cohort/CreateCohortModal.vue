<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BaseSideModal, BaseInput, BaseSelect, BaseButton } from '@/components/common'
import { useCohortStore } from '@/stores/Cohort'
import { t } from '@/utils/i18n'
import type { CohortFormData } from '@/types/Cohort'
// Props
interface Props {
  show: boolean
}

withDefaults(defineProps<Props>(), {
  show: false,
})

const cohortStore = useCohortStore()

onMounted(async () => {
  await cohortStore.fetchRoles()
  await cohortStore.fetchGroups()
  await cohortStore.fetchClusters()
  await cohortStore.fetchUsers()
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Form data type

// Form state
const formData = ref<CohortFormData>({
  name: '',
  description: '',
  clusterIds: [],
  roleIds: [],
  groupIds: [],
  userIds: [],
})

// Validation
const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.clusterIds.length > 0
})

// Methods
const closeModal = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    clusterIds: [],
    roleIds: [],
    groupIds: [],
    userIds: [],
  }
}

const saveCohort = async () => {
  if (!isFormValid.value) return

  await cohortStore.createCohort(formData.value)
  closeModal()
}
</script>

<template>
  <BaseSideModal
    v-if="show"
    :title="t('pages.cohort.create.title')"
    size="md"
    :close-button="true"
    :z-index="99999999"
    custom-class="left-0 right-0"
    @onClose="closeModal"
    @onBackgroundClick="closeModal"
  >
    <div class="p-6 space-y-6">
      <!-- Cohort Name -->
      <BaseInput
        v-model="formData.name"
        :label="t('pages.cohort.create.name')"
        :placeholder="t('pages.cohort.create.namePlaceholder')"
        type="text"
        required
      />

      <!-- Description -->
      <BaseInput
        v-model="formData.description"
        :label="t('pages.cohort.create.description')"
        :placeholder="t('pages.cohort.create.descriptionPlaceholder')"
        type="textArea"
        :inputRows="4"
      />

      <!-- Cluster -->
      <BaseSelect
        v-model="formData.clusterIds"
        :label="t('pages.cohort.create.cluster')"
        :placeholder="t('pages.cohort.create.clusterPlaceholder')"
        multiple
        :options="cohortStore.getClustersList"
        required
      />

      <!-- Roles -->
      <BaseSelect
        v-model="formData.roleIds"
        :label="t('pages.cohort.create.roles')"
        :placeholder="t('pages.cohort.create.rolesPlaceholder')"
        :options="cohortStore.getRolesList"
        :multiple="true"
      />

      <!-- User Groups -->
      <BaseSelect
        v-model="formData.groupIds"
        :label="t('pages.cohort.create.userGroups')"
        :placeholder="t('pages.cohort.create.userGroupsPlaceholder')"
        :options="cohortStore.getGroupsList"
        :multiple="true"
      />

      <!-- Users -->
      <BaseSelect
        v-model="formData.userIds"
        :label="t('pages.cohort.create.users')"
        :placeholder="t('pages.cohort.create.usersPlaceholder')"
        :options="cohortStore.getUsersList"
        :multiple="true"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 p-4 border-t border-gray-200">
        <BaseButton
          :text="t('pages.cohort.create.cancel')"
          color="primary"
          variant="link"
          size="sm"
          class="!w-[100px]"
          @on-click="closeModal"
        />
        <BaseButton
          :text="t('pages.cohort.create.save')"
          color="primary"
          variant="default"
          size="sm"
          :disabled="!isFormValid"
          class="!w-[140px]"
          @on-click="saveCohort"
        />
      </div>
    </template>
  </BaseSideModal>
</template>
