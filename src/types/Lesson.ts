export interface LessonItem {
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
