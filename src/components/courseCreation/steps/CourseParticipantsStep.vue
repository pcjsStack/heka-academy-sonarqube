<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { GroupOptions } from 'sortablejs'
import {
  BaseTab,
  BaseText,
  BaseButtonIcon,
  BaseIcon,
  BaseCheckbox,
  BaseButton,
} from '@/components/common'
import type { Icons } from '@/types/Styles'
import { t } from '@/utils/i18n'
import CohortService from '@/services/cohort'

interface GroupSettings {
  enabled: boolean
  force: boolean
}

interface ExistingParticipant {
  index: number
  id: string | number
  type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles'
  name?: string
  fullName?: string
  email?: string
  surname?: string
  title?: string
}

const props = withDefaults(
  defineProps<{
    isEdit: boolean
    groupSettings?: GroupSettings
    existingParticipants?: ExistingParticipant[]
  }>(),
  {
    isEdit: true,
    groupSettings: () => ({ enabled: false, force: false }),
    existingParticipants: () => [],
  },
)

const participantTab = ref<'users' | 'groups' | 'stores' | 'cluster' | 'role'>('users')

// Computed tabs based on group settings
const tabs = computed(() => {
  const allTabs = [
    { label: t('pages.course.participants.tabs.users'), value: 'users' as const },
    { label: t('pages.course.participants.tabs.groups'), value: 'groups' as const },
    { label: t('pages.course.participants.tabs.stores'), value: 'stores' as const },
    { label: t('pages.course.participants.tabs.cluster'), value: 'cluster' as const },
    { label: t('pages.course.participants.tabs.role'), value: 'role' as const },
  ]

  const { enabled, force } = props.groupSettings

  if (force && enabled) {
    return allTabs.filter((tab) => tab.value === 'groups')
  } else if (!force && !enabled) {
    return allTabs.filter((tab) => tab.value !== 'groups')
  } else {
    return allTabs
  }
})

const scrollContainer = ref<HTMLElement | null>(null)

type ParticipantItem = {
  id: string | number
  type: 'user' | 'group' | 'store' | 'cluster' | 'role'
  title: string
  subtitle?: string
  iconBg: string
  iconName: Icons
  iconColor: 'success' | 'primary' | 'error' | 'warning' | 'neutral'
  avatarText?: string
  checked?: boolean
}

const leftItems = ref<ParticipantItem[]>([])
const selectedRight = ref<Set<string | number>>(new Set())
const selectAll = ref(false)

// Right lists populated from API with lazy loading
const rightUsers = ref<ParticipantItem[]>([])
const rightGroups = ref<ParticipantItem[]>([])
const rightStores = ref<ParticipantItem[]>([])
const rightClusters = ref<ParticipantItem[]>([])
const rightRoles = ref<ParticipantItem[]>([])

// Pagination state per tab
const pages = ref({ users: 0, groups: 0, stores: 0, cluster: 0, role: 0 })
const hasMore = ref({ users: true, groups: true, stores: true, cluster: true, role: true })
const isLoading = ref(false)

type UserApiItem = {
  id: number | string
  name?: string
  surname?: string
  fullName?: string
  email?: string
}

const getInitials = (name?: string, surname?: string, fullName?: string) => {
  if (name && surname) {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase()
  }
  if (fullName) {
    const parts = fullName.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return fullName.substring(0, 2).toUpperCase()
  }
  return 'U'
}

const getAvatarColor = (index: number): string => {
  const colors: string[] = [
    'bg-primary-500',
    'bg-blue-500',
    'bg-teal-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-green-500',
  ]
  return colors[index % colors.length] as string
}

const mapUser = (u: UserApiItem, index: number): ParticipantItem => {
  // Use fullName if available, otherwise construct from name and surname
  const constructedName = `${u.name || ''} ${u.surname || ''}`.trim()
  let title = '-'
  if (u.fullName) {
    title = u.fullName
  } else if (constructedName.length > 0) {
    title = constructedName
  }

  const result: ParticipantItem = {
    id: u.id,
    type: 'user',
    title,
    iconBg: getAvatarColor(index),
    iconName: 'user',
    iconColor: 'neutral',
    avatarText: getInitials(u.name, u.surname, u.fullName),
    checked: false,
  }
  if (u.email) {
    result.subtitle = u.email
  }
  return result
}

type GenericApiItem = {
  id: number | string
  name?: string
  title?: string
}

