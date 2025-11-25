import { VisibilityStatus } from './Course'
export type Media = {
  id: number
  uuid: string
  fileName: string
  name: string
  collectionName: string
  mimeType: string
  size: number
  url: string
  conversionsDisk?: string
  customProperties?: string[]
  disk?: string
  type?: string
  generatedConversions?: string[]
  manipulations?: string[]
  modelId?: string
  modelType?: string
  orderColumn?: number
  previewExists?: boolean
  responsiveImages?: string[]
  createdAt?: string
  updatedAt?: string
  customFileName?: string
  status?: 'published' | 'draft' | 'expired'
  visible?: VisibilityStatus
}
