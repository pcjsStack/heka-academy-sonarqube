import { t } from './i18n'
import { VisibilityStatus } from '@/types/Course'

export const visibilityOptions = [
  { value: VisibilityStatus.SHOW, label: t('pages.course.settings.visibility.show') },
  { value: VisibilityStatus.HIDE, label: t('pages.course.settings.visibility.hide') },
  { value: VisibilityStatus.MAINTENANCE, label: t('pages.course.settings.visibility.maintenance') },
]

export const yesNoOptions = [
  { value: 'yes', label: t('pages.course.settings.yes') },
  { value: 'no', label: t('pages.course.settings.no') },
]
export const groupSettingOptions = [
  { value: 'group', label: t('pages.course.settings.groups.mode') },
  { value: 'force', label: t('pages.course.settings.groups.forceMode') },
]
