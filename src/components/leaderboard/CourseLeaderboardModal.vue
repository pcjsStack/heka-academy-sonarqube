<template>
  <BaseSideModal
    :title="t('pages.leaderboard.title')"
    :close-button="true"
    size="md"
    custom-class="left-0"
    :z-index="99999999"
    @on-close="handleClose"
  >
    <div class="px-6 py-6">
      <!-- Ranked List -->
      <div class="flex flex-col gap-2 mb-6">
        <div
          v-for="user in users"
          :key="user.id"
          :class="[
            'flex items-center px-5 py-3 rounded-[12px]',
            user.rank <= 3 ? 'bg-primary-550-6' : 'bg-grey-50',
          ]"
        >
          <!-- Rank Number -->
          <div class="w-[32px]">
            <BaseText
              :text="user.rank.toString()"
              type="p-sm"
              font="medium"
              class="!text-black/65 !leading-[17px]"
            />
          </div>

          <!-- Profile Image -->
          <div class="relative mr-4">
            <img :src="user.image" :alt="user.name" class="w-9 h-9 rounded-full object-cover" />
          </div>

          <!-- User Name -->
          <div class="flex-1">
            <BaseText
              :text="user.name"
              type="p-sm"
              font="medium"
              class="!text-black/85 !leading-[17px]"
            />
          </div>

          <!-- Score -->
          <div class="flex items-center gap-1 text-warning-500">
            <BaseIcon name="stars" size="2xs" />
            <BaseText
              :text="user.score.toString()"
              font="medium"
              class="text-warning-500 !leading-[15px] !text-[12px]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Button -->
    <div class="px-6 pb-6 flex justify-end">
      <BaseButton
        :text="t('pages.courseCompleted.returnHome')"
        color="primary"
        variant="default"
        size="md"
        :full-size="false"
        tailwind-css="!w-auto"
        @on-click="handleReturnHome"
      />
    </div>
  </BaseSideModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BaseSideModal, BaseText, BaseIcon, BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'

// Import images
import JennyImg from '@/assets/users/Jenny.png'
import MeghanImg from '@/assets/users/Meghan.png'
import AlexImg from '@/assets/users/Alex.jpg'
import GiuliaImg from '@/assets/users/Giulia.png'
import LucaImg from '@/assets/users/Luca.png'
import ElenaImg from '@/assets/users/Elena.png'
import AntonioImg from '@/assets/users/antonio_romano.png'
import GiorgiaImg from '@/assets/users/giorgia_verde.png'

interface User {
  id: number
  name: string
  score: number
  image: string
  rank: number
}

// Emits
const emit = defineEmits<{
  close: []
  returnHome: []
}>()

// Mock data - replace with actual API data
const users = ref<User[]>([
  {
    id: 1,
    rank: 1,
    name: 'Jenny Wilson',
    score: 200,
    image: JennyImg,
  },
  {
    id: 2,
    rank: 2,
    name: 'Meghan Jessica',
    score: 150,
    image: MeghanImg,
  },
  {
    id: 3,
    rank: 3,
    name: 'Alex Turner',
    score: 100,
    image: AlexImg,
  },
  {
    id: 4,
    rank: 4,
    name: 'Giulia Rossi',
    score: 90,
    image: GiuliaImg,
  },
  {
    id: 5,
    rank: 4,
    name: 'Giulia Rossi',
    score: 90,
    image: GiuliaImg,
  },
  {
    id: 6,
    rank: 5,
    name: 'Luca Bianchi',
    score: 80,
    image: LucaImg,
  },
  {
    id: 7,
    rank: 6,
    name: 'Davide M',
    score: 75,
    image: LucaImg,
  },
  {
    id: 8,
    rank: 7,
    name: 'Elena Fiore',
    score: 70,
    image: ElenaImg,
  },
  {
    id: 9,
    rank: 8,
    name: 'Antonio Romano',
    score: 67,
    image: AntonioImg,
  },
  {
    id: 10,
    rank: 9,
    name: 'Giorgia Verde',
    score: 60,
    image: GiorgiaImg,
  },
])

// Methods
const handleClose = () => {
  emit('close')
}

const handleReturnHome = () => {
  emit('returnHome')
}
</script>
