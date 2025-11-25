<script setup lang="ts">
import { ref, computed } from 'vue'
import moment from 'moment'
import ThreeDotMenu from '@/components/ThreeDotMenu.vue'
import BaseDeleteModal from '@/components/BaseDeleteModal.vue'
import EditFileModal from '@/components/common/modals/EditFileModal.vue'
import FileViewerModal from '@/components/modal/FileViewerModal.vue'
import CourseVisibilityChangeModal from '@/components/courseManagement/CourseVisibilityChangeModal.vue'
import { BaseIcon } from '@/components/common'
import { t } from '@/utils/i18n'
import { fileSizeConvert } from '@/utils/generalUtils'
import pdfIcon from '@/assets/images/pdf.svg?url'
import imageIcon from '@/assets/images/image.svg?url'
import filesIcon from '@/assets/images/files.svg?url'
import playIcon from '@/assets/images/play.svg?url'
import type { UploadFileResponse } from '@/types/uploadFiles'
import type { UpdateFileParams } from '@/types/uploadFiles'
import { VisibilityStatus, VisibilityType } from '@/types/Course'
import type { Icons } from '@/types/Styles'

const props = defineProps<{
  file: UploadFileResponse
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'delete', file: UploadFileResponse): void
  (e: 'edit', data: UpdateFileParams): void
  (e: 'loadList'): void
}>()

const showDeleteModal = ref(false)
const showEditModal = ref(false)
const showVisibilityChangeModal = ref(false)
const isFileViewerOpen = ref(false)

const visibilityStatus = computed(() => {
  return props.file.visibility || VisibilityStatus.SHOW
})

const showVisibilityBadge = computed(() => {
  return (
    visibilityStatus.value === VisibilityStatus.MAINTENANCE ||
    visibilityStatus.value === VisibilityStatus.HIDE
  )
})

const visibilityIcon = computed(() => {
  if (visibilityStatus.value === VisibilityStatus.MAINTENANCE) {
    return 'pause'
  } else if (visibilityStatus.value === VisibilityStatus.HIDE) {
    return 'eye-off'
  }
  return null
})

// Get file extension from filename
const getFileExtension = (fileName: string | undefined): string => {
  if (!fileName) return ''
  const lastDot = fileName.lastIndexOf('.')
  return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : ''
}

// Determine file type based on MIME type and extension
const getFileType = (mimeType: string | undefined, fileName: string | undefined): string => {
  const type = (mimeType || '').toLowerCase()
  const fileExtension = getFileExtension(fileName)

  // Image file extensions
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
  // Video file extensions
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp']
  // PDF extension
  const pdfExtensions = ['pdf']
  // SCORM/ZIP extensions
  const scormExtensions = ['zip']

  // Check MIME type first
  if (type.includes('pdf')) return 'pdf'
  if (type.includes('image')) return 'image'
  if (type.includes('video')) return 'video'
  if (type.includes('folder')) return 'folder'
  // Check for ZIP/SCORM files - handle "application/zip" and other zip MIME types
  if (type.includes('scorm') || type.includes('zip') || type === 'application/zip') return 'scorm'

  // Fallback to file extension if MIME type is incorrect or missing
  if (pdfExtensions.includes(fileExtension)) return 'pdf'
  if (imageExtensions.includes(fileExtension)) return 'image'
  if (videoExtensions.includes(fileExtension)) return 'video'
  if (scormExtensions.includes(fileExtension)) return 'scorm'

  // Check filename patterns for SCORM
  const fileNameLower = (fileName || '').toLowerCase()
  if (fileNameLower.includes('scorm') || fileNameLower.includes('imsmanifest.xml')) {
    return 'scorm'
  }

  return 'unknown'
}

const getFileIcon = (type: string) => {
  const fileType = getFileType(type, props.file.fileName)

  if (fileType === 'pdf') {
    return pdfIcon
  } else if (fileType === 'image') {
    return imageIcon
  } else if (fileType === 'video') {
    return playIcon
  } else if (fileType === 'folder') {
    return filesIcon
  } else if (fileType === 'scorm') {
    return filesIcon
  } else {
    return filesIcon
  }
}

const getFileIconBackgroundColor = (type: string) => {
  const fileType = getFileType(type, props.file.fileName)

  if (fileType === 'pdf') {
    return '#FF2A831A'
  } else if (fileType === 'image') {
    return '#40BF7F1A'
  } else if (fileType === 'video') {
    return '#1975FF1A'
  } else if (fileType === 'folder') {
    return '#FF77001A'
  } else if (fileType === 'scorm') {
    return '#1975FF1A'
  } else {
    return '#F3F4F6'
  }
}

