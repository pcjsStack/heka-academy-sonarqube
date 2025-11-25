import type { QuizCreationQuestion } from './QuizCreation'

export interface LinkQuizData {
  id: string
  title: string
  questions: QuizCreationQuestion[]
  hasGlobalMedia?: boolean
  linkType: LinkType
  linkedItem?: LinkedItem
}

export enum LinkType {
  FILE = 'file',
  COURSE = 'course',
  LESSONS = 'lessons',
  SUB_LESSON = 'sub-lesson',
}

export interface LinkedItem {
  id: string
  name: string
  type: LinkType
}

export interface LinkQuizOption {
  id: string
  name: string
  type: LinkType
}
