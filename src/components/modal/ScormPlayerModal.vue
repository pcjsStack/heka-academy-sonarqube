<template>
  <div class="w-full h-[70vh] overflow-auto">
    <!-- Loading/Error Messages -->
    <div
      v-if="isLoading || isExtracting"
      class="absolute inset-0 flex items-center justify-center z-10"
    >
      <div class="text-center p-10 bg-white rounded-lg shadow-lg max-w-md">
        <div
          class="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-5"
        ></div>
        <p v-if="isExtracting" class="text-gray-700">
          {{ t('pages.uploadFiles.scormViewer.extracting') }}
        </p>
        <p v-else class="text-gray-700">{{ t('pages.uploadFiles.scormViewer.loading') }}</p>
      </div>
    </div>

    <div
      v-if="scormError"
      class="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10"
    >
      <div class="text-center p-10 bg-white rounded-lg shadow-lg max-w-md">
        <h3 class="text-red-600 text-lg font-semibold mb-4">
          {{ t('pages.uploadFiles.scormViewer.errorTitle') }}
        </h3>
        <p class="mb-3 text-gray-800">{{ scormError }}</p>
        <p class="text-xs text-gray-600 mt-2 break-all font-mono">{{ normalizedScormUrl }}</p>
        <button
          @click="retryLoad"
          class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded cursor-pointer text-sm transition-colors"
        >
          {{ t('pages.uploadFiles.scormViewer.retry') }}
        </button>
      </div>
    </div>

    <!-- SCORM Content Frame -->
    <iframe
      v-if="!scormError && normalizedScormUrl"
      ref="scormFrame"
      :src="normalizedScormUrl"
      class="w-full h-full border-none block"
      @load="onIframeLoad"
      @error="onIframeError"
      allowfullscreen
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import JSZip from 'jszip'
import { t } from '@/utils/i18n'

interface ScormEvent {
  timestamp: string
  type: string
  details: string
  isSubmission: boolean
  fullData: string
}

interface ScormStateData {
  initialized: boolean
  data: Record<string, string>
}

interface ScormAPI {
  LMSInitialize: () => string
  LMSFinish: () => string
  LMSGetValue: (key: string) => string
  LMSSetValue: (key: string, value: string) => string
  LMSCommit: () => string
  LMSGetLastError: () => string
  LMSGetErrorString: (errorCode?: string) => string
  LMSGetDiagnostic: (errorCode?: string) => string
  LMSGetVersion: () => string
}

const props = defineProps<{
  scormUrl: string
}>()

const scormFrame = ref<HTMLIFrameElement | null>(null)

// const showEventPanel = ref(false)
const scormError = ref<string | null>(null)
const isLoading = ref(true)
const extractionProgress = ref(0)
const isExtracting = ref(false)
const percentage = defineModel<number>('percentage', { required: true })
// ZIP extraction state
const extractedFiles = ref(new Map<string, string>())
const zipEntryUrl = ref<string | null>(null)

// Check if URL is a ZIP file
function isZipUrl(url: string): boolean {
  if (!url) return false
  const zipPattern = /\.zip(\?|$|#)/i
  return zipPattern.test(url) || url.toLowerCase().includes('.zip')
}

// Computed SCORM URL - normalize S3 URLs or use extracted ZIP
const normalizedScormUrl = computed<string | null>(() => {
  // If we have extracted ZIP content, use the blob URL
  if (zipEntryUrl.value) {
    return zipEntryUrl.value
  }

  let url = props.scormUrl

  // If it's a ZIP URL, return null (will be handled by extraction)
  if (isZipUrl(url)) {
    return null
  }

  // If it's an S3 URL, ensure it points to indexAPI.html
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If URL doesn't end with indexAPI.html, append it
    if (!url.endsWith('indexAPI.html') && !url.includes('indexAPI.html')) {
      // Remove trailing slash if present
      url = url.replace(/\/$/, '')
      // Check if it ends with scormdriver folder
      if (!url.endsWith('scormdriver')) {
        url = url + '/scormdriver'
      }
      url = url + '/indexAPI.html'
    }
  }

  return url
})

// Event tracking
const trackedEvents = ref<ScormEvent[]>([])
const currentStatus = ref<string>('')

// Video completion tracking
const videoDuration = ref(0)
const videoCompleted = ref(false)
const videoProgress = ref(0)
let videoCheckInterval: NodeJS.Timeout | null = null
const videoElements = new Set<HTMLVideoElement>()
let activeVideoElement: HTMLVideoElement | null = null
const videoCompletionTracker = new Map<
  string,
  { completed: boolean; duration: number; lastTime: number }
>()
let findAllVideoElementsFn: (() => HTMLVideoElement[]) | null = null
let findActiveVideoFn: (() => HTMLVideoElement | null) | null = null
let lastPlayedVideo: HTMLVideoElement | null = null
let lastPlayedVideoDuration = 0

