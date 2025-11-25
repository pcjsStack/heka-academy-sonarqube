<template>
  <div class="min-h-screen bg-white">
    <!-- Header Section -->
    <div
      class="sticky top-0 z-50 flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 py-4 sm:px-6 sm:py-[18px] md:px-4 md:py-4 lg:px-8 lg:py-[18px] border-b border-gray-200 bg-white"
    >
      <!-- Title Row -->
      <div class="flex items-center gap-2 sm:gap-4 md:gap-3 lg:gap-4 mb-3 sm:mb-0">
        <!-- Back Button -->
        <BaseIcon
          name="chevron-left"
          size="sm"
          color="neutral"
          :tone="500"
          class="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          @click="handleBack"
        />
        <!-- Title -->
        <BaseText
          :text="t('pages.reportBuilder.title')"
          class="!text-[20px] !leading-[24px] !text-black/85 !font-semibold whitespace-nowrap"
        />
      </div>

      <!-- Buttons Row -->
      <div class="flex items-center gap-2 sm:gap-2 md:gap-1.5 lg:gap-2">
        <BaseButton
          :text="t('pages.reportBuilder.buttons.generateReport')"
          variant="default"
          color="primary"
          size="sm"
          @click="handleGenerateReport"
          class="!w-auto whitespace-nowrap !px-4 !py-2 md:!px-4 md:!py-2 lg:!px-5 lg:!py-2.5 !text-xs md:!text-xs lg:!text-sm"
        />
        <BaseButton
          :text="t('pages.reportBuilder.buttons.export')"
          variant="outline"
          color="primary"
          size="sm"
          rightIcon="chevron-right"
          rightIconSize="xs"
          @click="handleExport"
          class="!w-auto whitespace-nowrap !px-4 !py-2 md:!px-4 md:!py-2 lg:!px-5 lg:!py-2.5 !text-xs md:!text-xs lg:!text-sm"
        />
      </div>
    </div>

    <!-- Description Section -->
    <section class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 md:py-5 lg:py-6 w-full">
      <p class="text-[14px] leading-[22px] text-neutral-500 font-medium">
        {{ t('pages.reportBuilder.content.description') }}
      </p>
    </section>

    <!-- Main Content Section with Sidebar -->
    <section class="px-4 sm:px-6 md:px-4 lg:px-8 pb-8 md:pb-6 lg:pb-8 w-full">
      <div class="flex flex-col lg:flex-row gap-6 md:gap-5 lg:gap-6">
        <!-- LEFT: Sidebar (Desktop) -->
        <aside class="hidden lg:flex w-[320px] border border-gray-200 rounded-lg flex-col bg-white">
          <!-- Header -->
          <div class="flex items-center p-4 border-b border-grey-150 flex-shrink-0">
            <BaseText
              :text="t('pages.reportBuilder.sidebar.title')"
              class="!text-[16px] !leading-[24px] !text-black/85 !font-semibold"
            />
          </div>

          <!-- Scrollable Content -->
          <div class="lg:px-4 px-3 pt-6 pb-4 flex-1 overflow-y-auto">
            <ReportFilters
              v-model="filterValues"
              :report-type-options="reportTypeOptions"
              :course-options="courseOptions"
              :lesson-quiz-options="lessonQuizOptions"
            />
          </div>

          <!-- Footer Buttons -->
          <div class="lg:px-4 px-3 border-t pt-4 pb-4 border-grey-150 flex-shrink-0">
            <div class="flex items-center gap-3">
              <BaseButton
                :text="t('pages.reportBuilder.buttons.reset')"
                variant="outline"
                color="neutral"
                size="sm"
                @click="handleReset"
                class="flex-1"
              />
              <BaseButton
                :text="t('pages.reportBuilder.buttons.applyFilters')"
                variant="default"
                color="primary"
                size="sm"
                @click="handleApplyFilters"
                class="flex-1"
              />
            </div>
          </div>
        </aside>

        <!-- RIGHT: Main Content Area -->
        <div class="flex-1 min-w-0 w-full lg:w-auto">
          <!-- Title -->
          <BaseText
            :text="t('pages.reportBuilder.table.title')"
            class="!text-[18px] !leading-[24px] !text-black/85 !font-bold mb-4 sm:mb-6 md:mb-5 lg:mb-6"
          />

          <div class="bg-white rounded-lg">
            <!-- Header Section -->
            <div
              class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-4 md:gap-3 lg:gap-4 mb-6 md:mb-5 lg:mb-6"
            >
              <!-- Search Filter -->
              <div class="relative w-full sm:w-64">
                <BaseInput
                  v-model="searchQuery"
                  type="text"
                  :placeholder="t('pages.reportBuilder.table.search.placeholder')"
                  iconNameLeft="search"
                />
              </div>

              <!-- Sort by Date & Filter Button -->
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <BaseText
                  :text="t('pages.reportBuilder.table.sortBy')"
                  class="!text-[14px] !text-neutral-500 flex-shrink-0"
                />
                <BaseSelect
                  v-model="sortBy"
                  :placeholder="t('pages.reportBuilder.table.sortBy.placeholder')"
                  :options="sortOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full sm:w-[200px]"
                />
                <!-- Mobile Filter Button -->
                <BaseButtonIcon
                  icon="filter-1"
                  iconClass="!text-black !w-[14px] !h-[14px]"
                  size="sm"
                  variant="outline"
                  color="neutral"
                  :aria-label="'Filter'"
                  class="lg:hidden relative !w-[41px] !h-[40px] !rounded-[8px] !border-neutral-300 flex-shrink-0"
                  @on-click="isSidebarOpen = true"
                />
              </div>
            </div>

            <!-- Table Section -->
            <div class="overflow-x-auto">
              <BaseTable
                :columns="tableColumns"
                :data="tableData"
                :row-key="'id'"
                class="w-full"
                :pagination="false"
              />
            </div>

            <!-- Pagination -->
            <BasePagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @update:current-page="handlePageChange"
              class="mt-6 md:mt-5 lg:mt-6"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile Filter Modal -->
    <BaseSideModal
      v-if="isSidebarOpen"
      size="xs"
      :title="t('pages.reportBuilder.sidebar.title')"
      :closeButton="true"
      @onClose="isSidebarOpen = false"
      @onBackgroundClick="isSidebarOpen = false"
    >
      <div class="px-4 pt-6 pb-4">
        <ReportFilters
          v-model="filterValues"
          :report-type-options="reportTypeOptions"
          :course-options="courseOptions"
          :lesson-quiz-options="lessonQuizOptions"
        />
      </div>

      <template #footer>
        <div class="px-4 border-t pt-4 pb-4 border-grey-150">
          <div class="flex items-center gap-3">
            <BaseButton
              :text="t('pages.reportBuilder.buttons.reset')"
              variant="outline"
              color="neutral"
              size="sm"
              @click="handleReset"
              class="flex-1"
            />
            <BaseButton
              :text="t('pages.reportBuilder.buttons.applyFilters')"
              variant="default"
              color="primary"
              size="sm"
              @click="handleApplyFiltersAndClose"
              class="flex-1"
            />
          </div>
        </div>
      </template>
    </BaseSideModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  BaseButtonIcon,
  BaseText,
  BaseIcon,
  BaseSelect,
  BaseInput,
  BaseTable,
  BasePagination,
  BaseSideModal,
} from '@/components/common'
import ReportFilters from '@/components/reportBuilder/ReportFilters.vue'
import { t } from '@/utils/i18n'

