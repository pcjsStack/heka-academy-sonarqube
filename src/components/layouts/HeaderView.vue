<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { BaseInput, BaseIcon, BaseButtonIcon } from '@/components/common'
import { t } from '@/utils/i18n'

defineEmits(['back', 'inputChange', 'toggleFilter', 'toggleViewType'])

const props = withDefaults(
  defineProps<{
    title: string
    isBack?: boolean
    isSearch?: boolean
    custom_actions?: boolean
    isFilter?: boolean
    isShowViewType?: boolean
    isActiveViewType?: 'grid' | 'list'
    isPerformance?: boolean
    isShowFilter?: boolean
    hasActiveFilters?: boolean
    searchClear?: boolean
    searchText?: string
  }>(),
  {
    isBack: false,
    isSearch: true,
    title: '',
    custom_actions: false,
    isFilter: false,
    isShowViewType: false,
    isActiveViewType: 'grid',
    isPerformance: false,
    hasActiveFilters: false,
    isShowFilter: false,
    searchClear: false,
    searchText: '',
  },
)
const showCreateMenu = ref('')
const searchInputValue = ref('')

// Click outside functionality
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const dropdownContainer = target.closest('.dropdown-container')

  if (!dropdownContainer && showCreateMenu.value) {
    showCreateMenu.value = ''
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(
  () => props.isShowViewType,
  () => {
    searchInputValue.value = ''
  },
)
// Watch for changes in the search value from the store
watch(
  () => props.searchText,
  (newValue) => {
    searchInputValue.value = newValue || ''
  },
  { immediate: true },
)
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 bg-white border-b border-gray-200',
      'flex flex-wrap items-center justify-between',
      'p-4 sm:px-6 sm:py-4 md:px-4 md:py-4 md:pb-3 lg:px-8 lg:py-[18px] lg:pb-[10px]',
      isPerformance ? 'gap-2 md:gap-3 lg:gap-4' : 'gap-2',
    ]"
  >
    <!-- Left: Back button + Title -->
    <div class="flex items-center gap-2 md:gap-3 lg:gap-4 min-w-0 flex-1 lg:flex-initial">
      <BaseIcon
        v-if="isBack"
        name="angle-left"
        size="sm"
        color="neutral-700 !w-[12px]"
        class="cursor-pointer flex-shrink-0"
        iconCutomSize="!w-[12px]"
        @click="$emit('back')"
      />

      <h1
        class="text-lg md:text-[20px] lg:text-[24px] font-semibold text-neutral-700 tracking-[-0.032px] truncate"
      >
        {{ title }}
      </h1>
    </div>

    <!-- Right: View Type Toggles (if filter + show view type) -->
    <div v-if="isFilter && isShowViewType" class="flex items-center gap-2 flex-shrink-0">
      <BaseButtonIcon
        icon="grid-outline"
        iconClass="!text-primary-950 !w-[14px]"
        size="sm"
        color="primary"
        variant="default"
        :class="[
          isActiveViewType === 'grid' ? '!bg-[rgba(25,117,255,0.1)]' : '!bg-[transparent]',
          '!w-[41px] !h-[40px] !rounded-[8px]',
        ]"
        :aria-label="t('pages.common.gridView')"
        @on-click="$emit('toggleViewType', 'grid')"
      />
      <BaseButtonIcon
        icon="list-view"
        iconClass="!text-black/50 !w-[14px]"
        size="sm"
        variant="default"
        color="neutral"
        :aria-label="t('pages.common.listView')"
        :class="[
          isActiveViewType === 'list' ? '!bg-[rgba(25,117,255,0.1)]' : '!bg-[transparent]',
          '!w-[41px] !h-[40px] !rounded-[8px]',
        ]"
        @on-click="$emit('toggleViewType', 'list')"
      />
    </div>

    <!-- Right: Search + Filter + Custom Actions -->
    <div
      :class="[
        'flex flex-wrap items-center gap-2',
        isFilter ? 'w-full lg:w-auto mt-2 lg:mt-0' : 'w-full sm:w-auto',
      ]"
    >
      <!-- Search Input -->
      <div v-if="isSearch" class="relative flex-1 min-w-[200px] lg:flex-initial lg:min-w-0">
        <BaseInput
          id-name="inputPlace"
          :placeholder="t('pages.common.search')"
          type="text"
          icon-name-left="search"
          tailwind-css="pl-10 py-2.5 rounded-lg text-sm text-grey-600 leading-5 font-normal"
          class="w-full lg:!w-[260px]"
          :clearable="searchClear"
          v-model="searchInputValue"
          @onInput="(event: Event) => $emit('inputChange', event)"
        />
        <BaseButtonIcon
          v-if="custom_actions && isFilter && isShowFilter"
          icon="filter-1"
          iconClass="!fill-grey-800 !w-[14px] !h-[14px]"
          size="sm"
          color="neutral"
          :aria-label="t('pages.common.filter')"
          variant="default"
          class="!rounded-[8px] !absolute top-[10px] !right-[10px] !p-0 !bg-mainBackground"
        />
      </div>

      <!-- Filter Button -->
      <BaseButtonIcon
        v-if="isFilter"
        icon="filter"
        iconClass="!text-black !w-[14px] !h-[14px]"
        size="sm"
        variant="outline"
        color="neutral"
        :aria-label="t('pages.common.filter')"
        class="relative !w-[41px] !h-[40px] !rounded-[8px] !border-neutral-300 flex-shrink-0"
        @on-click="$emit('toggleFilter')"
      >
        <template #badge>
          <span
            v-if="hasActiveFilters"
            class="absolute top-[9px] right-[10px] w-2 h-2 bg-pink rounded-full"
          ></span>
        </template>
      </BaseButtonIcon>

      <!-- Custom Actions Slot -->
      <div v-if="custom_actions" class="flex-shrink-0">
        <slot name="custom_actions"></slot>
      </div>
    </div>
  </header>
</template>
