<template>
  <div class="bg-white rounded-lg p-6">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <!-- Title -->
      <BaseText
        :text="t('pages.reports.lessonTitle')"
        type="subtitle"
        font="bold"
        color="neutral"
        :tone="900"
        class="!text-[18px]"
      />

      <!-- Search Bar -->
      <div class="relative">
        <BaseInput
          v-model="searchQuery"
          :placeholder="t('pages.reports.search.placeholder')"
          iconNameLeft="search"
          iconName="filter-1"
          type="text"
          class="w-64"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- Table Section -->
    <BaseTable
      :columns="tableColumns"
      :data="paginatedData"
      :row-key="'username'"
      class="w-full"
      :pagination="false"
    />

    <!-- Pagination -->
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @update:current-page="handlePageChange"
      class="mt-6"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BaseTable, BaseText, BaseInput, BasePagination } from '@/components/common'
import { t } from '@/utils/i18n'
import courseParticipationColumns from '@/mock/courseParticipationColumns.json'

interface Props {
  lessonId?: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<Props>()

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Calculate total pages based on filtered data
const totalPages = computed(() => Math.ceil(filteredParticipants.value.length / itemsPerPage.value))

// Create table columns from mock data
const tableColumns = computed(() =>
  courseParticipationColumns.map((col) => ({
    key: col.key,
    label: t(col.labelKey),
    sortable: col.sortable,
    width: col.width,
    align: col.align as 'left' | 'center' | 'right',
  })),
)

// Static mock data for UI display
const staticParticipants = [
  {
    username: 'johndoe',
    allActions: 45,
  },
  {
    username: 'janesmith',
    allActions: 32,
  },
  {
    username: 'robertjohnson',
    allActions: 28,
  },
]

// Filter participants based on search query
// TODO: Replace with actual lesson participation data from API
const filteredParticipants = computed(() => {
  if (!searchQuery.value) {
    return staticParticipants
  }

  return staticParticipants.filter((participant) =>
    participant.username.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// Paginated data
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filteredParticipants.value.slice(startIndex, endIndex)
})

// Reset to first page when search changes
watch(searchQuery, () => {
  currentPage.value = 1
})

const handleSearch = () => {
  // Search is handled by the computed property
  // TODO: Implement API search for lesson participation
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  console.log('Page changed to:', page)
  // TODO: Implement API pagination for lesson participation
}
</script>