const mapGroup = (g: GenericApiItem): ParticipantItem => ({
  id: g.id,
  type: 'group',
  title: g.name || '-',
  iconBg: 'bg-blue-100',
  iconName: 'user-group',
  iconColor: 'primary',
})

const mapStore = (s: GenericApiItem): ParticipantItem => ({
  id: s.id,
  type: 'store',
  title: s.name || '-',
  iconBg: 'bg-green-100',
  iconName: 'shopping-bag',
  iconColor: 'success',
})

const mapCluster = (c: GenericApiItem): ParticipantItem => ({
  id: c.id,
  type: 'cluster',
  title: c.name || '-',
  iconBg: 'bg-yellow-100',
  iconName: 'grid',
  iconColor: 'warning',
})

const mapRole = (r: GenericApiItem): ParticipantItem => ({
  id: r.id,
  type: 'role',
  title: r.title || '-',
  iconBg: 'bg-purple-100',
  iconName: 'shield-info',
  iconColor: 'neutral',
})

const loadUsers = async () => {
  if (isLoading.value || !hasMore.value.users) return
  isLoading.value = true
  try {
    const next = pages.value.users + 1
    const res = await CohortService.getUsers(next, 20)
    const items = Array.isArray(res?.data?.data) ? res.data.data : []
    const startIndex = rightUsers.value.length
    // Map ALL items first (before filtering) so we can use them for enrichment
    const allMappedItems = items.map((item: UserApiItem, idx: number) =>
      mapUser(item, startIndex + idx),
    )

    // Enrich leftItems with user details if they match (check against ALL loaded items)
    leftItems.value = leftItems.value.map((leftItem) => {
      if (leftItem.type === 'user') {
        const matchedUser = allMappedItems.find((u: ParticipantItem) => u.id === leftItem.id)
        if (matchedUser) {
          return {
            ...leftItem,
            title: matchedUser.title,
            subtitle: matchedUser.subtitle,
            avatarText: matchedUser.avatarText,
            iconBg: matchedUser.iconBg,
          }
        }
      }
      return leftItem
    })

    // Add ALL items to right list (we'll filter them in the computed property for display)
    // This ensures we can find them for enrichment even if they're in leftItems
    // Filter out duplicates based on ID
    const existingIds = new Set(rightUsers.value.map((item: ParticipantItem) => item.id))
    const newItems = allMappedItems.filter((item: ParticipantItem) => !existingIds.has(item.id))
    rightUsers.value = [...rightUsers.value, ...newItems]
    pages.value.users = res?.data?.currentPage || next
    hasMore.value.users = res?.data?.currentPage < res?.data?.lastPage
  } catch (error) {
    console.error('Error loading users:', error)
    hasMore.value.users = false
  } finally {
    isLoading.value = false
  }
}

const loadGroups = async () => {
  if (isLoading.value || !hasMore.value.groups) return
  isLoading.value = true
  try {
    const next = pages.value.groups + 1
    const res = await CohortService.getGroups(next, 20)
    const items = Array.isArray(res?.data?.data) ? res.data.data : []
    // Map ALL items first (before filtering) so we can use them for enrichment
    const allMappedItems = items.map(mapGroup)

    // Enrich leftItems with group details if they match (check against ALL loaded items)
    leftItems.value = leftItems.value.map((leftItem) => {
      if (leftItem.type === 'group') {
        const matchedGroup = allMappedItems.find((g: ParticipantItem) => g.id === leftItem.id)
        if (matchedGroup) {
          return {
            ...leftItem,
            title: matchedGroup.title,
            iconBg: matchedGroup.iconBg,
            iconColor: matchedGroup.iconColor,
          }
        }
      }
      return leftItem
    })

    // Add ALL items to right list (we'll filter them in the computed property for display)
    // This ensures we can find them for enrichment even if they're in leftItems
    // Filter out duplicates based on ID
    const existingIds = new Set(rightGroups.value.map((item: ParticipantItem) => item.id))
    const newItems = allMappedItems.filter((item: ParticipantItem) => !existingIds.has(item.id))
    rightGroups.value = [...rightGroups.value, ...newItems]
    pages.value.groups = res?.data?.currentPage || next
    hasMore.value.groups = res?.data?.currentPage < res?.data?.lastPage
  } catch (error) {
    console.error('Error loading groups:', error)
    hasMore.value.groups = false
  } finally {
    isLoading.value = false
  }
}

