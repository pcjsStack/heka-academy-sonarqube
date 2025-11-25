<script setup lang="ts">
import { useRouter } from 'vue-router'
import FlashCardListing from '@/components/flashCard/FlashCardListing.vue'

const router = useRouter()

const handleCardClick = (flashCardId: string) => {
  router.push({ name: 'flash-card-details', params: { id: flashCardId } })
}
</script>

<template>
  <FlashCardListing @handle-card-click="handleCardClick" />
</template>
