/**
 * Report Builder Type Definitions
 */

/**
 * Academy filters for report generation
 */
export interface AcademyFilters {
  courseIds: string[]
  quizIds: string[]
  lessonIds: string[]
  badgeIds: string[]
  skillIds: string[]
  fileIds: string[]
}

/**
 * Users filters for report generation
 */
export interface UsersFilters {
  groupIds: string[]
  clusterIds: string[]
  roleIds: string[]
}

/**
 * Report type options
 */
export type ReportType = 'course' | 'quiz' | 'lessons' | 'badgesAndSkills' | 'files'

/**
 * Filter category options
 */
export type FilterCategory = 'academy' | 'users'

/**
 * File format options for report generation
 */
export type FileFormat = 'pdf' | 'csv' | 'xlsx'

/**
 * Form data for generating a report
 */
export interface GenerateReportFormData {
  reportType: ReportType
  filterCategory?: FilterCategory
  academyFilters?: AcademyFilters
  usersFilters?: UsersFilters
  reportName: string
  fileCreationEnabled: boolean
  fileFormat: FileFormat
}
