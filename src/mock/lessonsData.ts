import { t } from '@/utils/i18n'

export interface mockLessonItem {
  id: string
  title: string
  category?: string
  categoryColor?: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'red'
  mentor?: string
  mentorAvatar?: string
  progress?: number
  thumbnail?: string
  isBookmarked?: boolean
}

export const lessonsData: mockLessonItem[] = [
  {
    id: '1',
    title: 'Introduction to Vue.js Fundamentals',
    category: 'FRONTEND',
    categoryColor: 'blue',
    mentor: 'John Doe',
    progress: 0,
    thumbnail: '',
    isBookmarked: false,
  },
  {
    id: '2',
    title: 'Advanced JavaScript Concepts',
    category: 'FRONTEND',
    categoryColor: 'purple',
    mentor: 'Jane Smith',
    progress: 0,
    thumbnail: '',
    isBookmarked: false,
  },
  {
    id: '3',
    title: 'Building Responsive Web Applications',
    category: 'DESIGN',
    categoryColor: 'pink',
    mentor: 'Mike Johnson',
    progress: 0,
    thumbnail: '',
    isBookmarked: false,
  },
  {
    id: '4',
    title: 'Database Design and Implementation',
    category: 'BACKEND',
    categoryColor: 'green',
    mentor: 'Sarah Williams',
    progress: 0,
    thumbnail: '',
    isBookmarked: false,
  },
]

export const lessonTabs = [
  {
    label: t('pages.lessonDetails.tabs.content'),
    value: 'content',
  },
  {
    label: t('pages.lessonDetails.tabs.participants'),
    value: 'participants',
  },
  {
    label: t('pages.lessonDetails.tabs.progress'),
    value: 'progress',
  },
]
