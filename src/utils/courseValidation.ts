import type { Media } from '@/types/Media'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface CourseValidationSchema {
  files: {
    maxCount: number
    maxTotalSizeMB: number
  }
}

export const COURSE_VALIDATION_SCHEMA: CourseValidationSchema = {
  files: {
    maxCount: 10,
    maxTotalSizeMB: 100,
  },
}

export interface FileValidationResult extends ValidationResult {
  fileCount: number
  totalSizeMB: number
}

/**
 * Validates course files according to the schema
 * @param files Array of Media files
 * @param schema Validation schema (optional, uses default if not provided)
 * @returns ValidationResult with validation status and errors
 */
export function validateCourseFiles(
  files: Media[],
  schema: CourseValidationSchema = COURSE_VALIDATION_SCHEMA,
): FileValidationResult {
  const errors: string[] = []
  const fileCount = files.length
  const totalSizeBytes = files.reduce((total, file) => total + (file.size || 0), 0)
  const totalSizeMB = totalSizeBytes / (1024 * 1024) // Convert bytes to MB

  // Check file count
  if (fileCount > schema.files.maxCount) {
    errors.push(`Maximum ${schema.files.maxCount} files allowed. You selected ${fileCount} files.`)
  }

  // Check total file size
  if (totalSizeMB > schema.files.maxTotalSizeMB) {
    errors.push(
      `Total file size cannot exceed ${schema.files.maxTotalSizeMB}MB. Current size: ${totalSizeMB.toFixed(2)}MB`,
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileCount,
    totalSizeMB,
  }
}

/**
 * Validates a specific step in course creation
 * @param stepName Name of the step to validate
 * @param data Data to validate
 * @param schema Validation schema (optional, uses default if not provided)
 * @returns ValidationResult
 */
export function validateCourseStep(
  stepName: string,
  data: Media[],
  schema: CourseValidationSchema = COURSE_VALIDATION_SCHEMA,
): ValidationResult {
  switch (stepName) {
    case 'files':
      return validateCourseFiles(data, schema)
    default:
      return { isValid: true, errors: [] }
  }
}

/**
 * Gets validation error messages for display
 * @param validationResult Result from validation functions
 * @returns Array of error messages
 */
export function getValidationErrors(validationResult: ValidationResult): string[] {
  return validationResult.errors
}

/**
 * Checks if course creation can proceed based on validation
 * @param stepName Current step name
 * @param data Step data
 * @param schema Validation schema (optional, uses default if not provided)
 * @returns boolean indicating if user can proceed
 */
export function canProceedToNextStep(
  stepName: string,
  data: Media[],
  schema: CourseValidationSchema = COURSE_VALIDATION_SCHEMA,
): boolean {
  const validation = validateCourseStep(stepName, data, schema)
  return validation.isValid
}
