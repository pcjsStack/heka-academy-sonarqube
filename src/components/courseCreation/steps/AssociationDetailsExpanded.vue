<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BaseTab, BaseText, BaseTable, BaseCircularProgress } from '@/components/common'
import { t } from '@/utils/i18n'
import { participantColumns, progressColumns } from '@/mock/participantColumn'
import type { RowType } from '@/types/BaseTable'
import type { CourseParticipants } from '@/types/Course'
import TimerService from '@/services/timerService'
import { formattedTime } from '@/utils/generalUtils'

interface Props {
  associationId: string | number
  associationType: 'course' | 'lesson' | 'file' | 'quiz'
  associationTitle: string
  isLoading?: boolean
  participantsData?: CourseParticipants[]
  progressData?: CourseParticipants[]
  courseParticipantsCurrentPage?: number
  courseParticipantsPerPage?: number
  courseParticipantsTotal?: number
  showParticipantsTab?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  participantsData: () => [],
  progressData: () => [],
  courseParticipantsCurrentPage: 0,
  courseParticipantsPerPage: 5,
  courseParticipantsTotal: 0,
  showParticipantsTab: true,
})
const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

// Default to progress tab if participants tab is hidden (for quizzes)
const activeTab = ref<'participants' | 'progress'>(
  props.showParticipantsTab ? 'participants' : 'progress',
)

// Timer data storage - map participant ID to timer seconds
const timerData = ref<Record<number, number>>({})

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

// Watch for changes in progressData and fetch timer details
watch(
  () => props.progressData,
  async (newProgressData) => {
    if (!newProgressData || newProgressData.length === 0) {
      timerData.value = {}
      return
    }

    // Clear existing timer data
    timerData.value = {}

    // Fetch timer details for all participants
    const timerPromises = newProgressData.map((participant) =>
      fetchTimerDetails(participant.execution?.timerId, participant.id),
    )
    await Promise.all(timerPromises)
  },
  { immediate: true, deep: true },
)

const tabs = computed(() => {
  if (props.showParticipantsTab) {
    return [
      { label: t('pages.course.associations.details.tabs.participants'), value: 'participants' },
      { label: t('pages.course.associations.details.tabs.progress'), value: 'progress' },
    ]
  } else {
    // Only show Progress tab for quizzes
    return [{ label: t('pages.course.associations.details.tabs.progress'), value: 'progress' }]
  }
})

// Map API data to table row format for participants
const participantsTableData = computed<RowType[]>(() => {
  return props.participantsData.map((participant) => ({
    id: participant.id,
    fullName: participant.fullName || '-',
    username: `${participant.firstName?.toLowerCase() || ''}${participant.surname?.toLowerCase() || ''}`,
    emailAddress: participant.email || '-',
    status: participant.status || 'active',
  }))
})

// Map API data to table row format for progress
const progressTableData = computed<RowType[]>(() => {
  return props.progressData.map((participant) => {
    const timerSeconds = timerData.value[participant.id] ?? 0
    const formattedTimer = timerSeconds > 0 ? formattedTime(timerSeconds) : '00:00:00'

    return {
      id: participant.id,
      fullName: participant.fullName || '-',
      email: participant.email || '-',
      progress: participant.execution?.percentage || 0,
      time: formattedTimer,
    }
  })
})

const handlePageChange = (page: number) => {
  emit('page-change', page)
  // In a real implementation, fetch new data here
}
</script>

<template>
  <div
    class="bg-white border border-neutral-200 rounded-lg p-4 md:p-3 lg:p-4 space-y-4 md:space-y-3 lg:space-y-4"
  >
    <!-- Tabs -->
    <BaseTab :tabs="tabs" v-model="activeTab" />

    <!-- Loading State -->
    <div v-if="isLoading" class="py-8 md:py-6 lg:py-8 text-center">
      <BaseText
        :text="t('types.loading.fetchingCourseParticipants', { type: associationType })"
        :tone="500"
        color="neutral"
        type="p-sm"
      />
    </div>

    <!-- Participants Tab Content -->
    <div v-else-if="activeTab === 'participants'" class="space-y-3 md:space-y-2.5 lg:space-y-3">
      <BaseText
        :text="t('pages.course.associations.details.enrolledUsers')"
        :tone="900"
        color="neutral"
        font="semibold"
        type="p-md"
      />
      <BaseTable
        :columns="participantColumns"
        :data="participantsTableData"
        row-key="id"
        :pagination="participantsTableData.length > 0"
        server-side
        :initial-page="courseParticipantsCurrentPage || 1"
        :initial-per-page="courseParticipantsPerPage"
        :total="courseParticipantsTotal"
        @page-change="handlePageChange"
      >
        <template #cell-status="{ row }">
          <span
            v-if="row.status === 'active' || row.status === 'ACTIVE'"
            class="inline-flex items-center px-2.5 py-0.5 md:px-2 md:py-0.5 lg:px-2.5 lg:py-0.5 rounded-full text-xs md:text-[11px] lg:text-xs font-medium bg-green-100 text-green-800"
          >
            {{ t('pages.course.associations.details.status.active') }}
          </span>
          <span
            v-else
            class="inline-flex items-center px-2.5 py-0.5 md:px-2 md:py-0.5 lg:px-2.5 lg:py-0.5 rounded-full text-xs md:text-[11px] lg:text-xs font-medium bg-gray-100 text-gray-800"
          >
            {{ t('pages.course.associations.details.status.inactive') }}
          </span>
        </template>
      </BaseTable>
    </div>

    <!-- Progress Tab Content -->
    <div v-else-if="activeTab === 'progress'" class="space-y-3 md:space-y-2.5 lg:space-y-3">
      <BaseText
        :text="t('pages.course.associations.details.userProgress')"
        :tone="900"
        color="neutral"
        font="semibold"
        type="p-md"
      />

      <BaseTable
        :columns="progressColumns"
        :data="progressTableData"
        row-key="id"
        :pagination="progressTableData.length > 0"
        server-side
        :initial-page="courseParticipantsCurrentPage || 1"
        :initial-per-page="courseParticipantsPerPage"
        :total="courseParticipantsTotal"
        @page-change="handlePageChange"
      >
        <template #cell-progress="{ row }">
          <div class="flex items-center gap-2 md:gap-1.5 lg:gap-2">
            <BaseCircularProgress :value="Number(row.progress) || 0" size="sm" />
          </div>
        </template>
        <template #cell-time="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm text-grey-800 font-medium">{{ row.time || '00:00:00' }}</span>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
