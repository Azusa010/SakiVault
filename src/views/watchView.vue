<template>
  <main class="watch-view">
    <RouterLink class="back-link" :to="{ name: 'anime-detail', params: { id } }">
      ← 返回详情
    </RouterLink>

    <section class="watch-content">
      <p class="eyebrow">观看来源 · {{ sourceName || '未选择' }}</p>
      <h1>{{ animeTitle || '正在查找播放来源' }}</h1>

      <p v-if="isLoading" class="state-message">正在搜索来源...</p>

      <p v-else-if="errorMessage" class="state-message is-error">{{ errorMessage }}</p>

      <p v-else-if="results.length === 0" class="state-message">该来源没有找到匹配结果。</p>

      <div v-else class="result-list">
        <button v-for="result in results" :key="result.url" type="button" class="result-item">
          <span>{{ result.name }}</span>
          <small>已找到播放页面</small>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts" name="WatchView">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getAnimeById } from '@/api/bangumi'
import type { AnimeSourceSearchResult } from '@/utils/xpathParser'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const sourceName = computed(() => {
  return typeof route.query.source === 'string' ? route.query.source : ''
})

const animeTitle = ref('')

const results = ref<AnimeSourceSearchResult[]>([])

const isLoading = ref(false)

const errorMessage = ref('')

async function searchSource(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  results.value = []

  try {
    if (!window.electronAPI?.isDesktop) throw new Error('视频来源解析仅支持 Electron 桌面端')

    if (!sourceName.value) throw new Error('没有选择播放来源')

    const [anime, rule] = await Promise.all([
      getAnimeById(id.value),
      window.electronAPI.loadAnimeRule(sourceName.value),
    ])

    animeTitle.value = anime.title

    results.value = await window.electronAPI.searchAnime(rule, anime.title)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : ''
  } finally {
    isLoading.value = false
  }
}

watch(
  [id, sourceName],
  () => {
    void searchSource()
  },
  { immediate: true },
)
</script>

<style scoped>
.watch-view {
  min-height: 100vh;
  padding: 32px clamp(20px, 7vw, 120px);
  color: var(--text-main);
}

.back-link {
  color: var(--text-muted);
  text-decoration: none;
}

.watch-content {
  width: min(760px, 100%);
  margin: 84px auto;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 0.9rem;
}

h1 {
  margin: 0 0 32px;
  font-size: clamp(1.8rem, 4vw, 3rem);
}

.state-message {
  color: var(--text-muted);
}

.state-message.is-error {
  color: #ff9aac;
}

.result-list {
  display: grid;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.04);
  text-align: left;
}

.result-item small {
  color: var(--text-muted);
}
</style>
