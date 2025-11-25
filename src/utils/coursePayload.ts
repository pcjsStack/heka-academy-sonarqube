import moment from 'moment'
import type { Media } from '@/types/Media'
import type { Restriction, ParticipantShape, ParticipantShapePayload } from '@/types/Course'

type SettingsShape = Record<string, unknown>

type AssociationItem = {
  id: number | string
  type: 'course' | 'lessons' | 'file' | string
  isNew?: boolean
}

export type AssociationsShape = {
  leftItems: AssociationItem[]
}

const toBoolean = (val: unknown): boolean => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toLowerCase() === 'yes' || val.toLowerCase() === 'true'
  return false
}

export interface RestrictionsPayloadShape {
  recurrenceType?: string
  recurrenceInterval?: number
  repeatOn?: string
  recurrenceEndDate?: string | null
  endAfterOccurrences?: number | null
  completionCondition?: string
}

export interface CreateCoursePayloadShape {
  name: string
  shortName: string
  categoryId: number | null
  visibility: string
  status: 'draft' | 'published'
  startDate?: string
  endDate?: string
  idNumber: string
  alwaysAvailable: boolean
  description: string
  completionTracking: { enabled: boolean; show: boolean }
  groupSettings: { enabled: boolean; force: boolean }
  fileIds: Array<number | string>
  restrictions?: RestrictionsPayloadShape
  assignations: Array<{
    index: number
    type: 'file_asset' | 'new_file' | 'course' | 'lessons' | 'quiz'
    id: number | string
  }>
  rules: Array<{ type: string; value: string; assignationIndex?: number }>
  participants?: ParticipantShapePayload[]
}

