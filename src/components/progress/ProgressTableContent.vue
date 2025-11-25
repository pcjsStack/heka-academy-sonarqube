<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { BaseText, BaseTable, BaseInput } from '@/components/common'
import { t } from '@/utils/i18n'
import { progressColumns } from '@/mock/participantColumn'
import type { RowType } from '@/types/BaseTable'
import { useCourseStore } from '@/stores/courseStore'
import { CourseExecutionType } from '@/types/Course'
import { debounce, formattedTime } from '@/utils/generalUtils'
import TimerService from '@/services/timerService'
import { ExecutionStatus } from '@/types/GlobalTypes'

interface Props {
  courseId: number
  type?: CourseExecutionType
}

const props = withDefaults(defineProps<Props>(), {
  type: CourseExecutionType.COURSE,
})

const courseStore = useCourseStore()
const isLoading = ref(false)
const searchQuery = ref('')

// Timer data storage - map participant ID to timer seconds
const timerData = ref<Record<number, number>>({})

// Debounced search function
const debouncedSearch = debounce(async (query: string) => {
  await fetchProgressData(1, query)
}, 500)

// Watch search query changes (skip initial mount)
watch(
  searchQuery,
  (newQuery) => {
    if (newQuery !== undefined) {
      debouncedSearch(newQuery)
    }
  },
  { immediate: false },
)

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

// Fetch progress data
const fetchProgressData = async (page: number = 1, search: string = '') => {
  isLoading.value = true
  try {
    // Clear timer data on new fetch
    timerData.value = {}

    await courseStore.fetchCourseParticipants(props.courseId, props.type, {
      page,
      perPage: courseStore.courseParticipantsPerPage,
      search: search || undefined,
    })

    // Fetch timer details for all participants
    const timerPromises = courseStore.courseParticipants.map((participant) =>
      fetchTimerDetails(participant.execution?.timerId, participant.id),
    )
    await Promise.all(timerPromises)
  } catch (error) {
    console.error('Error fetching course participants:', error)
  } finally {
    isLoading.value = false
  }
}

// Get progress status text based on percentage
const getProgressStatus = (status: ExecutionStatus): { text: string; color: string } => {
  console.log('status', status)
  if (status === ExecutionStatus.COMPLETED) {
    return { text: t('pages.courseDetails.status.done'), color: 'text-green-800 bg-green-100' }
  } else if (status === ExecutionStatus.IN_PROGRESS) {
    return { text: t('pages.courseDetails.status.inProgress'), color: 'text-blue-800 bg-blue-100' }
  } else {
    return { text: t('pages.courseDetails.status.todo'), color: 'text-gray-800 bg-gray-100' }
  }
}

// Map API data to table row format for progress
const progressTableData = computed<RowType[]>(() => {
  return courseStore.courseParticipants.map((participant) => {
    const timerSeconds = timerData.value[participant.id] ?? 0
    const formattedTimer = timerSeconds > 0 ? formattedTime(timerSeconds) : '00:00:00'

    return {
      id: participant.id,
      fullName: participant.fullName || '-',
      email: participant.email || '-',
      progress: participant.execution?.percentage ?? 0,
      status: participant.execution?.status ?? ExecutionStatus.TODO,
      time: formattedTimer,
    }
  })
})

const handlePageChange = (page: number) => {
  fetchProgressData(page, searchQuery.value)
}

// Initial data fetch
onMounted(() => {
  fetchProgressData(courseStore.courseParticipantsCurrentPage || 1)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Title and Search Bar -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex-shrink-0">
        <BaseText :text="t('pages.progress.title')" :tone="700" color="neutral" type="p-lg" />
      </div>
      <div class="flex-shrink-0">
        <BaseInput
          v-model="searchQuery"
          :placeholder="t('pages.common.search')"
          type="text"
          icon-name="search"
        />
      </div>
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

    <!-- Progress Table Content -->
    <div v-else class="space-y-3">
      <BaseTable
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
          <span
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              getProgressStatus(row.status as ExecutionStatus).color,
            ]"
          >
            {{ getProgressStatus(row.status as ExecutionStatus).text }}
          </span>
        </template>
        <template #cell-time="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm text-grey-800 font-medium">{{ row.time || '00:00' }}</span>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