const loadStores = async () => {
  if (isLoading.value || !hasMore.value.stores) return
  isLoading.value = true
  try {
    const next = pages.value.stores + 1
    const res = await CohortService.getStores(next, 20)
    const items = Array.isArray(res?.data?.data) ? res.data.data : []
    // Map ALL items first (before filtering) so we can use them for enrichment
    const allMappedItems = items.map(mapStore)

    // Enrich leftItems with store details if they match (check against ALL loaded items)
    leftItems.value = leftItems.value.map((leftItem) => {
      if (leftItem.type === 'store') {
        const matchedStore = allMappedItems.find((s: ParticipantItem) => s.id === leftItem.id)
        if (matchedStore) {
          return {
            ...leftItem,
            title: matchedStore.title,
            iconBg: matchedStore.iconBg,
            iconColor: matchedStore.iconColor,
          }
        }
      }
      return leftItem
    })

    // Add ALL items to right list (we'll filter them in the computed property for display)
    // This ensures we can find them for enrichment even if they're in leftItems
    // Filter out duplicates based on ID
    const existingIds = new Set(rightStores.value.map((item: ParticipantItem) => item.id))
    const newItems = allMappedItems.filter((item: ParticipantItem) => !existingIds.has(item.id))
    rightStores.value = [...rightStores.value, ...newItems]
    pages.value.stores = res?.data?.currentPage || next
    hasMore.value.stores = res?.data?.currentPage < res?.data?.lastPage
  } catch (error) {
    console.error('Error loading stores:', error)
    hasMore.value.stores = false
  } finally {
    isLoading.value = false
  }
}

const loadClusters = async () => {
  if (isLoading.value || !hasMore.value.cluster) return
  isLoading.value = true
  try {
    const next = pages.value.cluster + 1
    const res = await CohortService.getClusters(next, 20)
    const items = Array.isArray(res?.data?.data) ? res.data.data : []
    // Map ALL items first (before filtering) so we can use them for enrichment
    const allMappedItems = items.map(mapCluster)

    // Enrich leftItems with cluster details if they match (check against ALL loaded items)
    leftItems.value = leftItems.value.map((leftItem) => {
      if (leftItem.type === 'cluster') {
        const matchedCluster = allMappedItems.find((c: ParticipantItem) => c.id === leftItem.id)
        if (matchedCluster) {
          return {
            ...leftItem,
            title: matchedCluster.title,
            iconBg: matchedCluster.iconBg,
            iconColor: matchedCluster.iconColor,
          }
        }
      }
      return leftItem
    })

    // Add ALL items to right list (we'll filter them in the computed property for display)
    // This ensures we can find them for enrichment even if they're in leftItems
    // Filter out duplicates based on ID
    const existingIds = new Set(rightClusters.value.map((item: ParticipantItem) => item.id))
    const newItems = allMappedItems.filter((item: ParticipantItem) => !existingIds.has(item.id))
    rightClusters.value = [...rightClusters.value, ...newItems]
    pages.value.cluster = res?.data?.currentPage || next
    hasMore.value.cluster = res?.data?.currentPage < res?.data?.lastPage
  } catch (error) {
    console.error('Error loading clusters:', error)
    hasMore.value.cluster = false
  } finally {
    isLoading.value = false
  }
}

const loadRoles = async () => {
  if (isLoading.value || !hasMore.value.role) return
  isLoading.value = true
  try {
    const next = pages.value.role + 1
    const res = await CohortService.getRoles(next, 20)
    const items = Array.isArray(res?.data?.data) ? res.data.data : []
    // Map ALL items first (before filtering) so we can use them for enrichment
    const allMappedItems = items.map(mapRole)

    // Enrich leftItems with role details if they match (check against ALL loaded items)
    leftItems.value = leftItems.value.map((leftItem) => {
      if (leftItem.type === 'role') {
        const matchedRole = allMappedItems.find((r: ParticipantItem) => r.id === leftItem.id)
        if (matchedRole) {
          return {
            ...leftItem,
            title: matchedRole.title,
            iconBg: matchedRole.iconBg,
            iconColor: matchedRole.iconColor,
          }
        }
      }
      return leftItem
    })

    // Add ALL items to right list (we'll filter them in the computed property for display)
    // This ensures we can find them for enrichment even if they're in leftItems
    // Filter out duplicates based on ID
    const existingIds = new Set(rightRoles.value.map((item: ParticipantItem) => item.id))
    const newItems = allMappedItems.filter((item: ParticipantItem) => !existingIds.has(item.id))
    rightRoles.value = [...rightRoles.value, ...newItems]
    pages.value.role = res?.data?.currentPage || next
    hasMore.value.role = res?.data?.currentPage < res?.data?.lastPage
  } catch (error) {
    console.error('Error loading roles:', error)
    hasMore.value.role = false
  } finally {
    isLoading.value = false
  }
}

