<template>
  <div class="search-view w">
    <SearchForm />
  </div>
</template>

<script setup lang="ts" name="SearchView">
import { useRoute } from 'vue-router'
import SearchForm from '@/components/SearchForm.vue';
const route = useRoute()


</script>

<style scoped>
</style>
