import type { Icons } from './Styles'

export interface GlobalParams {
  page?: number
  perPage?: number
  order?: 'asc' | 'desc'
  search?: string
  orderColumn?: string
  isAdmin?: boolean
}

export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum ExecutionStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
export interface ExecutionDetails {
  attempts: number | null
  percentage: number | null
  timerId: number | null
  status: ExecutionStatus
}

export interface ActionButtonConfig {
  id: string
  text: string
  variant: 'default' | 'outline'
  color: 'error' | 'primary'
  leftIcon?: Icons
  tooltipText: string
  onClick: () => void
  disabled?: boolean
  size?: 'lg' | 'md' | 'sm' | 'xs' | '2xs' | '3xs'
  leftIconSize?: '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | '2xs'
  buttonClass?: string
}
