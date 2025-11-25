<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, BaseIcon, BaseText } from '@/components/common'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import AddCategoryModal from '@/components/courseManagement/AddCategoryModal.vue'
import { CourseVisibilityChangeModal } from '@/components/courseManagement'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import type { MenuItem } from '@/components/ThreeDotMenu.vue'
import { VisibilityStatus, VisibilityType } from '@/types/Course'
import { t } from '@/utils/i18n'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const addCategoryModal = ref(false)
const editingCategoryId = ref<number | undefined>(undefined)
const categoryStore = useCategoryStore()

const showDeleteModal = ref(false)
const selectedCategoryId = ref<number | undefined>(undefined)
const selectedCategoryVisibility = ref<VisibilityStatus | null>(null)
const showVisibilityChangeModal = ref(false)

onMounted(async () => {
  await loadCategories()
})
const loadCategories = async () => {
  await categoryStore.fetchCategories({
    page: 0,
    isAdmin: props.isAdmin,
  })
}

const handleCategoriesViewAll = () => {
  if (props.isAdmin) {
    router.push({ name: 'admin-categories-view' })
  } else {
    router.push({ name: 'categories-view' })
  }
}

const handleDeleteClick = (categoryId: number) => {
  selectedCategoryId.value = categoryId
  showDeleteModal.value = true
}

const handleCancelDelete = () => {
  showDeleteModal.value = false
}

const handleConfirmDelete = async () => {
  showDeleteModal.value = false
  if (selectedCategoryId.value) {
    await categoryStore.handleDeleteCategory([selectedCategoryId.value], 'soft')
    await categoryStore.fetchCategories({
      page: 0,
      perPage: 8,
      isAdmin: props.isAdmin,
    })
  }
  selectedCategoryId.value = undefined
}

const handleEditCategory = (categoryId: number, visibility: VisibilityStatus) => {
  if (!props.isAdmin) {
    return
  }
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    editingCategoryId.value = categoryId
    addCategoryModal.value = true
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

const hasNoCategories = computed(() => categoryStore.categories.length === 0)

const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  editingCategoryId.value = undefined
  selectedCategoryVisibility.value = null
  loadCategories()
}

const handleVisibilityChangeEdit = async () => {
  addCategoryModal.value = true
  showVisibilityChangeModal.value = false
  selectedCategoryVisibility.value = null
}

const handleVisibilityChangeClose = () => {
  showVisibilityChangeModal.value = false
  editingCategoryId.value = undefined
  selectedCategoryVisibility.value = null
}
</script>

<template>
  <section class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6 w-full">
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center mb-6 md:mb-5 lg:mb-6">
        <h3 class="text-xl md:text-lg lg:text-xl font-bold text-gray-900">
          {{ t('pages.categories.title') }}
        </h3>
        <div class="flex items-center gap-3 md:gap-2.5 lg:gap-3">
          <BaseButton
            :text="t('pages.uploadedFiles.viewAll')"
            variant="blank"
            size="xs"
            right-icon="chevron-right"
            rightIconSize="xs"
            class="!w-[auto] !p-[0] !font-medium !bg-[transparent]"
            iconTextGapClass="!gap-[2px]"
            @click="handleCategoriesViewAll"
          />
        </div>
      </div>

      <!-- Horizontal Scroll Container -->
      <div v-if="!hasNoCategories" class="flex gap-6 md:gap-5 lg:gap-6 overflow-x-auto pb-2">
        <div
          v-for="category in categoryStore.categories"
          :key="category.id"
          class="flex-shrink-0 w-[320px] sm:w-[360px] md:w-[340px] lg:w-[360px] bg-white rounded-[20px] border border-gray-200 cursor-pointer"
          @click="handleCategoryClick(category.id)"
        >
          <div class="flex items-center p-4 md:p-3 lg:p-4 relative">
            <!-- Icon -->
            <div class="flex-shrink-0 mr-4 md:mr-2.5 lg:mr-4">
              <BaseIcon name="grid" size="5xl" color="neutral" :tone="700" />
            </div>

            <!-- Title -->
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

      <!-- No Data Message -->
      <div v-if="hasNoCategories" class="py-8 text-center">
        <div class="flex flex-col items-center justify-center gap-3">
          <BaseIcon name="inbox" size="lg" color="neutral" :tone="300" />
          <BaseText
            :text="t('pages.categories.noCategories')"
            :tone="500"
            color="neutral"
            type="p-sm"
          />
        </div>
      </div>
    </div>
  </section>

  <BaseDeleteModal
    v-if="showDeleteModal && isAdmin"
    :text="t('pages.categories.deleteModal.title')"
    :description="t('pages.categories.deleteModal.description')"
    @onCancel="handleCancelDelete"
    @onDelete="handleConfirmDelete"
  />
  <AddCategoryModal
    v-if="addCategoryModal && isAdmin"
    :show="addCategoryModal"
    :category-id="editingCategoryId"
    :is-dashboard="true"
    @close="addCategoryModal = false"
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
