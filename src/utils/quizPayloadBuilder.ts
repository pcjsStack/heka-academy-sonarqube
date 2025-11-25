import type { QuizAnswerValue, QuizInfoCategory } from '@/types/Quiz'
import { QuizQuestionType } from '@/types/QuizPayload'

interface QuestionAnswer {
  questionId: number
  value?: string | number
  optionIds?: number[]
  fileKey?: string
  comment?: string
}

interface CategoryExecutionPayload {
  categoryId: number
  questions: QuestionAnswer[]
}

interface QuizExecutionPayload {
  ownerId: number
  ownerType: 'quiz'
  categoryExecution: CategoryExecutionPayload
}

/**
 * Builds the quiz execution FormData payload for a specific category
 * @param quizId - The quiz ID
 * @param category - The current category with questions
 * @param answers - Record of answers by question ID
 * @returns FormData with request JSON and file attachments
 */
export const buildQuizCategoryPayload = (
  quizId: number,
  category: QuizInfoCategory,
  answers: Record<number, QuizAnswerValue>,
): FormData => {
  const questions: QuestionAnswer[] = []
  const collectedFiles: Array<{ file: File | Record<string, unknown>; fileName: string }> = []
  const seenFileKeys = new Set<string>()

  // Iterate through all questions in the category
  for (const question of category.questions) {
    const answer = answers[question.id]

    // Skip if no answer provided
    if (!answer) continue

    const questionAnswer: QuestionAnswer = {
      questionId: question.id,
    }

    // Handle different question types
    switch (question.type.toUpperCase()) {
      case QuizQuestionType.OPEN:
        // Text answers
        if (answer.text) {
          questionAnswer.value = answer.text
        }
        break

      case QuizQuestionType.YES_NO:
        // Yes/No answers - map 1 to "yes" and 0 to "no"
        if (answer.radio !== undefined) {
          questionAnswer.value = answer.radio === 1 ? 'yes' : 'no'
        }
        break

      case QuizQuestionType.SELECT_SINGLE:
        // Single select - use optionIds array with single value
        if (answer.radio !== undefined) {
          questionAnswer.optionIds = [answer.radio]
        }
        break

      case QuizQuestionType.SELECT_MULTIPLE:
        // Multiple select - use optionIds array
        if (answer.checkbox && answer.checkbox.length > 0) {
          questionAnswer.optionIds = answer.checkbox
        }
        break

      case QuizQuestionType.RATING:
        // Rating value (0-10) - must be numeric
        if (answer.rating !== undefined) {
          questionAnswer.value = answer.rating
        }
        break

      case QuizQuestionType.PHOTO:
        // Photo only question - no value, just fileKey
        break

      default:
        break
    }

    // Handle photo file attachments
    if (answer.photoFiles && answer.photoFiles.length > 0) {
      const mediaFile = answer.photoFiles[0] // Get first file

      if (mediaFile) {
        // Extract original file name and File object
        let fileName = ''
        let actualFile: File | Record<string, unknown> | null = null

        // Check if mediaFile is a File instance
        if (mediaFile instanceof File) {
          fileName = mediaFile.name
          actualFile = mediaFile
        }
        // Check if mediaFile has a file property (File object)
        else {
          const mediaObj = mediaFile as Record<string, unknown>

          if (mediaObj.file instanceof File) {
            fileName = mediaObj.file.name
            actualFile = mediaObj.file
          }
          // Check if it's a Media object with fileName
          else if (
            'fileName' in mediaFile ||
            'customFileName' in mediaFile ||
            'name' in mediaFile
          ) {
            fileName =
              (mediaFile as Record<string, string>).fileName ||
              (mediaFile as Record<string, string>).customFileName ||
              (mediaFile as Record<string, string>).name ||
              `file_${question.id}`
            actualFile = mediaFile as Record<string, unknown>
          }
        }

        // Only add to collected files if we have an actual file and haven't seen it before
        if (actualFile && fileName) {
          // Create unique key for deduplication (filename + size if File)
          const fileKey = actualFile instanceof File ? `${fileName}-${actualFile.size}` : fileName

          if (!seenFileKeys.has(fileKey)) {
            seenFileKeys.add(fileKey)
            collectedFiles.push({
              file: actualFile,
              fileName: fileName, // Use original file name
            })
          }

          // Add fileKey to question answer (use original file name)
          questionAnswer.fileKey = fileName
        }
      }
    }

    // Add comment as a separate field if provided
    if (answer.comment) {
      questionAnswer.comment = answer.comment
    }

    // Only add question if it has at least one answer field
    if (
      questionAnswer.value !== undefined ||
      questionAnswer.optionIds !== undefined ||
      questionAnswer.fileKey !== undefined ||
      questionAnswer.comment !== undefined
    ) {
      questions.push(questionAnswer)
    }
  }

  // Build the request JSON payload
  const requestPayload: QuizExecutionPayload = {
    ownerId: quizId,
    ownerType: 'quiz',
    categoryExecution: {
      categoryId: category.id,
      questions,
    },
  }

  // Create FormData
  const formData = new FormData()

  // Append request as JSON string with Content-Type metadata
  const requestBlob = new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
  formData.append('request', requestBlob, 'request.json')

  // Append all unique collected files as attachments
  collectedFiles.forEach(({ file, fileName }) => {
    // Check if we have the actual File object
    if (file instanceof File) {
      formData.append('attachments', file, fileName)
    } else {
      const fileObj = file as Record<string, unknown>
      if (fileObj.file instanceof File) {
        formData.append('attachments', fileObj.file, fileName)
      }
    }
  })

  return formData
}