const router = useRouter()

// Mobile sidebar toggle
const isSidebarOpen = ref(false)

// Filter states
const reportType = ref('')
const course = ref('')
const lessonQuiz = ref('')
const dateRange = ref(null)
const userScope = ref('all')
const completionStatus = ref<string[]>(['completed', 'inProgress'])

// Computed filter values for v-model
const filterValues = computed({
  get: () => ({
    reportType: reportType.value,
    course: course.value,
    lessonQuiz: lessonQuiz.value,
    dateRange: dateRange.value,
    userScope: userScope.value,
    completionStatus: completionStatus.value,
  }),
  set: (val) => {
    reportType.value = val.reportType
    course.value = val.course
    lessonQuiz.value = val.lessonQuiz
    dateRange.value = val.dateRange
    userScope.value = val.userScope
    completionStatus.value = val.completionStatus
  },
})

// Report Type Options
const reportTypeOptions = ref([
  {
    label: t('pages.reportBuilder.filters.reportType.options.quizProgress'),
    value: 'quizProgress',
  },
  {
    label: t('pages.reportBuilder.filters.reportType.options.courseProgress'),
    value: 'courseProgress',
  },
  {
    label: t('pages.reportBuilder.filters.reportType.options.lessonProgress'),
    value: 'lessonProgress',
  },
])