// Computed properties for events
const submissionEvents = computed(() => {
  return trackedEvents.value.filter((e) => e.isSubmission)
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const recentEvents = computed(() => {
  return trackedEvents.value.slice(0, 20)
})

// SCORM 1.2 State
const scormState: ScormStateData = {
  initialized: false,
  data: JSON.parse(localStorage.getItem('scorm12') || '{}') as Record<string, string>,
}

// Track an event
function trackEvent(type: string, details: string, isSubmission = false): void {
  const event = {
    timestamp: new Date().toLocaleTimeString(),
    type,
    details,
    isSubmission,
    fullData: details,
  }

  trackedEvents.value.unshift(event)

  // Keep only last 100 events
  if (trackedEvents.value.length > 100) {
    trackedEvents.value = trackedEvents.value.slice(0, 100)
  }
}

// Check if a key/value pair indicates a submission
function isSubmissionEvent(key: string, value: string): boolean {
  // Keys that definitely indicate submissions
  const submissionKeys = [
    'cmi.interactions',
    'cmi.core.lesson_status',
    'cmi.core.score',
    'cmi.score',
    'cmi.evaluation.comments',
    'cmi.suspend_data',
  ]

  // Check if key contains submission-related keywords
  const isSubmissionKey = submissionKeys.some((sk) => key.includes(sk))

  // Status values that indicate completion/submission
  const submissionStatuses = ['passed', 'completed', 'failed', 'submitted']
  const isSubmissionStatus = submissionStatuses.includes(String(value).toLowerCase())

  // Check if value indicates completion/submission
  const isSubmissionValue =
    isSubmissionStatus ||
    (typeof value === 'string' && value.length > 100) || // Long strings might be submissions
    key.includes('interactions') // Interactions are always submissions

  // Score-related keys are always submissions
  if (key.includes('score')) {
    return true
  }

  return (isSubmissionKey && isSubmissionValue) || (isSubmissionKey && key.includes('interactions'))
}

// Enhanced SCORM 1.2 API Implementation
const API: ScormAPI = {
  LMSInitialize(): string {
    trackEvent('Initialize', 'SCORM session initialized')
    percentage.value = 5
    console.log('initialized')
    scormState.initialized = true
    return 'true'
  },

  LMSFinish(): string {
    percentage.value = 100
    trackEvent('Finish', 'SCORM session finished')
    console.log('finished')
    scormState.initialized = false
    localStorage.setItem('scorm12', JSON.stringify(scormState.data))
    return 'true'
  },

  LMSGetValue(key: string): string {
    const value = scormState.data[key] ?? ''
    trackEvent('GetValue', `${key} = ${value}`)
    console.log('getValue', key, value)
    return value
  },

  LMSSetValue(key: string, value: string): string {
    const isSubmission = isSubmissionEvent(key, value)

    if (isSubmission) {
      trackEvent('SetValue (SUBMISSION)', `${key} = ${value}`, true)
    } else {
      trackEvent('SetValue', `${key} = ${value}`)
    }

    if (key === 'cmi.core.lesson_status' || key === 'cmi.completion_status') {
      currentStatus.value = value
    }

    scormState.data[key] = String(value)
    return 'true'
  },

  LMSCommit(): string {
    trackEvent('Commit', 'Data committed to LMS', false)
    localStorage.setItem('scorm12', JSON.stringify(scormState.data))
    return 'true'
  },

  LMSGetLastError(): string {
    return '0'
  },

  LMSGetErrorString(): string {
    return ''
  },

  LMSGetDiagnostic(): string {
    return ''
  },

  LMSGetVersion(): string {
    trackEvent('GetVersion', 'SCORM version requested')
    return '1.2'
  },
}

// Install SCORM API on window (for cross-frame communication)
function installSCORMAPI(): void {
  const w = window as Window & {
    API?: ScormAPI
    API_1484_11?: ScormAPI
    findSCORMAPI?: (win: Window | null) => ScormAPI | null
  }

  w.API = API
  w.API_1484_11 = API

  if (scormFrame.value?.contentWindow) {
    try {
      const iframeWin = scormFrame.value.contentWindow as Window & {
        API?: ScormAPI
        API_1484_11?: ScormAPI
      }
      iframeWin.API = API
      iframeWin.API_1484_11 = API

      let frame: Window | null = scormFrame.value.contentWindow
      while (frame && frame !== window) {
        try {
          const frameWin = frame as Window & { API?: ScormAPI; API_1484_11?: ScormAPI }
          frameWin.API = API
          frameWin.API_1484_11 = API
          frame = frame.parent
        } catch {
          break
        }
      }
    } catch {
      console.log(
        'Note: Cross-origin restrictions may apply. API will be found via parent frame search.',
      )
    }
  }

  function findAPI(win: Window | null): ScormAPI | null {
    if (!win) return null
    const w = win as Window & { API?: ScormAPI; LMSInitialize?: () => string }
    if (w.API && w.LMSInitialize) return w.API
    if (win.parent && win.parent !== win) return findAPI(win.parent)
    if (win.top && win.top !== win) return findAPI(win.top)
    return null
  }

  w.findSCORMAPI = findAPI

  trackEvent('System', 'SCORM API installed on window')
}

function onIframeLoad(): void {
  isLoading.value = false
  scormError.value = null
  installSCORMAPI()
  trackEvent('Iframe Loaded', `SCORM content frame loaded from: ${normalizedScormUrl.value}`)

  // Try to set up message passing for cross-frame communication
  if (scormFrame.value?.contentWindow) {
    window.addEventListener('message', handleSCORMMessage)
  }

  // Check if iframe loaded successfully (might be blocked by CORS)
  setTimeout(() => {
    try {
      if (scormFrame.value?.contentWindow) {
        // Try to access iframe content (will fail if CORS blocked)
        void scormFrame.value.contentWindow.location
        trackEvent('System', 'Iframe access verified - CORS allows communication')

        // Start monitoring video for completion
        startVideoMonitoring()
      }
    } catch (e) {
      const error = e as Error
      trackEvent(
        'Warning',
        `CORS restriction detected: ${error.message}. SCORM API may not work properly.`,
      )
      console.warn('CORS restriction:', error.message)
      console.warn('Make sure your S3 bucket has proper CORS configuration:')
      console.warn(`
CORS Configuration for S3:
{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedOrigins": ["*"], // or your specific domain
  "ExposeHeaders": [],
  "MaxAgeSeconds": 3000
}
      `)

      // Even with CORS restrictions, try to monitor via postMessage
      startVideoMonitoring()
    }
  }, 1000)
}

function onIframeError(): void {
  isLoading.value = false
  scormError.value = t('pages.uploadFiles.scormViewer.error')
  trackEvent('Error', `Failed to load SCORM content from: ${normalizedScormUrl.value}`)
}

function retryLoad(): void {
  scormError.value = null
  isLoading.value = true
  if (isZipUrl(props.scormUrl)) {
    extractZipFromUrl(props.scormUrl)
  } else if (scormFrame.value && normalizedScormUrl.value) {
    scormFrame.value.src = normalizedScormUrl.value
  }
}

// Download and extract ZIP file
async function extractZipFromUrl(zipUrl: string): Promise<void> {
  try {
    isExtracting.value = true
    extractionProgress.value = 0
    scormError.value = null
    trackEvent('System', `Starting ZIP extraction from: ${zipUrl}`)

    // Download ZIP file
    extractionProgress.value = 10
    const response = await fetch(zipUrl)

    if (!response.ok) {
      throw new Error(
        `${t('pages.uploadFiles.scormViewer.downloadFailed')}: ${response.status} ${response.statusText}`,
      )
    }

    extractionProgress.value = 30
    const arrayBuffer = await response.arrayBuffer()
    trackEvent('System', `ZIP downloaded (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`)

    // Extract ZIP
    extractionProgress.value = 40
    const zip = new JSZip()
    const zipData = await zip.loadAsync(arrayBuffer)

    extractionProgress.value = 50
    const files = Object.keys(zipData.files)
    trackEvent('System', `ZIP extracted, found ${files.length} files`)

    // Log all HTML files for debugging
    const htmlFiles = files.filter((f) => f.endsWith('.html') && !f.includes('__MACOSX'))
    console.log('Found HTML files:', htmlFiles)

    // Dynamic entry point detection - try multiple strategies
    let entryFile = null

    // Strategy 1: Parse imsmanifest.xml to find the entry point (most reliable)
    try {
      const manifestFile = files.find((f) => {
        const normalized = f.replace(/\\/g, '/').toLowerCase()
        return normalized.includes('imsmanifest.xml')
      })

      if (manifestFile && zipData.files[manifestFile]) {
        const manifestBlob = await zipData.files[manifestFile].async('text')
        const parser = new DOMParser()
        const manifestDoc = parser.parseFromString(manifestBlob, 'text/xml')

        // Check for parsing errors
        const parseError = manifestDoc.querySelector('parsererror')
        if (parseError) {
          console.warn('XML parsing error in manifest:', parseError.textContent)
        } else {
          // Look for resource href in manifest (handle different namespaces)
          // Try without namespace first, then with namespace
          let resources = manifestDoc.querySelectorAll('resource')
          if (resources.length === 0) {
            // Try with namespace
            resources = manifestDoc.querySelectorAll('*[local-name()="resource"]')
          }

          for (const resource of resources) {
            const href = resource.getAttribute('href') || resource.getAttributeNS(null, 'href')

            if (href) {
              // Normalize the href path
              const manifestEntry = href.replace(/\\/g, '/').replace(/^\/+/, '')

              // Try to find the file (exact match first, then partial)
              entryFile = files.find((f) => {
                const normalized = f.replace(/\\/g, '/').replace(/^\/+/, '')
                return (
                  normalized === manifestEntry ||
                  normalized.endsWith('/' + manifestEntry) ||
                  normalized.endsWith(manifestEntry) ||
                  normalized.includes('/' + manifestEntry)
                )
              })

              if (entryFile) {
                trackEvent(
                  'System',
                  `Found entry point from manifest: ${entryFile} (href: ${href})`,
                )
                break
              } else {
                // Try with different path combinations
                const pathVariations = [
                  manifestEntry,
                  '/' + manifestEntry,
                  manifestEntry.replace(/^\.\//, ''),
                  manifestEntry.split('/').pop() || '', // Just filename
                ]

                for (const variation of pathVariations) {
                  entryFile = files.find((f) => {
                    const normalized = f.replace(/\\/g, '/').replace(/^\/+/, '')
                    return (
                      normalized === variation ||
                      normalized.endsWith('/' + variation) ||
                      normalized.endsWith(variation)
                    )
                  })

                  if (entryFile) {
                    trackEvent(
                      'System',
                      `Found entry point from manifest (variation): ${entryFile}`,
                    )
                    break
                  }
                }

                if (entryFile) break
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse manifest:', error)
    }

    // Strategy 2: Look for common entry point filenames (in order of priority)
    if (!entryFile) {
      const entryPointPatterns = [
        /indexapi\.html$/i, // indexAPI.html
        /index\.html$/i, // index.html
        /launch\.html$/i, // launch.html
        /start\.html$/i, // start.html
        /course\.html$/i, // course.html
        /main\.html$/i, // main.html
      ]

      for (const pattern of entryPointPatterns) {
        entryFile = files.find((f) => {
          const normalized = f.replace(/\\/g, '/').toLowerCase()
          return (
            pattern.test(normalized) &&
            !normalized.includes('blank') &&
            !normalized.includes('goodbye') &&
            !normalized.includes('error') &&
            !normalized.includes('unsupported')
          )
        })

        if (entryFile) {
          trackEvent('System', `Found entry point by pattern: ${entryFile}`)
          break
        }
      }
    }

    // Strategy 3: Find HTML files at root level (excluding utility files)
    if (!entryFile) {
      const utilityFiles = ['blank', 'goodbye', 'error', 'unsupported', 'sandbox']
      entryFile = files.find((f) => {
        const normalized = f.replace(/\\/g, '/').toLowerCase()
        const parts = normalized.split('/')
        const filename = parts[parts.length - 1] || ''

        // Root level or single directory level HTML file
        return (
          normalized.endsWith('.html') &&
          parts.length <= 2 && // root or one level deep
          !utilityFiles.some((util) => filename.includes(util))
        )
      })

      if (entryFile) {
        trackEvent('System', `Found entry point at root level: ${entryFile}`)
      }
    }

    // Strategy 4: Find any HTML file (excluding known utility files)
    if (!entryFile) {
      const utilityFiles = ['blank', 'goodbye', 'error', 'unsupported', 'sandbox', 'aicccomm']
      entryFile = files.find((f) => {
        const normalized = f.replace(/\\/g, '/').toLowerCase()
        const filename = normalized.split('/').pop() || ''
        return normalized.endsWith('.html') && !utilityFiles.some((util) => filename.includes(util))
      })

      if (entryFile) {
        trackEvent('System', `Found entry point (fallback): ${entryFile}`)
      }
    }

    // Strategy 5: Last resort - any HTML file
    if (!entryFile) {
      entryFile = files.find((f) => {
        const normalized = f.replace(/\\/g, '/').toLowerCase()
        return normalized.endsWith('.html')
      })

      if (entryFile) {
        trackEvent('System', `Warning: Using last resort HTML file: ${entryFile}`)
      }
    }

    if (!entryFile) {
      throw new Error(t('pages.uploadFiles.scormViewer.noEntryPoint'))
    }

    console.log('Selected entry file:', entryFile)
    trackEvent('System', `Entry point determined: ${entryFile}`)

    // Extract all files and create blob URLs
    extractionProgress.value = 60
    const blobUrls = new Map()
    let processed = 0

    for (const filePath of files) {
      const file = zipData.files[filePath]

      // Skip directories or undefined files
      if (!file || file.dir) continue

      try {
        const content = await file.async('blob')
        const blobUrl = URL.createObjectURL(content)

        // Store with original path
        blobUrls.set(filePath, blobUrl)

        // Also store normalized versions for easier lookup
        const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '')
        if (normalized !== filePath) {
          blobUrls.set(normalized, blobUrl)
        }

        // Also store with leading slash
        if (!normalized.startsWith('/')) {
          blobUrls.set('/' + normalized, blobUrl)
        }

        processed++
        extractionProgress.value = 60 + Math.floor((processed / files.length) * 30)
      } catch (error) {
        console.warn(`Failed to extract file: ${filePath}`, error)
      }
    }

    console.log('Extracted files count:', blobUrls.size)
    console.log('Sample file paths:', Array.from(blobUrls.keys()).slice(0, 10))

    extractedFiles.value = blobUrls
    extractionProgress.value = 90

    // Store files in IndexedDB (with actual blobs, not just URLs)
    await storeExtractedFilesAsBlobs(zipData, files)

    // Try to register service worker, fallback to blob URLs if it fails
    let useServiceWorker = false
    try {
      await registerServiceWorker()
      useServiceWorker = true
    } catch (error) {
      console.warn('Service Worker registration failed, falling back to blob URLs:', error)
      trackEvent(
        'Warning',
        `Service Worker unavailable: ${(error as Error).message}. Using blob URLs fallback.`,
      )
      useServiceWorker = false
    }

    // Use service worker URL if available, otherwise use blob URLs
    const normalizedEntryFile = entryFile.replace(/\\/g, '/').replace(/^\/+/, '')

    if (useServiceWorker) {
      zipEntryUrl.value = `/scorm/${normalizedEntryFile}`
    } else {
      // Fallback: Use blob URL with enhanced path rewriting
      const entryFile_obj = zipData.files[entryFile]
      if (entryFile_obj) {
        const entryBlob = await entryFile_obj.async('blob')
        let entryContent = await entryBlob.text()

        // Rewrite relative paths to use blob URLs
        entryContent = rewriteRelativePaths(entryContent, entryFile, blobUrls)

        // Inject URL resolver script to handle dynamic URL construction
        entryContent = injectUrlResolver(entryContent, entryFile, blobUrls)

        // Create blob URL for the rewritten HTML
        const rewrittenBlob = new Blob([entryContent], { type: 'text/html' })
        zipEntryUrl.value = URL.createObjectURL(rewrittenBlob)

        trackEvent('System', 'Using blob URL fallback (Service Worker unavailable)')
      }
    }

    extractionProgress.value = 100
    isExtracting.value = false
    isLoading.value = false

    trackEvent('System', `ZIP extraction complete. Entry point: ${entryFile}`)
  } catch (error) {
    console.error('ZIP extraction error:', error)
    const err = error as Error
    scormError.value = `Failed to extract SCORM package: ${err.message}`
    isExtracting.value = false
    isLoading.value = false
    trackEvent('Error', `ZIP extraction failed: ${err.message}`)
  }
}

// Rewrite relative paths in HTML to use blob URLs
function rewriteRelativePaths(
  html: string,
  currentPath: string,
  blobUrls: Map<string, string>,
): string {
  // Create a map of file paths to blob URLs for quick lookup
  const pathMap = new Map()
  blobUrls.forEach((blobUrl, filePath) => {
    const normalized = filePath.replace(/\\/g, '/')
    pathMap.set(normalized, blobUrl)

    // Also map without leading slash
    if (normalized.startsWith('/')) {
      pathMap.set(normalized.substring(1), blobUrl)
    }
  })

  // Function to resolve relative path
  function resolvePath(basePath: string, relativePath: string): string {
    const normalizedBase = basePath.replace(/\\/g, '/')
    const baseDir = normalizedBase.substring(0, normalizedBase.lastIndexOf('/') + 1)

    if (relativePath.startsWith('/')) {
      return relativePath.substring(1)
    } else if (relativePath.startsWith('../')) {
      // Handle parent directory navigation
      const parts = baseDir.split('/').filter((p: string) => p)
      const relParts = relativePath.split('/')

      for (const part of relParts) {
        if (part === '..') {
          parts.pop()
        } else if (part !== '.') {
          parts.push(part)
        }
      }
      return parts.join('/')
    } else if (relativePath.startsWith('./')) {
      return baseDir + relativePath.substring(2)
    } else {
      return baseDir + relativePath
    }
  }

  // Replace src, href, and action attributes
  let rewrittenHtml = html

  // Match src="...", href="...", action="..."
  const attributePattern = /(src|href|action)\s*=\s*["']([^"']+)["']/gi
  rewrittenHtml = rewrittenHtml.replace(attributePattern, (match, attr, url) => {
    // Skip if already absolute URL (http, https, data, blob)
    if (/^(https?:|data:|blob:)/i.test(url)) {
      return match
    }

    // Resolve relative path
    const resolvedPath = resolvePath(currentPath, url)
    const blobUrl = pathMap.get(resolvedPath)

    if (blobUrl) {
      return `${attr}="${blobUrl}"`
    }

    // Try without leading slash
    const noSlashPath = resolvedPath.startsWith('/') ? resolvedPath.substring(1) : resolvedPath
    const blobUrl2 = pathMap.get(noSlashPath)

    if (blobUrl2) {
      return `${attr}="${blobUrl2}"`
    }

    // Couldn't resolve, return original
    return match
  })

  // Also handle CSS imports and JavaScript sources
  rewrittenHtml = rewrittenHtml.replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
    if (/^(https?:|data:|blob:)/i.test(url)) {
      return match
    }

    const resolvedPath = resolvePath(currentPath, url)
    const blobUrl = pathMap.get(resolvedPath) || pathMap.get(resolvedPath.substring(1))

    if (blobUrl) {
      return `url("${blobUrl}")`
    }

    return match
  })

  return rewrittenHtml
}

// Inject URL resolver script to handle dynamic URL construction
function injectUrlResolver(
  html: string,
  currentPath: string,
  blobUrls: Map<string, string>,
): string {
  // Create a path-to-blob URL map for JavaScript access
  const pathMap: Record<string, string> = {}
  blobUrls.forEach((blobUrl, filePath) => {
    const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '')
    pathMap[normalized] = blobUrl
    pathMap['/' + normalized] = blobUrl
    if (normalized !== filePath) {
      pathMap[filePath] = blobUrl
    }
  })

  // Function to resolve relative paths - build script as string to avoid Vue template parsing
  const pathMapJson = JSON.stringify(pathMap)
  const currentPathNormalized = currentPath.replace(/\\/g, '/')

  // Build script content - split script tag to avoid Vue parser issues
  const scriptStart = '<scr' + 'ipt>'
  const scriptEnd = '</scr' + 'ipt>'

  const resolverScript =
    scriptStart +
    '(function() {' +
    "'use strict';" +
    'const SCORM_PATH_MAP = ' +
    pathMapJson +
    ';' +
    'function resolveScormPath(basePath, relativePath) {' +
    "if (!relativePath || relativePath === '') { console.warn('[SCORM] Empty URL path'); return null; }" +
    'if (/^(https?:|data:|blob:|javascript:)/i.test(relativePath)) { return relativePath; }' +
    "const normalizedBase = (basePath || '').replace(/\\\\/g, '/').replace(/^\\/+/, '');" +
    "const baseDir = normalizedBase.substring(0, normalizedBase.lastIndexOf('/') + 1);" +
    'let resolved = relativePath;' +
    "if (relativePath.startsWith('/')) { resolved = relativePath.substring(1); }" +
    "else if (relativePath.startsWith('../')) {" +
    "const parts = baseDir.split('/').filter(p => p);" +
    "const relParts = relativePath.split('/');" +
    'for (const part of relParts) {' +
    "if (part === '..') { parts.pop(); } else if (part !== '.') { parts.push(part); }" +
    '}' +
    "resolved = parts.join('/');" +
    "} else if (relativePath.startsWith('./')) { resolved = baseDir + relativePath.substring(2); }" +
    'else { resolved = baseDir + relativePath; }' +
    "const blobUrl = SCORM_PATH_MAP[resolved] || SCORM_PATH_MAP['/' + resolved] || SCORM_PATH_MAP[resolved.replace(/^\\/+/, '')];" +
    'if (blobUrl) { return blobUrl; }' +
    "console.warn('[SCORM] Could not resolve path:', relativePath);" +
    'return relativePath;' +
    '}' +
    "const currentDocPath = '" +
    currentPathNormalized +
    "';" +
    'const OriginalRequest = window.Request;' +
    'window.Request = function(input, init) {' +
    "if (typeof input === 'string' && input && !/^(https?:|data:|blob:|javascript:)/i.test(input)) {" +
    'const resolved = resolveScormPath(currentDocPath, input);' +
    'if (resolved) { return new OriginalRequest(resolved, init); }' +
    '}' +
    'return new OriginalRequest(input, init);' +
    '};' +
    'window.Request.prototype = OriginalRequest.prototype;' +
    'const originalFetch = window.fetch;' +
    'window.fetch = function(input, init) {' +
    "if (typeof input === 'string' && input && !/^(https?:|data:|blob:|javascript:)/i.test(input)) {" +
    'const resolved = resolveScormPath(currentDocPath, input);' +
    'if (resolved) { return originalFetch(resolved, init); }' +
    '}' +
    'return originalFetch(input, init);' +
    '};' +
    'const OriginalURL = window.URL;' +
    'window.URL = function(url, base) {' +
    'if (url && !/^(https?:|data:|blob:|javascript:)/i.test(url)) {' +
    "const basePath = base ? (typeof base === 'string' ? base : base.href) : currentDocPath;" +
    'const resolved = resolveScormPath(basePath, url);' +
    'if (resolved) { return new OriginalURL(resolved, base); }' +
    '}' +
    'return new OriginalURL(url, base);' +
    '};' +
    'window.URL.prototype = OriginalURL.prototype;' +
    "console.log('[SCORM] URL resolver injected');" +
    '})();' +
    scriptEnd

  // Inject script before closing head tag or at the beginning of body
  if (html.includes('</head>')) {
    html = html.replace('</head>', resolverScript + '</head>')
  } else if (html.includes('<body')) {
    html = html.replace('<body', resolverScript + '<body')
  } else {
    // Fallback: inject at the beginning
    html = resolverScript + html
  }

  return html
}

// Store extracted files as blobs in IndexedDB
async function storeExtractedFilesAsBlobs(zipData: JSZip, files: string[]): Promise<void> {
  try {
    const dbName = 'scorm-cache'
    const version = 1

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version)

      request.onerror = () => reject(request.error)
      request.onsuccess = async () => {
        const db = request.result

        // Extract all blobs first (before transaction)
        const fileEntries = files.filter((f) => zipData.files[f] && !zipData.files[f].dir)

        if (fileEntries.length === 0) {
          resolve()
          return
        }

        // Extract all blobs first
        const filePromises = fileEntries.map(async (filePath) => {
          try {
            const file = zipData.files[filePath]
            if (!file) return null
            const blob = await file.async('blob')
            const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '')

            return {
              path: normalized,
              pathOriginal: filePath,
              blob: blob,
              url: URL.createObjectURL(blob),
            }
          } catch (error) {
            console.warn(`Failed to extract file: ${filePath}`, error)
            return null
          }
        })

        // Wait for all files to be extracted
        const fileData = await Promise.all(filePromises)

        // Now store in IndexedDB
        const transaction = db.transaction(['files'], 'readwrite')
        const store = transaction.objectStore('files')

        // Clear old data
        store.clear()

        // Store all files in IndexedDB
        fileData.forEach((data) => {
          if (data) {
            store.put(data)
          }
        })

        transaction.oncomplete = () => {
          trackEvent(
            'System',
            `Files stored in IndexedDB (${fileData.filter((d) => d).length} files)`,
          )
          resolve()
        }

        transaction.onerror = () => reject(transaction.error)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' })
        }
      }
    })
  } catch (error) {
    console.warn('Failed to store files:', error)
    throw error
  }
}

