import { QuizParticipantType } from './Course'
export enum QuizQuestionType {
  OPEN = 'OPEN',
  RATING = 'RATING',
  YES_NO = 'YES_NO',
  SELECT_SINGLE = 'SELECT_SINGLE',
  SELECT_MULTIPLE = 'SELECT_MULTIPLE',
  PHOTO = 'PHOTO',
}

export enum QuizStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  EXPIRED = 'expired',
}

export enum QuizCorrectAnswer {
  YES = 'YES',
  NO = 'NO',
}

export interface QuizQuestionOption {
  id?: number
  title: string
  weight: number
}

export interface QuizQuestion {
  id?: number
  title: string
  type: QuizQuestionType
  weight: number
  isRequired: boolean
  photoRequired: boolean
  commentRequired: boolean
  sequence: number
  correctAnswer?: QuizCorrectAnswer
  options?: QuizQuestionOption[]
  fileKeys?: string[]
  removeFileIds?: number[]
}

export interface QuizCategory {
  id?: number
  title: string
  weight: number
  questions: QuizQuestion[]
}

export interface QuizParticipantPayload {
  index: number
  type: QuizParticipantType
  id: number
}

export interface QuizCreatePayload {
  title: string
  language: string
  visibility: string
  maxAttempts: number
  description: string
  showFeedback: boolean
  weight: number
  status: QuizStatus
  minWeight: number | null
  minWeightMessage: string | null
  startDate: string | null
  endDate: string | null
  categories: QuizCategory[]
  participants: QuizParticipantPayload[]
}