export function buildCreateCoursePayload(params: {
  settings: SettingsShape
  uploadedFiles: Media[]
  associations: AssociationsShape
  accessRestrictions?: Restriction[]
  recurrence?: Record<string, unknown> | null
  completionCondition?: string
  participants?: ParticipantShape[]
}): CreateCoursePayloadShape {
  const {
    settings,
    associations,
    uploadedFiles,
    accessRestrictions,
    recurrence,
    completionCondition,
    participants,
  } = params

  const name = (settings.fullName as string) || ''
  const shortName = (settings.shortName as string) || ''
  const categoryId = settings.category ? Number(settings.category as string) : null
  const visibility = (settings.visibility as string) || 'show'
  const status: 'draft' | 'published' = 'published'
  const alwaysAvailable = Boolean(settings.alwaysAvailable)

  const startDateRaw = (settings.startDate as string) || ''
  const endDateRaw = (settings.endDate as string) || ''
  const startDate =
    !alwaysAvailable && startDateRaw
      ? moment(startDateRaw).format('YYYY-MM-DDTHH:mm:ssZ')
      : undefined
  const endDate =
    !alwaysAvailable && endDateRaw ? moment(endDateRaw).format('YYYY-MM-DDTHH:mm:ssZ') : undefined

  const idNumber = (settings.idNumber as string) || ''
  const description = (settings.summary as string) || ''
  const completionTracking = {
    enabled: toBoolean(settings.enableCompletionTracking),
    show: toBoolean(settings.showActivityCompletionConditions),
  }

  // Handle groupSettings - can be an object or fallback to old groupSetting string
  let groupSettings = { enabled: false, force: false }
  if (settings.groupSettings && typeof settings.groupSettings === 'object') {
    const gs = settings.groupSettings as { enabled: boolean; force: boolean }
    groupSettings = {
      enabled: Boolean(gs.enabled),
      force: Boolean(gs.force),
    }
  } else if (settings.groupSetting) {
    // Backward compatibility with old groupSetting string format
    const groupSetting = settings.groupSetting as string
    groupSettings = {
      enabled: groupSetting === 'group' || groupSetting === 'force',
      force: groupSetting === 'force',
    }
  }

  // Build assignations from leftItems order
  const left = associations.leftItems || []
  const assignations = left.map((item, index) => {
    if (item.type.toLowerCase() === 'lesson' || item.type.toLowerCase() === 'lessons')
      return { index, type: 'lessons' as const, id: item.id }
    if (item.type.toLowerCase() === 'course' || item.type.toLowerCase() === 'courses')
      return { index, type: 'course' as const, id: item.id }
    if (item.type.toLowerCase() === 'quiz' || item.type.toLowerCase() === 'quizzes')
      return { index, type: 'quiz' as const, id: item.id }
    if (item.type.toLowerCase() === 'file' || item.type.toLowerCase() === 'file_asset') {
      if (item.isNew || typeof item.id === 'undefined' || item.id === null) {
        // Use uploaded file index if present, else 0
        const id = index < uploadedFiles.length ? index : 0
        return { index, type: 'new_file' as const, id }
      }
      return { index, type: 'file_asset' as const, id: item.id }
    }
    // default treat as file asset
    return { index, type: 'file_asset' as const, id: item.id }
  })
  console.log('assignations', assignations)

  // fileIds: include only known existing file ids from associations
  const fileIds = left
    .filter((i) => i.type === 'file' && !i.isNew && typeof i.id !== 'undefined')
    .map((i) => i.id)

  // Convert access restrictions to rules format, only include assignationIndex if defined
  const rules =
    accessRestrictions?.map((r) => {
      const rule: { type: string; value: string; assignationIndex?: number } = {
        type: r.type,
        value: r.value.toString(),
      }
      // Only add assignationIndex if it's defined
      if (r.assignationIndex !== undefined) {
        rule.assignationIndex = r.assignationIndex
      }
      return rule
    }) || []

  // Build restrictions object from recurrence data
  const restrictionsPayload: RestrictionsPayloadShape = {}

  if (recurrence) {
    const recurrenceType = recurrence.recurrenceType as string
    const recurrenceInterval = Number(recurrence.recurrenceInterval) || 1
    const ends = recurrence.ends as string

    // Only add recurrence fields if recurrenceType is set
    if (recurrenceType && recurrenceType !== '') {
      restrictionsPayload.recurrenceType = recurrenceType.toLowerCase() // Convert to lowercase for API
      restrictionsPayload.recurrenceInterval = recurrenceInterval

      // Add repeatOn for monthly/weekly - use repeatDay field from SetRecurrence
      if (recurrenceType.toLowerCase() === 'monthly' || recurrenceType.toLowerCase() === 'weekly') {
        const repeatDay = recurrence.repeatDay as string
        // Convert full day name to 3-letter abbreviation
        const dayMap: Record<string, string> = {
          Monday: 'mon',
          Tuesday: 'tue',
          Wednesday: 'wed',
          Thursday: 'thu',
          Friday: 'fri',
          Saturday: 'sat',
          Sunday: 'sun',
        }
        restrictionsPayload.repeatOn = dayMap[repeatDay] || repeatDay.toLowerCase().substring(0, 3)
      }

      // Add end conditions - SetRecurrence uses 'endDate' and 'afterOccurrences'
      if (ends === 'endDate') {
        restrictionsPayload.recurrenceEndDate = recurrence.endDate
          ? moment(recurrence.endDate as string).format('YYYY-MM-DD')
          : null
        restrictionsPayload.endAfterOccurrences = null
      } else if (ends === 'afterOccurrences') {
        restrictionsPayload.endAfterOccurrences = Number(recurrence.endAfterOccurrences) || null
        restrictionsPayload.recurrenceEndDate = null
      } else {
        // If ends is 'never', set both to null
        restrictionsPayload.recurrenceEndDate = null
        restrictionsPayload.endAfterOccurrences = null
      }
    }
  }

  // Add completion condition
  if (completionCondition) {
    restrictionsPayload.completionCondition = completionCondition
  }

  // Transform participants to the correct format with index and plural types
  const transformedParticipants: ParticipantShapePayload[] = (participants || []).map(
    (p, index) => {
      // Access the type field from the participant object
      const participantData = p as unknown as { type: string; id: number | string }

      // Map singular types to plural
      const typeMap: Record<string, 'users' | 'groups' | 'stores' | 'clusters' | 'roles'> = {
        user: 'users',
        group: 'groups',
        store: 'stores',
        cluster: 'clusters',
        role: 'roles',
      }

      const pluralType = typeMap[participantData.type] || participantData.type || 'users'

      return {
        index: index.toString(),
        type: pluralType as 'users' | 'groups' | 'stores' | 'clusters' | 'roles',
        id: participantData.id.toString(),
      }
    },
  )

  const base: CreateCoursePayloadShape = {
    name,
    shortName,
    categoryId,
    visibility,
    status,
    idNumber,
    alwaysAvailable,
    description,
    completionTracking,
    groupSettings,
    fileIds,
    assignations,
    participants: transformedParticipants,
    rules,
    restrictions: Object.keys(restrictionsPayload).length > 0 ? restrictionsPayload : undefined,
  }

  if (!alwaysAvailable) {
    if (startDate) (base as unknown as { startDate?: string }).startDate = startDate
    if (endDate) (base as unknown as { endDate?: string }).endDate = endDate
  }

  return base
}
