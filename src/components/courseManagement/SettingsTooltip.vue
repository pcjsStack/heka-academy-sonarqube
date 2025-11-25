<template>
  <div
    v-if="show"
    class="settings-tooltip absolute bg-white rounded-lg shadow-lg p-2 z-50 min-w-[230px]"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
    @click.stop
  >
    <!-- Edit -->
    <div
      class="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer text-grey-800 mb-2"
      @click="handleAction('edit')"
    >
      <BaseIcon name="edit" size="xs" class="mr-3" />
      <BaseText
        :text="t('pages.categorySettings.edit')"
        class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
      />
    </div>

    <!-- Create New Sub-category -->
    <div
      class="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer text-grey-800 mb-2"
      @click="handleAction('createSubCategory')"
    >
      <BaseIcon name="add" size="xs" class="mr-3" />
      <BaseText
        :text="t('pages.categorySettings.createSubCategory')"
        class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
      />
    </div>

    <!-- Delete -->
    <div
      class="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer text-grey-800 mb-2"
      @click="handleAction('delete')"
    >
      <BaseIcon name="delete-outline" size="xs" class="mr-3" />
      <BaseText
        :text="t('pages.categorySettings.delete')"
        class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
      />
    </div>

    <!-- Permissions -->
    <div
      class="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer text-grey-800 mb-2"
      @click="handleAction('permissions')"
    >
      <BaseIcon name="layer" size="xs" class="mr-3" />
      <BaseText
        :text="t('pages.categorySettings.permissions')"
        class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
      />
    </div>

    <!-- Cohorts -->
    <div
      class="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer text-grey-800 mb-2"
      @click="handleAction('cohorts')"
    >
      <BaseIcon name="cohorts" size="xs" class="mr-3" />
      <BaseText
        :text="t('pages.categorySettings.cohorts')"
        class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
      />
    </div>

    <!-- Restore Course -->
    <div
      class="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer text-grey-800 mb-1"
      @click="handleAction('restoreCourse')"
    >
      <BaseIcon name="restore" size="xs" class="mr-3" />
      <BaseText
        :text="t('pages.categorySettings.restoreCourse')"
        class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
      />
    </div>

    <!-- Content Bank -->
    <div
      class="flex items-center px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer text-grey-800"
      @click="handleAction('contentBank')"
    >
      <BaseIcon name="content-files" size="xs" class="mr-3 mt-1" />
      <BaseText
        :text="t('pages.categorySettings.contentBank')"
        class="!text-[14px] !leading-[17px] !text-grey-800 !font-medium"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { t } from '@/utils/i18n'
import { BaseText, BaseIcon } from '@/components/common'

interface Position {
  top: number
  left: number
}

// Props
interface Props {
  show?: boolean
  position?: Position
  categoryId?: number
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  position: () => ({ top: 0, left: 0 }),
  categoryId: 0,
})

// Emits
const emit = defineEmits<{
  action: [action: string, categoryId: number]
  close: []
}>()

// Methods
const handleAction = (action: string) => {
  emit('action', action, props.categoryId)
  emit('close')
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const tooltip = target.closest('.settings-tooltip')

  if (!tooltip && props.show) {
    emit('close')
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