// Register service worker with better error handling
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error(t('pages.uploadFiles.scormViewer.serviceWorkerNotSupported'))
  }

  try {
    // First, check if the service worker file exists
    const swResponse = await fetch('/sw.js', { method: 'HEAD' })

    if (!swResponse.ok) {
      throw new Error(`Service Worker file not found (${swResponse.status})`)
    }

    // Check content type
    const contentType = swResponse.headers.get('content-type') || ''
    if (!contentType.includes('javascript') && !contentType.includes('application/javascript')) {
      console.warn(`Service Worker has incorrect MIME type: ${contentType}`)
      throw new Error(
        `Service Worker has unsupported MIME type: ${contentType}. Please configure your server to serve .js files with 'application/javascript' MIME type.`,
      )
    }

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    // Wait for service worker to be ready (with timeout)
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service Worker registration timeout')), 5000),
      ),
    ])

    trackEvent('System', 'Service Worker registered successfully')
    return registration
  } catch (error) {
    const err = error as Error
    console.error('Service Worker registration failed:', error)
    trackEvent('Warning', `Service Worker registration failed: ${err.message}`)
    throw error
  }
}

function handleSCORMMessage(event: MessageEvent): void {
  // Handle messages from SCORM content
  if (event.data && typeof event.data === 'object') {
    if (event.data.type === 'scorm' || event.data.__scoEvent) {
      const eventData = event.data.__scoEvent || event.data
      trackEvent(
        eventData.type || 'Message',
        JSON.stringify(eventData),
        eventData.type === 'SUBMIT' || eventData.type === 'submission',
      )
    }

    // Handle video completion messages
    if (event.data.type === 'video-timeupdate') {
      handleVideoTimeUpdate(event.data.currentTime, event.data.duration)
    } else if (event.data.type === 'video-ended') {
      handleVideoEnded()
    } else if (event.data.type === 'video-loaded' && event.data.duration) {
      // Handle video duration from postMessage
      if (event.data.duration > 0) {
        videoDuration.value = event.data.duration
        trackEvent(
          'System',
          `Video duration received via postMessage: ${formatDuration(event.data.duration)}`,
        )
      }
    }
  }
}

