<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseCard, BaseButton, BaseSwiperCarousel, BaseText, BaseIcon } from '@/components/common'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import ProgressTable from '@/components/progress/ProgressTable.vue'
import { CourseCreationModal } from '@/components/courseCreation'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import { useCourseStore } from '@/stores/courseStore'
import {
  CourseExecutionType,
  VisibilityStatus,
  type CourseDetails,
  type GetCoursesParams,
  type CourseItem,
  VisibilityType,
} from '@/types/Course'
import { t } from '@/utils/i18n'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const coursesStore = useCourseStore()
const courses = ref<CourseItem[]>([])
const isShowCourseCreationModal = ref(false)
const showDeleteCourseModal = ref(false)
const selectedCourseVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)
const selectedCourseId = ref<number | null>(null)
const showProgressTable = ref(false)
const carouselItems = computed(() =>
  coursesStore.courses.map((c) => ({ ...c, id: String(c.id), thumbnail: c.imageUrl || '' })),
)

const hasNoCourses = computed(
  () => !coursesStore.coursesIsLoading && carouselItems.value.length === 0,
)

onMounted(async () => {
  try {
    const params: GetCoursesParams = { page: 0, perPage: 12, order: 'asc', orderColumn: 'name' }
    await coursesStore.fetchCourses({ ...params, isAdmin: props.isAdmin })
    courses.value = coursesStore.courses
  } catch (error) {
    console.error('Error fetching courses:', error)
  }
})
const router = useRouter()

const handleCardClick = (courseId: string) => {
  if (props.isAdmin) {
    router.push({ name: 'course-admin-details', params: { id: courseId } })
  } else {
    router.push({ name: 'course-details', params: { id: courseId } })
  }
}

const carouselRef = ref<{ slidePrev: () => void; slideNext: () => void } | null>(null)

const swiperOptions = {
  slidesPerView: 6.5,
  spaceBetween: 24,
  centeredSlides: false,
  loop: false,
  breakpoints: {
    1280: {
      slidesPerView: 5.5,
      spaceBetween: 24,
    },
    768: {
      slidesPerView: 3.5,
      spaceBetween: 16,
    },
    320: {
      slidesPerView: 1.5,
      spaceBetween: 16,
    },
  },
}

const handleCoursesViewAll = () => {
  if (props.isAdmin) {
    router.push({ name: 'admin-course-view' })
  } else {
    router.push({ name: 'course-view' })
  }
}
const handleDeleteCourse = (courseId: number) => {
  selectedCourseId.value = courseId
  showDeleteCourseModal.value = true
}
const handleCancelCourseModal = () => {
  showDeleteCourseModal.value = false
}
const handleDeleteConfirmCourseModal = async () => {
  if (selectedCourseId.value) {
    await coursesStore.deleteCourse([selectedCourseId.value], 'soft')
    showDeleteCourseModal.value = false
    selectedCourseId.value = null
  }
}
const handleEditCourse = async (courseId: number, visibility: VisibilityStatus) => {
  if (!props.isAdmin) {
    return
  }
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    selectedCourseId.value = courseId
    await coursesStore.fetchCourseById(selectedCourseId.value as number, true)
    isShowCourseCreationModal.value = true
    return
  }
  selectedCourseVisibility.value = visibility
  selectedCourseId.value = courseId
  showVisibilityChangeModal.value = true
}

const handleProgressCourse = (courseId: number) => {
  selectedCourseId.value = courseId
  showProgressTable.value = true
}
const handleCloseProgressTable = () => {
  showProgressTable.value = false
  selectedCourseId.value = null
}
const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  selectedCourseId.value = null
  selectedCourseVisibility.value = null
  await coursesStore.fetchCourses({
    page: 0,
    perPage: 12,
    order: 'asc',
    orderColumn: 'name',
    isAdmin: props.isAdmin,
  })
}

