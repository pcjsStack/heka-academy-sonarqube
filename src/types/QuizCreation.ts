import type { Media } from './Media'
import type { Icons } from './Styles'
import { ParticipantType } from './Course'

export enum QuizCreationQuestionType {
  YES_NO = 'yes-no',
  MULTIPLE_CHOICE = 'multiple-choice',
  TEXT_FIELD = 'text-field',
}

export interface QuizCreationQuestion {
  id: string
  question: string
  description?: string
  type: QuizCreationQuestionType
  options?: QuizCreationOption[]
  hasMedia?: boolean
}

export interface QuizCreationOption {
  id: string
  text: string
  isCorrect?: boolean
  order: number
}

export interface QuizCreationData {
  id: string
  title: string
  questions: QuizCreationQuestion[]
  hasGlobalMedia?: boolean
}

export interface QuestionTypeOption {
  value: QuizCreationQuestionType
  label: string
}

export interface QuestionType {
  id: number
  name: string
  customerId: number
  customerUuid: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  userId: number
  type: string
}

export interface QuizSettingsData {
  title: string
  language: string
  maxAttempts?: string
  showFeedback?: boolean
  description?: string
  image?: Media[]
}

export interface StepValidationState {
  isValid: boolean
  errors: string[]
}

export interface QuizStepExpose {
  getSettings?: () => QuizSettingsData & StepValidationState
  setSettings?: (values: Partial<QuizSettingsData>) => void
}

export interface ParticipantItem {
  id: string | number
  type: ParticipantType
  title: string
  subtitle?: string
  iconBg: string
  iconName: Icons
  iconColor: 'success' | 'primary' | 'error' | 'warning' | 'neutral'
  avatarText?: string
  checked?: boolean
}

export interface QuizParticipantsData {
  participants: ParticipantItem[]
}

export interface QuizParticipantsExpose {
  getParticipants?: () => QuizParticipantsData
  setParticipants?: (items: ParticipantItem[]) => void
}

export interface QuizPublishData {
  startDate: string
  endDate: string
}

export interface QuizPublishExpose {
  getPublishData?: () => QuizPublishData
  setPublishData?: (values: Partial<QuizPublishData>) => void
}

export interface QuestionOption {
  id?: string | number
  text: string
  value: number
}

export interface QuestionFormData {
  categoryId: string
  question: string
  answerType: string
  required: boolean
  photoRequired: string
  comment: string
  attachments: Media[]
  weight: number
  correctAnswer?: string
  options?: QuestionOption[]
}

export interface QuestionValidation {
  isQuestionValid: boolean
  isWeightValid: boolean
  isCorrectAnswerValid: boolean
  isOptionsValid: boolean
}

export interface QuizQuestion {
  id: string
  title: string
  weight: string
  type: string
  attachments: Media[]
  required: boolean
  photoRequired: string
  comment: string
  correctAnswer?: string
  options?: QuestionOption[]
  fileKeys?: string[]
  removeFileIds?: number[]
}

export interface QuizCategory {
  id: string
  title: string
  weight: string
  expanded: boolean
  questions: QuizQuestion[]
}

export interface MinimumWeightRule {
  id: string
  weight: string
  message: string
}

export interface QuizQuestionsData {
  categoriesWeightTotal: string
  categoriesWeightCurrent: number
  minimumWeightToPass: boolean
  minimumWeightRules: MinimumWeightRule[]
  categories: QuizCategory[]
}

export interface QuizQuestionsExpose {
  getQuestions?: () => QuizQuestionsData & StepValidationState
  setQuestions?: (values: Partial<QuizQuestionsData>) => void
}
