<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BaseIcon } from '@/components/common'

const props = defineProps<{
  images: string[]
  imageClass?: string
  leftIconClass?: string
  rightIconClass?: string
  isDelete?: boolean
}>()

const emit = defineEmits(['close', 'delete', 'change'])

const currentIndex = ref(0)
const images = computed(() => props.images || [])

const nextImage = () => {
  if (images.value.length === 0) {
    emit('close')
    return
  }
  // Loop back to first image when reaching the end
  currentIndex.value = (currentIndex.value + 1) % images.value.length
  emit('change', currentIndex.value)
}

const prevImage = () => {
  if (images.value.length > 0) {
    // Loop to last image when going back from first image
    currentIndex.value = (currentIndex.value - 1 + images.value.length) % images.value.length
    emit('change', currentIndex.value)
  }
}

watch(
  () => props.images,
  (newImages) => {
    if (currentIndex.value >= newImages.length) {
      currentIndex.value = newImages.length - 1
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="grid grid-cols-1 gap-4">
    <div class="relative">
      <div class="w-full h-full mx-auto text-center">
        <img
          :src="images[currentIndex]"
          alt="Product Display"
          :class="['rounded-[20px] w-full h-full object-contain', imageClass]"
        />
      </div>
      <BaseIcon
        v-if="isDelete"
        name="delete-3"
        class="absolute top-3 right-3 bg-white/90 p-1.5 rounded-[6px] cursor-pointer z-10"
        color="red"
        size="xl"
        @click="emit('delete', images[currentIndex])"
      />
      <BaseIcon
        v-if="images.length > 1"
        name="chevron-left"
        class="absolute left-5 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-[6px] cursor-pointer"
        :class="leftIconClass"
        color="blank"
        size="xl"
        @click="prevImage"
      />
      <BaseIcon
        v-if="images.length > 1"
        name="chevron-right"
        class="absolute right-5 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-[6px] cursor-pointer"
        :class="rightIconClass"
        color="blank"
        size="xl"
        @click="nextImage"
      />
      <div
        v-if="images.length > 1"
        class="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium"
      >
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>
  </div>
</template>
