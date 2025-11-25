<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { BaseIcon, BaseButton, BasePagination, BaseText } from '@/components/common'
import HeaderView from '@/components/layouts/HeaderView.vue'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import CategoryFilter from '@/components/sections/CategoryFilter.vue'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import { AddCategoryModal } from '@/components/courseManagement'
import { useCategoryStore } from '@/stores/categoryStore'
import type { MenuItem } from '@/components/ThreeDotMenu.vue'
import { VisibilityStatus, VisibilityType } from '@/types/Course'
import { t } from '@/utils/i18n'
import type { GetCategoriesParams } from '@/types/Category'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const filters = ref<GetCategoriesParams>({
  search: '',
  page: 0,
  perPage: 8,
  visibility: null,
  status: undefined,
  isAdmin: false,
})

const router = useRouter()
const categoryStore = useCategoryStore()
const showDeleteModal = ref(false)
const showFilterModal = ref(false)
const showCategoryCreationModal = ref(false)
const selectedCategoryId = ref<number | null>(null)
const selectedCategoryVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)
const editingCategoryId = ref<number | null>(null)

const handleBack = () => {
  if (props.isAdmin) {
    router.push('/admin')
  } else {
    router.push('/')
  }
}

onMounted(async () => {
  await loadCategories()
})

const loadCategories = async () => {
  await categoryStore.fetchCategories({
    ...filters.value,
    isAdmin: props.isAdmin,
  })
}

const hasActiveFilters = computed(() => {
  const vis = filters.value.visibility
  const hasVisibilityFilter = vis
    ? Array.isArray(vis)
      ? vis.length > 0 && vis.some((v) => String(v) !== 'all')
      : String(vis) !== 'all'
    : false
  return Boolean(hasVisibilityFilter)
})

const handleInputChange = (event: Event) => {
  const searchValue = (event.target as HTMLInputElement).value
  filters.value.search = searchValue
  debouncedSearch()
}

const debouncedSearch = debounce(() => {
  filters.value.page = 0
  loadCategories()
}, 500)

const toggleFilter = () => {
  showFilterModal.value = !showFilterModal.value
}

const handleApplyFilters = () => {
  filters.value.page = 0
  loadCategories()
  showFilterModal.value = false
}

const handleClearFilters = () => {
  filters.value = {
    search: filters.value.search,
    page: 0,
    perPage: 8,
    visibility: undefined,
    status: undefined,
    isAdmin: props.isAdmin,
  }
  showFilterModal.value = false
  loadCategories()
}

const handleUpdateFilters = (filterParams: GetCategoriesParams) => {
  filters.value = { ...filters.value, ...filterParams }
}

const handleDeleteClick = (categoryId: number) => {
  selectedCategoryId.value = categoryId
  showDeleteModal.value = true
}

const handleCancelDelete = () => {
  showDeleteModal.value = false
  selectedCategoryId.value = null
}

const handleConfirmDelete = async () => {
  showDeleteModal.value = false
  if (selectedCategoryId.value) {
    await categoryStore.handleDeleteCategory([selectedCategoryId.value], 'soft')
    await loadCategories()
  }
  selectedCategoryId.value = null
}

const handleEditCategory = (categoryId: number, visibility: VisibilityStatus) => {
  if (!props.isAdmin) {
    return
  }
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    editingCategoryId.value = categoryId
    showCategoryCreationModal.value = true
    return
  }
  selectedCategoryVisibility.value = visibility
  editingCategoryId.value = categoryId
  showVisibilityChangeModal.value = true
}

const getMenuItems = (categoryId: number): MenuItem[] => {
  const category = categoryStore.categories.find((cat) => Number(cat.id) === Number(categoryId))
  const isEditDisabled = category?.visibility === VisibilityStatus.MAINTENANCE
  // Disable edit and delete if not in Maintenance or Hide status
  const isDisabled = !isEditDisabled
  const disabledTooltip = isDisabled ? t('pages.category.buttons.cannotDeleteNotDraft') : undefined

  return [
    {
      label: t('pages.common.edit'),
      icon: 'edit',
      action: () => handleEditCategory(categoryId, category?.visibility as VisibilityStatus),
    },
    {
      label: t('pages.common.delete'),
      icon: 'delete',
      danger: true,
      disabled: isDisabled,
      tooltip: disabledTooltip,
      action: () => handleDeleteClick(categoryId),
    },
  ]
}

const handleCategoryClick = (categoryId: number) => {
  const category = categoryStore.categories.find((cat) => cat.id === categoryId)
  // Disable click if not admin and visibility is maintenance
  if (!props.isAdmin && category?.visibility === VisibilityStatus.MAINTENANCE) {
    return
  }
  router.push({
    name: props.isAdmin ? 'admin-category-detail' : 'category-detail',
    params: { id: categoryId },
  })
}

const isCategoryDisabled = (categoryId: number) => {
  const category = categoryStore.categories.find((cat) => cat.id === categoryId)
  return !props.isAdmin && category?.visibility === VisibilityStatus.MAINTENANCE
}

const handlePageChangeCategory = async (page: number) => {
  filters.value.page = page - 1
  await loadCategories()
}

const handleCreateCategory = () => {
  editingCategoryId.value = null
  showCategoryCreationModal.value = true
}

const handleCloseCategoryCreationModal = async () => {
  showCategoryCreationModal.value = false
  editingCategoryId.value = null
  await loadCategories()
}
const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  editingCategoryId.value = null
  selectedCategoryVisibility.value = null
  loadCategories()
}

