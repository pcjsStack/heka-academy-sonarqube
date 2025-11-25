import type { Media } from '@/types/Media'
import { getFileType } from './generalUtils'
import { CourseContentType } from '@/types/Course'
import otherFile from '@/assets/images/files.svg'
import pdfFile from '@/assets/images/pdf.svg'
import imageFile from '@/assets/images/image.svg'
import videoFile from '@/assets/images/play.svg'

export const renderStatus = (key: string) => {
  switch (key.toLowerCase()) {
    case 'scheduled':
      return 'primary'
    case 'approved':
      return 'success'
    case 'done':
      return 'success'
    case 'pending':
      return 'warning'
    case 'in_progress':
      return 'warning'
    case 'rejected':
      return 'error'
    case 'cancelled':
      return 'error'
    case 'completed':
      return 'success'
    case 'assigned':
      return 'warning'
    default:
      return ''
  }
}

export const FirstLetterCapitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
export const getFileIcon = (file: Media): string => {
  const type = getFileType(file)
  if (type.startsWith('image/')) {
    return imageFile
  } else if (type === 'application/pdf') {
    return pdfFile
  } else if (type.startsWith('video/')) {
    return videoFile
  } else {
    return otherFile
  }
}

/**
 * Maps a Media file to its corresponding CourseContentType based on MIME type
 * @param file - The Media file object
 * @returns The appropriate CourseContentType
 */
export const getContentTypeFromFile = (file: Media): CourseContentType => {
  const mimeType = getFileType(file)
  const fileName = file.fileName?.toLowerCase() || ''

  // Check MIME type first
  if (mimeType.startsWith('image/')) {
    return CourseContentType.IMAGE
  } else if (mimeType === 'application/pdf') {
    return CourseContentType.PDF
  } else if (mimeType.startsWith('video/')) {
    return CourseContentType.VIDEO
  } else if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-zip-compressed' ||
    fileName.endsWith('.zip')
  ) {
    return CourseContentType.ZIP
  }

  // Fallback to checking file extension if MIME type is not conclusive
  if (fileName.endsWith('.pdf')) {
    return CourseContentType.PDF
  } else if (fileName.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i)) {
    return CourseContentType.IMAGE
  } else if (fileName.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
    return CourseContentType.VIDEO
  } else if (fileName.endsWith('.zip')) {
    return CourseContentType.ZIP
  }

  // Default to DOCUMENT
  return CourseContentType.DOCUMENT
}
