<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BaseSideModal, BaseText, BaseIcon, BaseRadioButton } from '@/components/common'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import { t } from '@/utils/i18n'
import crownIcon from '@/assets/images/crown.svg?url'
import type { LeaderBoardItem, CourseLeaderboard } from '@/types/LeaderBoard'

const leaderboardStore = useLeaderboardStore()

interface Tab {
  id: number | 'all'
  label: string
  name: string
  isAll?: boolean
}

// Emits
const emit = defineEmits<{
  close: []
}>()

// State
const selectedType = ref<'lessons' | 'courses'>('lessons')
const activeTab = ref<number | 'all' | null>('all')
const isLoading = ref(false)

// Data
const users = computed<LeaderBoardItem[]>(() => leaderboardStore.leaderboardItems)
const courseLeaderboards = computed<CourseLeaderboard[]>(() => leaderboardStore.courseLeaderboards)

// Generate tabs dynamically from courseLeaderboards with "All" as first tab
const tabs = computed<Tab[]>(() => {
  const allTab: Tab = {
    id: 'all',
    label: t('pages.leaderboard.tabs.all'),
    name: t('pages.leaderboard.tabs.all'),
    isAll: true,
  }
  const courseTabs = courseLeaderboards.value.map((item) => ({
    id: item.id,
    label: item.name || item.shortName,
    name: item.name,
    isAll: false,
  }))
  return [allTab, ...courseTabs]
})

// Fetch course/lesson leaderboard list when type changes
watch(
  selectedType,
  async (newType) => {
    try {
      isLoading.value = true
      // Always reset to "All" tab when switching types
      activeTab.value = 'all'
      leaderboardStore.resetLeaderboardItems()

      // First fetch the course/lesson leaderboard list
      await leaderboardStore.fetchCourseLeaderboard(newType === 'courses' ? 'course' : 'lessons')

      // After fetching course list, fetch leaderboard items for "All" tab
      await fetchLeaderboardItems()
    } catch (error) {
      console.error('Error fetching course leaderboard:', error)
    } finally {
      isLoading.value = false
    }
  },
  { immediate: true },
)

// Fetch leaderboard items for selected tab
const fetchLeaderboardItems = async (itemId?: number) => {
  isLoading.value = true
  try {
    const params: {
      ownerType: 'course' | 'lessons'
      ownerId?: number
      page: number
      perPage: number
    } = {
      ownerType: selectedType.value === 'courses' ? 'course' : 'lessons',
      page: 0,
      perPage: 15,
    }

    // Only add ownerId if it's provided (not for "All" tab)
    if (itemId) {
      params.ownerId = itemId
    }

    await leaderboardStore.fetchLessonLeaderboard(params)
  } catch (error) {
    console.error('Error fetching leaderboard items:', error)
  } finally {
    isLoading.value = false
  }
}

// Handle tab click
const handleTabClick = async (tabId: number | 'all') => {
  activeTab.value = tabId
  if (tabId === 'all') {
    // Fetch leaderboard items without ownerId for "All" tab
    await fetchLeaderboardItems()
  } else {
    await fetchLeaderboardItems(tabId)
  }
}

// Methods
const handleClose = () => {
  emit('close')
}

// Get user full name
const getUserFullName = (user: LeaderBoardItem['user']): string => {
  return `${user.firstName || ''} ${user.surname || ''}`.trim() || user.username || ''
}

// Get user image (returns undefined if not available)
const getUserImage = (user: LeaderBoardItem['user']): string | undefined => {
  return user.image || undefined
}

// Check if user has image
const hasUserImage = (user: LeaderBoardItem['user']): boolean => {
  return !!user.image
}

// Get user initials
const getUserInitials = (user: LeaderBoardItem['user']): string => {
  const firstName = user.firstName || ''
  const surname = user.surname || ''
  if (firstName && surname) {
    return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase()
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase()
  }
  if (user.username) {
    return user.username.charAt(0).toUpperCase()
  }
  return 'U'
}