// Watch for tab changes based on group settings
watch(
  () => tabs.value,
  (newTabs) => {
    // If current tab is not in available tabs, switch to first available tab
    const availableTabValues = newTabs.map((t) => t.value)
    if (!availableTabValues.includes(participantTab.value)) {
      participantTab.value = availableTabValues[0] || 'users'
    }
  },
  { immediate: true },
)

// Initial load for default tab
watch(
  () => participantTab.value,
  async (tab) => {
    selectedRight.value.clear()
    selectAll.value = false
    if (tab === 'users' && rightUsers.value.length === 0) await loadUsers()
    if (tab === 'groups' && rightGroups.value.length === 0) await loadGroups()
    if (tab === 'stores' && rightStores.value.length === 0) await loadStores()
    if (tab === 'cluster' && rightClusters.value.length === 0) await loadClusters()
    if (tab === 'role' && rightRoles.value.length === 0) await loadRoles()
  },
  { immediate: true },
)

// Drag-and-drop behavior
const leftGroup: GroupOptions = { name: 'participants', pull: false, put: true }
const rightGroup: GroupOptions = { name: 'participants', pull: true, put: false }

// Get left items IDs for filtering
const leftItemsIds = computed(() => new Set(leftItems.value.map((item) => item.id)))

// Single reactive binding for the right column based on active tab
// Filter out items that are already in the left side
const rightList = computed<ParticipantItem[]>({
  get() {
    let list: ParticipantItem[] = []
    switch (participantTab.value) {
      case 'users':
        list = rightUsers.value
        break
      case 'groups':
        list = rightGroups.value
        break
      case 'stores':
        list = rightStores.value
        break
      case 'cluster':
        list = rightClusters.value
        break
      case 'role':
        list = rightRoles.value
        break
      default:
        return []
    }
    // Filter out items that are already in leftItems
    return list.filter((item) => !leftItemsIds.value.has(item.id))
  },
  set(newVal: ParticipantItem[]) {
    // When setting (from VueDraggable), update the underlying array
    // The newVal is already filtered (doesn't contain leftItems), so we just update directly
    switch (participantTab.value) {
      case 'users':
        rightUsers.value = newVal
        break
      case 'groups':
        rightGroups.value = newVal
        break
      case 'stores':
        rightStores.value = newVal
        break
      case 'cluster':
        rightClusters.value = newVal
        break
      case 'role':
        rightRoles.value = newVal
        break
    }
  },
})

const moveItemUp = (index: number) => {
  if (index <= 0) return
  const items = leftItems.value
  const prev = items[index - 1] as ParticipantItem
  const curr = items[index] as ParticipantItem
  items[index - 1] = curr
  items[index] = prev
}

const moveItemDown = (index: number) => {
  const items = leftItems.value
  if (index >= items.length - 1) return
  const next = items[index + 1] as ParticipantItem
  const curr = items[index] as ParticipantItem
  items[index + 1] = curr
  items[index] = next
}

const removeFromLeft = (index: number) => {
  const items = leftItems.value
  const removed = items.splice(index, 1)[0]
  if (!removed) return

  // Add the item back to its respective right list based on type
  // Only add if it's not already in the list (to avoid duplicates)
  switch (removed.type) {
    case 'user':
      // Check if item already exists in rightUsers before adding
      if (!rightUsers.value.some((item) => item.id === removed.id)) {
        rightUsers.value = [removed, ...rightUsers.value]
      }
      break
    case 'group':
      if (!rightGroups.value.some((item) => item.id === removed.id)) {
        rightGroups.value = [removed, ...rightGroups.value]
      }
      break
    case 'store':
      if (!rightStores.value.some((item) => item.id === removed.id)) {
        rightStores.value = [removed, ...rightStores.value]
      }
      break
    case 'cluster':
      if (!rightClusters.value.some((item) => item.id === removed.id)) {
        rightClusters.value = [removed, ...rightClusters.value]
      }
      break
    case 'role':
      if (!rightRoles.value.some((item) => item.id === removed.id)) {
        rightRoles.value = [removed, ...rightRoles.value]
      }
      break
  }
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    rightList.value.forEach((item) => selectedRight.value.add(item.id))
  } else {
    selectedRight.value.clear()
  }
}