const handleVisibilityChangeEdit = async () => {
  showCategoryCreationModal.value = true
  showVisibilityChangeModal.value = false
  selectedCategoryVisibility.value = null
}

const handleVisibilityChangeClose = () => {
  showVisibilityChangeModal.value = false
  editingCategoryId.value = null
  selectedCategoryVisibility.value = null
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-full mx-auto">
      <HeaderView
        :title="t('pages.categories.title')"
        :isBack="true"
        @back="handleBack"
        :isFilter="isAdmin"
        :hasActiveFilters="hasActiveFilters"
        isSearch
        @inputChange="handleInputChange"
        @toggleFilter="toggleFilter"
        custom_actions
      >
        <template #custom_actions>
          <BaseButton
            v-if="isAdmin"
            :text="t('pages.categories.createCategory')"
            variant="default"
            size="md"
            @on-click="handleCreateCategory"
          />
        </template>
      </HeaderView>

      <div
        class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6"
        v-if="categoryStore.categories.length > 0"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-6 md:gap-5 lg:gap-6"
        >
          <div
            v-for="category in categoryStore.categories"
            :key="category.id"
            :class="[
              'bg-white rounded-[20px] border border-gray-200 overflow-hidden',
              isCategoryDisabled(category.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ]"
            @click="handleCategoryClick(category.id)"
          >
            <div class="flex items-center p-4 md:p-2.5 lg:p-4 relative">
              <!-- Icon -->
              <div class="flex-shrink-0 mr-4 md:mr-2.5 lg:mr-4">
                <BaseIcon name="grid" size="5xl" color="neutral" :tone="700" />
              </div>

              <!-- Title and Badge -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 md:gap-1.5 lg:gap-2 flex-wrap">
                  <h3
                    class="font-medium text-gray-900 text-sm md:text-xs lg:text-sm truncate capitalize"
                  >
                    {{ category.name }}
                  </h3>
                  <!-- Maintenance Badge -->
                  <div
                    v-if="category.visibility === VisibilityStatus.MAINTENANCE"
                    class="inline-flex items-center rounded-[8px] px-2 py-1 bg-warning-400 gap-1.5 flex-shrink-0"
                  >
                    <BaseIcon name="pause" size="xs" color="white" />
                    <BaseText
                      :text="t('pages.category.status.maintenance')"
                      type="p-xs"
                      color="white"
                      font="semibold"
                      class="!text-[11px] md:!text-[10px] lg:!text-[11px] !leading-[13px]"
                    />
                  </div>
                  <div
                    v-if="category.visibility === VisibilityStatus.HIDE"
                    class="inline-flex items-center rounded-[8px] px-2 py-1 bg-warning-400 gap-1.5 flex-shrink-0"
                  >
                    <BaseIcon name="eye-off" size="xs" color="white" />
                    <BaseText
                      :text="t('pages.category.status.hide')"
                      type="p-xs"
                      color="white"
                      font="semibold"
                      class="!text-[11px] md:!text-[10px] lg:!text-[11px] !leading-[13px]"
                    />
                  </div>
                </div>
              </div>

              <!-- Three Dot Menu -->
              <div class="flex-shrink-0 ml-2 md:ml-1.5 lg:ml-2" @click.stop>
                <ThreeDotMenu v-if="isAdmin" :items="getMenuItems(category.id)" />
              </div>
            </div>
          </div>
        </div>
        <div class="flex mt-6 md:mt-5 lg:mt-6 justify-center max-w-full">
          <BasePagination
            :currentPage="categoryStore.categoriesCurrentPage + 1"
            :totalPages="categoryStore.categoriesTotalPages"
            @update:current-page="handlePageChangeCategory"
          />
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12 md:py-10 lg:py-12">
        <div
          class="text-gray-400 text-lg md:text-base lg:text-lg font-medium mb-2 md:mb-1.5 lg:mb-2"
        >
          {{ t('pages.categories.noCategories') }}
        </div>
      </div>
    </div>
  </div>

  <BaseDeleteModal
    v-if="showDeleteModal && isAdmin"
    :text="t('pages.categories.deleteModal.title')"
    :description="t('pages.categories.deleteModal.description')"
    @onCancel="handleCancelDelete"
    @onDelete="handleConfirmDelete"
  />

  <CategoryFilter
    v-if="showFilterModal && isAdmin"
    :filters="filters"
    :is-admin="props.isAdmin"
    @close="toggleFilter"
    @applyFilters="handleApplyFilters"
    @clear="handleClearFilters"
    @update:filters="handleUpdateFilters"
  />

  <AddCategoryModal
    v-if="showCategoryCreationModal && isAdmin"
    :show="showCategoryCreationModal"
    :category-id="editingCategoryId"
    :is-dashboard="false"
    @close="handleCloseCategoryCreationModal"
  />
  <CourseVisibilityChangeModal
    v-if="showVisibilityChangeModal && isAdmin && editingCategoryId"
    :isOpen="showVisibilityChangeModal"
    :itemId="editingCategoryId as number"
    :currentVisibility="selectedCategoryVisibility as VisibilityStatus"
    @onClose="handleVisibilityChangeClose"
    @onSave="handleVisibilityChangeSave"
    :type="VisibilityType.CATEGORY"
    @onEdit="handleVisibilityChangeEdit"
  />
</template>
