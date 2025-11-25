import type { AxiosError } from 'axios'
import { t } from '@/utils/i18n'

interface ApiErrorResponse {
  message?: string
  error?: string
  detail?: string
  [key: string]: unknown
}

export interface DetailedError extends Error {
  responseData?: unknown
  status?: number
  statusText?: string
}
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Check if it's an Axios error with response data
    if ('response' in error && error.response) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      const responseData = axiosError.response?.data

      if (responseData) {
        // Try to extract message from different possible fields
        if (typeof responseData === 'string') {
          return responseData
        }

        if (typeof responseData === 'object' && responseData !== null) {
          // Check for common error message fields
          if (responseData.message) {
            return String(responseData.message)
          }
          if (responseData.error) {
            return String(responseData.error)
          }
          if (responseData.detail) {
            return String(responseData.detail)
          }

          // If no specific message field, try to stringify the response
          try {
            return JSON.stringify(responseData)
          } catch {
            return t('types.common.anErrorOccurred')
          }
        }
      }
    }

    // Fallback to error message
    return error.message
  }

  // Fallback for non-Error objects
  return String(error)
}
