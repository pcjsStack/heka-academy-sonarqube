import type { Media } from './Media'
import type { User } from './Users'
import type { Assignation } from './Lessons'

export type { Media }

export interface BadgeFormData {
  name: string
  image: File[] | Media[]
  imageUrl?: string
  associations: {
    fileIds: string[]
    courseIds: string[]
    lessonIds: string[]
    quizIds: string[]
  }
}

export interface SkillsFormData {
  names: string[]
  associations: {
    fileIds: string[]
    courseIds: string[]
    lessonIds: string[]
    quizIds: string[]
  }
}

export interface BadgeFormValidation {
  isNameValid: boolean
  isImageValid: boolean
  isAssociationValid: boolean
  isFormValid: boolean
}

export interface SkillsFormValidation {
  hasValidSkills: boolean
  isAssociationValid: boolean
  isFormValid: boolean
}

export interface AssociationOption {
  value: string
  label: string
}

export interface BadgeSkillsPayload {
  badge: BadgeFormData
  skills: SkillsFormData
}

export interface BadgeSkillsValidation {
  badge: BadgeFormValidation
  skills: SkillsFormValidation
  isSaveEnabled: boolean
}

export interface AddSkillPayload {
  names: string[]
  fileIds?: string[]
  courseIds?: string[]
  lessonIds?: string[]
  quizIds?: string[]
}

export interface EditSkillPayload {
  name: string
  fileIds?: string[]
  courseIds?: string[]
  lessonIds?: string[]
  quizIds?: string[]
}

export interface Badge {
  id: number
  name: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
}

export interface BadgeDetails {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  description: string | null
  customerId: number
  user: User
  attachment: Media
  files: Media[]
  courses: Assignation[]
  lessons: Assignation[]
  quizzes: Assignation[]
}

export interface Skill {
  id: number
  name: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
}

export interface GetBadgesParams {
  deletedFilter?: 'active' | 'deleted' | 'all'
  search?: string
  isAdmin?: boolean
  page?: number
  perPage?: number
}

export interface GetSkillsParams {
  deletedFilter?: 'active' | 'deleted' | 'all'
  search?: string
  isAdmin?: boolean
  page?: number
  perPage?: number
}

export interface BadgeSkillsResponse {
  data: Badge[] | Skill[]
  total?: number
  page?: number
  perPage?: number
  totalPage?: number
}

export interface BadgeSkillsFilters {
  deleted?: boolean
}

export interface StoredAssociations {
  files: Assignation[]
  courses: Assignation[]
  lessons: Assignation[]
  quizzes: Assignation[]
}

export interface ExtendedBadgeAssociations {
  files?: Assignation[]
  courses?: Assignation[]
  lessons?: Assignation[]
  quizzes?: Assignation[]
  fileIds?: string[]
  courseIds?: string[]
  lessonIds?: string[]
  quizIds?: string[]
}

export interface ExtendedSkillsAssociations {
  files?: Assignation[]
  courses?: Assignation[]
  lessons?: Assignation[]
  quizzes?: Assignation[]
  fileIds?: string[]
  courseIds?: string[]
  lessonIds?: string[]
  quizIds?: string[]
}
