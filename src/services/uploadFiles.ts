import axiosInstance, { academyPrefix } from '@/services/api/axiosInstance'
import type { GetFilesParams, UpdateFileParams } from '@/types/uploadFiles'
import type { AxiosResponse } from 'axios'
import { t } from '@/utils/i18n'

import axios from 'axios'

class UploadFilesService {
  async uploadFiles(formData: FormData) {
    const response = await axiosInstance.post(`${academyPrefix}/catalog/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      loadingMessage: t('types.loading.uploadingFiles'),
      showLoader: true,
    })
    return response
  }

  async getPresignedUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    payload: { visibility: string; status: string },
  ) {
    const response = await axiosInstance.post(
      `${academyPrefix}/catalog/files/generate-presigned-url`,
      payload,
      {
        params: { fileName, fileType, fileSize },
        showLoader: false,
      },
    )
    return response.data
  }

  async uploadToS3(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    abortSignal?: AbortSignal,
  ) {
    // Use a direct axios call to avoid interceptors that might add headers or auth tokens
    // which would break the S3 signature
    const response = await axios.put(url, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      signal: abortSignal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      },
    })
    return response
  }

  async getFiles(params: GetFilesParams) {
    const response = await axiosInstance.get(`${academyPrefix}/catalog/files`, {
      loadingMessage: t('types.loading.fetchingFiles'),
      showLoader: true,
      params,
    })
    return response.data
  }
  async deleteFile(ids: string[], deleteType: 'soft' | 'hard') {
    const params = new URLSearchParams()
    ids.forEach((id) => {
      params.append('ids', id)
    })
    params.append('deleteType', deleteType)
    const response = await axiosInstance.delete(`${academyPrefix}/catalog/files`, {
      loadingMessage: t('types.loading.deletingFile'),
      showLoader: true,
      params,
    })
    return response
  }
  async updateFileDetails(data: UpdateFileParams) {
    const { id, ...rest } = data
    const response = await axiosInstance.patch(`${academyPrefix}/catalog/files/${id}`, rest, {
      loadingMessage: t('types.loading.updatingFile'),
      showLoader: true,
    })
    return response
  }

  async uploadFileStream(
    file: File,
    visibility: string,
    status: string = 'published',
    onProgress?: (progress: number) => void,
    onProgressUpdate?: (data: string) => void,
    abortSignal?: AbortSignal,
  ) {
    // Read file as binary data (ArrayBuffer) - this matches the binary body type in Postman
    const fileData = await file.arrayBuffer()

    // Prepare headers as per API specification from Postman
    const headers: Record<string, string> = {
      'X-Filename': file.name,
      'X-Request': JSON.stringify({ visibility, status }),
      'X-Content-Type': file.type || 'application/octet-stream',
      'Content-Type': 'application/octet-stream', // Use binary content type for file upload
    }

    try {
      const response = await axiosInstance.post(`${academyPrefix}/catalog/files/stream`, fileData, {
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        signal: abortSignal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percentCompleted)
          }
        },
        validateStatus: (status) => {
          return status >= 200 && status < 300
        },
        // Don't transform response for streaming
        transformResponse: [(data) => data],
        showLoader: false, // Hide global loader - upload popup handles progress
      })

      // Handle streaming response updates if provided
      // The response might contain progress information
      if (onProgressUpdate && response.data) {
        // Convert response data to string if needed
        const responseText =
          typeof response.data === 'string'
            ? response.data
            : typeof response.data === 'object'
              ? JSON.stringify(response.data)
              : String(response.data)
        onProgressUpdate(responseText)
      }

      return response
    } catch (error: unknown) {
      // Check if this is a chunked encoding or network error but upload might have succeeded
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = (error as { code?: string })?.code
      const errorString = String(error)

      const isChunkedEncodingError =
        errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
        errorMessage.includes('chunked') ||
        errorMessage.includes('CHUNKED_ENCODING') ||
        errorCode === 'ERR_INCOMPLETE_CHUNKED_ENCODING' ||
        errorString.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
        errorString.includes('chunked')

      const isNetworkError =
        errorMessage.includes('Network Error') ||
        errorMessage === 'Network Error' ||
        errorCode === 'ERR_NETWORK' ||
        errorCode === 'ECONNABORTED' ||
        errorString.includes('Network Error')

      // If it's a chunked encoding or network error, check if we can determine success
      if (isChunkedEncodingError || isNetworkError) {
        const axiosError = error as {
          response?: AxiosResponse
          code?: string
          message?: string
          request?: { status?: number }
        }

        // If server returned 200, treat as success despite parsing error
        if (axiosError?.response?.status === 200) {
          return axiosError.response
        }

        // For network errors without response, if upload progress reached 100%,
        // assume success (this is handled in the store, but we can also create a mock response here)
        // The store will handle this case based on progress
      }

      // Re-throw other errors
      throw error
    }
  }
}

export const uploadFilesService = new UploadFilesService()
