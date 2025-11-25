import productStyling from '@/assets/layout/product_styling.png'
import skillDevelopment from '@/assets/layout/skill_development.png'
import productTraining from '@/assets/layout/product_training.png'
import storeManager from '@/assets/layout/store_manager.png'
import type { LessonItem } from '@/types/Lesson'

export const flashCardData: LessonItem[] = [
  {
    id: '1',
    title: 'JavaScript ES6+ Key Concepts & Syntax',
    category: 'JAVASCRIPT',
    categoryColor: 'orange',
    mentor: 'Dr. Sarah Mitchell',
    progress: 15,
    thumbnail: productStyling,
    isBookmarked: false,
  },
  {
    id: '2',
    title: 'React Hooks & State Management Essentials',
    category: 'REACT',
    categoryColor: 'green',
    mentor: 'James Rodriguez',
    progress: 30,
    thumbnail: skillDevelopment,
    isBookmarked: false,
  },
  {
    id: '3',
    title: 'Typography & Color Theory Fundamentals',
    category: 'DESIGN',
    categoryColor: 'red',
    mentor: 'Emily Chen',
    progress: 60,
    thumbnail: productTraining,
    isBookmarked: false,
  },
  {
    id: '4',
    title: 'Agile Methodology & Scrum Framework',
    category: 'PROJECT MGMT',
    categoryColor: 'blue',
    mentor: 'Michael Anderson',
    progress: 100,
    thumbnail: storeManager,
    isBookmarked: false,
  },
  {
    id: '5',
    title: 'CSS Grid & Flexbox Layout Patterns',
    category: 'CSS',
    categoryColor: 'pink',
    mentor: 'Lisa Thompson',
    progress: 45,
    thumbnail: productTraining,
    isBookmarked: false,
  },
  {
    id: '6',
    title: 'UX Principles & Usability Testing Methods',
    category: 'UX RESEARCH',
    categoryColor: 'red',
    mentor: 'David Park',
    progress: 75,
    thumbnail: storeManager,
    isBookmarked: false,
  },
]
