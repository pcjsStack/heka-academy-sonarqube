<script setup lang="ts">
withDefaults(
  defineProps<{
    userName?: string
    filesCount?: number
    coursesCount?: number
  }>(),
  {
    userName: 'Sarah Elison',
    filesCount: 1119,
    coursesCount: 80,
  },
)
</script>

<template>
  <section class="px-4 lg:px-8 py-6 w-full">
    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between w-full mx-auto">
      <!-- Greeting -->
      <div class="flex-1">
        <h2 class="text-[24px] font-normal text-neutral-500 mb-[12px] leading-[32px]">
          Hello, <b class="font-semibold text-neutral-700">{{ userName }}</b> 👋
        </h2>
        <p class="text-[14px] leading-[22px] text-neutral-500 font-medium">
          Access courses, track progress, and enhance your skills to grow professionally.
        </p>
      </div>
    </div>
  </section>
</template>
