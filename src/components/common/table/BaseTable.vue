<script lang="ts" setup>
import type { Column, RowType } from '@/types/BaseTable'
import { ref, computed, watch, useSlots } from 'vue'
import BasePagination from './BasePagination.vue'
import BaseIcon from '../icon/BaseIcon.vue'
import { BaseCheckbox } from '@/components/common'

type SortOrder = 'asc' | 'desc'

// Props definition
const props = defineProps<{
  columns: Column[]
  data: RowType[]
  rowKey: keyof RowType
  selectable?: boolean
  selectedRows?: Array<RowType[keyof RowType]>
  pagination?: boolean
  serverSide?: boolean
  total?: number
  perPageOptions?: number[]
  initialPage?: number
  initialPerPage?: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:selectedRows', val: Array<RowType[keyof RowType]>): void
  (e: 'row-click', row: RowType): void
  (e: 'cell-click', row: RowType, colKey?: keyof RowType): void
  (e: 'sort-change', field: keyof RowType, order: SortOrder): void
  (e: 'page-change', page: number): void
  (e: 'per-page-change', perPage: number): void
}>()

// Slots
const slots = useSlots()
const hasActionsSlot = computed(() => Boolean(slots.actions))

// Reactive state
const actionColumnKey = 'actions'
const dataColumns = computed(() => props.columns.filter((col) => col.key !== actionColumnKey))
const internalPage = ref(props.initialPage ?? 1)
const internalPerPage = ref(props.initialPerPage ?? props.perPageOptions?.[0] ?? 10)
const sortField = ref<keyof RowType | ''>('')
const sortOrder = ref<SortOrder>('asc')
const internalSelected = ref<Array<RowType[keyof RowType]>>(
  props.selectedRows ? [...props.selectedRows] : [],
)

// Keep in sync with outside changes
watch(
  () => props.selectedRows,
  (val) => (internalSelected.value = val ? [...val] : []),
)

// Filter, sort, and paginate data
const displayedData = computed(() => {
  const rows = [...props.data]

  // Only apply client-side sorting when serverSide is false
  if (sortField.value && !props.serverSide) {
    rows.sort((a, b) => {
      const aVal = a[sortField.value]
      const bVal = b[sortField.value]
      if (aVal == null || bVal == null) return 0
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (sortOrder.value === 'asc' ? 1 : -1)
    })
  }

  // Only apply client-side pagination when serverSide is false
  if (props.pagination && !props.serverSide) {
    const start = (internalPage.value - 1) * internalPerPage.value
    return rows.slice(start, start + internalPerPage.value)
  }

  return rows
})

watch(
  () => props.initialPage,
  (val) => {
    internalPage.value = val ?? 1
  },
)

// Pagination math
const totalPages = computed(() => {
  const count = props.serverSide ? (props.total ?? 0) : props.data.length
  return Math.max(1, Math.ceil(count / internalPerPage.value))
})

// Select-all logic
const allSelected = computed(
  () =>
    displayedData.value.length > 0 &&
    displayedData.value.every((r) => internalSelected.value.includes(r[props.rowKey]!)),
)

// Column span for empty state
const colspan = computed(
  () => props.columns.length + (props.selectable ? 1 : 0) + (hasActionsSlot.value ? 1 : 0),
)

// Methods
const changeSort = (col: Column) => {
  if (!col.sortable) return
  if (sortField.value === col.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = col.key
    sortOrder.value = 'asc'
  }
  emit('sort-change', sortField.value, sortOrder.value)
}

const onRowClick = (row: RowType) => {
  emit('row-click', row)
}

const onCellClick = (row: RowType, colKey?: Column) => {
  if (colKey?.clickable) emit('cell-click', row, colKey.key)
}

const isSelected = (row: RowType): boolean => {
  return internalSelected.value.includes(row[props.rowKey]!)
}