// Course Options (Mock data - to be replaced with actual API data)
const courseOptions = ref([
  { label: 'Sample Course 1', value: 'course1' },
  { label: 'Sample Course 2', value: 'course2' },
  { label: 'Sample Course 3', value: 'course3' },
])

// Lesson/Quiz Options (Mock data - to be replaced with actual API data)
const lessonQuizOptions = ref([
  { label: 'Sample Lesson 1', value: 'lesson1' },
  { label: 'Sample Lesson 2', value: 'lesson2' },
  { label: 'Sample Quiz 1', value: 'quiz1' },
  { label: 'Sample Quiz 2', value: 'quiz2' },
])

// Table states
const searchQuery = ref('')
const sortBy = ref('')
const currentPage = ref(1)
const totalPages = ref(5)

// Sort Options
const sortOptions = ref([
  { label: t('pages.reportBuilder.table.sortBy.newest'), value: 'newest' },
  { label: t('pages.reportBuilder.table.sortBy.oldest'), value: 'oldest' },
])

// Table Columns
const tableColumns = [
  {
    key: 'id',
    label: t('pages.reportBuilder.table.columns.id'),
    width: '100px',
    align: 'left' as const,
  },
  { key: 'name', label: t('pages.reportBuilder.table.columns.name'), align: 'left' as const },
  {
    key: 'type',
    label: t('pages.reportBuilder.table.columns.type'),
    width: '150px',
    align: 'left' as const,
  },
  {
    key: 'status',
    label: t('pages.reportBuilder.table.columns.status'),
    width: '150px',
    align: 'left' as const,
  },
  {
    key: 'fileFormat',
    label: t('pages.reportBuilder.table.columns.fileFormat'),
    width: '150px',
    align: 'left' as const,
  },
]

// Mock Table Data (to be replaced with actual data)
const tableData = ref([
  { id: 1, name: 'Sample Report 1', type: 'Quiz', status: 'Completed', fileFormat: 'PDF' },
  { id: 2, name: 'Sample Report 2', type: 'Course', status: 'In Progress', fileFormat: 'Excel' },
  { id: 3, name: 'Sample Report 3', type: 'Lesson', status: 'Completed', fileFormat: 'PDF' },
])

const handleBack = () => {
  router.back()
}

const handleReset = () => {
  reportType.value = ''
  course.value = ''
  lessonQuiz.value = ''
  dateRange.value = null
  userScope.value = 'all'
  completionStatus.value = ['completed', 'inProgress']
}

const handleApplyFilters = () => {
  // Apply filters functionality to be implemented
}

const handleApplyFiltersAndClose = () => {
  handleApplyFilters()
  isSidebarOpen.value = false
}

const handleGenerateReport = () => {
  // Generate report functionality to be implemented
}

const handleExport = () => {
  // Export functionality to be implemented
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Fetch data for the new page
}
</script>
