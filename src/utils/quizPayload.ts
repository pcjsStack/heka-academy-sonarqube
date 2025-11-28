import moment from 'moment'
import type {
  QuizCreatePayload,
  QuizParticipantPayload,
  QuizStatus,
  QuizQuestion,
  QuizQuestionOption,
  QuizCategory,
} from '@/types/QuizPayload'
import { QuizQuestionType, QuizCorrectAnswer } from '@/types/QuizPayload'
import type {
  QuizSettingsData,
  QuizParticipantsData,
  QuizPublishData,
  QuizQuestionsData,
} from '@/types/QuizCreation'
import type { Media } from '@/types/Media'
import { ParticipantType, QuizParticipantType } from '@/types/Course'

/**
 * Formats a date string to ISO 8601 format with timezone
 * @param dateString - Date string to format
 * @returns ISO formatted date string like "2025-11-16T18:29:59.000Z" or null
 */
const formatDateToISO = (dateString: string): string | null => {
  if (!dateString) return null

  try {
    const date = moment(dateString)
    if (!date.isValid()) return null

    // Return ISO string format: "2025-11-16T18:29:59.000Z"
    return date.toISOString()
  } catch (error) {
    console.error('Error formatting date:', error)
    return null
  }
}

/**
 * Maps frontend question type to API question type
 * @param type - Frontend question type
 * @returns API question type
 */
const mapQuestionType = (type: string): QuizQuestionType => {
  const typeMap: Record<string, QuizQuestionType> = {
    open: QuizQuestionType.OPEN,
    rating: QuizQuestionType.RATING,
    yes_no: QuizQuestionType.YES_NO,
    select_single: QuizQuestionType.SELECT_SINGLE,
    select_multiple: QuizQuestionType.SELECT_MULTIPLE,
    photo: QuizQuestionType.PHOTO,
  }
  return typeMap[type] || QuizQuestionType.OPEN
}

/**
 * Converts yes/no string to boolean
 * @param value - "yes" or "no" string
 * @returns boolean value
 */
const yesNoToBoolean = (value: string): boolean => {
  return value === 'yes'
}

/**
 * Builds the quiz creation payload from step data
 * @param settings - Settings step data
 * @param questions - Questions step data
 * @param participants - Participants step data
 * @param publish - Publish step data
 * @param status - Quiz status (default: 'draft')
 * @returns Complete quiz payload ready for API submission
 */
export const buildQuizPayload = (
  settings: QuizSettingsData,
  questions: QuizQuestionsData,
  participants: QuizParticipantsData,
  publish: QuizPublishData,
  status: QuizStatus = 'draft' as QuizStatus,
): QuizCreatePayload => {
  // Transform participants data
  const participantsPayload: QuizParticipantPayload[] = participants.participants.map(
    (participant, index) => {
      // Map ParticipantType to API format
      let type: QuizParticipantType

      switch (participant.type) {
        case ParticipantType.USER:
          type = QuizParticipantType.USERS
          break
        case ParticipantType.GROUP:
          type = QuizParticipantType.GROUPS
          break
        case ParticipantType.STORE:
          type = QuizParticipantType.STORES
          break
        case ParticipantType.CLUSTER:
          type = QuizParticipantType.CLUSTERS
          break
        case ParticipantType.ROLE:
          type = QuizParticipantType.ROLES
          break
        default:
          type = QuizParticipantType.USERS
      }

      return {
        index,
        type,
        id: Number(participant.id),
      }
    },
  )

  // Transform categories and questions data
  const categoriesPayload: QuizCategory[] = questions.categories.map((category) => {
    const questionsPayload: QuizQuestion[] = category.questions.map((question, questionIndex) => {
      const baseQuestion: QuizQuestion = {
        title: question.title,
        type: mapQuestionType(question.type),
        weight: parseFloat(question.weight) || 0,
        isRequired: question.required,
        photoRequired: yesNoToBoolean(question.photoRequired),
        commentRequired: yesNoToBoolean(question.comment),
        sequence: questionIndex + 1, // 1-indexed
      }

      // Add question ID if it exists (edit mode)
      if (question.id) {
        const questionId = typeof question.id === 'string' ? parseInt(question.id, 10) : question.id
        if (!isNaN(questionId)) {
          baseQuestion.id = questionId
        }
      }

      // Add correctAnswer for YES_NO questions
      if (question.correctAnswer) {
        const answerUpper = question.correctAnswer.toUpperCase()
        baseQuestion.correctAnswer =
          answerUpper === 'YES' ? QuizCorrectAnswer.YES : QuizCorrectAnswer.NO
      }

      // Add options for SELECT_SINGLE and SELECT_MULTIPLE questions
      if (question.options && question.options.length > 0) {
        baseQuestion.options = question.options.map((option): QuizQuestionOption => {
          const optionPayload: QuizQuestionOption = {
            title: option.text,
            weight: option.value,
          }
          // Add option ID if it exists (edit mode - existing option)
          if (option.id !== undefined && option.id !== null) {
            const optionId = typeof option.id === 'string' ? parseInt(option.id, 10) : option.id
            if (!isNaN(optionId)) {
              optionPayload.id = optionId
            }
          }
          return optionPayload
        })
      }

      // Add fileKeys for new attachments (only new files, not existing ones)
      // fileKeys should only contain new file names, not existing attachment fileNames
      if (question.fileKeys !== undefined) {
        // Use provided fileKeys (can be empty array if no new files)
        baseQuestion.fileKeys = question.fileKeys
      } else {
        // Fallback: if fileKeys not provided, check attachments for new files (create mode)
        if (question.attachments && question.attachments.length > 0) {
          const newFiles = question.attachments.filter(
            (att) => att instanceof File || att.id === undefined || att.id === null,
          )
          const fileKeys = newFiles
            .map((att) => {
              if (att instanceof File) {
                return att.name
              }
              return att.fileName || att.name || ''
            })
            .filter((key) => key !== '')
          baseQuestion.fileKeys = fileKeys
        } else {
          // No attachments, set empty array
          baseQuestion.fileKeys = []
        }
      }

      // Add removeFileIds for removed attachments (edit mode)
      // Always set removeFileIds (empty array if no files removed)
      baseQuestion.removeFileIds = question.removeFileIds || []

      return baseQuestion
    })

    const categoryPayload: QuizCategory = {
      title: category.title,
      weight: parseFloat(category.weight) || 0,
      questions: questionsPayload,
    }

    // Add category ID if it exists (edit mode)
    if (category.id) {
      const categoryId = typeof category.id === 'string' ? parseInt(category.id, 10) : category.id
      if (!isNaN(categoryId)) {
        categoryPayload.id = categoryId
      }
    }

    return categoryPayload
  })

  // Handle minimum weight to pass
  let minWeight: number | null = null
  let minWeightMessage: string | null = null
  if (questions.minimumWeightToPass && questions.minimumWeightRules.length > 0) {
    const firstRule = questions.minimumWeightRules[0]
    if (firstRule) {
      minWeight = parseFloat(firstRule.weight) || null
      minWeightMessage = firstRule.message || null
    }
  }

  // Build the final payload
  const payload: QuizCreatePayload = {
    title: settings.title,
    language: settings.language,
    visibility: settings.visibility,
    maxAttempts: Number(settings.maxAttempts) || 0,
    description: settings.description || '',
    showFeedback: settings.showFeedback || false,
    weight: 1.0, // Default weight
    status,
    minWeight,
    minWeightMessage,
    startDate: formatDateToISO(publish.startDate),
    endDate: formatDateToISO(publish.endDate),
    categories: categoriesPayload,
    participants: participantsPayload,
  }

  return payload
}

