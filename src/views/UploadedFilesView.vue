<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { BasePagination, BaseButton } from '@/components/common'
import HeaderView from '@/components/layouts/HeaderView.vue'
import UploadFileModal from '@/components/uploadFiles/UploadFileModal.vue'
import UploadFilesCard from '@/components/sections/UploadFilesCard.vue'
import UploadFileFilter from '@/components/sections/UploadFileFilter.vue'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import { t } from '@/utils/i18n'
import type {
  FilterState,
  GetFilesParams,
  UpdateFileParams,
  UploadFileResponse,
} from '@/types/uploadFiles'
import { VisibilityStatus } from '@/types/Course'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const uploadFilesStore = useUploadFilesStore()
const router = useRouter()
const currentPage = ref(0)
const isShowFilter = ref(false)
const isUploadFiles = ref(false)
const filters = ref<FilterState>({
  search: '',
  visibility: [],
  fileTypes: [],
})
const perPage = 30

onMounted(async () => {
  await loadFiles()
})

const loadFiles = async () => {
  const params: GetFilesParams = {
    page: currentPage.value,
    perPage,
    order: 'asc',
    orderColumn: 'customFileName',
    search: filters.value.search,
  }

  if (filters.value.visibility.length > 0 && !filters.value.visibility.includes('all')) {
    params.visibility = filters.value.visibility.join(',') as unknown as VisibilityStatus
  }

  if (filters.value.fileTypes.length > 0 && !filters.value.fileTypes.includes('all')) {
    const standardTypes = filters.value.fileTypes.filter(
      (type) => type !== 'other' && !type.startsWith('other:'),
    )
    if (standardTypes.length > 0) {
      params.mimeTypes = standardTypes.join(',')
    }

    // Handle custom "other" values (but not the "other" value itself)
    const otherTypes = filters.value.fileTypes.filter((type) => type.startsWith('other:'))
    if (otherTypes.length > 0) {
      const customTypes = otherTypes.map((type) => type.replace('other:', ''))
      // If we have standard types, append custom types; otherwise use only custom types
      if (params.mimeTypes) {
        params.mimeTypes = `${params.mimeTypes},${customTypes.join(',')}`
      } else {
        params.mimeTypes = customTypes.join(',')
      }
    }
  }

  await uploadFilesStore.fetchFiles(params)
}

const handlePageChange = (page: number) => {
  currentPage.value = page - 1
  loadFiles()
}

const goBack = () => {
  if (props.isAdmin) {
    router.push('/admin')
  } else {
    router.push('/')
  }
}
const totalPages = computed(() => uploadFilesStore.totalPages)

const goToUploadFiles = () => {
  isUploadFiles.value = true
}

const toggleFilter = () => {
  isShowFilter.value = !isShowFilter.value
}
const handleCloseUpload = () => {
  isUploadFiles.value = false
}

const handleApplyFilters = (appliedFilters: FilterState) => {
  filters.value = appliedFilters
  currentPage.value = 0
  loadFiles()
  toggleFilter()
}

const updateFilters = (newFilters: FilterState) => {
  filters.value = newFilters
}

const clearAllFilters = () => {
  filters.value = {
    visibility: [],
    fileTypes: [],
    search: '',
  }
  currentPage.value = 0
  loadFiles()
  toggleFilter()
}

const handleInputChange = (event: Event) => {
  const searchValue = (event.target as HTMLInputElement).value
  filters.value.search = searchValue
  debouncedSearch()
}

const debouncedSearch = debounce(() => {
  currentPage.value = 0
  loadFiles()
}, 500)

const handleDelete = async (file: UploadFileResponse) => {
  await uploadFilesStore.deleteFile([file.id.toString()], 'soft')
  loadFiles()
}

const handleEdit = async (data: UpdateFileParams) => {
  await uploadFilesStore.updateFileDetails(data)
  loadFiles()
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-full mx-auto">
      <HeaderView
        :title="t('pages.uploadedFiles.title')"
        isBack
        @back="goBack"
        isSearch
        isFilter
        :hasActiveFilters="filters.visibility.length > 0 || filters.fileTypes.length > 0"
        :searchText="filters.search"
        @inputChange="handleInputChange"
        @toggleFilter="toggleFilter"
        custom_actions
      >
        <template #custom_actions>
          <BaseButton
            v-if="isAdmin"
            :text="t('pages.uploadedFiles.AddFiles')"
            variant="default"
            color="primary"
            @click="goToUploadFiles"
            class="!min-w-[100px]"
          />
        </template>
      </HeaderView>
      <!-- Files Grid -->
      <div
        class="px-4 sm:px-6 md:px-4 lg:px-8 py-6 sm:py-6 md:py-5 lg:py-6"
        v-if="uploadFilesStore.files.length > 0"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3 md:gap-2.5 lg:gap-3"
        >
          <UploadFilesCard
            v-for="file in uploadFilesStore.files"
            :key="file.id"
            :file="file"
            :is-admin="isAdmin"
            @delete="handleDelete(file)"
            @edit="handleEdit"
            @loadList="loadFiles"
          />
        </div>
        <div class="flex mt-6 md:mt-5 lg:mt-6 justify-center max-w-full">
          <BasePagination
            :currentPage="currentPage + 1"
            :totalPages="totalPages"
            @update:current-page="handlePageChange"
          />
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-12 md:py-10 lg:py-12">
        <div
          class="text-gray-400 text-lg md:text-base lg:text-lg font-medium mb-2 md:mb-1.5 lg:mb-2"
        >
          {{ t('pages.uploadedFiles.noFilesUploaded') }}
        </div>
        <div class="text-gray-500 text-sm md:text-xs lg:text-sm">
          {{ t('pages.uploadedFiles.uploadYourFirstFileToGetStarted') }}
        </div>
      </div>
    </div>
  </div>
  <UploadFileModal v-if="isUploadFiles" @close="handleCloseUpload" />
  <UploadFileFilter
    v-if="isShowFilter && isAdmin"
    @close="toggleFilter"
    :filters="filters"
    @update:filters="updateFilters"
    @applyFilters="handleApplyFilters"
    @clear="clearAllFilters"
  />
</template>
