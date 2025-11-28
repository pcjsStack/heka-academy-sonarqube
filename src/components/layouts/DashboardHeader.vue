<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { BaseButton, BaseIcon, BaseText } from '@/components/common'
import { t } from '@/utils/i18n'
import type { Icons } from '@/types/Styles'
import type { HeaderViewOptions } from '@/types/HeaderView'

const emit = defineEmits(['manage', 'edit', 'add', 'trophy', 'cancel', 'reset', 'save'])

// Props
interface Props {
  isEditMode?: boolean
  isAdmin?: boolean
}

withDefaults(defineProps<Props>(), {
  isEditMode: false,
  isAdmin: false,
})
const showCreateMenu = ref(false)
const showManageMenu = ref(false)

const toggleCreateMenu = (menu: boolean) => {
  showCreateMenu.value = showCreateMenu.value === menu ? false : true
  showManageMenu.value = false
}

const toggleManageMenu = (menu: boolean) => {
  showManageMenu.value = showManageMenu.value === menu ? false : true
  showCreateMenu.value = false
}

const selectOption = (option: string) => {
  emit('add', option)
  showCreateMenu.value = false
}

const selectManageOption = (option: string) => {
  emit('manage', option)
  showManageMenu.value = false
}

const handleCancel = () => {
  emit('cancel')
}

const handleReset = () => {
  emit('reset')
}

const handleSave = () => {
  emit('save')
}
const filteredCreateOptions = ref<HeaderViewOptions[]>([
  {
    key: 'file',
    icon: 'file-outline',
    title: t('pages.header.add.file'),
  },
  {
    key: 'course',
    icon: 'content',
    title: t('pages.header.add.course'),
  },
  {
    key: 'lesson',
    icon: 'lesson',
    title: t('pages.header.add.lesson'),
  },
  {
    key: 'category',
    icon: 'layout',
    title: t('pages.header.add.category'),
  },
  {
    key: 'sections',
    icon: 'sections',
    title: t('pages.header.add.section'),
  },
  {
    key: 'skills',
    icon: 'medal',
    title: t('pages.header.add.badge'),
  },
  {
    key: 'quiz',
    icon: 'list-check',
    title: t('pages.header.add.quiz'),
  },
])

const manageOptions = ref<HeaderViewOptions[]>([
  {
    key: 'cohort',
    icon: 'user',
    title: t('pages.header.manage.cohort'),
  },
  {
    key: 'badgeAndSkills',
    icon: 'medal',
    title: t('pages.header.manage.badgeAndSkills'),
  },
])
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const dropdownContainer = target.closest('.dropdown-container')

  if (!dropdownContainer && (showCreateMenu.value || showManageMenu.value)) {
    showCreateMenu.value = false
    showManageMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header
    class="flex justify-between items-center px-8 pt-6 pb-4 border-b border-gray-200 bg-white w-full"
  >
    <div class="w-full mx-auto w-full flex justify-between items-center">
      <!-- Left side - Title -->
      <div class="flex items-center">
        <BaseText
          :text="isAdmin ? t('pages.admin.title') : t('pages.learning.title')"
          type="h1"
          color="neutral"
          :tone="700"
          font="semibold"
          class="!text-[24px]"
        />
      </div>

      <!-- Right side - Actions -->
      <div class="flex items-center gap-2">
        <!-- Normal Mode Actions -->
        <template v-if="!isEditMode">
          <!-- Manage Dropdown -->
          <div class="dropdown-container relative">
            <BaseButton
              v-if="isAdmin"
              text="Manage"
              variant="blank"
              size="sm"
              rightIcon="chevron-down"
              @on-click="toggleManageMenu(true)"
              class="!font-medium min-w-[102px]"
            />
            <div
              v-if="showManageMenu"
              class="absolute top-full right-0 bg-white rounded-[8px] py-2 px-[6px] shadow-custom mt-2 z-50 flex flex-col gap-2 lg:min-w-[160px] min-w-[100%]"
            >
              <div
                v-for="item in manageOptions"
                :key="item.key"
                @click="selectManageOption(item.key)"
                class="flex items-center px-2 py-[6px] hover:bg-neutral-100 cursor-pointer rounded-[8px]"
              >
                <div class="min-w-[25px] text-left">
                  <BaseIcon
                    :name="item.icon as Icons"
                    color="neutral"
                    variant="outline-light"
                    size="sm"
                    class="!text-grey-800 !w-[14px] !h-[14px]"
                  />
                </div>
                <BaseText
                  :text="item.title"
                  color="neutral"
                  type="p-sm"
                  class="!text-grey-800 !font-medium !text-[14px] !leading-[17px] !tracking-[-0.032px]"
                />
              </div>
            </div>
          </div>

          <template v-if="!isAdmin">
            <BaseButton
              :text="t('pages.header.manage.badgeAndSkills')"
              leftIcon="medal"
              leftIconSize="xs"
              variant="blank"
              size="xs"
              @onClick="emit('manage', 'badgeAndSkills')"
              class="!min-w-[160px] !font-medium"
            />
          </template>
          <BaseButton
            v-if="isAdmin"
            text="Trophy"
            hideText
            leftIcon="trophy"
            leftIconSize="xs"
            variant="blank"
            size="sm"
            @onClick="$emit('trophy')"
            class="min-w-[40px] neutral !text-neutral-500 !font-medium !p-2 min-h-[40px]"
          />

          <BaseButton
            v-if="isAdmin"
            text="Edit"
            variant="blank"
            size="sm"
            @onClick="$emit('edit')"
            class="min-w-[74px] neutral !text-neutral-500 !font-medium"
          />

          <div v-if="isAdmin" class="dropdown-container relative w-full lg:w-auto">
            <BaseButton
              text="Add"
              variant="default"
              leftIcon="add"
              size="sm"
              @on-click="toggleCreateMenu(true)"
              class="bg-blue-600 text-white hover:bg-blue-700"
            />
            <div
              v-if="showCreateMenu"
              class="absolute top-full right-0 bg-white rounded-[8px] py-2 px-[6px] shadow-custom mt-2 z-50 flex flex-col gap-2 lg:min-w-[160px] min-w-[100%]"
            >
              <div
                v-for="item in filteredCreateOptions"
                :key="item.key"
                @click="selectOption(item.key)"
                class="flex items-center px-2 py-[6px] hover:bg-neutral-100 cursor-pointer rounded-[8px]"
              >
                <div class="min-w-[25px] text-left">
                  <BaseIcon
                    :name="item.icon as Icons"
                    color="neutral"
                    variant="outline-light"
                    size="sm"
                    class="!text-grey-800 !w-[14px] !h-[14px]"
                  />
                </div>
                <BaseText
                  :text="item.title"
                  color="neutral"
                  type="p-sm"
                  class="!text-grey-800 !font-medium !text-[14px] !leading-[17px] !tracking-[-0.032px]"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Edit Mode Actions -->
        <template v-else>
          <BaseButton
            :text="t('pages.learning.buttons.cancel')"
            variant="blank"
            size="sm"
            @onClick="handleCancel"
            class="!font-medium !min-w-[95px]"
          />

          <BaseButton
            :text="t('pages.learning.buttons.reset')"
            variant="blank"
            size="sm"
            @onClick="handleReset"
            class="!font-medium !min-w-[189px] neutral !text-neutral-500"
          />

          <BaseButton
            :text="t('pages.learning.buttons.save')"
            variant="default"
            size="sm"
            @onClick="handleSave"
            class="!min-w-[81px] !font-medium"
          />
        </template>
      </div>
    </div>
  </header>
</template>