/**
 * Extracts unique question attachments from all questions in all categories
 * @param questions - Questions data from questionsRef
 * @returns Array of unique Media objects
 */
export const getUniqueQuestionAttachments = (questions: QuizQuestionsData): Media[] => {
  const allAttachments: Media[] = []
  const seenIds = new Set<number>()
  const seenFileKeys = new Set<string>()

  questions.categories.forEach((category) => {
    category.questions.forEach((question) => {
      if (question.attachments && question.attachments.length > 0) {
        question.attachments.forEach((attachment) => {
          // For newly uploaded File objects without an ID
          if (attachment instanceof File) {
            const fileKey = `${attachment.name}-${attachment.size}`
            if (!seenFileKeys.has(fileKey)) {
              seenFileKeys.add(fileKey)
              allAttachments.push(attachment)
            }
          }
          // For existing Media objects with an ID
          else if (attachment.id && !seenIds.has(attachment.id)) {
            seenIds.add(attachment.id)
            allAttachments.push(attachment)
          }
          // For Media objects without ID but with a filename
          else if (!attachment.id && (attachment.fileName || attachment.name)) {
            const fileKey = `${attachment.fileName || attachment.name}-${attachment.size || 0}`
            if (!seenFileKeys.has(fileKey)) {
              seenFileKeys.add(fileKey)
              allAttachments.push(attachment)
            }
          }
        })
      }
    })
  })

  return allAttachments
}

/**
 * Builds FormData with quiz payload and file attachments
 * @param settings - Settings data
 * @param questions - Questions data
 * @param participants - Participants data
 * @param publish - Publish data
 * @param status - Quiz status
 * @returns FormData ready for API submission
 */
export const buildQuizFormData = (
  settings: QuizSettingsData,
  questions: QuizQuestionsData,
  participants: QuizParticipantsData,
  publish: QuizPublishData,
  status: QuizStatus,
): FormData => {
  // Build JSON payload
  const payload = buildQuizPayload(settings, questions, participants, publish, status)
  console.log('payload: buildQuizFormData', payload)
  // Create FormData
  const formData = new FormData()

  // Append quiz JSON data
  formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))

  // Append settings image (if exists)
  if (settings.image && settings.image.length > 0) {
    const settingsImage = settings.image[0]
    if (settingsImage instanceof File) {
      formData.append('attachment', settingsImage)
    }
  }

  // Append unique question attachments
  const questionAttachments = getUniqueQuestionAttachments(questions)
  if (questionAttachments.length > 0) {
    questionAttachments.forEach((attachment) => {
      // Check if it's a File object (newly uploaded)
      if (attachment instanceof File) {
        formData.append('questionAttachments', attachment)
      }
    })
  }

  return formData
}
