import { t } from '@/utils/i18n'
import mensCollection from '@/assets/layout/mens_collection.png'
import womensCollection from '@/assets/layout/womens_collection.png'
import storytelling from '@/assets/layout/Storytelling.png'
import storeManager from '@/assets/layout/StoreManager.png'
export interface mockCourseItem {
  id: string
  title: string
  category: string
  categoryColor: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'red'
  mentor: string
  mentorAvatar?: string
  progress: number
  thumbnail: string
  isBookmarked?: boolean
}
export const coursesData: mockCourseItem[] = [
  {
    id: '1',
    title: "Beginner's Guide to Becoming a Professional Front-End Developer",
    category: 'FRONT END',
    categoryColor: 'blue',
    mentor: 'Leonardo samsul',
    progress: 70,
    thumbnail: mensCollection,
    isBookmarked: false,
  },
  {
    id: '2',
    title: 'Optimizing User Experience with the Best UI/UX Design',
    category: 'UI/UX DESIGN',
    categoryColor: 'purple',
    mentor: 'Bayu Salto',
    progress: 50,
    thumbnail: womensCollection,
    isBookmarked: false,
  },
  {
    id: '3',
    title: 'Reviving and Refresh Company Image',
    category: 'BRANDING',
    categoryColor: 'pink',
    mentor: 'Padhang Satrio',
    progress: 30,
    thumbnail: storytelling,
    isBookmarked: false,
  },
  {
    id: '4',
    title: 'Advanced Store Management Techniques',
    category: 'MANAGEMENT',
    categoryColor: 'green',
    mentor: 'Sarah Johnson',
    progress: 85,
    thumbnail: storeManager,
    isBookmarked: false,
  },
  {
    id: '5',
    title: "Beginner's Guide to Becoming a Professional Front-End Developer",
    category: 'FRONT END',
    categoryColor: 'blue',
    mentor: 'Leonardo samsul',
    progress: 70,
    thumbnail: mensCollection,
    isBookmarked: false,
  },
  {
    id: '6',
    title: 'Optimizing User Experience with the Best UI/UX Design',
    category: 'UI/UX DESIGN',
    categoryColor: 'purple',
    mentor: 'Bayu Salto',
    progress: 50,
    thumbnail: womensCollection,
    isBookmarked: false,
  },
  {
    id: '7',
    title: 'Reviving and Refresh Company Image',
    category: 'BRANDING',
    categoryColor: 'pink',
    mentor: 'Padhang Satrio',
    progress: 30,
    thumbnail: storytelling,
    isBookmarked: false,
  },
  {
    id: '8',
    title: 'Advanced Store Management Techniques',
    category: 'MANAGEMENT',
    categoryColor: 'green',
    mentor: 'Sarah Johnson',
    progress: 85,
    thumbnail: storeManager,
    isBookmarked: false,
  },
]

export const tabs = [
  {
    label: t('pages.courseDetails.tabs.course'),
    value: 'course',
  },
  {
    label: t('pages.courseDetails.tabs.participants'),
    value: 'participants',
  },
  {
    label: t('pages.courseDetails.tabs.progress'),
    value: 'progress',
  },
  // {
  //   label: t('pages.courseDetails.tabs.reports'),
  //   value: 'reports',
  // },
]
