import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useLoaderStore } from '@/stores/useLoaderStore'
import { extractErrorMessage } from '@/utils/errorHandler'
import { t } from '@/utils/i18n'

// Interface for detailed error with response data
interface DetailedError extends Error {
  responseData?: unknown
  status?: number
  statusText?: string
}

// Extend the AxiosRequestConfig type
declare module 'axios' {
  export interface AxiosRequestConfig {
    showLoader?: boolean
    loadingMessage?: string
  }
}
export const academyPrefix = 'academy'
// export const corePrefix = 'core'
const coreBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const timerBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const corePrefix = `${coreBaseUrl}core`
export const timerPrefix = `${timerBaseUrl}common/chronometers`
const AUTH_TOKEN = 'auth_token'
const REFRESH_TOKEN = 'refresh_token'
// Create base axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000',
  timeout: 120000, // 2 minutes - extended for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    if (!config.headers.Authorization) {
      const token = localStorage.getItem(AUTH_TOKEN)
      if (!token) {
        console.error(t('types.common.noTokenFound'))
        return Promise.reject(new Error(t('types.common.noTokenFound')))
      }
      config.headers.Authorization = `Bearer ${token}`
    }

    // Show loader if explicitly requested (defaults to true for non-GET requests unless showLoader is false)
    const loaderStore = useLoaderStore()
    // Show loader if:
    // 1. showLoader is explicitly true, OR
    // 2. showLoader is undefined/not set AND it's a non-GET request
    // Don't show if showLoader is explicitly false
    const shouldShowLoader =
      config.showLoader === true || (config.showLoader !== false && config.method !== 'get')
    if (shouldShowLoader) {
      loaderStore.showLoader(config.loadingMessage)
    }

    return config
  },
  (error: AxiosError) => {
    const loaderStore = useLoaderStore()
    loaderStore.hideLoader()
    return Promise.reject(error)
  },
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const loaderStore = useLoaderStore()
    loaderStore.hideLoader()
    return response
  },
  async (error: AxiosError) => {
    const loaderStore = useLoaderStore()
    loaderStore.hideLoader()
    const originalRequest = error.config

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest) {
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000'}/auth/refresh`,
            {
              refreshToken,
            },
          )
          const { token, refreshToken: newRefreshToken } = response.data

          // Update tokens in localStorage
          localStorage.setItem(AUTH_TOKEN, token)
          if (newRefreshToken) {
            localStorage.setItem(REFRESH_TOKEN, newRefreshToken)
          }

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return axiosInstance(originalRequest)
        } else {
          // No refresh token available, redirect to login
          localStorage.removeItem(AUTH_TOKEN)
          localStorage.removeItem(REFRESH_TOKEN)
          window.location.href = '/login'
        }
      } catch (refreshError) {
        // Handle refresh token failure
        localStorage.removeItem(AUTH_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)
        // Redirect to login page or handle as needed
        window.location.href = '/login'
        console.error('Token refresh failed:', refreshError)
      }
    }

    // Handle chunked encoding and network errors - if server returned 200, treat as success
    const errorMessage = error.message || String(error)
    const errorCode = (error as { code?: string })?.code
    const isChunkedEncodingError =
      errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
      errorMessage.includes('chunked') ||
      errorCode === 'ERR_INCOMPLETE_CHUNKED_ENCODING'

    const isNetworkError =
      errorMessage.includes('Network Error') ||
      errorCode === 'ERR_NETWORK' ||
      errorCode === 'ECONNABORTED'

    // If it's a chunked encoding or network error but server returned 200, return the response as success
    // This handles cases where the upload succeeded but response parsing failed
    if ((isChunkedEncodingError || isNetworkError) && error.response?.status === 200) {
      return error.response
    }

    // Also check if error has no response but request was made (might be network error after 200)
    // This is a fallback for cases where response parsing completely failed
    if ((isChunkedEncodingError || isNetworkError) && !error.response && error.request) {
      // Check if request headers indicate it was a streaming request
      const requestUrl = (error.config as InternalAxiosRequestConfig)?.url || ''
      if (requestUrl.includes('/stream')) {
        // For streaming requests with network errors, if we can't determine status,
        // let the service layer handle it based on upload progress
      }
    }

    // Handle other errors
    if (error.response) {
      // Extract the actual error message from response data
      const extractedErrorMessage = extractErrorMessage(error)

      // Handle specific error cases
      switch (error.response.status) {
        case 403:
          console.error('Forbidden: You do not have permission to access this resource')
          break
        case 404:
          console.error('Not Found: The requested resource does not exist')
          break
        case 500:
          console.error('Server Error: Something went wrong on the server')
          break
        default:
          console.error('An error occurred:', extractedErrorMessage)
      }

      // Create a more detailed error object that includes response data
      const detailedError: DetailedError = new Error(extractedErrorMessage)
      detailedError.responseData = error.response.data
      detailedError.status = error.response.status
      detailedError.statusText = error.response.statusText
      detailedError.message = extractedErrorMessage
      return Promise.reject(detailedError)
    }

    // Reject with the extracted error message for non-response errors
    return Promise.reject(new Error(extractErrorMessage(error)))
  },
)

export default axiosInstance
