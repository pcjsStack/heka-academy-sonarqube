<template>
  <div class="p-6 overflow-y-auto sm:h-[calc(100vh-150px)]">
    <!-- Enrollment Options Section -->
    <div class="mb-6">
      <BaseText
        :text="t('pages.course.enrollUsers.enrollmentOptions')"
        :tone="700"
        color="neutral"
        font="semibold"
        type="p-sm"
        class="mb-4"
      />

      <div class="space-y-4">
        <!-- Select Users -->
        <div>
          <BaseText
            :text="t('pages.course.enrollUsers.selectUsers')"
            :tone="600"
            color="neutral"
            font="medium"
            type="p-xs"
            class="mb-2"
          />
          <BaseSelect
            v-model="selectedUser"
            :options="userOptions"
            placeholder="Select a user"
            class="w-full"
          />
        </div>

        <!-- Select Cohort -->
        <div>
          <BaseText
            :text="t('pages.course.enrollUsers.selectCohort')"
            :tone="600"
            color="neutral"
            font="medium"
            type="p-xs"
            class="mb-2"
          />
          <BaseSelect
            v-model="selectedCohort"
            :options="cohortOptions"
            placeholder="Select a cohort"
            class="w-full"
          />
        </div>

        <!-- Assign Role -->
        <div>
          <BaseText
            :text="t('pages.course.enrollUsers.assignRole')"
            :tone="600"
            color="neutral"
            font="medium"
            type="p-xs"
            class="mb-2"
          />
          <BaseSelect
            v-model="selectedRole"
            :options="roleOptions"
            placeholder="Select a role"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 mt-6">
      <BaseButton
        :text="t('pages.course.enrollUsers.cancel')"
        color="neutral"
        variant="outline"
        size="sm"
        class="w-full sm:w-auto"
        @on-click="handleCancel"
      />
      <BaseButton
        :text="t('pages.course.enrollUsers.enrollSelected')"
        color="primary"
        variant="default"
        size="sm"
        class="w-full sm:w-auto"
        @on-click="handleEnroll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { BaseText, BaseSelect, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import usersData from '@/mock/users.json'
import cohortsData from '@/mock/cohorts.json'
import rolesData from '@/mock/roles.json'

// Emits
const emit = defineEmits<{
  cancel: []
  enroll: [user: string, cohort: string, role: string]
}>()

// Form data
const selectedUser = ref('')
const selectedCohort = ref('')
const selectedRole = ref('')

// Options
const userOptions = computed(() =>
  usersData.map((user) => ({
    value: user.name,
    label: user.name,
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

// Methods
const handleCancel = () => {
  emit('cancel')
  resetForm()
}

const handleEnroll = () => {
  if (selectedUser.value && selectedCohort.value && selectedRole.value) {
    emit('enroll', selectedUser.value, selectedCohort.value, selectedRole.value)
    resetForm()
  }
}

const resetForm = () => {
  selectedUser.value = ''
  selectedCohort.value = ''
  selectedRole.value = ''
}
</script>
