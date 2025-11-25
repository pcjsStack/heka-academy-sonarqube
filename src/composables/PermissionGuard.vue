<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Permission } from '@/types/Users'

interface Props {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireAll: false,
  fallback: false,
})

const userStore = useUserStore()

const hasAccess = computed(() => {
  if (props.permission) {
    return userStore.permissions.includes(props.permission)
  }
  if (!props.permission && !props.permissions) {
    return props.fallback
  }
  return props.fallback
})
</script>

<template>
  <div v-if="hasAccess">
    <slot />
  </div>
  <div v-else-if="$slots.fallback">
    <slot name="fallback" />
  </div>
</template>