// Format duration in seconds to readable format (MM:SS)
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Start monitoring video for completion
function startVideoMonitoring(): void {
  // Clear any existing interval
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval)
  }

  // Try to find ALL video elements in iframe
  findAllVideoElementsFn = function findAllVideoElements(): HTMLVideoElement[] {
    const videos: HTMLVideoElement[] = []
    try {
      if (!scormFrame.value?.contentWindow) return videos

      const iframeDoc = scormFrame.value.contentDocument || scormFrame.value.contentWindow.document
      if (!iframeDoc) return videos

      // Look for all video elements in main document
      const mainVideos = iframeDoc.querySelectorAll('video')
      videos.push(...Array.from(mainVideos))

      // Also check nested iframes
      const nestedIframes = iframeDoc.querySelectorAll('iframe')
      for (const iframe of nestedIframes) {
        try {
          const nestedDoc =
            iframe.contentDocument || (iframe as HTMLIFrameElement).contentWindow?.document
          if (nestedDoc) {
            const nestedVideos = nestedDoc.querySelectorAll('video')
            videos.push(...Array.from(nestedVideos))
          }
        } catch {
          // CORS restriction, skip
        }
      }

      return videos
    } catch {
      // CORS restriction or other error
      return videos
    }
  }

  // Function to find the currently playing/active video
  findActiveVideoFn = function findActiveVideo(): HTMLVideoElement | null {
    const allVideos = findAllVideoElementsFn!()

    // Find the video that is currently playing (not paused and has currentTime > 0)
    for (const video of allVideos) {
      try {
        if (!video.paused && video.currentTime > 0 && !video.ended) {
          return video
        }
      } catch {
        // Skip if we can't access video properties
      }
    }

    // If no video is playing, find the one that was most recently interacted with
    let mostRecentVideo: HTMLVideoElement | null = null
    let maxTime = -1

    for (const video of allVideos) {
      try {
        if (video.currentTime > maxTime && !video.ended) {
          maxTime = video.currentTime
          mostRecentVideo = video
        }
      } catch {
        // Skip if we can't access video properties
      }
    }

    return (
      mostRecentVideo || (allVideos.length > 0 ? allVideos[allVideos.length - 1] || null : null)
    )
  }

  // Function to setup listeners for all videos
  function setupAllVideoListeners(): void {
    const allVideos = findAllVideoElementsFn!()

    // Add listeners to new videos that we haven't seen before
    for (const video of allVideos) {
      if (!videoElements.has(video)) {
        videoElements.add(video)
        setupVideoListeners(video)
        trackEvent(
          'System',
          `New video element found and monitoring started (total: ${videoElements.size})`,
        )
      }
    }

    // Find and track the active video
    const activeVideo = findActiveVideoFn!()
    if (activeVideo && activeVideo !== activeVideoElement) {
      activeVideoElement = activeVideo

      // Update duration to active video's duration
      if (activeVideo.duration && activeVideo.duration > 0) {
        videoDuration.value = activeVideo.duration
        trackEvent(
          'System',
          `Active video changed: duration ${formatDuration(activeVideo.duration)}`,
        )
      }
    }
  }

  // Initial setup
  setupAllVideoListeners()

  // Continuously monitor for new videos and track active video
  videoCheckInterval = setInterval(() => {
    setupAllVideoListeners()

    // Update progress for active video
    if (activeVideoElement) {
      try {
        if (activeVideoElement.duration && activeVideoElement.duration > 0) {
          const activeVideoId = activeVideoElement.src || activeVideoElement.currentSrc
          handleVideoTimeUpdate(
            activeVideoElement.currentTime,
            activeVideoElement.duration,
            activeVideoId,
          )
        }
      } catch {
        // Video might have been removed or CORS issue
        activeVideoElement = null
      }
    }
  }, 500) // Check every 500ms
}

