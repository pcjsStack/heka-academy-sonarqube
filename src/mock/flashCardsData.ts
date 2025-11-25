import mensCollection from '@/assets/layout/mens_collection.png'
import womensCollection from '@/assets/layout/womens_collection.png'
import storytelling from '@/assets/layout/Storytelling.png'
import storeManager from '@/assets/layout/StoreManager.png'
import type { FlashCardItem } from '@/types/FlashCard'

export const flashCardsData: FlashCardItem[] = [
  {
    id: '1',
    title: 'JavaScript ES6+ Features Quick Reference',
    category: 'PROGRAMMING',
    categoryColor: 'blue',
    mentor: 'Alex Thompson',
    progress: 25,
    thumbnail: mensCollection,
    isBookmarked: false,
  },
  {
    id: '2',
    title: 'React Hooks Cheat Sheet',
    category: 'FRONT END',
    categoryColor: 'purple',
    mentor: 'Maria Rodriguez',
    progress: 50,
    thumbnail: womensCollection,
    isBookmarked: false,
  },
  {
    id: '3',
    title: 'UX Design Principles',
    category: 'UI/UX DESIGN',
    categoryColor: 'pink',
    mentor: 'David Chen',
    progress: 75,
    thumbnail: storytelling,
    isBookmarked: false,
  },
  {
    id: '4',
    title: 'Agile Methodology Flash Cards',
    category: 'MANAGEMENT',
    categoryColor: 'green',
    mentor: 'Emma Wilson',
    progress: 100,
    thumbnail: storeManager,
    isBookmarked: false,
  },
  {
    id: '5',
    title: 'CSS Grid & Flexbox Guide',
    category: 'FRONT END',
    categoryColor: 'orange',
    mentor: 'Sarah Johnson',
    progress: 40,
    thumbnail: mensCollection,
    isBookmarked: false,
  },
  {
    id: '6',
    title: 'User Testing Best Practices',
    category: 'UI/UX DESIGN',
    categoryColor: 'purple',
    mentor: 'Michael Brown',
    progress: 60,
    thumbnail: womensCollection,
    isBookmarked: false,
  },
]