const handleVisibilityChangeEdit = async () => {
  // Proceed to edit course modal
  await coursesStore.fetchCourseById(selectedCourseId.value as number, true)
  isShowCourseCreationModal.value = true
  showVisibilityChangeModal.value = false
  selectedCourseId.value = null
  selectedCourseVisibility.value = null
}
</script>

<template>
  <section class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6 w-full">
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center mb-6 md:mb-5 lg:mb-6">
        <h3
          class="text-[18px] md:text-base lg:text-[18px] font-semibold text-black/85 leading-[22px]"
        >
          {{ t('pages.courses.title') }}
        </h3>
        <div class="flex items-center gap-3 md:gap-2.5 lg:gap-3">
          <BaseButton
            :text="t('pages.uploadedFiles.viewAll')"
            variant="blank"
            size="xs"
            right-icon="chevron-right"
            rightIconSize="xs"
            class="!w-[auto] !p-[0] !font-medium !bg-[transparent]"
            iconTextGapClass="!gap-[2px]"
            @click="handleCoursesViewAll"
          />
        </div>
      </div>

      <!-- Carousel -->
      <BaseSwiperCarousel
        v-if="!hasNoCourses"
        ref="carouselRef"
        :items="carouselItems"
        :options="swiperOptions"
      >
        <template #slide="{ item }">
          <BaseCard
            :title="item.name"
            :category="item.category?.name || ''"
            :categoryColor="'blue'"
            :mentor="(item.user?.firstName || '') + ' ' + (item.user?.surname || '')"
            :mentorAvatar="(item.user?.firstName || '') + ' ' + (item.user?.surname || '')"
            :progress="item.execution?.percentage || 0"
            :thumbnail="item.imageUrl || undefined"
            :isEditable="isAdmin"
            :visibility="item.visibility"
            :start-date="item.startDate"
            :end-date="item.endDate"
            :total-assignations="item.totalAssignations"
            @click="() => handleCardClick(String(item.id))"
            @edit="handleEditCourse(Number(item.id), item.visibility)"
            @delete="() => handleDeleteCourse(Number(item.id))"
            @progress="handleProgressCourse(Number(item.id))"
            :isAdmin="isAdmin"
          />
        </template>
      </BaseSwiperCarousel>

      <!-- No Data Message -->
      <div v-if="hasNoCourses" class="py-8 text-center">
        <div class="flex flex-col items-center justify-center gap-3">
          <BaseIcon name="inbox" size="lg" color="neutral" :tone="300" />
          <BaseText :text="t('pages.courses.noCourses')" :tone="500" color="neutral" type="p-sm" />
        </div>
      </div>
    </div>
  </section>
  <CourseCreationModal
    :title="t('pages.courses.createCourse')"
    v-if="isShowCourseCreationModal && isAdmin"
    :editCourse="coursesStore.courseDetails as CourseDetails"
    @close="isShowCourseCreationModal = false"
  />
  <BaseDeleteModal
    v-if="showDeleteCourseModal && isAdmin"
    :text="t('pages.baseDeleteModal.deleteCourse')"
    :description="t('pages.baseDeleteModal.deleteCourseDescription')"
    @onCancel="handleCancelCourseModal"
    @onDelete="handleDeleteConfirmCourseModal"
  />
  <ProgressTable
    v-if="showProgressTable"
    :isOpen="showProgressTable"
    @onClose="handleCloseProgressTable"
    :id="selectedCourseId as number"
    :type="CourseExecutionType.COURSE"
  />
  <CourseVisibilityChangeModal
    v-if="showVisibilityChangeModal && isAdmin"
    :isOpen="showVisibilityChangeModal"
    :itemId="selectedCourseId as number"
    :currentVisibility="selectedCourseVisibility as VisibilityStatus"
    @onClose="showVisibilityChangeModal = false"
    @onSave="handleVisibilityChangeSave"
    :type="VisibilityType.COURSE"
    @onEdit="handleVisibilityChangeEdit"
  />
</template>