const toggleItemSelection = (id: string | number) => {
  if (selectedRight.value.has(id)) {
    selectedRight.value.delete(id)
  } else {
    selectedRight.value.add(id)
  }
  // Update select all checkbox state
  selectAll.value = selectedRight.value.size === rightList.value.length
}

const onDragAdd = () => {
  setTimeout(() => {
    if (selectedRight.value.size > 1) {
      const selectedItems = rightList.value.filter((item) => selectedRight.value.has(item.id))

      // Remove selected items from the right list (update the underlying arrays)
      selectedItems.forEach((item) => {
        switch (item.type) {
          case 'user':
            rightUsers.value = rightUsers.value.filter((i) => i.id !== item.id)
            break
          case 'group':
            rightGroups.value = rightGroups.value.filter((i) => i.id !== item.id)
            break
          case 'store':
            rightStores.value = rightStores.value.filter((i) => i.id !== item.id)
            break
          case 'cluster':
            rightClusters.value = rightClusters.value.filter((i) => i.id !== item.id)
            break
          case 'role':
            rightRoles.value = rightRoles.value.filter((i) => i.id !== item.id)
            break
        }
      })

      const existingIds = new Set(leftItems.value.map((item) => item.id))
      const newItems = selectedItems.filter((item) => !existingIds.has(item.id))

      const seen = new Set<string | number>()
      const uniqueLeft: ParticipantItem[] = []
      for (const item of leftItems.value) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          uniqueLeft.push(item)
        }
      }
      leftItems.value = [...uniqueLeft, ...newItems]

      // Clear selection
      selectedRight.value.clear()
      selectAll.value = false
    } else {
      const seen = new Set<string | number>()
      const uniqueItems: ParticipantItem[] = []

      for (const item of leftItems.value) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          uniqueItems.push(item)
        }
      }

      if (uniqueItems.length !== leftItems.value.length) {
        leftItems.value = uniqueItems
      }

      selectedRight.value.clear()
      selectAll.value = false
    }
  }, 10)
}

watch(
  () => selectedRight.value.size,
  () => {
    selectAll.value =
      selectedRight.value.size > 0 && selectedRight.value.size === rightList.value.length
  },
)

// Helper function to find participant details from right lists
const findParticipantDetails = (
  id: string | number,
  type: 'users' | 'groups' | 'stores' | 'clusters' | 'roles',
): ParticipantItem | null => {
  switch (type) {
    case 'users':
      return rightUsers.value.find((item) => String(item.id) === String(id)) || null
    case 'groups':
      return rightGroups.value.find((item) => String(item.id) === String(id)) || null
    case 'stores':
      return rightStores.value.find((item) => String(item.id) === String(id)) || null
    case 'clusters':
      return rightClusters.value.find((item) => String(item.id) === String(id)) || null
    case 'roles':
      return rightRoles.value.find((item) => String(item.id) === String(id)) || null
    default:
      return null
  }
}