const toggleRow = (row: RowType) => {
  const key = row[props.rowKey]!
  const idx = internalSelected.value.indexOf(key)
  if (idx > -1) internalSelected.value.splice(idx, 1)
  else internalSelected.value.push(key)
  emit('update:selectedRows', [...internalSelected.value])
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    internalSelected.value = []
  } else {
    internalSelected.value = displayedData.value.map((r) => r[props.rowKey]!)
  }
  emit('update:selectedRows', [...internalSelected.value])
}
const handlePageChange = (page: number) => {
  internalPage.value = page
  emit('page-change', page)
}
</script>

<template>
  <div class="w-full flex flex-col">
    <!-- Table -->
    <div class="overflow-x-auto border border-neutral-200 rounded-t-[8px]">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-neutral-50">
          <tr>
            <!-- Select All Checkbox -->
            <th v-if="selectable" class="px-5 py-4 leading-[0] text-left">
              <BaseCheckbox
                :model-value="allSelected"
                @update:model-value="toggleSelectAll"
                class="!w-[13px] !h-[14px] mr-[12px] checkbox"
                defaultStyle="!border-grey-800"
                uncheckedStroke="#637083"
                :checkbox-width="15"
                :checkbox-height="15"
              />
            </th>
            <!-- Column Headers -->
            <th
              v-for="col in dataColumns"
              :key="String(col.key)"
              :class="[
                'px-4 py-2 text-left text-[14px] font-semibold text-neutral-800',
                col.width,
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : '',
                !selectable && 'py-3',
              ]"
            >
              <div class="flex items-center space-x-[7px]">
                <span
                  v-if="col.sortable"
                  class="cursor-pointer text-[14px] font-semibold text-neutral-800 tracking-[-0.016px] leading-5 whitespace-nowrap"
                  @click="() => changeSort(col)"
                >
                  {{ col.label }}
                </span>
                <span
                  v-else
                  class="cursor-pointer text-[14px] font-semibold text-neutral-800 tracking-[-0.016px] leading-5 whitespace-nowrap"
                >
                  {{ col.label }}
                </span>

                <!-- Sort Icons -->
                <template v-if="col.sortable">
                  <BaseIcon
                    @click="() => changeSort(col)"
                    name="arrow-vertical"
                    size="xs"
                    class="text-neutral-700 cursor-pointer"
                  />
                </template>
              </div>
            </th>
            <!-- Actions Column -->
            <th v-if="hasActionsSlot" class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Data Rows -->
          <tr
            v-for="row in displayedData"
            :key="String(row[rowKey])"
            @click="() => onRowClick(row)"
            class="hover:bg-gray-100"
          >
            <!-- Row Checkbox -->
            <td v-if="selectable" class="px-5 py-4 leading-[0]" @click.stop>
              <!-- <input
                type="checkbox"
                :checked="isSelected(row)"
                @change="() => toggleRow(row)"
                class="h-4 w-[14px] accent-primary-600"
              /> -->
              <BaseCheckbox
                :model-value="isSelected(row)"
                @update:model-value="() => toggleRow(row)"
                class="h-4 w-[14px] accent-primary-600"
                uncheckedStroke="#637083"
                :checkbox-width="15"
                :checkbox-height="15"
              />
            </td>
            <!-- Cells -->
            <td
              v-for="col in dataColumns"
              :key="String(col.key)"
              :class="[
                'px-4 py-1 text-sm text-grey-800 whitespace-nowrap font-medium',
                { 'cursor-pointer': col.clickable },
                !selectable && 'py-2',
              ]"
              @click="() => onCellClick(row, col)"
            >
              <slot v-if="col.key !== 'actions'" :name="`cell-${String(col.key)}`" :row="row">
                {{ String(row[col.key]) }}
              </slot>
            </td>
            <!-- Actions Slot -->
            <td v-if="hasActionsSlot" class="px-4 py-1">
              <div class="flex items-center cursor-pointer justify-start">
                <slot name="actions" :row="row" />
              </div>
            </td>
          </tr>
          <!-- Empty State -->
          <tr v-if="displayedData.length === 0">
            <td :colspan="colspan" class="px-4 py-2 text-center text-sm text-gray-500">
              No data available
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->
    <BasePagination
      v-if="pagination"
      :current-page="internalPage"
      :total-pages="totalPages"
      @update:current-page="handlePageChange"
      class="sm:mt-8 mt-6"
    />
  </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
