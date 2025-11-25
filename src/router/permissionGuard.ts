import { useUserStore } from '@/stores/user'
import { useToaster } from '@/composables/useToaster'
import type { RouteLocationNormalized, Router } from 'vue-router'

// Define routes that don't require permission checks (safe fallback routes)
const safeRoutes = ['not-found']

export function checkRoutePermission(route: RouteLocationNormalized): boolean {
  const userStore = useUserStore()
  const routeName = route.name as string

  // If it's a safe route, always allow access
  if (safeRoutes.includes(routeName)) {
    return true
  }

  // Check if this is an admin route
  const isAdminRoute = route.meta.isAdmin === true

  // If it's NOT an admin route, allow access to everyone
  if (!isAdminRoute) {
    return true
  }

  // If it's an admin route, check for academy_admin permission
  const hasAdminPermission = userStore.permissions?.includes('academy_admin')

  return hasAdminPermission || false
}

function getNonAdminRoute(routeName: string): string {
  if (routeName.startsWith('admin-')) {
    const nonAdminRoute = routeName.replace(/^admin-/, '')
    return nonAdminRoute
  }
  return 'dashboard'
}

export function setupPermissionGuard(router: Router) {
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: (route?: string | { name: string; params?: Record<string, string | string[]> }) => void,
    ) => {
      const userStore = useUserStore()

      // Fetch permissions if not loaded
      if (!userStore.permissions || userStore.permissions.length === 0) {
        await userStore.fetchPermission()
      }

      const hasAccess = checkRoutePermission(to)

      if (hasAccess) {
        next()
      } else {
        // Show toast notification for access denial
        const { showToast } = useToaster()
        showToast({
          tone: 'error',
          message: 'You do not have permission to access this admin page.',
        })

        // Redirect to non-admin equivalent route or dashboard
        const routeName = to.name as string
        const fallbackRoute = getNonAdminRoute(routeName)

        // Preserve route params if they exist (e.g., course ID)
        if (to.params && Object.keys(to.params).length > 0) {
          next({ name: fallbackRoute, params: to.params })
        } else {
          next({ name: fallbackRoute })
        }
      }
    },
  )
}
