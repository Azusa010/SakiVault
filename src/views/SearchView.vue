<template>
  <div class="search-view w">
    <!-- <SearchForm v-model:keyword="keyword" v-model:year="year" v-model:rating="rating" v-model:tag="tag" @reset="resetFilters" /> -->
     <SearchForm v-model:keyword="keyword"/>
  </div>
</template>

<script setup lang="ts" name="SearchView">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import SearchForm from '@/components/SearchForm.vue';
const route = useRoute()
const keyword = ref('')

</script>

<style scoped>
</style>
