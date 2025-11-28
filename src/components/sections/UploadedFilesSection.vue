<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UploadFilesCard from '@/components/sections/UploadFilesCard.vue'
import { useUploadFilesStore } from '@/stores/uploadFiles'
import { BaseButton } from '@/components/common'
import { t } from '@/utils/i18n'
import type { Media } from '@/types/Media'
import type { UpdateFileParams } from '@/types/uploadFiles'

const router = useRouter()
const uploadFilesStore = useUploadFilesStore()

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

onMounted(async () => {
  await loadFiles()
})
const loadFiles = async () => {
  await uploadFilesStore.fetchFiles({
    page: 0,
    perPage: 8,
    order: 'asc',
    orderColumn: 'customFileName',
    search: '',
  })
}

const handleViewAll = () => {
  if (props.isAdmin) {
    router.push({ name: 'admin-uploaded-files' })
  } else {
    router.push({ name: 'uploaded-files' })
  }
}

const handleDelete = async (file: Media) => {
  await uploadFilesStore.deleteFile([file.id.toString()], 'soft')
  loadFiles()
}

const handleEdit = async (data: UpdateFileParams) => {
  console.log('edit file', data)
  await uploadFilesStore.updateFileDetails(data)
  loadFiles()
}
</script>

<template>
  <section class="px-4 sm:px-6 md:px-4 lg:px-8 py-4 sm:py-4 md:py-4 lg:py-4 pt-[8px] w-full">
    <div class="max-w-full mx-auto">
      <div class="w-full flex justify-between items-center mb-6 md:mb-5 lg:mb-6">
        <h3
          class="text-[18px] md:text-base lg:text-[18px] font-semibold text-black/85 leading-[22px]"
        >
          {{ t('pages.uploadedFiles.title') }}
        </h3>
        <BaseButton
          :text="t('pages.uploadedFiles.viewAll')"
          variant="blank"
          size="xs"
          right-icon="chevron-right"
          rightIconSize="xs"
          class="!w-[auto] !p-[0] !font-medium !bg-[transparent]"
          iconTextGapClass="!gap-[2px]"
          @click="handleViewAll"
        />
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-1.5 lg:gap-2 justify-items-center"
        v-if="uploadFilesStore.files.length > 0"
      >
        <UploadFilesCard
          v-for="file in uploadFilesStore.files"
          :key="file.id"
          :file="file"
          :is-admin="isAdmin"
          @edit="handleEdit"
          @delete="handleDelete(file)"
          @loadList="loadFiles"
        />
      </div>
    </div>
  </section>
</template>
