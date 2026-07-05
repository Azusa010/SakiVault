<template>
  <div class="search-view w">
    <!-- <SearchForm v-model:keyword="keyword" v-model:year="year" v-model:rating="rating" v-model:tag="tag" @reset="resetFilters" /> -->
    <SearchForm
      v-model:keyword="keyword"
      v-model:year="year"
      v-model:rating="rating"
      v-model:tags="tags"
      @reset="resetFilters"
    />
    <SearchResults
      :results="results"
      :loading="loading"
      :error="error"
      :hasMore="hasMore"
      :hasActiveFilter="hasActiveFilter"
      @load-more="handleLoadMore"
      @retry="search"
    />
  </div>
</template>

<script setup lang="ts" name="SearchView">
import { watch, onMounted } from 'vue'
import { useRoute, useRouter, } from 'vue-router'
import SearchForm from '@/components/SearchForm.vue'
import SearchResults from '@/components/SearchResults.vue'
import { useAnimeSearch } from '@/composables/useAnimeSearch'

const route = useRoute()
const router = useRouter()
const {
  keyword,
  year,
  rating,
  tags,
  results,
  loading,
  error,
  hasMore,
  hasActiveFilter,
  search,
  loadMore,
  resetFilters,
} = useAnimeSearch({
  initialKeyword: getQueryString(route.query.keyword),
  initialYear: getQueryString(route.query.year),
  initialRating: getQueryNumber(route.query.rating),
  initialTags: getQueryStringArray(route.query.tag),
})

function getQueryString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function getQueryNumber(value: unknown) {
  const num = typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(num) ? num : undefined
}

function getQueryStringArray(value: unknown) {
  if (typeof value === 'string') return value.length > 0 ? [value] : undefined
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
  }
}

watch([keyword, year, rating, tags], () => {
  const query: Record<string, string | string[]> = {}

  if (keyword.value.trim()) query.keyword = keyword.value.trim()
  if (year.value) query.year = year.value
  if (rating.value) query.rating = String(rating.value)
  if (tags.value && tags.value.length > 0) query.tag = tags.value

  router.replace({ query })
})

function handleLoadMore() {
  loadMore()
}


</script>

<style scoped></style>