// Get avatar background color based on user ID
const getAvatarColor = (userId: number): string => {
  const colors: string[] = [
    'bg-primary-500',
    'bg-blue-500',
    'bg-teal-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
  ]
  return colors[userId % colors.length] as string
}
</script>
<template>
  <BaseSideModal
    :title="t('pages.leaderboard.title')"
    :close-button="true"
    custom-class="left-0"
    :z-index="99999999"
    @on-close="handleClose"
  >
    <div class="py-8 pb-[0] px-6">
      <!-- Radio Buttons -->
      <div class="flex gap-[64px] mb-8">
        <BaseRadioButton
          :model-value="selectedType"
          value="lessons"
          :label="t('pages.leaderboard.lessons')"
          @update:model-value="selectedType = $event"
          customInputStyles="w-[20px] h-[16px]"
          wrapperClass="!gap-[12px]"
          labelClass="!text-black/50"
          labelActiveClass="!text-black/85"
        />
        <BaseRadioButton
          :model-value="selectedType"
          value="courses"
          :label="t('pages.leaderboard.courses')"
          @update:model-value="selectedType = $event"
          customInputStyles="w-[20px] h-[16px]"
          wrapperClass="!gap-[12px]"
          labelClass="!text-black/50"
          labelActiveClass="!text-black/85"
        />
      </div>

      <!-- Tabs -->
      <div
        v-if="tabs.length > 0"
        class="flex overflow-x-auto mb-4 [scrollbar-width:thin] [scrollbar-color:#6969dd_#e0e0e0]"
      >
        <div class="flex gap-0 min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'py-2 px-4 text-sm leading-[22px] whitespace-nowrap !font-medium border-b-2 transition-colors flex-shrink-0 cursor-pointer',
              activeTab === tab.id
                ? 'text-primary-950 border-primary-950'
                : 'text-neutral-500 border-neutral-200 hover:text-neutral-700',
            ]"
            @click="handleTabClick(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="users.length === 0 && tabs.length > 0"
        class="flex flex-col items-center justify-center py-16"
      >
        <BaseIcon name="inbox" size="lg" color="neutral" :tone="300" class="mb-4" />
        <BaseText :text="t('types.error.noDataFound')" type="p-sm" color="neutral" :tone="500" />
      </div>

      <!-- Top 3 Users (only show if 3+ users) -->
      <div v-if="users.length >= 3" class="relative pt-[65px] mb-[46px]">
        <div class="flex justify-evenly items-end relative z-10">
          <!-- Rank 2 -->
          <div class="flex flex-col items-center">
            <div class="relative mb-2 flex flex-col items-center">
              <div
                class="w-[74px] h-[74px] rounded-full border-[3px] border-primary-850 flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="hasUserImage(users[1]!.user)"
                  :src="getUserImage(users[1]!.user)"
                  :alt="getUserFullName(users[1]!.user)"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  :class="[
                    getAvatarColor(users[1]!.user.id),
                    'w-full h-full flex items-center justify-center text-white font-semibold text-lg',
                  ]"
                >
                  {{ getUserInitials(users[1]!.user) }}
                </div>
              </div>
              <div
                class="w-[28px] h-[28px] rounded-full bg-primary-850 text-white text-[16px] leading-[19px] font-semibold flex items-center justify-center mt-[-18px]"
              >
                2
              </div>
            </div>
            <BaseText
              :text="getUserFullName(users[1]!.user)"
              type="p-sm"
              font="medium"
              class="text-center !text-black/85 !leading-[17px] mb-[6px]"
            />
            <div
              class="flex items-center gap-1 bg-warning-500/10 rounded-[7px] px-[6px] py-1 text-warning-500"
            >
              <BaseIcon name="stars" size="2xs" />
              <BaseText
                :text="users[1]!.percentage.toFixed().toString() || '0'"
                font="medium"
                class="text-warning-500 !leading-[15px] !text-[12px]"
              />
            </div>
          </div>

          <!-- Rank 1 -->
          <div class="flex flex-col items-center mb-[20px]">
            <div class="relative mb-2 flex flex-col items-center">
              <img
                :src="crownIcon"
                alt="crown-icon"
                class="absolute -top-[28px] left-1/2 transform -translate-x-1/2 z-[-1] w-[34px] h-[34px]"
              />
              <div
                class="w-[84px] h-[84px] rounded-full border-[4px] border-primary-950 flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="hasUserImage(users[0]!.user)"
                  :src="getUserImage(users[0]!.user)"
                  :alt="getUserFullName(users[0]!.user)"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  :class="[
                    getAvatarColor(users[0]!.user.id),
                    'w-full h-full flex items-center justify-center text-red-500 font-semibold text-xl',
                  ]"
                >
                  {{ getUserInitials(users[0]!.user) }}
                </div>
              </div>
              <div
                class="w-[28px] h-[28px] rounded-full bg-primary-950 text-white text-[16px] leading-[19px] font-semibold flex items-center justify-center mt-[-18px]"
              >
                1
              </div>
            </div>
            <BaseText
              :text="getUserFullName(users[0]!.user)"
              type="p-sm"
              font="medium"
              class="text-center !text-black/85 !leading-[17px] mb-[6px]"
            />
            <div
              class="flex items-center gap-1 bg-warning-500/10 rounded-[7px] px-[6px] py-1 text-warning-500"
            >
              <BaseIcon name="stars" size="2xs" />
              <BaseText
                :text="users[0]!.percentage.toFixed().toString() || '0'"
                font="medium"
                class="text-warning-500 !leading-[15px] !text-[12px]"
              />
            </div>
          </div>

          <!-- Rank 3 -->
          <div class="flex flex-col items-center">
            <div class="relative mb-2 flex flex-col items-center">
              <div
                class="w-[74px] h-[74px] rounded-full border-[3px] border-primary-850 flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="hasUserImage(users[2]!.user)"
                  :src="getUserImage(users[2]!.user)"
                  :alt="getUserFullName(users[2]!.user)"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  :class="[
                    getAvatarColor(users[2]!.user.id),
                    'w-full h-full flex items-center justify-center text-white font-semibold text-lg',
                  ]"
                >
                  {{ getUserInitials(users[2]!.user) }}
                </div>
              </div>
              <div
                class="w-[28px] h-[28px] rounded-full bg-primary-850 text-white text-[16px] leading-[19px] font-semibold flex items-center justify-center mt-[-18px]"
              >
                3
              </div>
            </div>
            <BaseText
              :text="getUserFullName(users[2]!.user)"
              type="p-sm"
              font="medium"
              class="text-center !text-black/85 !leading-[17px] mb-[6px]"
            />
            <div
              class="flex items-center gap-1 bg-warning-500/10 rounded-[7px] px-[6px] py-1 text-warning-500"
            >
              <BaseIcon name="stars" size="2xs" />
              <BaseText
                :text="users[2]!.percentage.toFixed().toString() || '0'"
                font="medium"
                class="text-warning-500 !leading-[15px] !text-[12px]"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Single User Display (1-2 users) -->
      <div v-if="users.length > 0 && users.length < 3" class="flex flex-col gap-4 mb-4">
        <div
          v-for="(user, index) in users"
          :key="`${user.user.id}-${index}`"
          class="flex items-center px-[20px] py-3 rounded-[16px] transition-colors bg-grey-50 hover:bg-gray-50"
        >
          <!-- Rank Number -->
          <div class="w-[32px]">
            <BaseText
              :text="(index + 1).toString()"
              type="p-sm"
              font="medium"
              class="!text-black/65 !leading-[17px]"
            />
          </div>

          <!-- Profile Image -->
          <div class="relative mr-4">
            <div class="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
              <img
                v-if="hasUserImage(user.user)"
                :src="getUserImage(user.user)"
                :alt="getUserFullName(user.user)"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                :class="[
                  getAvatarColor(user.user.id),
                  'w-full h-full flex items-center justify-center text-white font-semibold text-sm',
                ]"
              >
                {{ getUserInitials(user.user) }}
              </div>
            </div>
          </div>

          <!-- User Info -->
          <div class="flex-1">
            <BaseText
              :text="getUserFullName(user.user)"
              type="p-sm"
              :tone="700"
              font="medium"
              class="!text-black/85 !leading-[17px]"
            />
          </div>

          <!-- Score -->
          <div class="flex items-center gap-1 text-warning-500">
            <BaseIcon name="stars" size="2xs" />
            <BaseText
              :text="user.percentage.toFixed().toString()"
              font="medium"
              class="text-warning-500 !leading-[15px] !text-[12px]"
            />
          </div>
        </div>
      </div>

      <!-- Ranked List (4+) -->
      <div
        v-if="users.length > 3"
        class="relative overflow-x-auto max-h-[400px] flex flex-col gap-2"
      >
        <div
          v-for="(user, index) in users.slice(3)"
          :key="`${user.user.id}-${index}`"
          class="flex items-center px-[20px] py-2 rounded-[16px] transition-colors bg-grey-50 hover:bg-gray-50"
        >
          <!-- Rank Number -->
          <div class="w-[32px]">
            <BaseText
              :text="(index + 4).toString()"
              type="p-sm"
              font="medium"
              class="!text-black/65 !leading-[17px]"
            />
          </div>

          <!-- Profile Image -->
          <div class="relative mr-4">
            <div class="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
              <img
                v-if="hasUserImage(user.user)"
                :src="getUserImage(user.user)"
                :alt="getUserFullName(user.user)"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                :class="[
                  getAvatarColor(user.user.id),
                  'w-full h-full flex items-center justify-center text-white font-semibold text-xs',
                ]"
              >
                {{ getUserInitials(user.user) }}
              </div>
            </div>
          </div>

          <!-- User Info -->
          <div class="flex-1">
            <BaseText
              :text="getUserFullName(user.user)"
              type="p-sm"
              :tone="700"
              font="medium"
              class="!text-black/85 !leading-[17px]"
            />
          </div>

          <!-- Score -->
          <div class="flex items-center gap-1 text-warning-500">
            <BaseIcon name="stars" size="2xs" />
            <BaseText
              :text="user.percentage.toFixed().toString()"
              font="medium"
              class="text-warning-500 !leading-[15px] !text-[12px]"
            />
          </div>
        </div>
      </div>
    </div>
  </BaseSideModal>
</template>
<style scoped></style>
