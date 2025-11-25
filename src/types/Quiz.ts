import type { CourseParticipantsView, ParticipantShape, VisibilityStatus } from './Course'
import type { ExecutionDetails, GlobalParams, PublishStatus } from './GlobalTypes'
import { CourseExecutionType } from './Course'
import { QuizQuestionType } from './QuizPayload'
import { ExecutionStatus } from './GlobalTypes'
import type { User } from './Users'

export interface QuizStep {
  id: number
  title: string
  isActive: boolean
  isCompleted: boolean
}

export interface QuizAnswerValue {
  text?: string
  rating?: number
  radio?: number
  checkbox?: number[]
  photo?: string[]
  photoFiles?: (File | Record<string, unknown>)[] // Store actual Media/File objects for FormData upload
  comment?: string
}

export interface quizItem {
  id: number
  title: string
  user: User
  imageUrl: string | null
  status: PublishStatus
  startDate: string | null
  endDate: string | null
  execution: ExecutionDetails | null
}

export interface QuizAttachment {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  user: User
  mimeType: string
  fileName: string
  customFileName: string
  size: number
  customerId: number
  visibility: VisibilityStatus
  status: PublishStatus
  url: string
}

export interface QuizOption {
  id: number
  title: string
  weight: number
  createdAt: string
}
export interface QuizInfoQuestion {
  id: number
  title: string
  type: QuizQuestionType
  weight: number
  isRequired: boolean
  photoRequired: boolean
  commentRequired: boolean
  correctAnswer: string | null
  sequence: number
  createdAt: string
  execution: executionQuestion | null
  options: QuizOption[]
  attachments: QuizAttachment[]
}

export interface executionQuestion {
  score: number
  value: string | number | null
  comment: string
  optionIds: number[]
  attachmentUrl: string
}
export interface executionCategory {
  score: number
}

export interface QuizInfoCategory {
  id: number
  title: string
  weight: number
  createdAt: string
  questions: QuizInfoQuestion[]
  execution: executionCategory | null
}
export interface QuizInfo {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  user: User
  title: string
  language: string
  maxAttempts: number
  execution: ExecutionDetails | null
  minWeight: number | null
  minWeightMessage: string | null
  description: string
  showFeedback: boolean
  isEditable: boolean | false
  weight: number
  startDate: string
  endDate: string
  status: PublishStatus
  customerId: number
  attachment: QuizAttachment
  categories: QuizInfoCategory[]
  participants: ParticipantShape[]
  participantsView: CourseParticipantsView
}

export interface GetQuizzesParams extends GlobalParams {
  status?: PublishStatus | null
  executionStatus?: ExecutionStatus | ExecutionStatus[] | null
}

export interface QuizQuestionAnswer {
  questionId: number
  answer: QuizAnswerValue
}

export interface QuizSubmissionPayload {
  quizId: number
  categoryId: number
  answers: QuizQuestionAnswer[]
  timeTaken: number
}

export interface EndQuizExecutionPayload {
  ownerId: number
  ownerType: CourseExecutionType
}