// Set up video event listeners for a specific video
function setupVideoListeners(video: HTMLVideoElement): void {
  if (!video) return

  // Create a unique identifier for this video
  const videoId = video.src || video.currentSrc || `video-${Date.now()}-${Math.random()}`

  // Initialize completion tracker for this video if not exists
  if (!videoCompletionTracker.has(videoId)) {
    videoCompletionTracker.set(videoId, {
      completed: false,
      duration: 0,
      lastTime: 0,
    })
  }

  // Set video duration if already available
  if (video.duration && video.duration > 0) {
    const tracker = videoCompletionTracker.get(videoId)!
    tracker.duration = video.duration

    // Only update global duration if this is the active video
    if (video === activeVideoElement) {
      videoDuration.value = video.duration
      trackEvent('System', `Video duration detected: ${formatDuration(video.duration)}`)
    }
  }

  // Listen for loaded metadata to get video duration
  const onLoadedMetadata = (): void => {
    setTimeout(() => {
      if (
        video.duration &&
        video.duration > 0 &&
        !isNaN(video.duration) &&
        isFinite(video.duration)
      ) {
        const tracker = videoCompletionTracker.get(videoId)!
        const oldDuration = tracker.duration
        tracker.duration = video.duration

        if (oldDuration !== video.duration) {
          if (video === activeVideoElement) {
            videoDuration.value = video.duration
          }
          trackEvent('System', `Video metadata loaded: duration ${formatDuration(video.duration)}`)
        }
      }
    }, 100)
  }
  video.addEventListener('loadedmetadata', onLoadedMetadata)

  // Listen for loadeddata event
  const onLoadedData = (): void => {
    if (
      video.duration &&
      video.duration > 0 &&
      !isNaN(video.duration) &&
      isFinite(video.duration)
    ) {
      const tracker = videoCompletionTracker.get(videoId)!
      if (tracker.duration !== video.duration) {
        tracker.duration = video.duration
        if (video === activeVideoElement) {
          videoDuration.value = video.duration
        }
        trackEvent('System', `Video data loaded: duration ${formatDuration(video.duration)}`)
      }
    }
  }
  video.addEventListener('loadeddata', onLoadedData)

  // Listen for play event to mark this as active video
  const onPlay = (): void => {
    activeVideoElement = video
    lastPlayedVideo = video

    const updateDuration = (attempts = 0): void => {
      if (
        video.duration &&
        video.duration > 0 &&
        !isNaN(video.duration) &&
        isFinite(video.duration)
      ) {
        const duration = video.duration
        videoDuration.value = duration
        lastPlayedVideoDuration = duration
        const tracker = videoCompletionTracker.get(videoId)!
        if (tracker.duration !== duration) {
          tracker.duration = duration
          trackEvent('System', `Video started playing: duration ${formatDuration(duration)}`)
        }
      } else if (attempts < 10) {
        setTimeout(() => updateDuration(attempts + 1), 500)
      }
    }

    setTimeout(() => updateDuration(), 50)
  }
  video.addEventListener('play', onPlay)

  // Listen for time updates
  const onTimeUpdate = (): void => {
    if (video === activeVideoElement || (!activeVideoElement && !video.paused)) {
      handleVideoTimeUpdate(video.currentTime, video.duration, videoId)
    }
  }
  video.addEventListener('timeupdate', onTimeUpdate)

  // Listen for video end
  const onEnded = (): void => {
    const tracker = videoCompletionTracker.get(videoId)
    if (tracker && !tracker.completed) {
      tracker.completed = true

      let finalDuration = 0
      if (
        video.duration &&
        !isNaN(video.duration) &&
        isFinite(video.duration) &&
        video.duration > 0
      ) {
        finalDuration = video.duration
      } else if (tracker.duration > 0) {
        finalDuration = tracker.duration
      }

      if (finalDuration > 0) {
        tracker.duration = finalDuration
      }

      lastPlayedVideo = video
      if (finalDuration > 0) {
        lastPlayedVideoDuration = finalDuration
        if (video === activeVideoElement) {
          videoDuration.value = finalDuration
        }
      }

      trackEvent(
        'Video Ended',
        `Video ended event fired: duration ${formatDuration(finalDuration)}`,
        true,
      )

      setTimeout(() => {
        checkAllVideosCompleted()
      }, 2000)
    }
  }
  video.addEventListener('ended', onEnded)

  // Listen for durationchange
  const onDurationChange = (): void => {
    if (
      video.duration &&
      video.duration > 0 &&
      !isNaN(video.duration) &&
      isFinite(video.duration)
    ) {
      const tracker = videoCompletionTracker.get(videoId)!
      const oldDuration = tracker.duration
      tracker.duration = video.duration

      if (oldDuration !== video.duration) {
        if (video === activeVideoElement) {
          videoDuration.value = video.duration
        }
        trackEvent('System', `Video duration changed: ${formatDuration(video.duration)}`)
      }
    }
  }
  video.addEventListener('durationchange', onDurationChange)

  trackEvent('System', `Video event listeners attached for video: ${videoId.substring(0, 50)}`)
}

