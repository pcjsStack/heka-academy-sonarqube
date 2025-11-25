<template>
  <div
    class="bg-white rounded-[20px] border border-gray-200 p-5 relative flex flex-col items-center justify-center min-h-[160px]"
    @click="$emit('click')"
  >
    <!-- Three Dot Menu -->
    <div v-if="idAdmin" class="absolute cursor-pointer top-3 right-3 z-10" @click.stop>
      <ThreeDotMenu :items="menuItems" />
    </div>

    <!-- Badge/Skill Image -->
    <div class="flex items-center justify-center mb-2">
      <div
        class="w-[80px] h-[80px] rounded-[10px] overflow-hidden bg-gray-100 flex items-center justify-center"
      >
        <img v-if="imageUrl" :src="imageUrl" :alt="name" class="w-full h-full object-cover" />
        <BaseIcon
          v-else
          :name="fallbackIcon"
          size="lg"
          :color="fallbackIconColor"
          :tone="fallbackIconTone"
        />
      </div>
    </div>

    <!-- Badge/Skill Name -->
    <div class="text-center">
      <BaseText
        :text="name"
        type="p-sm"
        font="medium"
        class="!text-[14px] !leading-[17px] !text-black/85 truncate capitalize"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseIcon, BaseText } from '@/components/common'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import type { MenuItem } from '@/components/ThreeDotMenu.vue'
import type { Icons } from '@/types/Styles'

interface Props {
  id: number
  name: string
  imageUrl?: string
  type: 'badge' | 'skill'
  idAdmin: boolean
}

const props = withDefaults(defineProps<Props>(), {
  idAdmin: false,
})

const emit = defineEmits<{
  click: []
  edit: [id: number]
  delete: [id: number]
}>()

const menuItems = computed((): MenuItem[] => [
  {
    label: 'Edit',
    icon: 'edit' as Icons,
    action: () => emit('edit', props.id),
  },
  {
    label: 'Delete',
    icon: 'delete' as Icons,
    danger: true,
    action: () => emit('delete', props.id),
  },
])

// Different fallback icons for badges vs skills
const fallbackIcon = computed(() => {
  return props.type === 'badge' ? 'trophy' : 'stars'
})

const fallbackIconColor = computed(() => {
  return props.type === 'badge' ? 'warning' : 'primary'
})

const fallbackIconTone = computed(() => {
  return 400
})
</script>