// Watch for existing participants and populate leftItems
watch(
  () => props.existingParticipants,
  async (participants) => {
    if (!participants || participants.length === 0) {
      leftItems.value = []
      return
    }

    // Sort by index to maintain order
    const sortedParticipants = [...participants].sort((a, b) => a.index - b.index)

    // In edit mode, clear right lists to force reload fresh data
    // This ensures we can find participant details even if they were just created
    if (props.isEdit) {
      rightUsers.value = []
      rightGroups.value = []
      rightStores.value = []
      rightClusters.value = []
      rightRoles.value = []
      // Reset pagination
      pages.value = { users: 0, groups: 0, stores: 0, cluster: 0, role: 0 }
      hasMore.value = { users: true, groups: true, stores: true, cluster: true, role: true }
    }

    // Load data for all participant types to ensure we can find details
    const participantTypes = new Set(sortedParticipants.map((p) => p.type))

    if (participantTypes.has('users')) {
      if (rightUsers.value.length === 0 || props.isEdit) {
        await loadUsers()
      }
    }
    if (participantTypes.has('groups')) {
      if (rightGroups.value.length === 0 || props.isEdit) {
        await loadGroups()
      }
    }
    if (participantTypes.has('stores')) {
      if (rightStores.value.length === 0 || props.isEdit) {
        await loadStores()
      }
    }
    if (participantTypes.has('clusters')) {
      if (rightClusters.value.length === 0 || props.isEdit) {
        await loadClusters()
      }
    }
    if (participantTypes.has('roles')) {
      if (rightRoles.value.length === 0 || props.isEdit) {
        await loadRoles()
      }
    }

    // Check if leftItems already has enriched data (from loadUsers/etc enrichment)
    // If so, preserve it and only update items that weren't enriched
    const existingLeftItemsMap = new Map(leftItems.value.map((item) => [item.id, item]))

    // Map participants to ParticipantItem format
    const mappedParticipants: ParticipantItem[] = sortedParticipants.map((p, idx) => {
      // First check if we already have an enriched item in leftItems
      const existingItem = existingLeftItemsMap.get(p.id)
      if (
        existingItem &&
        existingItem.title &&
        existingItem.title !== `ID: ${p.id}` &&
        existingItem.title !== `User ${p.id}` &&
        existingItem.title !== `Group ${p.id}` &&
        existingItem.title !== `Store ${p.id}` &&
        existingItem.title !== `Cluster ${p.id}` &&
        existingItem.title !== `Role ${p.id}`
      ) {
        // Use the already enriched item
        return existingItem
      }

      // Try to find participant details from right lists
      const foundDetails = findParticipantDetails(p.id, p.type)

      // Use found details if available, otherwise use provided data
      const name =
        p.name ||
        (foundDetails && 'name' in foundDetails
          ? (foundDetails as unknown as { name?: string }).name
          : undefined)
      const surname =
        p.surname ||
        (foundDetails && 'surname' in foundDetails
          ? (foundDetails as unknown as { surname?: string }).surname
          : undefined)
      const fullName =
        p.fullName || (foundDetails?.title && p.type === 'users' ? foundDetails.title : undefined)
      const email = p.email || foundDetails?.subtitle
      const title = p.title || (foundDetails && p.type === 'roles' ? foundDetails.title : undefined)

      const baseItem: ParticipantItem = {
        id: p.id,
        type:
          p.type === 'users'
            ? 'user'
            : p.type === 'groups'
              ? 'group'
              : p.type === 'stores'
                ? 'store'
                : p.type === 'clusters'
                  ? 'cluster'
                  : 'role',
        title: fullName || name || title || foundDetails?.title || `ID: ${p.id}`,
        iconBg: foundDetails?.iconBg || 'bg-neutral-100',
        iconName: foundDetails?.iconName || 'user',
        iconColor: foundDetails?.iconColor || 'neutral',
        avatarText: foundDetails?.avatarText,
      }

      // Customize based on type
      if (p.type === 'users') {
        if (!baseItem.avatarText) {
          baseItem.avatarText = getInitials(name, surname, fullName)
        }
        if (!foundDetails) {
          baseItem.iconBg = getAvatarColor(idx)
        }
        baseItem.iconName = 'user'
        baseItem.title =
          fullName ||
          `${name || ''} ${surname || ''}`.trim() ||
          foundDetails?.title ||
          `User ${p.id}`
        if (email) baseItem.subtitle = email
      } else if (p.type === 'groups') {
        if (!foundDetails) {
          baseItem.iconBg = 'bg-blue-100'
        }
        baseItem.iconName = 'user-group'
        baseItem.iconColor = 'primary'
        baseItem.title = name || fullName || foundDetails?.title || `Group ${p.id}`
      } else if (p.type === 'stores') {
        if (!foundDetails) {
          baseItem.iconBg = 'bg-green-100'
        }
        baseItem.iconName = 'shopping-bag'
        baseItem.iconColor = 'success'
        baseItem.title = name || fullName || foundDetails?.title || `Store ${p.id}`
      } else if (p.type === 'clusters') {
        if (!foundDetails) {
          baseItem.iconBg = 'bg-yellow-100'
        }
        baseItem.iconName = 'grid'
        baseItem.iconColor = 'warning'
        baseItem.title = name || fullName || foundDetails?.title || `Cluster ${p.id}`
      } else if (p.type === 'roles') {
        if (!foundDetails) {
          baseItem.iconBg = 'bg-purple-100'
        }
        baseItem.iconName = 'shield-info'
        baseItem.iconColor = 'neutral'
        baseItem.title = title || name || foundDetails?.title || `Role ${p.id}`
      }

      return baseItem
    })

    leftItems.value = mappedParticipants
  },
  { immediate: true, deep: true },
)

// Get loading message based on active tab
const loadingMessage = computed(() => {
  switch (participantTab.value) {
    case 'users':
      return t('types.loading.fetchingUsers')
    case 'groups':
      return t('types.loading.fetchingGroups')
    case 'stores':
      return t('types.loading.fetchingStores')
    case 'cluster':
      return t('types.loading.fetchingClusters')
    case 'role':
      return t('types.loading.fetchingRoles')
    default:
      return t('types.loading.fetchingUsers')
  }
})

