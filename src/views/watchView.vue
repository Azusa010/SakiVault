<template>
  <main class="watch-view">
    <RouterLink class="back-link" :to="{ name: 'anime-detail', params: { id } }">
      ← 返回详情
    </RouterLink>

    <section class="watch-content">
      <p class="eyebrow">观看来源 · {{ sourceName || '未选择' }}</p>
      <h1>{{ animeTitle || '正在查找播放来源' }}</h1>

      <section v-if="streamSource||isStreamLoading||streamErrorMessage" class="playback-section">
        <p v-if="playingEpisode" class="playing-title">正在播放{{ playingEpisode.title }}</p>

        <AnimeVideoPlayer :source="streamSource" @error="handlePlayerError" />

        <p v-if="isStreamLoading" class="state-message">正在解析</p>
        <p v-else-if="streamErrorMessage" class="state-message is-error">
          {{ streamErrorMessage }}
        </p>
      </section>

      <p v-if="isLoading" class="state-message">正在搜索来源...</p>

      <p v-else-if="errorMessage" class="state-message is-error">
        {{ errorMessage }}
      </p>

      <template v-else>
        <p v-if="results.length === 0" class="state-message">该来源没有找到匹配结果。</p>

        <div v-else class="result-list">
          <button
            v-for="result in results"
            :key="result.url"
            type="button"
            class="result-item"
            :class="{ 'is-selected': selectedResult?.url === result.url }"
            @click="selectSearchResult(result)"
          >
            <span>{{ result.name }}</span>
            <small>加载剧集</small>
          </button>
        </div>

        <section v-if="selectedResult" class="episode-section">
          <h2>{{ selectedResult.name }}</h2>

          <p v-if="isEpisodeLoading" class="state-message">正在解析线路与剧集...</p>

          <p v-else-if="episodeErrorMessage" class="state-message is-error">
            {{ episodeErrorMessage }}
          </p>

          <p v-else-if="episodeRoutes.length === 0" class="state-message">
            该结果没有解析到可用剧集。
          </p>

          <template v-else>
            <div class="route-tabs">
              <button
                v-for="(episodeRoute, index) in episodeRoutes"
                :key="episodeRoute.name"
                type="button"
                :class="{ active: selectedRouteIndex === index }"
                @click="selectedRouteIndex = index"
              >
                {{ episodeRoute.name }}
              </button>
            </div>

            <div v-if="selectedRoute" class="episode-grid">
              <button
                v-for="episode in selectedRoute.episodes"
                :key="episode.url"
                class="episode-item"
                :class="{'is-playing':playingEpisode?.url===episode.url}"
                :disabled="isStreamLoading"
                @click="playEpisode(episode)"
              >
                {{ episode.title }}
              </button>
            </div>
          </template>
        </section>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts" name="WatchView">
import { computed, ref, watch ,shallowRef} from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getAnimeById } from '@/api/bangumi'
import type { KazumiSourceRule } from '@/utils/sourceRule'
import type {
  AnimeSourceEpisodeRoute,
  AnimeSourceSearchResult,
  AnimeSourceEpisode,
  AnimeStreamSource,
} from '@/utils/xpathParser'
import AnimeVideoPlayer from '@/components/AnimeVideoPlayer.vue'

const route = useRoute()

// 当前 Bangumi 条目 ID。
const id = computed(() => Number(route.params.id))

// 用户选择的 Kazumi 规则名称。
const sourceName = computed(() => {
  return typeof route.query.source === 'string' ? route.query.source : ''
})

// 当前番剧标题。
const animeTitle = ref('')

// 当前规则。
const activeRule = shallowRef<KazumiSourceRule | null>(null)

// 来源搜索结果。
const results = ref<AnimeSourceSearchResult[]>([])

// 当前选中的搜索结果。
const selectedResult = ref<AnimeSourceSearchResult | null>(null)

// 解析到的线路与剧集。
const episodeRoutes = ref<AnimeSourceEpisodeRoute[]>([])

