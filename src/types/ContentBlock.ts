import type { Media } from '@/types/Media'

export interface ContentBlockData {
  video: File[] | Media[] | null
  description: string
  backgroundColor?: string
}

export interface ContentBlockResponse {
  id: number
  video: Media | null
  description: string
  backgroundColor?: string
  createdAt: string
  updatedAt: string
  customerId?: number | null
  user?: {
    id: number
    firstName: string
    surname: string
    email: string
  } | null
  attachment?: Media | null
}
