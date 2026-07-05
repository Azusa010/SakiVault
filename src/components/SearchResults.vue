<template>
  <div class="search-results">
    <!-- 错误 -->
    <div v-if="error" class="state-message error">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="handleRetry">重新加载</button>
    </div>
    <!-- 首次加载 -->
    <div v-else-if="loading && results.length === 0" class="state-message">
      <div class="results-grid">
        <SkeletonCard v-for="n in 10" :key="n"/>
      </div>
    </div>
    <!-- 还没搜 -->
    <div v-else-if="!hasActiveFilter && results.length === 0" class="state-message">
      <p>输入关键词或者筛选条件开始搜索</p>
    </div>
    <!-- 结果为空 -->
     <div v-else-if="results.length===0" class="state-message">
      <p>没有找到相关结果</p>
    </div>
    <!-- 有结果 -->
     <div v-else>
      <div class="results-grid">
        <AnimeCard
          v-for="anime in results"
          :key="anime.id"
          :anime="anime"
        />
      </div>
      <!-- 加载更多 -->
       <div v-if="hasMore" class="load-more">
        <button @click="handleLoadMore" class="load-more-btn" :disabled="loading" >
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
       </div>
     </div>


  </div>
</template>

<script setup lang="ts" name="SearchResults">
import { type Anime } from '@/types/anime'
import SkeletonCard from './SkeletonCard.vue';
import AnimeCard from './AnimeCard.vue'

defineProps<{
  results: Anime[]
  loading: boolean
  error: string | null
  hasMore: boolean
  hasActiveFilter: boolean
}>()

const emit = defineEmits<{
  'load-more': []
  'retry': []
}>()

const handleLoadMore = () => {
  emit('load-more')
}

const handleRetry = () => {
  emit('retry')
}
</script>

<style scoped>
.search-results {
  padding: var(--space-lg) var(--space-md);
  max-width: 1280px;
  margin: 0 auto;
}

.state-message {
  text-align: center;
  color: var(--text-muted);
}

.state-message.error {
  color: var(--color-error);
}

.retry-btn,
.load-more-btn {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-overlay);
  background-color: var(--surface-card);
  color: var(--text-main);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.retry-btn:hover,
.load-more-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-md);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: var(--space-xl);
}
</style>