// 当前选中的线路下标。
const selectedRouteIndex = ref(0)

// 搜索来源状态。
const isLoading = ref(false)

// 解析剧集状态。
const isEpisodeLoading = ref(false)

// 搜索来源失败信息。
const errorMessage = ref('')

// 解析剧集失败信息。
const episodeErrorMessage = ref('')

// 已成功解析并正在播放的剧集
const playingEpisode = ref<AnimeSourceEpisode | null>(null)

// 当前可播放的视频流
const streamSource = ref<AnimeStreamSource | null>(null)

// 解析视频流状态
const isStreamLoading = ref(false)

// 解析视频流失败信息
const streamErrorMessage = ref('')

// 当前选中的线路。
const selectedRoute = computed(() => {
  return episodeRoutes.value[selectedRouteIndex.value] ?? null
})

// 搜索当前番剧的来源结果。
async function searchSource(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  results.value = []
  selectedResult.value = null
  episodeRoutes.value = []

  try {
    if (!window.electronAPI?.isDesktop) {
      throw new Error('视频来源解析仅支持 Electron 桌面端')
    }

    if (!sourceName.value) {
      throw new Error('没有选择播放来源')
    }

    const [anime, rule] = await Promise.all([
      getAnimeById(id.value),
      window.electronAPI.loadAnimeRule(sourceName.value),
    ])

    animeTitle.value = anime.title
    activeRule.value = rule
    results.value = await window.electronAPI.searchAnime(rule, anime.title)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '来源搜索失败'
  } finally {
    isLoading.value = false
  }
}

/** 选择一个搜索结果，并解析它的线路与剧集。 */
async function selectSearchResult(result: AnimeSourceSearchResult): Promise<void> {
  if (!activeRule.value || !window.electronAPI) {
    return
  }

  selectedResult.value = result
  playingEpisode.value = null
  streamSource.value = null
  streamErrorMessage.value = ''
  selectedRouteIndex.value = 0
  episodeRoutes.value = []
  episodeErrorMessage.value = ''
  isEpisodeLoading.value = true

  try {
    episodeRoutes.value = await window.electronAPI.loadAnimeEpisodes(activeRule.value, result.url)
  } catch (error) {
    episodeErrorMessage.value = error instanceof Error ? error.message : '剧集解析失败'
  } finally {
    isEpisodeLoading.value = false
  }
}

// 解析剧集播放页，并把最终媒体流交给播放器
async function playEpisode(episode: AnimeSourceEpisode): Promise<void> {
  if (!window.electronAPI) return

  isStreamLoading.value = true
  streamErrorMessage.value = ''

  try {
    const source = await window.electronAPI.resolveAnimeStream(episode.url)
    playingEpisode.value = episode
    streamSource.value = source
  } catch (error) {
    streamErrorMessage.value = error instanceof Error ? error.message : '视频流解析失败'
  } finally {
    isStreamLoading.value = false
  }
}

// 接受播放器内部的HLS或原生媒体错误
function handlePlayerError(message: string): void {
  streamErrorMessage.value = message
}
/** 条目或来源变化后重新搜索。 */
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
  cursor: pointer;
}

.result-item:hover,
.result-item.is-selected {
  border-color: rgba(0, 255, 204, 0.5);
  background: rgba(0, 255, 204, 0.1);
}

.result-item small {
  color: var(--text-muted);
}

.episode-section {
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.episode-section h2 {
  margin: 0 0 18px;
  font-size: 1.25rem;
}

.route-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.route-tabs button {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
}

.route-tabs button.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
}

.episode-item {
  padding: 10px;
  border-radius: 8px;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.06);
  text-align: center;
}
.playback-section {
  margin: 0 0 32px;
}

.playing-title {
  margin: 0 0 10px;
  color: var(--text-muted);
}

.episode-item {
  border: 1px solid transparent;
  cursor: pointer;
}

.episode-item:hover,
.episode-item.is-playing {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.episode-item:disabled {
  cursor: wait;
  opacity: 0.6;
}
</style>
