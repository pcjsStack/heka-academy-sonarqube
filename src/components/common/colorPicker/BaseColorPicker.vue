<template>
  <div>
    <label
      v-if="label"
      class="block !text-[12px] !leading-[15px] mb-[6px] !text-neutral-700 !font-medium"
    >
      {{ label }}
    </label>
    <div class="flex items-center gap-3">
      <!-- Color Preview -->
      <div
        class="w-[40px] h-[40px] rounded-lg border border-neutral-300 cursor-pointer transition-all"
        :style="{ backgroundColor: modelValue || defaultColor }"
        @click="togglePicker"
      />

      <!-- Color Input -->
      <BaseInput
        :model-value="modelValue || defaultColor"
        type="text"
        :placeholder="placeholder"
        @update:model-value="handleColorChange"
        class="flex-1"
      />

      <!-- Reset Button -->
      <BaseButtonIcon
        v-if="showReset && modelValue !== defaultColor"
        icon="clock-rotate-left"
        variant="outline"
        size="sm"
        color="neutral"
        @click="handleReset"
        class="!rounded-lg"
      />
    </div>

    <!-- Color Picker Dropdown -->
    <Transition name="fade">
      <div v-if="showPicker" class="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div class="space-y-3">
          <!-- Predefined Colors -->
          <div class="grid grid-cols-8 gap-2">
            <div
              v-for="color in predefinedColors"
              :key="color"
              class="w-8 h-8 rounded-md cursor-pointer transition-transform hover:scale-110 border-2"
              :class="
                modelValue === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
              "
              :style="{ backgroundColor: color }"
              @click="selectColor(color)"
            />
          </div>

          <!-- Native Color Picker -->
          <div class="pt-3 border-t border-gray-200">
            <label class="block text-xs font-medium text-gray-600 mb-2"> Custom Color </label>
            <input
              type="color"
              :value="modelValue || defaultColor"
              @input="handleNativeColorChange"
              class="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BaseInput, BaseButtonIcon } from '@/components/common'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  defaultColor?: string
  showReset?: boolean
  predefinedColors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: 'Select a color',
  defaultColor: '#f9fafb',
  showReset: true,
  predefinedColors: () => [
    '#f9fafb',
    '#f3f4f6',
    '#e5e7eb',
    '#d1d5db',
    '#ffffff',
    '#fef3c7',
    '#fde68a',
    '#fcd34d',
    '#dbeafe',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#e0e7ff',
    '#c7d2fe',
    '#a5b4fc',
    '#818cf8',
    '#fce7f3',
    '#fbcfe8',
    '#f9a8d4',
    '#f472b6',
    '#dcfce7',
    '#bbf7d0',
    '#86efac',
    '#4ade80',
    '#ffedd5',
    '#fed7aa',
    '#fdba74',
    '#fb923c',
    '#fee2e2',
    '#fecaca',
    '#fca5a5',
    '#f87171',
  ],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPicker = ref(false)

const togglePicker = () => {
  showPicker.value = !showPicker.value
}

const selectColor = (color: string) => {
  emit('update:modelValue', color)
  showPicker.value = false
}

const handleColorChange = (value: string) => {
  emit('update:modelValue', value)
}

const handleNativeColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleReset = () => {
  emit('update:modelValue', props.defaultColor)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
