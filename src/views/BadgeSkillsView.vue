<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { BaseTab } from '@/components/common'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import {
  EditBadgeModal,
  EditSkillModal,
  BadgeSkillsFilter,
  BadgeSkillsGrid,
} from '@/components/badgeSkills'
import { useBadgeAndSkillStore } from '@/stores/BadgeAndSkill'
import { useBadgeSkillsActions } from '@/composables/useBadgeSkillsActions'
import { t } from '@/utils/i18n'
import type { GetBadgesParams, GetSkillsParams } from '@/types/BadgeAndSkill'
import type { BadgeSkillsFilters } from '@/components/badgeSkills/BadgeSkillsFilter.vue'
import HeaderView from '@/components/layouts/HeaderView.vue'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const badgeStore = useBadgeAndSkillStore()

// Tabs state
const activeTab = ref<'badges' | 'skills'>('badges')
const tabs = computed(() => [
  { label: t('pages.badgeSkills.tabs.badges'), value: 'badges' },
  { label: t('pages.badgeSkills.tabs.skills'), value: 'skills' },
])

// Pagination state per tab
const badgePage = ref(1)
const skillPage = ref(1)
const perPage = 20

// Search and filter state per tab
const badgeSearchQuery = ref('')
const skillSearchQuery = ref('')
const showFilter = ref(false)

const badgeFilters = ref<BadgeSkillsFilters>({ deleted: false })
const skillFilters = ref<BadgeSkillsFilters>({ deleted: false })

const currentFilters = computed(() =>
  activeTab.value === 'badges' ? badgeFilters.value : skillFilters.value,
)

const hasActiveFilters = computed(() => Boolean(currentFilters.value.deleted))

// Build API params functions
const buildBadgeParams = (): GetBadgesParams => ({
  isAdmin: props.isAdmin,
  deletedFilter: badgeFilters.value.deleted ? 'active' : undefined,
  search: badgeSearchQuery.value.trim() || undefined,
  page: badgePage.value - 1,
  perPage,
})

const buildSkillParams = (): GetSkillsParams => ({
  isAdmin: props.isAdmin,
  deletedFilter: skillFilters.value.deleted ? 'active' : undefined,
  search: skillSearchQuery.value.trim() || undefined,
  page: skillPage.value - 1,
  perPage,
})

// Load data functions
const loadBadges = async () => {
  await badgeStore.fetchBadges(buildBadgeParams())
}

const loadSkills = async () => {
  await badgeStore.fetchSkills(buildSkillParams())
}

const loadData = async () => {
  if (activeTab.value === 'badges') {
    await loadBadges()
  } else {
    await loadSkills()
  }
}

// Search handlers with debounce
const createDebouncedSearch = (loadFn: () => Promise<void>) =>
  debounce(() => {
    if (activeTab.value === 'badges') badgePage.value = 1
    else skillPage.value = 1
    loadFn()
  }, 500)

const debouncedBadgeSearch = createDebouncedSearch(loadBadges)
const debouncedSkillSearch = createDebouncedSearch(loadSkills)

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (activeTab.value === 'badges') {
    badgeSearchQuery.value = value
    debouncedBadgeSearch()
  } else {
    skillSearchQuery.value = value
    debouncedSkillSearch()
  }
}

const currentSearchQuery = computed(() =>
  activeTab.value === 'badges' ? badgeSearchQuery.value : skillSearchQuery.value,
)

// Filter handlers
const handleToggleFilter = () => {
  showFilter.value = !showFilter.value
}

const handleApplyFilters = async (filterParams: BadgeSkillsFilters) => {
  if (activeTab.value === 'badges') {
    badgeFilters.value = { ...filterParams }
    badgePage.value = 1
    await loadBadges()
  } else {
    skillFilters.value = { ...filterParams }
    skillPage.value = 1
    await loadSkills()
  }
  showFilter.value = false
}

const handleClearFilters = async () => {
  if (activeTab.value === 'badges') {
    badgeFilters.value = { deleted: false }
    badgePage.value = 1
    await loadBadges()
  } else {
    skillFilters.value = { deleted: false }
    skillPage.value = 1
    await loadSkills()
  }
  showFilter.value = false
}

