<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, BaseSwiperCarousel, BaseButtonIcon } from '@/components/common'
import { flashCardData } from '@/mock/flashCardData'
import type { LessonItem } from '@/types/Lesson'
import { t } from '@/utils/i18n'

withDefaults(
  defineProps<{
    flashCards?: LessonItem[]
  }>(),
  {
    flashCards: () => flashCardData,
  },
)

const emit = defineEmits(['handle-card-click'])
const handleBookmark = (flashCardId: string, isBookmarked: boolean) => {
  console.log(`Flash Card ${flashCardId} bookmarked:`, isBookmarked)
}

const handleLike = (flashCardId: string, isLiked: boolean) => {
  console.log(`Flash Card ${flashCardId} liked:`, isLiked)
}

const handleDislike = (flashCardId: string, isDisliked: boolean) => {
  console.log(`Flash Card ${flashCardId} disliked:`, isDisliked)
}

const handleCardClick = (flashCardId: string) => {
  emit('handle-card-click', flashCardId)
}

const handleItemClick = (item: LessonItem, index: number) => {
  console.log('Carousel item clicked:', item, index)
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
</script>

<template>
  <section class="px-4 lg:px-8 py-6 w-full">
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">{{ t('pages.flashcards.title') }}</h3>
        <div class="flex items-center gap-3">
          <BaseButtonIcon
            icon="chevron-left"
            variant="outline"
            size="sm"
            color="neutral"
            @onClick="carouselRef?.slidePrev()"
            class="w-10 h-10 !rounded-full border-gray-300 bg-white hover:bg-gray-50"
          />
          <BaseButtonIcon
            icon="chevron-right"
            variant="default"
            size="sm"
            color="primary"
            @click="carouselRef?.slideNext()"
            class="w-10 h-10 !rounded-full bg-purple-600 hover:bg-purple-700"
          />
        </div>
      </div>
      <BaseSwiperCarousel
        ref="carouselRef"
        :items="flashCards"
        :options="swiperOptions"
        @itemClick="handleItemClick"
      >
        <template #slide="{ item }">
          <BaseCard
            :title="item.title"
            :category="item.category"
            :categoryColor="item.categoryColor"
            :mentor="item.mentor"
            :mentorAvatar="item.mentorAvatar"
            :progress="item.progress"
            :thumbnail="item.thumbnail"
            :isBookmarked="item.isBookmarked"
            :showLikeDislike="true"
            @bookmark="(isBookmarked) => handleBookmark(item.id, isBookmarked)"
            @like="(isLiked) => handleLike(item.id, isLiked)"
            @dislike="(isDisliked) => handleDislike(item.id, isDisliked)"
            @click="() => handleCardClick(item.id)"
          />
        </template>
      </BaseSwiperCarousel>
    </div>
  </section>
</template>
