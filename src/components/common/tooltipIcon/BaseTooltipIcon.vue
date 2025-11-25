<template>
  <popper hover :placement="placement" arrow class="popper-icons dark">
    <BaseIcon name="info-fill" size="sm" />
    <template #content>
      <BaseText :text="text" :tone="700" color="white" font="medium" type="p-xs" />
    </template>
  </popper>
</template>

<script lang="ts" setup>
import Popper from 'vue3-popper'
import BaseIcon from '../icon/BaseIcon.vue'
import BaseText from '../text/BaseText.vue'

withDefaults(
  defineProps<{
    placement?:
      | 'left'
      | 'left-start'
      | 'left-end'
      | 'right'
      | 'right-start'
      | 'right-end'
      | 'bottom'
      | 'bottom-start'
      | 'bottom-end'
      | 'top'
      | 'top-start'
      | 'top-end'
    openDelay?: number
    closeDelay?: number
    disableClickAway?: boolean
    zIndex?: number
    text?: string
  }>(),
  {
    placement: 'top',
    openDelay: 0,
    closeDelay: 0,
    disableClickAway: false,
    zIndex: 9999,
    text: '',
  },
)
</script>
<style scoped>
.popper-icons {
  @apply border-0 relative mt-0.5 ml-1 -top-[3px] !important;
}

:deep(.popper) {
  width: 220px;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.dark {
  --popper-theme-background-color: #333333;
  --popper-theme-background-color-hover: #333333;
  --popper-theme-text-color: white;
  --popper-theme-border-width: 0px;
  --popper-theme-border-radius: 6px;
  --popper-theme-padding: 6px;
  --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
  @apply text-xs;
}
</style>
