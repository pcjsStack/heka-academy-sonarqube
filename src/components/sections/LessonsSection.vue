<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseCard, BaseSwiperCarousel, BaseButton, BaseText, BaseIcon } from '@/components/common'
import ProgressTable from '@/components/progress/ProgressTable.vue'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import { CreateLessonModal } from '@/components/lessonCreation'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import { useLessonsStore } from '@/stores/lessonsStore'
import type { Lesson, GetLessonsParams } from '@/types/Lessons'
import { CourseExecutionType, VisibilityStatus, VisibilityType } from '@/types/Course'
import { t } from '@/utils/i18n'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const lessonsStore = useLessonsStore()
const carouselItems = computed(() =>
  lessonsStore.lessons.map((l) => ({ ...l, id: String(l.id), thumbnail: l.imageUrl || '' })),
)

const hasNoLessons = computed(() => carouselItems.value.length === 0)

const showDeleteLessonModal = ref(false)
const showEditLessonModal = ref(false)
const showProgressTable = ref(false)
const selectedCourseVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)
const selectedLessonId = ref<number | null>(null)

onMounted(async () => {
  try {
    const params: GetLessonsParams = {
      page: 0,
      perPage: 8,
      order: 'asc',
      orderColumn: 'name',
      isAdmin: props.isAdmin,
    }
    await lessonsStore.fetchLessons(params)
  } catch (error) {
    console.error('Error fetching lessons:', error)
  }
})

const router = useRouter()

const handleBookmark = (lessonId: string, isBookmarked: boolean) => {
  console.log(`Lesson ${lessonId} bookmarked:`, isBookmarked)
}

const handleCardClick = (lessonId: string) => {
  if (props.isAdmin) {
    router.push({
      name: 'lesson-admin-details',
      params: { id: lessonId },
    })
  } else {
    router.push({
      name: 'lesson-details',
      params: { id: lessonId },
    })
  }
}

const handleProgressLesson = (lessonId: number) => {
  selectedLessonId.value = lessonId
  showProgressTable.value = true
}
const handleCloseProgressTable = () => {
  showProgressTable.value = false
  selectedLessonId.value = null
}
const handleEditLesson = async (lessonId: number, visibility: VisibilityStatus) => {
  if (!props.isAdmin) {
    return
  }
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    selectedLessonId.value = lessonId
    await lessonsStore.fetchLessonById(selectedLessonId.value as number, true)
    showEditLessonModal.value = true
    return
  }
  selectedCourseVisibility.value = visibility
  selectedLessonId.value = lessonId
  showVisibilityChangeModal.value = true
}

const handleCloseEditLesson = () => {
  showEditLessonModal.value = false
  lessonsStore.clearLessonDetails()
}

const handleDeleteLesson = (lessonId: number) => {
  selectedLessonId.value = lessonId
  showDeleteLessonModal.value = true
}

const handleCancelLesson = () => {
  showDeleteLessonModal.value = false
  selectedLessonId.value = null
}
const handleDeleteConfirmLesson = async () => {
  if (selectedLessonId.value) {
    await lessonsStore.deleteLesson([selectedLessonId.value])
    showDeleteLessonModal.value = false
    selectedLessonId.value = null
  }
}

type CarouselItem = Omit<Lesson, 'id'> & { id: string }
const handleItemClick = (item: CarouselItem, index: number) => {
  console.log('Carousel item clicked:', item, index)
}

const carouselRef = ref<{ slidePrev: () => void; slideNext: () => void } | null>(null)

const handleLessonsViewAll = () => {
  if (props.isAdmin) {
    router.push({ name: 'admin-lessons-view' })
  } else {
    router.push({ name: 'lessons-view' })
  }
}

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
const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  selectedLessonId.value = null
  selectedCourseVisibility.value = null
  await lessonsStore.fetchLessons({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'name',
    isAdmin: props.isAdmin,
  })
}

const handleVisibilityChangeEdit = async () => {
  // Proceed to edit course modal
  await lessonsStore.fetchLessonById(selectedLessonId.value as number, true)
  showEditLessonModal.value = true
  showVisibilityChangeModal.value = false
  selectedLessonId.value = null
  selectedCourseVisibility.value = null
}
</script>

<template>
  <section class="px-4 lg:px-8 py-6 w-full">
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">{{ t('pages.lessons.title') }}</h3>
        <div class="flex items-center gap-3">
          <BaseButton
            :text="t('pages.lessons.viewAll')"
            variant="blank"
            size="xs"
            right-icon="chevron-right"
            rightIconSize="xs"
            class="!w-[auto] !p-[0] !font-medium !bg-[transparent]"
            iconTextGapClass="!gap-[2px]"
            @click="handleLessonsViewAll"
          />
        </div>
      </div>
      <BaseSwiperCarousel
        v-if="!hasNoLessons"
        ref="carouselRef"
        :items="carouselItems"
        :options="swiperOptions"
        @itemClick="handleItemClick"
      >
        <template #slide="{ item }">
          <BaseCard
            :title="item.name"
            :category="item.status"
            :categoryColor="'blue'"
            :mentor="`${item.user.firstName} ${item.user.surname}`"
            :mentorAvatar="`${item.user.firstName} ${item.user.surname}`"
            :progress="item.execution?.percentage || 0"
            :thumbnail="item.imageUrl || ''"
            :isEditable="isAdmin"
            :showLikeDislike="false"
            :isAdmin="isAdmin"
            :visibility="item.visibility"
            :start-date="item.startDate ?? null"
            :end-date="item.endDate ?? null"
            :total-assignations="item.totalAssignations ?? 0"
            @bookmark="(isBookmarked) => handleBookmark(item.id, isBookmarked)"
            @click="() => handleCardClick(item.id)"
            @progress="handleProgressLesson(Number(item.id))"
            @edit="handleEditLesson(Number(item.id), item.visibility)"
            @delete="handleDeleteLesson(Number(item.id))"
          />
        </template>
      </BaseSwiperCarousel>

      <!-- No Data Message -->
      <div v-if="hasNoLessons" class="py-8 text-center">
        <div class="flex flex-col items-center justify-center gap-3">
          <BaseIcon name="inbox" size="lg" color="neutral" :tone="300" />
          <BaseText :text="t('pages.lessons.noLessons')" :tone="500" color="neutral" type="p-sm" />
        </div>
      </div>
    </div>
  </section>

  <CreateLessonModal
    v-if="showEditLessonModal && isAdmin"
    :show="showEditLessonModal"
    :edit-lesson="lessonsStore.getLessonDetails"
    @close="handleCloseEditLesson"
  />
  <BaseDeleteModal
    v-if="showDeleteLessonModal && isAdmin"
    :text="t('pages.baseDeleteModal.deleteLesson')"
    :description="t('pages.baseDeleteModal.deleteLessonDescription')"
    @onCancel="handleCancelLesson"
    @onDelete="handleDeleteConfirmLesson"
  />
  <ProgressTable
    v-if="showProgressTable"
    :isOpen="showProgressTable"
    @onClose="handleCloseProgressTable"
    :id="selectedLessonId as number"
    :type="CourseExecutionType.LESSON"
  />
  <CourseVisibilityChangeModal
    v-if="showVisibilityChangeModal && isAdmin"
    :isOpen="showVisibilityChangeModal"
    :itemId="selectedLessonId as number"
    :currentVisibility="selectedCourseVisibility as VisibilityStatus"
    @onClose="showVisibilityChangeModal = false"
    @onSave="handleVisibilityChangeSave"
    :type="VisibilityType.LESSONS"
    @onEdit="handleVisibilityChangeEdit"
  />
</template>