const handleUpdateFilters = (filterParams: BadgeSkillsFilters) => {
  if (activeTab.value === 'badges') {
    badgeFilters.value = { ...badgeFilters.value, ...filterParams }
  } else {
    skillFilters.value = { ...skillFilters.value, ...filterParams }
  }
}

// Page change handlers
const handleBadgePageChange = async (page: number) => {
  badgePage.value = page
  await loadBadges()
}

const handleSkillPageChange = async (page: number) => {
  skillPage.value = page
  await loadSkills()
}

// Actions composable
const actions = useBadgeSkillsActions(buildBadgeParams, buildSkillParams)

// Watch for tab changes
watch(activeTab, () => {
  loadData()
})

// Fetch data on mount
onMounted(async () => {
  await Promise.all([loadBadges(), loadSkills()])
})

const handleBack = () => {
  router.push(props.isAdmin ? '/admin' : '/')
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <HeaderView
      :title="t('pages.badgeSkills.header.title')"
      :isBack="true"
      @back="handleBack"
      :isSearch="true"
      @inputChange="handleSearchInput"
      :isFilter="isAdmin"
      :searchText="currentSearchQuery"
      :hasActiveFilters="hasActiveFilters"
      @toggleFilter="handleToggleFilter"
    />

    <div class="px-4 sm:px-6 md:px-4 lg:px-8 pb-2">
      <BaseTab v-model="activeTab" :tabs="tabs" />
    </div>

    <main class="px-4 sm:px-6 lg:px-8 py-6">
      <div class="max-w-7xl mx-auto">
        <!-- Badges Tab -->
        <BadgeSkillsGrid
          v-if="activeTab === 'badges'"
          :items="badgeStore.badges"
          type="badge"
          :idAdmin="isAdmin"
          :empty-text="t('pages.badgeSkills.noBadges')"
          :total-pages="badgeStore.badgesTotalPages"
          :current-page="badgePage"
          @item-edit="actions.handleEditBadge"
          @item-delete="actions.handleDeleteBadge"
          @page-change="handleBadgePageChange"
        />

        <!-- Skills Tab -->
        <BadgeSkillsGrid
          v-if="activeTab === 'skills'"
          :items="badgeStore.skills"
          type="skill"
          :idAdmin="isAdmin"
          :empty-text="t('pages.badgeSkills.noSkills')"
          :total-pages="badgeStore.skillsTotalPages"
          :current-page="skillPage"
          @item-edit="actions.handleEditSkill"
          @item-delete="actions.handleDeleteSkill"
          @page-change="handleSkillPageChange"
        />
      </div>
    </main>

    <!-- Modals -->
    <BaseDeleteModal
      v-if="actions.showDeleteModal.value"
      :text="actions.deleteModalText.value"
      :description="actions.deleteModalDescription.value"
      @onCancel="actions.handleCancelDelete"
      @onDelete="actions.handleConfirmDelete"
    />

    <EditBadgeModal
      v-if="actions.showEditBadgeModal.value && isAdmin"
      :show="true"
      :badge-id="actions.editingBadgeId.value"
      :initial-badge-data="actions.editingBadgeData.value"
      :reload-params="buildBadgeParams()"
      @close="actions.handleCloseEditBadgeModal"
      @update="actions.handleUpdateBadge"
    />

    <EditSkillModal
      v-if="actions.showEditSkillModal.value && isAdmin"
      :show="true"
      :skill-id="actions.editingSkillId.value"
      :initial-skills-data="actions.editingSkillsData.value"
      :reload-params="buildSkillParams()"
      @close="actions.handleCloseEditSkillModal"
      @update="actions.handleUpdateSkill"
    />

    <BadgeSkillsFilter
      v-if="showFilter && isAdmin"
      :filters="currentFilters"
      :active-tab="activeTab"
      @close="handleToggleFilter"
      @applyFilters="handleApplyFilters"
      @clear="handleClearFilters"
      @update:filters="handleUpdateFilters"
    />
  </div>
</template>
