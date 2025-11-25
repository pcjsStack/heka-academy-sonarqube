import type { GlobalParams } from '@/types/GlobalTypes'

export interface GetCohortsParams extends GlobalParams {
  totalMembers?: string
}

export interface CohortItem {
  id: number
  name: string
  totalMembers: number
}

export interface CohortFormData {
  name: string
  description: string
  clusterIds: number[]
  roleIds: number[]
  groupIds: number[]
  userIds: number[]
}

export interface UserItem {
  id: number
  slug: string
  name: string
  surname: string
  fullName: string
  email: string | null
  mobile: string | null
  username: string
  status: string
  languageId: number
  timezoneId: number
  roleIds: number[]
  languageIds: number[]
}

export interface RoleItem {
  id: number
  slug: string
  defaultFg: boolean
  storeFg: boolean
  orgNodeFg: boolean
  title: string
  description: string | null
  permissionIds: number[]
  permissions: PermissionItem[]
  role_level: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PermissionItem {
  id: number
  title: string
  description: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface GroupItem {
  id: number
  name: string
  users: UserItem[]
  userIds: number[]
  createdAt: string
  updatedAt: string
}
export interface ClusterItem {
  id: number
  slug: string
  name: string
  customerId: number
  customer: CustomerItem
  storeIds: number[]
  stores: StoreItem[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface StoreItem {
  id: number
  external_id: string | null
  slug: string
  name: string
  code: string
  description: string | null
  customerId: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
export interface CustomerItem {
  id: number
  uuid: string
  slug: string
  name: string
  vatCode: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CustomerUserItem {
  id: number
  external_id: string | null
  slug: string
  name: string
  surname: string
  fullName: string
  email: string | null
  mobile: string | null
  username: string
  status: string
  languageId: number
  timezoneId: number
  customerId: number
  about_me: string | null
  job_description: string | null
  roleIds: number[]
  languageIds: number[]
  customer: CustomerItem
  stores: StoreItem[]
  related_stores: { store_id: number; role_id: number }[]
  roles: RoleItem[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
