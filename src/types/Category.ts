import type { GlobalParams } from './GlobalTypes'
import type {
  ParticipantShape,
  ParticipantShapePayload,
  VisibilityStatus,
  CourseAssignations,
} from './Course'
import type { User } from './Users'
import type { Assignation } from './Lessons'

export interface Category {
  id: number
  name: string
  shortName: string
  idNumber: string
  sequence: number
  visibility: VisibilityStatus
  customerId: number
  totalAssignations: number
}

export type CategoryType = 'course' | 'default'
export interface CreateCategoryParams {
  name: string
  type: CategoryType
  idNumber?: string
  parentId?: number
  visibility?: string
  description?: string
}
export interface GetCategoriesParams extends GlobalParams {
  visibility?: string[] | null
  status?: 'published' | 'draft' | null
}

export interface CreateCategoryPayloadShape {
  name: string
  shortName: string
  idNumber: string
  visibility: string
  assignations: Array<{
    index: number
    type: 'category' | 'course' | 'lessons' | 'file_asset' | 'quiz'
    id: number | string
  }>
  participants?: ParticipantShapePayload[]
}

export interface CategoryDetail {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  shortName: string
  idNumber: string
  sequence: number
  customerId: number
  visibility: VisibilityStatus
  user: User
  assignations: Assignation[]
  participants: ParticipantShape[]
}

export interface CategoryItem extends CourseAssignations {
  isExpired: boolean
  relatedId: number
  visibility: VisibilityStatus
  percentage: number
}
