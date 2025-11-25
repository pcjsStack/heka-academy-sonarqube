import type {
  AddSkillPayload,
  BadgeFormData,
  SkillsFormData,
  EditSkillPayload,
} from '@/types/BadgeAndSkill'

/**
 * Filter and validate IDs by removing null, undefined, and empty values
 */
const filterValidIds = (ids: string[] | undefined | null): string[] => {
  return (ids || [])
    .filter((id) => id !== null && id !== undefined && id !== '')
    .map((id) => String(id))
}

/**
 * Create FormData payload for badge creation matching the API format
 * @param badgeData - Badge form data containing name, image, and associations
 * @param description - Optional badge description
 * @returns FormData object ready to be sent to the API
 */
export const createBadgeFormData = (badgeData: BadgeFormData, description?: string): FormData => {
  const formData = new FormData()

  // Add badge name
  formData.append('name', badgeData.name)

  // Add description (optional)
  if (description) {
    formData.append('description', description)
  }

  // Add image file (attachment)
  if (badgeData.image.length > 0 && badgeData.image[0]) {
    const imageItem = badgeData.image[0]
    // Only append if it's a File (not Media)
    if (imageItem instanceof File) {
      formData.append('attachment', imageItem)
    }
  }

  // Add fileIds as separate form fields
  const validFileIds = filterValidIds(badgeData.associations.fileIds)
  validFileIds.forEach((fileId) => {
    formData.append('fileIds', fileId)
  })

  // Add courseIds as separate form fields
  const validCourseIds = filterValidIds(badgeData.associations.courseIds)
  validCourseIds.forEach((courseId) => {
    formData.append('courseIds', courseId)
  })

  // Add lessonIds as separate form fields
  const validLessonIds = filterValidIds(badgeData.associations.lessonIds)
  validLessonIds.forEach((lessonId) => {
    formData.append('lessonIds', lessonId)
  })

  // Add quizIds as separate form fields
  const validQuizIds = filterValidIds(badgeData.associations.quizIds)
  validQuizIds.forEach((quizId) => {
    formData.append('quizIds', quizId)
  })

  return formData
}

/**
 * Create skill payload object matching the API format for creating skills
 * @param skillsData - Skills form data containing names and associations
 * @returns Skill payload object
 */
export const createSkillPayload = (skillsData: SkillsFormData): AddSkillPayload => {
  // Filter valid skill names
  const validSkillNames = skillsData.names.filter((skill) => skill.trim() !== '')

  return {
    names: validSkillNames,
    fileIds: filterValidIds(skillsData.associations.fileIds),
    courseIds: filterValidIds(skillsData.associations.courseIds),
    lessonIds: filterValidIds(skillsData.associations.lessonIds),
    quizIds: filterValidIds(skillsData.associations.quizIds),
  }
}

/**
 * Create skill payload object for editing a single skill
 * @param skillsData - Skills form data containing names and associations
 * @returns Edit skill payload object with single name
 */
export const createEditSkillPayload = (skillsData: SkillsFormData): EditSkillPayload => {
  // For editing, only use the first name (single skill update)
  const skillName = skillsData.names[0]?.trim() || ''

  return {
    name: skillName,
    fileIds: filterValidIds(skillsData.associations.fileIds),
    courseIds: filterValidIds(skillsData.associations.courseIds),
    lessonIds: filterValidIds(skillsData.associations.lessonIds),
    quizIds: filterValidIds(skillsData.associations.quizIds),
  }
}

/**
 * Log FormData contents for debugging
 * Note: FormData cannot be JSON.stringify'd directly, so we convert it to an object
 */
export const logFormData = (formData: FormData, label = 'FormData'): void => {
  const formDataObject: Record<string, string | File | (string | File)[]> = {}

  formData.forEach((value, key) => {
    if (formDataObject[key]) {
      // If key already exists, convert to array or push to existing array
      if (Array.isArray(formDataObject[key])) {
        ;(formDataObject[key] as (string | File)[]).push(value)
      } else {
        formDataObject[key] = [formDataObject[key] as string | File, value]
      }
    } else {
      formDataObject[key] = value
    }
  })

  console.log(`${label}:`, formDataObject)
}
