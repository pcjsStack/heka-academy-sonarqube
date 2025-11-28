<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-1">
      <BaseText
        :text="t('pages.reportBuilder.generateReport.usersFilters.label')"
        color="neutral"
        class="!text-[14px] !leading-[17px] !text-black/85 !font-medium"
      />
      <BaseTooltipIcon
        :text="t('pages.reportBuilder.generateReport.usersFilters.tooltip')"
        class="!m-[-6px]"
        placement="top"
      />
    </div>

    <div class="space-y-4">
      <FilterSelect
        v-for="field in filterFields"
        :key="field.key"
        :label="t(field.labelKey)"
        :placeholder="t(field.placeholderKey)"
        :model-value="modelValue[field.key]"
        :options="field.options"
        :disabled="false"
        @update:model-value="(values: string[]) => handleChange(field.key, values)"
        @scroll-bottom="field.onScroll"
        @on-search="field.onSearch"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { debounce } from 'lodash'
import { BaseText, BaseTooltipIcon } from '@/components/common'
import FilterSelect from './FilterSelect.vue'
import { t } from '@/utils/i18n'
import { useCohortStore } from '@/stores/Cohort'
import type { UsersFilters } from '@/types/ReportBuilder'

interface Props {
  modelValue: UsersFilters
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: UsersFilters]
}>()

// Stores
const cohortStore = useCohortStore()

const searchQueries = ref({
  group: '',
  cluster: '',
  role: '',
})

// Options
const groupOptions = computed(() =>
  cohortStore.groups
    .filter((g) => g.id && g.name)
    .map((g) => ({ value: String(g.id), label: g.name })),
)

const clusterOptions = computed(() =>
  cohortStore.clusters
    .filter((s) => s.id && s.name)
    .map((s) => ({ value: String(s.id), label: s.name })),
)

const roleOptions = computed(() =>
  cohortStore.roles
    .filter((r) => r.id && r.title)
    .map((r) => ({ value: String(r.id), label: r.title })),
)

// Handlers
const handleChange = (key: keyof UsersFilters, values: string[]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: values })
}

// Scroll handlers
const handleGroupScrollBottom = async () => {
  // TODO: Implement when groups API supports pagination
  console.log('Load more groups')
}

const handleClusterScrollBottom = async () => {
  // TODO: Implement when stores API supports pagination
  console.log('Load more stores')
}

const handleRoleScrollBottom = async () => {
  // Roles are typically loaded all at once, no pagination needed
  console.log('Load more roles')
}

// Search handlers
const handleGroupSearch = debounce((query: string) => {
  searchQueries.value.group = query
  // TODO: Implement when groups API supports search
  console.log('Search groups:', query)
}, 500)

const handleClusterSearch = debounce((query: string) => {
  searchQueries.value.cluster = query
  // TODO: Implement when stores API supports search
  console.log('Search stores:', query)
}, 500)

const handleRoleSearch = debounce((query: string) => {
  searchQueries.value.role = query
  // TODO: Implement when roles API supports search
  console.log('Search roles:', query)
}, 500)

// Filter fields configuration
const filterFields = computed(() => [
  {
    key: 'groupIds' as keyof UsersFilters,
    labelKey: 'pages.reportBuilder.generateReport.usersFilters.groups',
    placeholderKey: 'pages.reportBuilder.generateReport.usersFilters.selectGroups',
    options: groupOptions,
    onScroll: handleGroupScrollBottom,
    onSearch: handleGroupSearch,
  },
  {
    key: 'clusterIds' as keyof UsersFilters,
    labelKey: 'pages.reportBuilder.generateReport.usersFilters.clusters',
    placeholderKey: 'pages.reportBuilder.generateReport.usersFilters.selectClusters',
    options: clusterOptions,
    onScroll: handleClusterScrollBottom,
    onSearch: handleClusterSearch,
  },
  {
    key: 'roleIds' as keyof UsersFilters,
    labelKey: 'pages.reportBuilder.generateReport.usersFilters.roles',
    placeholderKey: 'pages.reportBuilder.generateReport.usersFilters.selectRoles',
    options: roleOptions,
    onScroll: handleRoleScrollBottom,
    onSearch: handleRoleSearch,
  },
])

onMounted(async () => {
  await Promise.all([
    cohortStore.fetchGroups(),
    cohortStore.fetchClusters(),
    cohortStore.fetchRoles(),
  ])
})
</script>
