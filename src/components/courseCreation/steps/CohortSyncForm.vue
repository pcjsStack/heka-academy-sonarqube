<template>
  <div class="p-6">
    <!-- Form Fields -->
    <div class="space-y-4 overflow-y-auto sm:h-[calc(100vh-150px)]">
      <!-- Active -->
      <div>
        <BaseText
          :text="t('pages.course.cohortSync.active')"
          :tone="600"
          color="neutral"
          font="medium"
          type="p-xs"
          class="mb-2"
        />
        <BaseSelect
          v-model="formData.active"
          :options="activeOptions"
          placeholder="Yes"
          class="w-full"
        />
      </div>

      <!-- Cohort -->
      <div>
        <BaseText
          :text="t('pages.course.cohortSync.cohort')"
          :tone="600"
          color="neutral"
          font="medium"
          type="p-xs"
          class="mb-2"
        />
        <BaseSelect
          v-model="formData.cohort"
          :options="cohortOptions"
          :placeholder="t('pages.course.cohortSync.search')"
          class="w-full"
        />
      </div>

      <!-- Assign Role -->
      <div>
        <BaseText
          :text="t('pages.course.cohortSync.assignRole')"
          :tone="600"
          color="neutral"
          font="medium"
          type="p-xs"
          class="mb-2"
        />
        <BaseSelect
          v-model="formData.assignRole"
          :options="roleOptions"
          placeholder="Student"
          class="w-full"
        />
      </div>

      <!-- Add to Group -->
      <div>
        <BaseText
          :text="t('pages.course.cohortSync.addToGroup')"
          :tone="600"
          color="neutral"
          font="medium"
          type="p-xs"
          class="mb-2"
        />
        <BaseSelect
          v-model="formData.addToGroup"
          :options="groupOptions"
          placeholder="None"
          class="w-full"
        />
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 mt-6">
      <BaseButton
        :text="t('pages.course.cohortSync.cancel')"
        color="neutral"
        variant="outline"
        size="sm"
        class="w-full sm:w-auto"
        @on-click="handleCancel"
      />
      <BaseButton
        :text="t('pages.course.cohortSync.save')"
        color="primary"
        variant="default"
        size="sm"
        class="w-full sm:w-auto"
        @on-click="handleSave"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { BaseText, BaseSelect, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import activeOptionsData from '@/mock/activeOptions.json'
import cohortsData from '@/mock/cohorts.json'
import rolesData from '@/mock/roles.json'
import groupsData from '@/mock/groups.json'

// Emits
const emit = defineEmits<{
  cancel: []
  save: [data: CohortSyncData]
}>()

// Form data interface
interface CohortSyncData {
  active: string
  cohort: string
  assignRole: string
  addToGroup: string
}

// Form data
const formData = ref<CohortSyncData>({
  active: 'Yes',
  cohort: '',
  assignRole: 'Student',
  addToGroup: 'None',
})

// Options
const activeOptions = computed(() =>
  activeOptionsData.map((option) => ({
    value: option.name,
    label: option.name,
  })),
)

const cohortOptions = computed(() =>
  cohortsData.map((cohort) => ({
    value: cohort.name,
    label: cohort.name,
  })),
)

const roleOptions = computed(() =>
  rolesData.map((role) => ({
    value: role.name,
    label: role.name,
  })),
)

const groupOptions = computed(() =>
  groupsData.map((group) => ({
    value: group.name,
    label: group.name,
  })),
)

// Methods
const handleCancel = () => {
  emit('cancel')
  resetForm()
}

const handleSave = () => {
  emit('save', { ...formData.value })
  resetForm()
}

const resetForm = () => {
  formData.value = {
    active: 'Yes',
    cohort: '',
    assignRole: 'Student',
    addToGroup: 'None',
  }
}
</script>
