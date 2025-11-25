<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '@/components/layouts/DashboardHeader.vue'
import WelcomeSection from '@/components/sections/WelcomeSection.vue'
import UploadedFilesSection from '@/components/sections/UploadedFilesSection.vue'
import CoursesSection from '@/components/sections/CoursesSection.vue'
import LessonsSection from '@/components/sections/LessonsSection.vue'
import FlashCardsSection from '@/components/sections/FlashCardsSection.vue'
import QuizzesSection from '@/components/sections/QuizzesSection.vue'
import CategoriesSection from '@/components/sections/CategoriesSection.vue'
import UploadFileModal from '@/components/uploadFiles/UploadFileModal.vue'
import AddCategoryModal from '@/components/courseManagement/AddCategoryModal.vue'
import { CourseCreationModal } from '@/components/courseCreation'
import { BadgeAndSkillsModal } from '@/components/badgeSkills'
import { LeaderboardModal } from '@/components/leaderboard'
import { AddBlock, ContentBlockModal, VideoPreviewBlock } from '@/components/learning'
import { QuizCreationModal } from '@/components/quizCreation'
import LinkQuizModal from '@/components/quizCreation/LinkQuizModal.vue'
import { CreateLessonModal } from '@/components/lessonCreation'
import { CreateSectionModal } from '@/components/sectionCreation'
import { CreateCohortModal } from '@/components/cohort'
import { useContentBlockStore } from '@/stores/contentBlock'
import type { ContentBlockData } from '@/types/ContentBlock'
import type { Media } from '@/types/Media'
import type { LinkQuizData } from '@/types/LinkQuiz'

interface Props {
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const router = useRouter()
const contentBlockStore = useContentBlockStore()
const selectedModal = ref<string | null>(null)
const showLeaderboardModal = ref<boolean>(false)
const isEditMode = ref<boolean>(false)
const showContentBlockModal = ref<boolean>(false)
const showLinkQuizModal = ref<boolean>(false)
const courseCreationTitle = ref<string>('')
const linkQuizData = ref<LinkQuizData | null>(null)
const isSectionModalOpen = ref<boolean>(false)
const showCohortModal = ref<boolean>(false)

onMounted(async () => {
  await contentBlockStore.fetchContentBlocks()
})

// Computed property for background color
const dashboardBackgroundColor = computed(() => {
  return contentBlockStore.contentBlocks?.backgroundColor || '#ffffff' // Default background color
})

// Computed property for content block modal initial data
const contentBlockModalData = computed(() => {
  if (!contentBlockStore.contentBlocks) return undefined

  return {
    description: contentBlockStore.contentBlocks.description || '',
    backgroundColor: contentBlockStore.contentBlocks.backgroundColor || '#f9fafb',
    video: contentBlockStore.contentBlocks.attachment
      ? [contentBlockStore.contentBlocks.attachment]
      : null,
  }
})

const handleManage = (option?: string) => {
  if (option === 'cohort') {
    showCohortModal.value = true
  } else if (option === 'badgeAndSkills') {
    if (props.isAdmin) {
      router.push({ name: 'admin-badges-skills' })
    } else {
      router.push({ name: 'badges-skills' })
    }
  }
}

const handleEdit = () => {
  isEditMode.value = true
}

const handleAdd = (key: string) => {
  selectedModal.value = key
}

const handleCloseUpload = () => {
  selectedModal.value = null
  isSectionModalOpen.value = false
}

const handleLinkQuizClose = () => {
  showLinkQuizModal.value = false
  linkQuizData.value = null
}

const handleLinkQuizPublish = () => {
  showLinkQuizModal.value = false
  linkQuizData.value = null
}
const handleCloseLeaderboard = () => {
  showLeaderboardModal.value = false
}

const handleTrophy = () => {
  showLeaderboardModal.value = true
}

const handleCancel = async () => {
  // Revert to API state by re-fetching content blocks
  await contentBlockStore.fetchContentBlocks()
  isEditMode.value = false
}

const handleReset = async () => {
  // Reset pending changes locally
  contentBlockStore.saveContentBlockLocally({ video: [], description: '', backgroundColor: '' })
  await contentBlockStore.saveContentBlock()
  isEditMode.value = false
}

const handleSave = async () => {
  isEditMode.value = false
  await contentBlockStore.saveContentBlock()
}

const handleAddBlock = () => {
  showContentBlockModal.value = true
}

const handleCloseContentBlock = () => {
  showContentBlockModal.value = false
}

const handleSaveContentBlock = (data: ContentBlockData) => {
  // Save locally without API call
  contentBlockStore.saveContentBlockLocally(data)
  showContentBlockModal.value = false
}

const handlePlayVideo = (video: Media | File) => {
  console.log('Playing video:', video)
  // The VideoPreviewBlock component will handle the actual video playback
}
const handleSectionClose = () => {
  selectedModal.value = null
  isSectionModalOpen.value = false
}
const handleSectionNext = (data: { name: string; lesson: string[] }) => {
  console.log('Section next:', data)
  selectedModal.value = 'lesson'
  isSectionModalOpen.value = true
}
const handleRemoveVideo = () => {
  contentBlockStore.removeVideo()
}

const handleCloseCohort = () => {
  showCohortModal.value = false
}
</script>

<template>
  <div
    class="min-h-screen w-full transition-colors duration-500 ease-in-out"
    :style="{ backgroundColor: dashboardBackgroundColor }"
  >
    <DashboardHeader
      :is-admin="isAdmin"
      :is-edit-mode="isEditMode"
      @manage="handleManage"
      @edit="handleEdit"
      @add="handleAdd"
      @trophy="handleTrophy"
      @cancel="handleCancel"
      @reset="handleReset"
      @save="handleSave"
    />