// Handle load more button click
const handleLoadMore = async () => {
  if (participantTab.value === 'users') await loadUsers()
  if (participantTab.value === 'groups') await loadGroups()
  if (participantTab.value === 'stores') await loadStores()
  if (participantTab.value === 'cluster') await loadClusters()
  if (participantTab.value === 'role') await loadRoles()
}

// Check if load more button should be shown
const showLoadMoreButton = computed(() => {
  const currentTab = participantTab.value
  return hasMore.value[currentTab] && !isLoading.value && rightList.value.length > 0
})

// Expose getter so parent can collect selected participants from the left list
defineExpose({
  getParticipants: () => ({
    participants: leftItems.value,
  }),
  setParticipants: (items: ParticipantItem[]) => {
    leftItems.value = Array.isArray(items) ? items : []
  },
})
</script>

<template>
  <div class="w-full">
    <div
      class="grid grid-cols-2 gap-4 md:gap-3 lg:gap-4 px-2 py-4 md:py-3 lg:py-4 border-b border-neutral-200 bg-white lg:px-4"
    >
      <div class="flex items-end">
        <BaseText
          :text="t('pages.course.associations.thisCourse')"
          :tone="900"
          color="neutral"
          font="semibold"
          type="p-lg"
        />
      </div>
      <div class="hidden lg:block">
        <BaseTab :tabs="tabs" v-model="participantTab" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 h-[calc(100vh-250px)]">
      <!-- Left: Selected participants -->
      <div class="h-full flex flex-col lg:pr-5 pt-4 md:pt-3 lg:pt-4">
        <div class="flex-1 overflow-y-auto no-scrollbar">
          <VueDraggable
            v-model="leftItems"
            :group="leftGroup"
            class="space-y-[12px] md:space-y-2.5 lg:space-y-[12px] w-full h-full min-h-full"
            @add="onDragAdd"
          >
            <div
              v-if="leftItems.length === 0"
              class="w-full h-full min-h-[200px] md:min-h-[180px] lg:min-h-[200px] rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center"
            >
              <BaseText
                :text="'No participants selected'"
                :tone="500"
                color="neutral"
                type="p-sm"
              />
            </div>
            <div
              v-for="(element, index) in leftItems"
              :key="`left-${element.id}`"
              class="border border-neutral-200 rounded-lg p-4 md:p-3 lg:p-4 min-h-[66px] md:min-h-[60px] lg:min-h-[66px] flex items-center justify-between bg-white"
            >
              <div class="flex items-center gap-3 md:gap-2.5 lg:gap-3">
                <BaseButtonIcon
                  icon="arrow-move"
                  color="neutral"
                  variant="blank"
                  size="xs"
                  noButton
                />
                <template v-if="element.avatarText">
                  <div
                    class="w-8 h-8 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white text-xs md:text-[11px] lg:text-xs font-semibold"
                    :class="element.iconBg"
                  >
                    {{ element.avatarText }}
                  </div>
                </template>
                <template v-else>
                  <div
                    class="w-8 h-8 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center"
                    :class="element.iconBg"
                  >
                    <BaseIcon :name="element.iconName" size="sm" :color="element.iconColor" />
                  </div>
                </template>
                <div>
                  <BaseText :text="element.title || '-'" :tone="800" color="neutral" type="p-sm" />
                  <BaseText
                    v-if="element.subtitle"
                    :text="element.subtitle"
                    :tone="500"
                    color="neutral"
                    type="p-xs"
                  />
                </div>
              </div>
              <div class="flex items-center gap-1 md:gap-1 lg:gap-1">
                <BaseButtonIcon
                  icon="arrow-up"
                  color="neutral"
                  variant="outline-light"
                  size="xs"
                  @onClick="() => moveItemUp(index)"
                />
                <BaseButtonIcon
                  icon="arrow-down"
                  color="neutral"
                  variant="outline-light"
                  size="xs"
                  @onClick="() => moveItemDown(index)"
                />
                <BaseButtonIcon
                  icon="delete-outline"
                  color="error"
                  variant="outline-light"
                  size="xs"
                  @onClick="() => removeFromLeft(index)"
                />
              </div>
            </div>
          </VueDraggable>
        </div>
      </div>

      <!-- Right: Available participants area -->
      <div
        class="lg:border-l lg:border-neutral-200 lg:pl-5 pt-4 md:pt-3 lg:pt-4 h-full flex flex-col"
      >
        <!-- Mobile and tablet tabs above right content -->
        <div class="block lg:hidden px-2 mb-3">
          <BaseTab :tabs="tabs" v-model="participantTab" />
        </div>

        <!-- Actions bar with Select All and Add Selected button -->
        <div class="flex items-center justify-between mb-3 md:mb-2.5 lg:mb-3 px-2 md:px-3 lg:px-2">
          <div class="flex items-center gap-2 md:gap-1.5 lg:gap-2">
            <BaseCheckbox
              v-model="selectAll"
              :label="t('pages.course.participants.selectAll')"
              @update:model-value="toggleSelectAll"
            />
          </div>
        </div>

        <!-- Scrollable list -->
        <div
          ref="scrollContainer"
          class="overflow-y-auto px-2 md:px-3 lg:px-2"
          style="height: calc(100vh - 330px); scrollbar-width: thin"
        >
          <!-- Empty state when no data -->
          <div
            v-if="!isLoading && rightList.length === 0"
            class="w-full h-full flex items-center justify-center"
          >
            <div class="text-center py-12 md:py-10 lg:py-12">
              <div class="mb-4 md:mb-3 lg:mb-4 flex justify-center">
                <BaseIcon
                  :name="
                    participantTab === 'users'
                      ? 'user'
                      : participantTab === 'groups'
                        ? 'user-group'
                        : participantTab === 'stores'
                          ? 'shopping-bag'
                          : participantTab === 'cluster'
                            ? 'grid'
                            : 'shield-info'
                  "
                  size="lg"
                  color="neutral"
                  class="opacity-30"
                />
              </div>
              <BaseText
                :text="`No ${participantTab} found`"
                :tone="500"
                color="neutral"
                type="p-md"
                class="mb-2 md:mb-1.5 lg:mb-2 capitalize"
              />
              <BaseText
                :text="`There are no ${participantTab} available to select`"
                :tone="400"
                color="neutral"
                type="p-sm"
                class="capitalize"
              />
            </div>
          </div>

          <!-- List with data -->
          <div v-else class="space-y-3 md:space-y-2.5 lg:space-y-3">
            <VueDraggable
              v-model="rightList"
              :group="rightGroup"
              class="space-y-3 md:space-y-2.5 lg:space-y-3"
            >
              <div
                v-for="element in rightList"
                :key="`right-${element.id}`"
                class="bg-white rounded-lg p-4 md:p-3 lg:p-4 min-h-[56px] md:min-h-[50px] lg:min-h-[56px] flex items-center justify-between border border-neutral-200 cursor-pointer hover:bg-neutral-50"
                @click="toggleItemSelection(element.id)"
              >
                <div class="flex items-center gap-3 md:gap-2.5 lg:gap-3">
                  <BaseButtonIcon
                    icon="arrow-move"
                    color="neutral"
                    variant="blank"
                    size="xs"
                    noButton
                  />
                  <BaseCheckbox
                    :model-value="selectedRight.has(element.id)"
                    @click.stop
                    @update:model-value="() => toggleItemSelection(element.id)"
                  />
                  <template v-if="element.avatarText">
                    <div
                      class="w-10 h-10 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-[13px] lg:text-sm font-semibold"
                      :class="element.iconBg"
                    >
                      {{ element.avatarText }}
                    </div>
                  </template>
                  <template v-else>
                    <div
                      class="w-10 h-10 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center"
                      :class="element.iconBg"
                    >
                      <BaseIcon :name="element.iconName" size="sm" :color="element.iconColor" />
                    </div>
                  </template>
                  <div>
                    <BaseText
                      :text="element.title || '-'"
                      type="p-sm"
                      :tone="900"
                      color="neutral"
                    />
                    <BaseText
                      v-if="element.subtitle"
                      :text="element.subtitle"
                      :tone="500"
                      color="neutral"
                      type="p-xs"
                    />
                  </div>
                </div>
              </div>
            </VueDraggable>
            <div v-if="isLoading" class="py-3 md:py-2.5 lg:py-3 text-center">
              <BaseText :text="loadingMessage" :tone="500" color="neutral" type="p-xs" />
            </div>

            <!-- Load More Button -->
            <div v-if="showLoadMoreButton" class="py-4 flex justify-center">
              <BaseButton
                :text="t('pages.course.associations.loadMore')"
                variant="outline"
                color="primary"
                size="sm"
                :disabled="isLoading"
                @onClick="handleLoadMore"
                class="!font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
