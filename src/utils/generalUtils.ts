/* eslint-disable @typescript-eslint/no-explicit-any */
import { operation } from 'retry'
import { isAxiosError } from 'axios'
import moment from 'moment'
import type { Media } from '@/types/Media'
import { t } from '@/utils/i18n'

export function cloneDeep<T>(object: T): T {
  if (object == null) {
    return object
  }

  return JSON.parse(JSON.stringify(object)) as T
}

export function utcToFormattedDate(date: string, format: string) {
  return moment.utc(date, moment.ISO_8601).local().format(format)
}

export function generateCasualString(): string {
  return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, function () {
    const r = (Math.random() * 16) | 0
    const v = r
    return v.toString(36)
  })
}

export function getDayOfWeekPosition(isoDate: string): {
  dayOfWeek: string
  weekPosition: number
} {
  const date = moment(isoDate)
  const dayOfWeek: string = date.format('dddd') // Nome completo del giorno della settimana (es. "Monday", "Tuesday", ...)
  const weekPosition: number = Math.ceil(date.date() / 7) // Calcola la posizione del giorno della settimana nel mese

  return {
    dayOfWeek: dayOfWeek,
    weekPosition: weekPosition,
  }
}

export function getDayInMonth(isoDate: string): number {
  const date = moment(isoDate)
  return date.date()
}

export const truncateString = (string: string, length: number = 25): string => {
  if (!string) return string

  if (string.length <= length) {
    return string
  } else {
    return string.slice(0, length) + '...'
  }
}

export const fileSizeConvert = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2))
  return `${size} ${sizes[i]}`
}

//TODO: It does not work correctly with all formats, some it simply opens in the browser
export const downloadFile = (url: string, fileName: string): void => {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const hasObjectContent = (object: Record<string, any>): boolean => {
  return Object.keys(object).some((key) => {
    const value = object[key]
    if (Array.isArray(value)) {
      return value.length > 0
    } else if (typeof value === 'object' && value !== null) {
      return hasObjectContent(value)
    } else if (typeof value === 'string') {
      return value.trim() !== ''
    } else if (typeof value === 'boolean') {
      return value
    } else if (typeof value === 'number') {
      return !isNaN(value) && value !== 0
    }
    return false
  })
}

export function formattedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0')
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function debounce(func: (...args: any[]) => void, wait = 500, immediate = false) {
  let timeout: ReturnType<typeof setTimeout> | null

  const fn = function (this: any, ...args: any[]) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(this, args)
  }

  return Object.assign(fn, {
    stop() {
      if (timeout) clearTimeout(timeout)
    },
  })
}

export function fixGridLayout(gridDiv: HTMLElement | null) {
  const innerWidth = window.innerWidth
  if (gridDiv && innerWidth <= 768) {
    gridDiv.classList.remove('grid')
    setTimeout(() => {
      gridDiv.classList.add('grid')
    }, 1000)
  }
}

export function isEmptyObject(obj: object): obj is Record<string, never> {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

export async function retryPromise<T>(
  promise: () => Promise<T>,
  errorRetryCondition?: (error: Error) => boolean,
  retries = 3,
  factor = 2,
  minTimeout = 1000,
  maxTimeout = 5000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const op = operation({
      retries,
      factor,
      minTimeout,
      maxTimeout,
    })

    op.attempt(async () => {
      try {
        const result = await promise()
        resolve(result)
      } catch (error) {
        if (
          error instanceof Error &&
          (errorRetryCondition === undefined || errorRetryCondition(error)) &&
          op.retry(error)
        ) {
          return
        }

        reject(error)
      }
    })
  })
}

export async function retryInternalServerError<T>(
  promise: () => Promise<T>,
  retries = 2,
  minTimeout = 500,
  maxTimeout = 2500,
): Promise<T> {
  return retryPromise(
    promise,
    (error) => isAxiosError(error) && error.response != null && error.response.status >= 500,
    retries,
    undefined,
    minTimeout,
    maxTimeout,
  )
}

export function formatFileSize(files: Array<{ size?: number }>): string {
  const bytes = calculateTotalSize(files)
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  // Round to 1 decimal place for MB and GB, 0 for KB and Bytes
  const roundedSize = unitIndex >= 2 ? size.toFixed(1) : Math.round(size)
  return `${roundedSize} ${units[unitIndex]}`
}

/**
 * Calculates the total size of an array of files
 * @param files - Array of files or media objects
 * @returns Total size in bytes
 */
export function calculateTotalSize(files: Array<{ size?: number }>): number {
  return files.reduce((total, file) => total + (file.size || 0), 0)
}

export const getFileUrl = (file: any): string => {
  return file.url || URL.createObjectURL(file)
}

export const getMarkerImageFileUrl = (file: any): string => {
  if (file.url) return file.url

  if (!file._blobUrl) {
    file._blobUrl = URL.createObjectURL(file)
  }

  return file._blobUrl
}

export const getFileType = (file: File | Media): string => {
  return file.type || (file as Media).mimeType || ''
}

export const generateThumbnail = (file: File | Media) => {
  return new Promise<string>((resolve) => {
    const video = document.createElement('video')
    video.src = getFileUrl(file)
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.currentTime = 1

    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      } else {
        resolve('')
      }
    })
  })
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 60) {
    return `${totalMinutes} ${totalMinutes === 1 ? t('pages.common.minute') : t('pages.common.minutes')}`
  }
  const hrs = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) {
    return `${hrs} ${hrs > 1 ? t('pages.common.hours') : t('pages.common.hour')}`
  }
  return `${hrs} ${hrs > 1 ? t('pages.common.hours') : t('pages.common.hour')} ${mins} ${t('pages.common.minutes')}`
}
export const getCurrentDayChar = () => {
  const day = new Date().getDay()
  // 0: Sunday, 1: Monday, ...
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
}

export default { cloneDeep }
