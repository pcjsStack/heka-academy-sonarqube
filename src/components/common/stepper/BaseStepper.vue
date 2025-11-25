<script setup lang="ts">
// import { computed } from 'vue'

defineProps({
  steps: {
    type: Array as () => Array<{ label: string }>,
    required: true,
  },
  currentStep: {
    type: Number,
    required: true,
  },
})

// const progressWidth = computed(() => {
//   if (props.currentStep === 1) return '0%'
//   const percentage = ((props.currentStep - 1) / (props.steps.length - 1)) * 100
//   return `${percentage}%`
// })
</script>
<template>
  <div class="stepper-container md:!max-w-[450px] lg:!max-w-[557px]">
    <div class="flex items-center justify-between relative gap-4 sm:gap-4 md:gap-2.5 lg:gap-4">
      <!-- Progress line -->
      <div
        class="absolute top-5 md:top-4 lg:top-5 left-[60px] md:left-[45px] lg:left-[60px] right-[60px] md:right-[45px] lg:right-[60px] border-t border-dashed border-grey-700 z-0"
      ></div>
      <div
        class="absolute top-1/2 left-0 h-[2px] bg-blue-600 transition-all duration-300 -translate-y-1/2 z-10"
        :style="{ width: 100 }"
      ></div>

      <!-- Steps -->
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="flex flex-col items-center relative z-20 bg-white flex-shrink-0"
      >
        <div
          class="w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-300 font-medium tracking-[-0.016px]"
          :class="[
            currentStep > index + 1
              ? 'bg-success-500 text-white'
              : currentStep === index + 1
                ? 'bg-[rgba(25,117,255,0.1)] text-primary-550'
                : 'bg-gray-50 text-neutral-500',
          ]"
        >
          <span v-if="currentStep > index + 1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 md:h-4 md:w-4 lg:h-5 lg:w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <span v-else class="text-xs md:text-[11px] lg:text-xs">{{ index + 1 }}</span>
        </div>
        <span
          class="text-[12px] sm:text-[14px] md:text-[13px] lg:text-[14px] mt-[8px] sm:mt-[12px] md:mt-[10px] lg:mt-[12px] font-medium leading-[17px] tracking-[-0.016px]"
          :class="
            currentStep > index + 1
              ? 'text-neutral-700'
              : currentStep >= index + 1
                ? 'text-primary-550'
                : 'text-neutral-500'
          "
        >
          {{ step.label }}
        </span>
      </div>
    </div>
  </div>
</template>
<style scoped>
.stepper-container {
  @apply w-full max-w-[557px] mx-auto;
}
</style>
