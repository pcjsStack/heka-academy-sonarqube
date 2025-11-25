import type { ExecutionDetails, GlobalParams } from './GlobalTypes'
import { ExecutionStatus } from './GlobalTypes'
import type { User } from './Users'
import type { Media } from './Media'
import type { VisibilityStatus } from './Course'
import type { Restriction } from './Course'
export interface Lesson {
  id: number
  name: string
  user: User
  status: LessonStatus
  subLessonsCount: number
  imageUrl: string
  courseCount: number
  visibility: VisibilityStatus
  execution: ExecutionDetails | null
  startDate?: string | null
  endDate?: string | null
  totalAssignations?: number
}

export interface LessonDetails {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  user: User
  name: string
  shortName: string
  visibility: string
  startDate: string
  endDate: string
  alwaysAvailable: boolean
  idNumber: string
  language: string | null
  description: string
  completionTracking: {
    enabled: boolean
    show: boolean
  }
  status: LessonStatus
  customerId: number | null
  attachment: Media
  assignations: Assignation[]
  execution: ExecutionDetails | null
  rules?: Restriction[]
  restrictions?: {
    reminderAt?: string
    completionCondition?: string
    recurrenceType?: string
    recurrenceInterval?: number
    repeatOn?: string
    recurrenceEndDate?: string | null
    endAfterOccurrences?: number | null
  }
}

export enum LessonStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
}
export interface GetLessonsParams extends GlobalParams {
  status?: LessonStatus
  executionStatus?: ExecutionStatus | ExecutionStatus[] | null
  visibility?: string[]
  date?: string // Date range in format "YYYY-MM-DD,YYYY-MM-DD" or "startDate,endDate"
  startDate?: string
  endDate?: string
}

export interface CreateLessonPayload {
  name: string
  subLessonsNames: string[]
  courseIds: number[]
  status: LessonStatus
  files: Media
  attachment: Media
}

export interface Assignation {
  id: number
  customerId: number | null
  relatedId: number
  relatedType: string
  order: number
  createdAt: string
  execution: ExecutionDetails | null
  model: LessonModel
}

export interface LessonModel extends Media {
  visibility: VisibilityStatus
}
