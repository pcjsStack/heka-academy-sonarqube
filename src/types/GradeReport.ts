export interface GradeData {
  username: string
  emailAddress: string
  courseTotal: number | null
}

export interface PaginationData {
  currentPage: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface GradeReportData {
  grades: GradeData[]
  overallAverage: number
  pagination: PaginationData
}
