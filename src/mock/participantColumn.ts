import type { Column } from '@/types/BaseTable'
import { t } from '@/utils/i18n'

// Participant columns
export const participantColumns: Column[] = [
  {
    key: 'fullName',
    label: t('pages.course.associations.details.columns.fullName'),
    sortable: false,
    align: 'left',
  },
  {
    key: 'username',
    label: t('pages.course.associations.details.columns.username'),
    sortable: false,
    align: 'left',
  },
  {
    key: 'emailAddress',
    label: t('pages.course.associations.details.columns.emailAddress'),
    sortable: false,
    align: 'left',
  },
  {
    key: 'status',
    label: t('pages.course.associations.details.columns.status'),
    sortable: false,
    align: 'left',
  },
]

// Progress columns
export const progressColumns: Column[] = [
  {
    key: 'fullName',
    label: t('pages.course.associations.details.columns.fullName'),
    sortable: false,
    align: 'left',
  },
  {
    key: 'email',
    label: t('pages.course.associations.details.columns.emailAddress'),
    sortable: false,
    align: 'left',
  },
  {
    key: 'progress',
    label: t('pages.course.associations.details.columns.progress'),
    sortable: false,
    align: 'left',
  },
  {
    key: 'time',
    label: t('pages.course.associations.details.columns.time'),
    sortable: false,
    align: 'left',
  },
]
