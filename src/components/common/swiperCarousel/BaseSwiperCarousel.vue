<script setup lang="ts" generic="T extends { id: string }">
import { ref, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface SwiperOptions {
  slidesPerView?: number
  spaceBetween?: number
  centeredSlides?: boolean
  loop?: boolean
  breakpoints?: Record<number, { slidesPerView: number; spaceBetween: number }>
}

interface Props {
  items: T[]
  options?: SwiperOptions
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
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
  }),
})

const emit = defineEmits<{
  slideChange: []
  itemClick: [item: T, index: number]
}>()

const swiperRef = ref<SwiperType | null>(null)
const swiperModules = [Navigation, Pagination]

const swiperOptions = computed(() => ({
  modules: swiperModules,
  slidesPerView: props.options.slidesPerView ?? 6.5,
  spaceBetween: props.options.spaceBetween ?? 24,
  centeredSlides: props.options.centeredSlides ?? false,
  loop: props.options.loop ?? false,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  breakpoints: props.options.breakpoints ?? {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSwiper: (swiper: any) => {
    swiperRef.value = swiper
  },
  onSlideChange: () => {
    emit('slideChange')
  },
}))

const slidePrev = () => {
  swiperRef.value?.slidePrev()
}

const slideNext = () => {
  swiperRef.value?.slideNext()
}

const handleItemClick = (item: T, index: number) => {
  emit('itemClick', item, index)
}

defineExpose({
  slidePrev,
  slideNext,
  swiperRef,
})
</script>

<template>
  <div class="base-swiper-carousel">
    <Swiper v-bind="swiperOptions" class="swiper-container">
      <SwiperSlide
        v-for="(item, index) in items"
        :key="item.id"
        @click="() => handleItemClick(item, index)"
      >
        <slot name="slide" :item="item" :index="index" />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<style scoped>
/* Hide built-in swiper navigation */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  display: none !important;
}

/* Custom swiper styling */
:deep(.swiper-slide) {
  height: auto;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

/* All slides at same scale and opacity */
:deep(.swiper-slide-active),
:deep(.swiper-slide:not(.swiper-slide-active)) {
  transform: scale(1);
  opacity: 1;
  transition: all 0.3s ease;
}

/* Ensure proper spacing and alignment */
:deep(.swiper-wrapper) {
  align-items: stretch;
}

/* Remove default swiper pagination */
:deep(.swiper-pagination) {
  display: none !important;
}

/* Custom container styling */
.swiper-container {
  padding: 0;
  overflow: visible;
}
</style>