// Handle video time updates
function handleVideoTimeUpdate(
  currentTime: number,
  duration: number,
  videoId: string | null = null,
): void {
  if (!currentTime || !duration || duration <= 0 || isNaN(duration) || !isFinite(duration)) return

  if (duration !== videoDuration.value && duration > 0 && !isNaN(duration) && isFinite(duration)) {
    videoDuration.value = duration
  }

  if (videoId && videoCompletionTracker.has(videoId)) {
    const tracker = videoCompletionTracker.get(videoId)!
    tracker.lastTime = currentTime
    if (duration > 0 && !isNaN(duration) && isFinite(duration) && tracker.duration !== duration) {
      tracker.duration = duration
    }
  }

  const progress = (currentTime / duration) * 100
  videoProgress.value = Math.min(progress, 100)

  const threshold = duration < 2 ? duration * 0.95 : duration - 0.1

  if (duration > 0 && currentTime >= threshold) {
    if (videoId && videoCompletionTracker.has(videoId)) {
      const tracker = videoCompletionTracker.get(videoId)!
      if (!tracker.completed) {
        tracker.completed = true
        trackEvent(
          'Video Reached End',
          `Video reached end threshold: ${formatDuration(duration)}`,
          true,
        )

        setTimeout(() => {
          checkAllVideosCompleted()
        }, 500)
      }
    } else if (!videoCompleted.value) {
      setTimeout(() => {
        checkAllVideosCompleted()
      }, 500)
    }
  }
}

