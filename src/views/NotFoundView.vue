<script setup lang="ts">
import { t } from '@/utils/i18n'
</script>

<template>
  <div class="not-found">
    <h1>{{ t('pages.notFound.pageNotFound') }}</h1>
    <p>{{ t('pages.notFound.pageNotFoundDescription') }}</p>
    <router-link to="/">{{ t('pages.notFound.goToHome') }}</router-link>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 2rem;
}
</style>
