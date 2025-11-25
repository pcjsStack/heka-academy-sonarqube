export type RowType = Record<string, unknown>

export interface Column {
  key: keyof RowType
  label: string
  sortable?: boolean
  width?: string
  align: 'center' | 'left' | 'right'
  clickable?: boolean
}
