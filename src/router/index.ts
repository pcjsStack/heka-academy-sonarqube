import { createRouter, createWebHistory } from 'vue-router'
import { setupPermissionGuard } from './permissionGuard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('../views/DashboardView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/admin/uploaded-files',
      name: 'admin-uploaded-files',
      component: () => import('../views/UploadedFilesView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/admin/course/:id',
      name: 'course-admin-details',
      component: () => import('../views/courseAdminView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/course/:id',
      name: 'course-details',
      component: () => import('../views/CourseDetailsView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/flash-card/:id',
      name: 'admin-flash-card-details',
      component: () => import('../views/FlashCardDetailsView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/course/',
      name: 'course-view',
      component: () => import('../views/CourseView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/course/',
      name: 'admin-course-view',
      component: () => import('../views/CourseView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/admin/lessons',
      name: 'admin-lessons-view',
      component: () => import('../views/LessonsView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/lessons',
      name: 'lessons-view',
      component: () => import('../views/LessonsView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/lessons/:id',
      name: 'lesson-admin-details',
      component: () => import('../views/LessonAdminView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/lessons/:id',
      name: 'lesson-details',
      component: () => import('../views/LessonDetailsView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/quizzes',
      name: 'quizzes-view',
      component: () => import('../views/QuizView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/quizzes',
      name: 'admin-quizzes-view',
      component: () => import('../views/QuizView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/quiz/:id',
      name: 'quiz-detail',
      component: () => import('../views/QuizDetailView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/quiz/:id',
      name: 'admin-quiz-detail',
      component: () => import('../views/QuizDetailView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/categories',
      name: 'categories-view',
      component: () => import('../views/CategoryView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories-view',
      component: () => import('../views/CategoryView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/category/:id',
      name: 'category-detail',
      component: () => import('../views/CategoryDetailView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/category/:id',
      name: 'admin-category-detail',
      component: () => import('../views/CategoryDetailView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/badges-skills',
      name: 'badges-skills',
      component: () => import('../views/BadgeSkillsView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: false,
      },
    },
    {
      path: '/admin/badges-skills',
      name: 'admin-badges-skills',
      component: () => import('../views/BadgeSkillsView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/admin/report-builder',
      name: 'admin-report-builder',
      component: () => import('../views/ReportBuilderView.vue'),
      props: (route) => ({ isAdmin: route.meta.isAdmin }),
      meta: {
        isAdmin: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})
setupPermissionGuard(router)
export default router