// Handle video ended event
function handleVideoEnded(videoId: string | null = null): void {
  if (videoId && videoCompletionTracker.has(videoId)) {
    const tracker = videoCompletionTracker.get(videoId)!
    tracker.completed = true
  }

  checkAllVideosCompleted()
}

// Check if all videos have been completed
function checkAllVideosCompleted(): void {
  if (videoCompleted.value) return

  const allVideos = findAllVideoElementsFn ? findAllVideoElementsFn() : Array.from(videoElements)

  if (allVideos.length === 0) {
    trackEvent('System', 'No videos found to check completion')
    return
  }

  const playedVideos = allVideos.filter((video) => {
    try {
      return video.currentTime > 0 || video.ended
    } catch {
      return false
    }
  })

  trackEvent(
    'System',
    `Checking completion: ${playedVideos.length} played video(s) out of ${allVideos.length} total`,
  )

  let completedCount = 0
  let playingCount = 0
  let lastCompletedVideo: HTMLVideoElement | null = null
  let lastCompletedDuration = 0

  for (const video of playedVideos) {
    try {
      const isEnded = video.ended
      const duration = video.duration
      const currentTime = video.currentTime
      const isPaused = video.paused

      if (isEnded) {
        completedCount++
        lastCompletedVideo = video
        if (duration > 0 && !isNaN(duration) && isFinite(duration)) {
          lastCompletedDuration = duration
        }
      } else if (duration > 0 && !isNaN(duration) && isFinite(duration)) {
        const threshold = duration < 2 ? duration * 0.95 : duration - 0.1

        if (currentTime >= threshold) {
          completedCount++
          lastCompletedVideo = video
          lastCompletedDuration = duration
        } else if (!isPaused && currentTime > 0) {
          playingCount++
        }
      } else if (!isPaused && currentTime > 0) {
        playingCount++
      }
    } catch {
      // Skip if we can't access video properties
    }
  }

  if (lastCompletedVideo && lastCompletedDuration > 0) {
    lastPlayedVideo = lastCompletedVideo
    lastPlayedVideoDuration = lastCompletedDuration
  }

  if (
    playedVideos.length > 0 &&
    (completedCount === playedVideos.length || (completedCount > 0 && playingCount === 0))
  ) {
    trackEvent('System', 'All played videos completed - marking overall completion')
    markVideoCompleted()
  } else if (completedCount > 0 && playingCount === 0 && playedVideos.length > 0) {
    setTimeout(() => {
      const newVideos = findAllVideoElementsFn
        ? findAllVideoElementsFn()
        : Array.from(videoElements)
      const newPlayedVideos = newVideos.filter((video) => {
        try {
          return video.currentTime > 0 || video.ended
        } catch {
          return false
        }
      })

      if (newPlayedVideos.length === playedVideos.length) {
        trackEvent('System', 'No new videos detected - marking completion')
        markVideoCompleted()
      }
    }, 1000)
  }
}