    <main class="pb-8 w-full">
      <!-- Normal Content (only when not in edit mode and no content blocks exist) -->
      <Transition name="fade" mode="out-in">
        <div :key="'normal-mode'">
          <WelcomeSection />
        </div>
      </Transition>

      <!-- Video Preview Content (when there are content blocks with attachment, regardless of edit mode) -->
      <Transition name="fade" mode="out-in">
        <div
          v-if="contentBlockStore.contentBlocks && contentBlockStore.contentBlocks.attachment"
          :key="'video-preview-mode'"
          class="px-8 pt-8 pb-6"
        >
          <!-- Content Block from contentBlocks -->
          <VideoPreviewBlock
            :video-data="contentBlockStore.contentBlocks.attachment || undefined"
            :show-remove-button="false"
            :isEditMode="isEditMode"
            @play="handlePlayVideo"
            @remove="handleRemoveVideo"
          />
        </div>
      </Transition>

      <!-- Edit Mode Content (only when in edit mode and no content blocks attachment exist) -->
      <Transition name="fade" mode="out-in">
        <div
          v-if="isEditMode && !contentBlockStore.contentBlocks?.attachment"
          :key="'edit-mode'"
          class="px-8 pt-8 pb-[40px]"
        >
          <!-- Add Block Section -->
          <AddBlock @add-block="handleAddBlock" />
        </div>
      </Transition>

      <!-- Always show these sections -->
      <UploadedFilesSection v-if="isAdmin" :is-admin="isAdmin" />
      <CoursesSection :is-admin="isAdmin" />
      <LessonsSection :is-admin="isAdmin" />
      <FlashCardsSection v-if="isAdmin" :is-admin="isAdmin" />
      <CategoriesSection :is-admin="isAdmin" />
      <QuizzesSection :is-admin="isAdmin" />
    </main>
    <UploadFileModal v-if="selectedModal === 'file'" @close="handleCloseUpload" />
    <CourseCreationModal
      :title="courseCreationTitle || 'Create Course'"
      v-if="selectedModal === 'course'"
      @close="handleCloseUpload"
    />
    <BadgeAndSkillsModal v-if="selectedModal === 'skills'" @close="handleCloseUpload" />
    <QuizCreationModal
      v-if="selectedModal === 'quiz'"
      :show="selectedModal === 'quiz'"
      :isDashboard="true"
      :isAdmin="isAdmin"
      @close="handleCloseUpload"
    />
    <LinkQuizModal
      v-if="showLinkQuizModal && linkQuizData"
      :show="showLinkQuizModal"
      :quiz-data="linkQuizData"
      @close="handleLinkQuizClose"
      @publish="handleLinkQuizPublish"
    />
    <LeaderboardModal v-if="showLeaderboardModal" @close="handleCloseLeaderboard" />
    <ContentBlockModal
      v-if="showContentBlockModal"
      :initial-data="contentBlockModalData"
      @close="handleCloseContentBlock"
      @save="handleSaveContentBlock"
    />
    <CreateLessonModal v-if="selectedModal === 'lesson'" @close="handleCloseUpload" />
    <CreateSectionModal
      v-if="selectedModal === 'sections'"
      :show="selectedModal === 'sections'"
      @close="handleSectionClose"
      @next="handleSectionNext"
    />
    <AddCategoryModal
      v-if="selectedModal === 'category'"
      @close="handleCloseUpload"
      :isDashboard="true"
    />

    <!-- Create Cohort Modal -->
    <CreateCohortModal :show="showCohortModal" @close="handleCloseCohort" />
  </div>
</template>

<style scoped>
/* Fade transition for mode changes */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Background fade transition */
.background-fade-enter-active,
.background-fade-leave-active {
  transition: background-color 0.5s ease;
}

/* List transition for content blocks */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.4s ease;
}
</style>
