<script setup lang="ts">
import { computed } from 'vue'
import { BaseIcon, BaseText, BasePagination } from '@/components/common'
import BadgeSkillCard from './BadgeSkillCard.vue'
import type { Badge, Skill } from '@/types/BadgeAndSkill'

interface Props {
  items: (Badge | Skill)[]
  type: 'badge' | 'skill'
  idAdmin: boolean
  emptyText: string
  totalPages?: number
  currentPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalPages: 0,
  currentPage: 1,
  idAdmin: false,
})

const emit = defineEmits<{
  (e: 'item-click', id: number): void
  (e: 'item-edit', id: number): void
  (e: 'item-delete', id: number): void
  (e: 'page-change', page: number): void
}>()

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const hasItems = computed(() => props.items.length > 0)
</script>

<template>
  <div>
    <!-- Empty State -->
    <div v-if="!hasItems" class="py-8 text-center">
      <div class="flex flex-col items-center justify-center gap-3">
        <BaseIcon name="inbox" size="xl" color="neutral" :tone="300" class="mb-4" />
        <BaseText :text="emptyText" type="p-md" color="neutral" :tone="500" />
      </div>
    </div>

    <!-- Grid with Items -->
    <template v-else>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-8 gap-6"
      >
        <BadgeSkillCard
          v-for="item in items"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :idAdmin="idAdmin"
          :image-url="item.imageUrl"
          :type="type"
          :isDeleted="item.isDeleted"
          @click="emit('item-click', item.id)"
          @edit="emit('item-edit', item.id)"
          @delete="emit('item-delete', item.id)"
        />
      </div>

      <!-- Pagination -->
      <div class="flex justify-center mt-6">
        <BasePagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          @update:current-page="handlePageChange"
        />
      </div>
    </template>
  </div>
</template>
