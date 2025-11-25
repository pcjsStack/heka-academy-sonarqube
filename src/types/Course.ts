import type { ExecutionDetails, GlobalParams } from '@/types/GlobalTypes'
import { ExecutionStatus } from '@/types/GlobalTypes'
import type { Media } from '@/types/Media'
import type { Assignation } from '@/types/Lessons'
import type { Icons } from '@/types/Styles'

export interface GetCoursesParams extends GlobalParams {
  categoryId?: number
  categoryIds?: number[]
  status?: string
  published?: boolean
  executionStatus?: ExecutionStatus | ExecutionStatus[] | null
  date?: string // Date range in format "YYYY-MM-DD,YYYY-MM-DD" or "startDate,endDate"
  startDate?: string
  endDate?: string
  visibility?: string[] | null
  search?: string
  type?: string
}
export enum VisibilityStatus {
  SHOW = 'show',
  HIDE = 'hide',
  MAINTENANCE = 'maintenance',
}
export enum VisibilityType {
  COURSE = 'course',
  LESSONS = 'lessons',
  FILES = 'files',
  QUIZ = 'quiz',
  CATEGORY = 'category',
}
export interface CourseItem {
  id: number
  name: string
  shortName: string
  execution: ExecutionDetails | null
  description: string
  category: CategoryItem | null
  visibility: VisibilityStatus
  status: string
  startDate: string | null
  endDate: string | null
  user: UserItem
  imageUrl: string
  totalAssignations: number
}
export enum CourseContentType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  CALENDAR = 'calendar',
  QUIZ = 'quiz',
  VIDEO = 'video',
  PDF = 'pdf',
  ZIP = 'zip',
}
export enum CourseActionType {
  NEW_FILE = 'NEW_FILE',
  FILE_ASSET = 'FILE_ASSET',
  COURSE = 'COURSE',
  LESSONS = 'LESSONS',
  CATEGORY = 'CATEGORY',
  QUIZ = 'QUIZ',
}

export interface CourseAssignations {
  id: number
  title: string
  contentType: CourseContentType
  status?: 'done' | 'todo'
  actionType?: CourseActionType
}
export interface CourseDetails {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  shortName: string
  customerId: number | null
  visibility: string
  startDate: string | null
  endDate: string | null
  idNumber: string
  description: string
  execution: ExecutionDetails | null
  language: string | null
  alwaysAvailable: boolean
  completionTracking: {
    enabled: boolean
    show: boolean
  }
  groupSettings: {
    enabled: boolean
    force: boolean
  }
  restrictions: {
    reminderAt?: string
    completionCondition?: string
    recurrenceType?: string
    recurrenceInterval?: number
    repeatOn?: string
    recurrenceEndDate?: string | null
    endAfterOccurrences?: number | null
  }
  user: UserItem
  status: string
  attachment: Media
  assignations: Assignation[]
  rules: Restriction[]
  participants: ParticipantShape[]
  categoryId: number
}

export interface CategoryItem {
  id: number
  name: string
  description: string | null
}

export interface UserItem {
  id: number
  firstName: string
  surname: string
  email: string
}

export interface CourseParticipantsView {
  currentPage: number
  data: CourseParticipants[]
  page: number
  perPage: number
  totalPage: number
  total: number
}

export interface SelectOption {
  value: string
  label: string
}

export enum RestrictionType {
  COHORT = 'cohort',
  DATE = 'date',
  LANGUAGE = 'language',
  ACTIVITY = 'activity',
  GRADE = 'grade',
  USER_PROFILE = 'userProfile',
  RESTRICTION_SET = 'restrictionSet',
}
export interface Restriction {
  id?: number
  type: RestrictionType
  value: string | number | boolean
  assignationIndex?: number
}
export interface AssociationItem {
  id: string | number
  type: string
  title?: string
  iconBg?: string
  iconName?: Icons
  iconColor?: 'success' | 'primary' | 'error' | 'warning' | 'neutral'
  isNew?: boolean
  sourceList?: string
  thumbUrl?: string
}

export interface CourseRecurrence {
  recurrenceType: string
  recurrenceInterval: number
  repeatDay?: string
  repeatDate?: number
  ends?: string
  endDate?: string | null
  repeatOn?: string
  endAfterOccurrences?: number
}
export enum ParticipantType {
  USER = 'user',
  GROUP = 'group',
  STORE = 'store',
  CLUSTER = 'cluster',
  ROLE = 'role',
}
export enum QuizParticipantType {
  USERS = 'users',
  GROUPS = 'groups',
  STORES = 'stores',
  CLUSTERS = 'clusters',
  ROLES = 'roles',
}
export interface ParticipantShape {
  id: number
  customerId: number | null
  relatedId: number
  relatedType: ParticipantType
  order?: number
  createdAt?: string
}
export interface ParticipantShapePayload {
  index: string
  type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles'
  id: number | string
}

export enum CourseExecutionType {
  COURSE = 'COURSE',
  LESSON = 'LESSONS',
  QUIZ = 'QUIZ',
  CATEGORY = 'CATEGORY',
}

export interface NavigationHistoryType {
  courseId: number
  type: CourseActionType
  nestedNavigationHistory?: NavigationHistoryType
}
export interface CourseExecution {
  ownerId: number
  ownerType: CourseExecutionType
  relatedId: number
  relatedType: CourseActionType
  subExecution?: CourseExecution
  percentage?: number
}
export interface SubExecution {
  ownerId: number
  ownerType: CourseExecutionType
  relatedId: number
  relatedType: CourseActionType
  subExecution?: SubExecution
  percentage?: number
}

export interface CourseParticipants {
  id: number
  firstName: string
  surname: string
  email: string | null
  status: string
  languageId: number
  execution: ExecutionDetails | null
  fullName: string | null
}

export interface StartExecutionPayload {
  ownerId: number
  ownerType: CourseExecutionType
  timerId: number
}
