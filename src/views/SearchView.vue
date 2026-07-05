<template>
  <div class="search-view w">
    <!-- <SearchForm v-model:keyword="keyword" v-model:year="year" v-model:rating="rating" v-model:tag="tag" @reset="resetFilters" /> -->
     <SearchForm v-model:keyword="keyword"/>
    <SearchResults :results="[]" :loading="false" :error="null" :hasMore="false" :hasActiveFilter="false" @load-more="handleLoadMore" @retry="handleRetry" /><
  </div>
</template>

<script setup lang="ts" name="SearchView">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import SearchForm from '@/components/SearchForm.vue';
import SearchResults from "@/components/SearchResults.vue";
const route = useRoute()
const keyword = ref('')

</script>

<style scoped>
</style>
