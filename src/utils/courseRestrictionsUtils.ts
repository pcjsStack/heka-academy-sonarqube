import { t } from './i18n'
import type { Icons } from '@/types/Styles'

// Type definitions
export interface SelectOption {
  value: string
  label: string
}

// Date and Time Options
export const getMonthOptions = (): SelectOption[] => [
  { value: 'january', label: 'January' },
  { value: 'february', label: 'February' },
  { value: 'march', label: 'March' },
  { value: 'april', label: 'April' },
  { value: 'may', label: 'May' },
  { value: 'june', label: 'June' },
  { value: 'july', label: 'July' },
  { value: 'august', label: 'August' },
  { value: 'september', label: 'September' },
  { value: 'october', label: 'October' },
  { value: 'november', label: 'November' },
  { value: 'december', label: 'December' },
]

export const getDayOptions = (): SelectOption[] =>
  Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString(),
  }))

export const getYearOptions = (): SelectOption[] => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 51 }, (_, i) => {
    const year = currentYear + i
    return {
      value: year.toString(),
      label: year.toString(),
    }
  })
}

export const getHourOptions = (): SelectOption[] =>
  Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString(),
  }))

export const getMinuteOptions = (): SelectOption[] =>
  Array.from({ length: 60 }, (_, i) => ({
    value: i.toString(),
    label: i.toString(),
  }))

// AM/PM Options
export const getAmPmOptions = (): SelectOption[] => [
  { value: 'am', label: t('pages.course.restrictions.reminder.am') },
  { value: 'pm', label: t('pages.course.restrictions.reminder.pm') },
]

// Completion Options
export const getCompletionOptions = (): SelectOption[] => [
  { value: 'none', label: t('pages.course.restrictions.completion.none') },
  { value: 'manual', label: t('pages.course.restrictions.completion.manual') },
]

// Restriction Utilities
export const getRestrictionLabel = (restriction: string): string => {
  switch (restriction) {
    case 'cohort':
      return t('pages.course.restrictions.addModal.cohort.title')
    case 'activity':
      return t('pages.course.restrictions.addModal.activity.title')
    case 'date':
      return t('pages.course.restrictions.addModal.date.title')
    case 'grade':
      return t('pages.course.restrictions.addModal.grade.title')
    case 'language':
      return t('pages.course.restrictions.tag.language')
    case 'userProfile':
      return t('pages.course.restrictions.addModal.userProfile.title')
    case 'relativeDate':
      return t('pages.course.restrictions.addModal.relativeDate.title')
    case 'restrictionSet':
      return t('pages.course.restrictions.addModal.restrictionSet.title')
    default:
      return restriction
  }
}

// Array Utilities
export const removeFromArray = <T>(array: T[], item: T): T[] => {
  const index = array.indexOf(item)
  if (index > -1) {
    const newArray = [...array]
    newArray.splice(index, 1)
    return newArray
  }
  return array
}

// Toggle Utilities
export const createToggleHandler = (expandedState: { value: boolean }) => {
  return () => {
    expandedState.value = !expandedState.value
  }
}

// Restriction options for side modal
export interface RestrictionOption {
  value: string
  icon: Icons
  titleKey: string
  descKey: string
}

export const getRestrictionOptions = (): RestrictionOption[] => [
  {
    value: 'cohort',
    icon: 'cohort',
    titleKey: 'pages.course.restrictions.addModal.cohort.title',
    descKey: 'pages.course.restrictions.addModal.cohort.desc',
  },
  {
    value: 'activity',
    icon: 'activity',
    titleKey: 'pages.course.restrictions.addModal.activity.title',
    descKey: 'pages.course.restrictions.addModal.activity.desc',
  },
  {
    value: 'date',
    icon: 'calendar1',
    titleKey: 'pages.course.restrictions.addModal.date.title',
    descKey: 'pages.course.restrictions.addModal.date.desc',
  },
  {
    value: 'grade',
    icon: 'grade',
    titleKey: 'pages.course.restrictions.addModal.grade.title',
    descKey: 'pages.course.restrictions.addModal.grade.desc',
  },
  {
    value: 'language',
    icon: 'language',
    titleKey: 'pages.course.restrictions.addModal.language.title',
    descKey: 'pages.course.restrictions.addModal.language.desc',
  },
  {
    value: 'userProfile',
    icon: 'user-outline',
    titleKey: 'pages.course.restrictions.addModal.userProfile.title',
    descKey: 'pages.course.restrictions.addModal.userProfile.desc',
  },
  {
    value: 'restrictionSet',
    icon: 'menu',
    titleKey: 'pages.course.restrictions.addModal.restrictionSet.title',
    descKey: 'pages.course.restrictions.addModal.restrictionSet.desc',
  },
]
