<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { debounce } from 'lodash'
import { BaseText, BaseTable, BaseCircularProgress, BaseInput } from '@/components/common'
import { t } from '@/utils/i18n'
import { participantColumns, progressColumns } from '@/mock/participantColumn'
import type { RowType } from '@/types/BaseTable'
import { useCourseStore } from '@/stores/courseStore'
import { CourseExecutionType } from '@/types/Course'
import TimerService from '@/services/timerService'
import { formattedTime } from '@/utils/generalUtils'

interface Props {
  courseId: number
  initialTab?: 'participants' | 'progress'
  type?: CourseExecutionType
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'participants',
  type: CourseExecutionType.COURSE,
})

const courseStore = useCourseStore()
const activeTab = ref<'participants' | 'progress'>(props.initialTab)
const isLoading = ref(false)

// Timer data storage - map participant ID to timer seconds
const timerData = ref<Record<number, number>>({})

// Search functionality
const searchQuery = ref({ participants: '', progress: '' })

// Watch for changes in initialTab prop
watch(
  () => props.initialTab,
  (newTab) => {
    if (newTab && newTab !== activeTab.value) {
      activeTab.value = newTab
    }
  },
)

// Computed property for current search query
const currentSearchQuery = computed({
  get: () => searchQuery.value[activeTab.value],
  set: (value: string) => {
    searchQuery.value[activeTab.value] = value
  },
})

// Fetch timer details for a participant
const fetchTimerDetails = async (timerId: number | null | undefined, participantId: number) => {
  if (!timerId) {
    timerData.value[participantId] = 0
    return
  }

  try {
    const timerResponse = await TimerService.getTimer(timerId)
    if (timerResponse?.data?.seconds !== undefined) {
      timerData.value[participantId] = timerResponse.data.seconds
    } else {
      timerData.value[participantId] = 0
    }
  } catch (error) {
    console.error(`Error fetching timer details for participant ${participantId}:`, error)
    timerData.value[participantId] = 0
  }
}

// Fetch participants data when component mounts or tab changes
const fetchParticipantsData = async (page: number = 1, reset = false) => {
  isLoading.value = true
  try {
    // Clear timer data on reset
    if (reset) {
      timerData.value = {}
    }

    const search = searchQuery.value[activeTab.value].trim()
    await courseStore.fetchCourseParticipants(props.courseId, props.type, {
      page: reset ? 1 : page,
      perPage: courseStore.courseParticipantsPerPage,
      ...(search ? { search } : {}),
    })

    // Fetch timer details for all participants when on progress tab
    if (activeTab.value === 'progress') {
      const timerPromises = courseStore.courseParticipants.map((participant) =>
        fetchTimerDetails(participant.execution?.timerId, participant.id),
      )
      await Promise.all(timerPromises)
    }
  } catch (error) {
    console.error('Error fetching course participants:', error)
  } finally {
    isLoading.value = false
  }
}

// Debounced search function
const debouncedSearch = debounce(async () => {
  await fetchParticipantsData(1, true)
}, 500)

// Watch for search query changes
watch(
  () => currentSearchQuery.value,
  () => {
    debouncedSearch()
  },
)

// Watch for tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'participants' || newTab === 'progress') {
    const hasSearch = searchQuery.value[newTab].trim().length > 0
    await fetchParticipantsData(
      hasSearch ? 1 : courseStore.courseParticipantsCurrentPage || 1,
      hasSearch,
    )
  }
})

// Initial data fetch
fetchParticipantsData(courseStore.courseParticipantsCurrentPage || 1)

// Map API data to table row format for participants
const participantsTableData = computed<RowType[]>(() => {
  return courseStore.courseParticipants.map((participant) => ({
    id: participant.id,
    fullName: participant.fullName || '-',
    username: `${participant.firstName?.toLowerCase() || ''}${participant.surname?.toLowerCase() || ''}`,
    emailAddress: participant.email || '-',
    status: participant.status || 'active',
  }))
})

// Map API data to table row format for progress
const progressTableData = computed<RowType[]>(() => {
  return courseStore.courseParticipants.map((participant) => {
    const timerSeconds = timerData.value[participant.id] ?? 0
    const formattedTimer = timerSeconds > 0 ? formattedTime(timerSeconds) : '-'

    return {
      id: participant.id,
      fullName: participant.fullName || '-',
      email: participant.email || '-',
      progress: participant.execution?.percentage ?? 0,
      time: formattedTimer,
    }
  })
})

const handlePageChange = (page: number) => {
  fetchParticipantsData(page, false)
}
</script>

<template>
  <div class="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
    <!-- Participants Tab Content -->
    <div v-if="activeTab === 'participants'" class="space-y-3">
      <div class="flex items-center justify-between">
        <BaseText
          :text="t('pages.course.associations.details.enrolledUsers')"
          :tone="900"
          color="neutral"
          font="semibold"
          type="h6"
        />
        <BaseInput
          :placeholder="t('pages.course.associations.details.searchUsers')"
          v-model="currentSearchQuery"
          type="text"
          class="w-full lg:!w-[260px]"
          iconName="search"
        />
      </div>
      <!-- Loading State -->
      <div v-if="isLoading" class="py-8 text-center">
        <BaseText
          :text="t('types.loading.fetchingCourseParticipants', { type: props.type })"
          :tone="500"
          color="neutral"
          type="p-sm"
        />
      </div>
      <BaseTable
        v-else
        :columns="participantColumns"
        :data="participantsTableData"
        row-key="id"
        :pagination="participantsTableData.length > 0"
        server-side
        :initial-page="courseStore.courseParticipantsCurrentPage || 1"
        :initial-per-page="courseStore.courseParticipantsPerPage"
        :total="courseStore.courseParticipantsTotal"
        @page-change="handlePageChange"
      >
        <template #cell-status="{ row }">
          <span
            v-if="row.status === 'active' || row.status === 'ACTIVE'"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            {{ t('pages.course.associations.details.status.active') }}
          </span>
          <span
            v-else
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {{ t('pages.course.associations.details.status.inactive') }}
          </span>
        </template>
      </BaseTable>
    </div>

    <!-- Progress Tab Content -->
    <div v-else-if="activeTab === 'progress'" class="space-y-3">
      <div class="flex items-center justify-between">
        <BaseText
          :text="t('pages.course.associations.details.userProgress')"
          :tone="900"
          color="neutral"
          font="semibold"
          type="h6"
        />
        <BaseInput
          :placeholder="t('pages.course.associations.details.searchUsers')"
          v-model="currentSearchQuery"
          type="text"
          iconName="search"
          class="w-full lg:!w-[260px]"
        />
      </div>
      <!-- Loading State -->
      <div v-if="isLoading" class="py-8 text-center">
        <BaseText
          :text="t('types.loading.fetchingCourseParticipantsProgress', { type: props.type })"
          :tone="500"
          color="neutral"
          type="p-sm"
        />
      </div>
      <BaseTable
        v-else
        :columns="progressColumns"
        :data="progressTableData"
        row-key="id"
        :pagination="progressTableData.length > 0"
        server-side
        :initial-page="courseStore.courseParticipantsCurrentPage || 1"
        :initial-per-page="courseStore.courseParticipantsPerPage"
        :total="courseStore.courseParticipantsTotal"
        @page-change="handlePageChange"
      >
        <template #cell-progress="{ row }">
          <div class="flex items-center gap-2">
            <BaseCircularProgress :value="Number(row.progress) || 0" size="sm" />
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
