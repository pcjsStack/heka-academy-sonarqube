export interface User {
  id: number
  firstName: string
  surname: string
  email: string
  role: string
}

export type Permission =
  | 'academy_access'
  | 'academy_admin'
  | 'academy_edit_home_attachment'
  | 'academy_manage'
  | 'academy_create_category'
  | 'academy_edit_category'
  | 'academy_delete_category'
  | 'academy_create_course'
  | 'academy_edit_course'
  | 'academy_delete_course'
  | 'academy_create_lesson'
  | 'academy_edit_lesson'
  | 'academy_delete_lesson'
  | 'academy_create_file'
  | 'academy_edit_file'
  | 'academy_delete_file'
  | 'academy_create_quiz'
  | 'academy_edit_quiz'
  | 'academy_delete_quiz'
  | 'academy_badge_skills_create'
  | 'academy_badge_skills_edit'
  | 'academy_badge_skills_delete'
  | 'academy_leaderboard_view'

export interface PermissionResponse {
  success: boolean
  data: Permission[]
}
