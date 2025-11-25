import type { GlobalParams } from './GlobalTypes'
import { VisibilityStatus } from './Course'
import type { Media } from './Media'

export interface GetFilesParams extends GlobalParams {
  mimeTypes?: 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'scorm' | 'all' | string
  deletedFilter?: 'all' | 'deleted' | 'notDeleted'
  visibility?: VisibilityStatus
}

export interface FilterState {
  visibility: string[]
  fileTypes: string[]
  search: string
}
export interface UpdateFileParams {
  id: string
  status?: 'published' | 'draft' | 'expired'
  visibility?: VisibilityStatus
  customFileName?: string
}

export interface UploadFileResponse extends Media {
  id: number
  uuid: string
  fileName: string
  name: string
  collectionName: string
  mimeType: string
  size: number
  url: string
  visibility: VisibilityStatus
}