// Mark video as completed
function markVideoCompleted(): void {
  if (videoCompleted.value) return

  videoCompleted.value = true

  let finalDuration = 0
  let durationText = 'full duration'

  // Priority 1: Get duration from active video element
  if (activeVideoElement) {
    try {
      const duration = activeVideoElement.duration
      if (duration > 0 && !isNaN(duration) && isFinite(duration)) {
        finalDuration = duration
        durationText = formatDuration(duration)
        lastPlayedVideoDuration = duration
      }
    } catch {
      // Continue to next check
    }
  }

  // Priority 2: Get duration from last played video element
  if (finalDuration === 0 && lastPlayedVideo) {
    try {
      const duration = lastPlayedVideo.duration
      if (duration > 0 && !isNaN(duration) && isFinite(duration)) {
        finalDuration = duration
        durationText = formatDuration(duration)
        lastPlayedVideoDuration = duration
      }
    } catch {
      // Continue to next check
    }
  }

  // Priority 3: Use stored lastPlayedVideoDuration
  if (finalDuration === 0 && lastPlayedVideoDuration > 0) {
    finalDuration = lastPlayedVideoDuration
    durationText = formatDuration(lastPlayedVideoDuration)
  }

  // Priority 4: Fallback to global duration
  if (finalDuration === 0 && videoDuration.value > 0) {
    finalDuration = videoDuration.value
    durationText = formatDuration(videoDuration.value)
  }

  trackEvent('Video Completion', `Video fully watched (reached ${durationText})`, true)

  // Update percentage model
  percentage.value = 100

  // Update SCORM status to completed/passed
  if (scormState.initialized) {
    API.LMSSetValue('cmi.core.lesson_status', 'completed')

    const currentStatusVal = scormState.data['cmi.core.lesson_status']
    if (currentStatusVal !== 'passed') {
      API.LMSSetValue('cmi.core.lesson_status', 'passed')
    }

    API.LMSCommit()

    trackEvent('Video Completion', 'SCORM status updated to completed/passed', true)
    console.log(`✅ Video completion detected (${durationText}) and SCORM status updated!`)
  }
}

// Event management utility functions (exposed for debugging purposes)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clearEvents(): void {
  trackedEvents.value = []
  trackEvent('System', 'Event log cleared')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function exportEvents(): void {
  const dataStr = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      totalEvents: trackedEvents.value.length,
      submissions: submissionEvents.value.length,
      currentStatus: currentStatus.value,
      events: trackedEvents.value,
      scormData: scormState.data,
    },
    null,
    2,
  )

  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `scorm-events-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  trackEvent('System', 'Events exported')
}

let checkInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  installSCORMAPI()
  trackEvent('System', 'SCORM Player initialized')

  // Load saved status
  if (scormState.data['cmi.core.lesson_status']) {
    currentStatus.value = scormState.data['cmi.core.lesson_status']
  }

  // Check if URL is a ZIP file and extract it
  if (isZipUrl(props.scormUrl)) {
    await extractZipFromUrl(props.scormUrl)
  } else {
    isLoading.value = false
  }

  // Periodically check if API is being used (for debugging)
  checkInterval = setInterval(() => {
    if (scormState.initialized && !trackedEvents.value.some((e) => e.type.includes('SetValue'))) {
      // If initialized but no events, API might not be connected
      console.log('[SCORM] API initialized but no events tracked yet. Waiting for SCORM content...')
    }
  }, 5000)
})

onUnmounted(() => {
  window.removeEventListener('message', handleSCORMMessage)
  if (checkInterval) {
    clearInterval(checkInterval)
  }

  // Clean up video monitoring
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval)
    videoCheckInterval = null
  }

  // Clean up blob URLs
  if (zipEntryUrl.value) {
    URL.revokeObjectURL(zipEntryUrl.value)
  }
  extractedFiles.value.forEach((url) => URL.revokeObjectURL(url))

  // Clean up SCORM data from localStorage
  localStorage.removeItem('scorm12')
  trackEvent('System', 'SCORM data cleared from localStorage')
})

// Watch for URL changes
watch(
  () => props.scormUrl,
  async (newUrl) => {
    if (newUrl) {
      isLoading.value = true
      scormError.value = null

      // Clean up old blob URLs
      if (zipEntryUrl.value) {
        URL.revokeObjectURL(zipEntryUrl.value)
        zipEntryUrl.value = null
      }
      extractedFiles.value.forEach((url) => URL.revokeObjectURL(url))
      extractedFiles.value.clear()

      trackEvent('System', `SCORM URL changed to: ${newUrl}`)

      // If it's a ZIP URL, extract it
      if (isZipUrl(newUrl)) {
        await extractZipFromUrl(newUrl)
      } else {
        isLoading.value = false
      }
    }
  },
  { immediate: false },
)
</script>