const handleEditCourse = async () => {
  if (!props.isAdmin) {
    return
  }
  const visibility = props.file.visibility
  if (visibility === VisibilityStatus.MAINTENANCE || visibility === VisibilityStatus.HIDE) {
    showEditModal.value = true
    return
  }
  showVisibilityChangeModal.value = true
}
const menuItems = computed(() => {
  const visibility = props.file.visibility
  const isEditDisabled = visibility !== VisibilityStatus.MAINTENANCE

  const deleteDisabledTooltip = isEditDisabled
    ? t('pages.category.buttons.cannotDeleteNotDraft')
    : undefined

  return [
    {
      label: t('pages.common.edit'),
      icon: 'edit' as Icons,
      action: handleEditCourse,
    },
    {
      label: t('pages.common.delete'),
      icon: 'delete' as Icons,
      danger: true,
      disabled: isEditDisabled,
      tooltip: deleteDisabledTooltip,
      action: () => {
        if (isEditDisabled) {
          return
        }
        showDeleteModal.value = true
      },
    },
  ]
})

const handleCancel = () => {
  showDeleteModal.value = false
}

const handleDelete = async () => {
  showDeleteModal.value = false
  emit('delete', props.file)
}

const handleEditCancel = () => {
  showEditModal.value = false
}

const handleEditSuccess = (data: UpdateFileParams) => {
  showEditModal.value = false
  emit('edit', {
    ...data,
    id: props.file.id.toString(),
  })
}

const handleFileClick = () => {
  isFileViewerOpen.value = true
}
const handleVisibilityChangeSave = async () => {
  showVisibilityChangeModal.value = false
  emit('loadList')
}

const handleVisibilityChangeEdit = async () => {
  // Proceed to edit course modal
  showEditModal.value = true
  showVisibilityChangeModal.value = false
}
</script>
<template>
  <div
    :key="file.id"
    class="bg-grey-50 w-full flex items-center rounded-[12px] p-4 hover:shadow-md transition-shadow cursor-pointer"
    @click="handleFileClick"
  >
    <div
      class="flex items-center justify-center mr-[14px] w-[32px] h-[32px] rounded-[8px] flex-shrink-0 relative"
      :style="{ backgroundColor: getFileIconBackgroundColor(file.mimeType) }"
    >
      <img :src="getFileIcon(file.mimeType)" :alt="`${file.type} icon`" class="w-4 h-4" />
      <!-- Visibility Badge -->
      <div
        v-if="showVisibilityBadge && visibilityIcon"
        class="absolute -top-1 -right-1 w-5 h-5 bg-warning-400 rounded-full flex items-center justify-center border-2 border-white"
      >
        <BaseIcon :name="visibilityIcon as Icons" size="2xs" color="white" />
      </div>
    </div>
    <div class="flex-1 min-w-0">
      <h4 class="font-medium text-black/85 text-[14px] leading-[17px] mb-1 truncate max-w-full">
        {{ file.customFileName || file.fileName }}
      </h4>
      <div class="flex">
        <p class="text-[12px] font-medium text-black/50 mr-2">{{ fileSizeConvert(file.size) }} .</p>
        <p class="text-[12px] font-medium text-black/50">
          {{ moment(file.createdAt).format('MMM D, YYYY') }}
        </p>
      </div>
    </div>
    <ThreeDotMenu v-if="isAdmin" :items="menuItems" />
  </div>
  <BaseDeleteModal
    v-if="showDeleteModal && isAdmin"
    :text="t('pages.baseDeleteModal.deleteFile')"
    :description="t('pages.baseDeleteModal.deleteFileDescription')"
    @onCancel="handleCancel"
    @onDelete="handleDelete"
  />
  <EditFileModal
    v-if="showEditModal && isAdmin"
    :file="file"
    :isOpen="showEditModal"
    @onClose="handleEditCancel"
    @onSuccess="handleEditSuccess"
  />
  <FileViewerModal
    v-if="isFileViewerOpen"
    :isOpen="isFileViewerOpen"
    :file="file"
    @close="isFileViewerOpen = false"
  />
  <CourseVisibilityChangeModal
    v-if="showVisibilityChangeModal && isAdmin"
    :isOpen="showVisibilityChangeModal"
    :itemId="file.id as number"
    :currentVisibility="visibilityStatus as VisibilityStatus"
    @onClose="showVisibilityChangeModal = false"
    @onSave="handleVisibilityChangeSave"
    :type="VisibilityType.FILES"
    @onEdit="handleVisibilityChangeEdit"
  />
</template>
