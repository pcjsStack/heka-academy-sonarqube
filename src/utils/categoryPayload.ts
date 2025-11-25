import type { ParticipantShapePayload, AssociationItem } from '@/types/Course'
import type { ParticipantItem } from '@/types/QuizCreation'
import type { CreateCategoryPayloadShape } from '@/types/Category'
type SettingsShape = Record<string, unknown>

export type AssociationsShape = {
  leftItems: AssociationItem[]
}

export function buildCreateCategoryPayload(params: {
  settings: SettingsShape
  associations: AssociationsShape
  participants?: ParticipantItem[]
}): CreateCategoryPayloadShape {
  const { settings, associations, participants } = params

  const name = (settings.fullName as string) || ''
  const shortName = (settings.shortName as string) || ''
  const idNumber = (settings.idNumber as string) || ''
  const visibility = (settings.visibility as string) || 'show'

  // Build assignations from leftItems order
  const left = associations.leftItems || []
  const assignations = left.map((item, index) => {
    // Map component types to API types
    if (item.type === 'category') {
      return { index, type: 'category' as const, id: item.id }
    }
    if (item.type === 'course') {
      return { index, type: 'course' as const, id: item.id }
    }
    if (item.type === 'lesson') {
      return { index, type: 'lessons' as const, id: item.id }
    }
    if (item.type === 'quiz') {
      return { index, type: 'quiz' as const, id: item.id }
    }
    // Files: use file_asset type
    if (item.type === 'file') {
      return { index, type: 'file_asset' as const, id: item.id }
    }
    // Default fallback
    return { index, type: 'file_asset' as const, id: item.id }
  })

  // Transform participants to the correct format with index and plural types
  const transformedParticipants: ParticipantShapePayload[] = (participants || []).map(
    (p, index) => {
      // Access the type field from the participant object (ParticipantType enum or string)
      const participantType = String(p.type) // Convert enum to string if needed
      const participantId = p.id

      // Map singular types to plural
      const typeMap: Record<string, 'users' | 'groups' | 'stores' | 'clusters' | 'roles'> = {
        user: 'users',
        group: 'groups',
        store: 'stores',
        cluster: 'clusters',
        role: 'roles',
      }

      const pluralType = typeMap[participantType] || participantType || 'users'

      return {
        index: index.toString(),
        type: pluralType as 'users' | 'groups' | 'stores' | 'clusters' | 'roles',
        id: typeof participantId === 'string' ? participantId : participantId.toString(),
      }
    },
  )

  return {
    name,
    shortName,
    idNumber,
    visibility,
    assignations,
    participants: transformedParticipants,
  }
}
