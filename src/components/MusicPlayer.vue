<template>
  <section class="music-player">
    <form class="music-search" @submit.prevent="musicStore.search">
      <input type="text" placeholder="搜索音乐" class="music-input" v-model="musicStore.keyword" />
      <button type="submit" class="music-search-btn" :disabled="musicStore.isSearching">
        {{ musicStore.isSearching ? '搜索中' : '搜索' }}
      </button>
    </form>

    <p v-if="musicStore.error" class="music-error">{{ musicStore.error }}</p>

    <!-- 搜索结果 -->
    <div v-if="musicStore.searchResults.length > 0" class="music-results">
      <button
        type="button"
        v-for="music in musicStore.searchResults"
        :key="`${music.source}-${music.id}`"
        class="music-result"
        @click="musicStore.play(music)"
      >
        <img :src="music.coverUrl" v-if="music.coverUrl" alt="" class="music-cover" />
        <div v-else class="music-cover music-cover-empty">♪</div>

        <div class="music-info">
          <span class="music-name">{{ music.name }}</span>
          <span class="music-artist">{{ formatArtists(music.artist) }}</span>
        </div>
      </button>
    </div>

    <!-- 播放器 -->
    <div class="music-playbar">
      <audio
        :src="musicStore.currentUrl || undefined"
        ref="audioRef"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @ended="handleEnded"
      />
      <!-- 播放信息 -->
      <div class="playing-info">
        <img
          v-if="musicStore.currentMusic?.coverUrl"
          :src="musicStore.currentMusic?.coverUrl"
          alt=""
          class="playing-cover"
        />
        <div v-else class="playing-cover playing-cover-empty">♪</div>

        <div class="playing-text">
          <span class="playing-name">{{ musicStore.currentMusic?.name || '未播放' }}</span>
          <span class="playing-artist">{{
            musicStore.currentMusic
              ? formatArtists(musicStore.currentMusic?.artist)
              : '选择一首音乐'
          }}</span>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="play-controls">
        <button
          type="button"
          class="control-btn"
          :disabled="!musicStore.hasPrev"
          @click="musicStore.playPrev"
        >
          上一首
        </button>

        <button
          type="button"
          class="play-btn"
          :disabled="!musicStore.currentUrl"
          @click="togglePlay"
        >
          {{ isPlaying ? '暂停' : '播放' }}
        </button>
        <button
          type="button"
          class="control-btn"
          :disabled="!musicStore.hasNext"
          @click="musicStore.playNext"
        >
          下一首
        </button>
      </div>

      <!-- 播放进度 -->
      <div class="progress-row">
        <span class="time-text">{{ formatTime(currentTime) }}</span>
        <input
          class="progress-input"
          type="range"
          min="0"
          :max="duration || 0"
          :disabled="!duration"
          @input="handleSeek"
          :value="currentTime"
        />
        <span class="time-text">{{ formatTime(duration) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts" name="MusicPlayer">
import { nextTick, ref, watch } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import type { Music } from '@/types/music'

const musicStore = useMusicStore()

function formatArtists(artists: Music['artist']): string {
  return artists.map((artist) => artist.name).join(' / ')
}

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// 格式化播放时间
function formatTime(time: number): string {
  if (!Number.isFinite(time)) return '00:00'

  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// 播放/暂停 歌曲
async function togglePlay() {
  const audio = audioRef.value
  if (!audio || !musicStore.currentUrl) return

  if (audio.paused) {
    await audio.play()
    isPlaying.value = true
  } else {
    audio.pause()
    isPlaying.value = false
  }
}

// 拖动进度条进行跳转
function handleSeek(event: Event) {
  const audio = audioRef.value
  const target = event.target as HTMLInputElement

  if (!audio) return

  audio.currentTime = Number(target.value)
  currentTime.value = audio.currentTime
}
// 音频元数据加载后记录总时长
function handleLoadedMetadata() {
  duration.value = audioRef.value?.duration || 0
}

// 播放过程中同步当前时间
function handleTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime || 0
}
// 自动播放下一首
async function handleEnded() {
  isPlaying.value = false
  await musicStore.playNext()
}

// 播放地址变化后,自动播放
watch(
  () => musicStore.currentUrl,
  async (url) => {
    currentTime.value = 0
    duration.value = 0
    isPlaying.value = false

    if (!url) return

    await nextTick()

    try {
      await audioRef.value?.play()
      isPlaying.value = true
    } catch {
      isPlaying.value = false
    }
  },
)
</script>

<style scoped>
.music-player {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 120;
  width: min(420px, calc(100vw - 32px));
  padding: var(--space-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  background: rgba(17, 22, 34, 0.92);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(18px);
}

.music-search {
  display: flex;
  gap: var(--space-sm);
}

.music-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-main);
  outline: none;
}

.music-input:focus {
  border-color: var(--color-primary);
}

.music-search-btn {
  width: 72px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary-alpha);
  color: var(--text-main);
  cursor: pointer;
}

.music-search-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.music-error {
  margin-top: var(--space-sm);
  color: #ff6b6b;
  font-size: 0.85rem;
}

.music-results {
  max-height: 260px;
  margin-top: var(--space-sm);
  overflow: auto;
}

.music-result {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
}

.music-result:hover {
  background: rgba(255, 255, 255, 0.06);
}

.music-cover {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.music-cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-hover);
  color: var(--color-primary);
}

.music-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.music-name,
.music-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-name {
  color: var(--text-main);
  font-size: 0.92rem;
  font-weight: 600;
}

.music-artist {
  color: var(--text-muted);
  font-size: 0.78rem;
}
.music-playbar {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.playing-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.playing-cover {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.playing-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.playing-name,
.playing-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playing-name {
  color: var(--text-main);
  font-size: 0.95rem;
  font-weight: 700;
}

.playing-artist {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.play-controls {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.control-btn,
.play-btn {
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--text-main);
  cursor: pointer;
}

.control-btn {
  background: rgba(255, 255, 255, 0.06);
}

.play-btn {
  min-width: 72px;
  background: var(--color-primary);
  color: #06110f;
  font-weight: 700;
}

.control-btn:disabled,
.play-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.progress-row {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.time-text {
  color: var(--text-disabled);
  font-size: 0.75rem;
  text-align: center;
}

.progress-input {
  width: 100%;
  accent-color: var(--color-primary);
}
@media (max-width: 768px) {
  .music-player {
    right: 12px;
    bottom: calc(var(--mobile-tabbar-height) + 12px);
    width: calc(100vw - 24px);
  }
}
</style>
