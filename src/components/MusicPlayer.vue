<template>
  <section class="music-player-shell" @mouseenter="showMiniPlayer" @mouseleave="hideMiniPlayer">
    <!-- 收起时  侧边唱片 -->
    <button
      type="button"
      class="music-edge-tab"
      :class="{ 'is-spinning': isPlaying }"
      @click="openPanel"
    >
      <span class="vinyl-disc">
        <span class="vinyl-cover">
          <img
            v-if="musicStore.currentMusic?.coverUrl"
            :src="musicStore.currentMusic.coverUrl"
            alt=""
          />
          <img v-else src="../assets/pics/emptyCover.png" class="vinyl-cover" />
        </span>
      </span>
    </button>

    <!-- hover 迷你控制栏 -->
    <div v-if="isMiniVisible && !isPanelOpen" class="music-mini-player" @click="openPanel">
      <!-- 迷你播放器内容 -->
      <div class="mini-track">
        <img
          v-if="musicStore.currentMusic?.coverUrl"
          :src="musicStore.currentMusic.coverUrl"
          alt=""
          class="mini-cover"
        />
        <img v-else class="mini-cover mini-cover-empty" src="../assets/pics/emptyCover.png" />

        <div class="mini-text">
          <span class="mini-name">{{ musicStore.currentMusic?.name || 'SakiVault Player' }}</span>
          <span class="mini-artist">
            {{
              musicStore.currentMusic
                ? formatArtists(musicStore.currentMusic.artist)
                : '点击展开播放器'
            }}
          </span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="mini-controls">
        <button
          type="button"
          class="mini-control-btn"
          :disabled="!musicStore.hasPrev"
          @click.stop="musicStore.playPrev"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 5h2v14H6z" />
            <path d="M19 6v12L9.5 12z" />
          </svg>
        </button>

        <button
          type="button"
          class="mini-play-btn"
          :disabled="!musicStore.currentUrl"
          @click.stop="togglePlay"
        >
          <svg v-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 5h3v14H7z" />
            <path d="M14 5h3v14h-3z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <button
          type="button"
          class="mini-control-btn"
          :disabled="!musicStore.hasNext"
          @click.stop="musicStore.playNext"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 5h2v14h-2z" />
            <path d="M5 6v12l9.5-6z" />
          </svg>
        </button>
      </div>
    </div>
  </section>

  <!-- 完整播放器 -->
  <Teleport to="body">
    <section v-if="isPanelOpen" class="music-player">
      <audio
        :src="musicStore.currentUrl || undefined"
        ref="audioRef"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @ended="handleEnded"
      />

      <!-- 播放器头部 -->
      <header class="music-panel-header">
        <!-- 品牌标识 -->
        <div class="music-panel-brand">
          <span class="panel-brand-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 5.5v13h2v-13H7z" />
              <path d="M11 3v18h2V3h-2z" />
              <path d="M15 7.5v9h2v-9h-2z" />
              <path d="M3 9.5v5h2v-5H3z" />
              <path d="M19 10.5v3h2v-3h-2z" />
            </svg>
          </span>
          <span>SakiVault Player</span>
        </div>
        <button type="button" class="music-close-btn" @click="closePanel">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z"
            />
          </svg>
        </button>
      </header>

      <main class="music-panel-body">
        <!-- 首页 -->
        <section v-if="activePage === 'home'" class="player-page player-home">
          <div class="panel-cover-wrap">
            <img
              v-if="musicStore.currentMusic?.coverUrl"
              :src="musicStore.currentMusic.coverUrl"
              alt=""
              class="panel-cover"
            />
            <img v-else src="../assets/pics/emptyCover.png" class="panel-cover" />
          </div>

          <div class="panel-track-text">
            <h2 class="panel-track-title">{{ musicStore.currentMusic?.name || '未播放' }}</h2>
            <span>
              {{
                musicStore.currentMusic
                  ? formatArtists(musicStore.currentMusic.artist)
                  : '选择一首音乐'
              }}
            </span>
          </div>

          <div class="progress-row">
            <input
            class="progress-input"
              type="range"
              min="0"
              :max="duration || 0"
              :disabled="!duration"
              :value="currentTime"
              @input="handleSeek"
              />
              <span class="time-text">{{ formatTime(currentTime) }}</span>
              <span></span>
            <span class="time-text" style="text-align: end;">{{ formatTime(duration) }}</span>
          </div>


          <div class="play-controls">
            <button
              class="control-btn"
              :disabled="!musicStore.hasPrev"
              @click="musicStore.playPrev"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 5h2v14H6z" />
                <path d="M19 6v12L9.5 12z" />
              </svg>
            </button>

            <button class="play-btn" :disabled="!musicStore.currentUrl" @click="togglePlay">
              <svg v-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 5h3v14H7z" />
                <path d="M14 5h3v14h-3z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <button
              class="control-btn"
              :disabled="!musicStore.hasNext"
              @click="musicStore.playNext"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 5h2v14h-2z" />
                <path d="M5 6v12l9.5-6z" />
              </svg>
            </button>
          </div>

          <!-- 音量控制 -->
          <div class="volume-row">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              <path d="M16 8.5a5 5 0 0 1 0 7l1.4 1.4a7 7 0 0 0 0-9.8z" />
            </svg>
            <input
              type="range"
              class="volume-input"
              min="0"
              max="1"
              step="0.01"
              v-model.number="volume"
            />
            <span>{{ Math.round(volume * 100) }}</span>
          </div>
        </section>
        <!-- 搜索页 -->
        <section v-else-if="activePage === 'search'" class="player-page player-search">
          <form class="music-search" @submit.prevent="musicStore.search">
            <input
              type="text"
              placeholder="搜索音乐"
              class="music-input"
              v-model="musicStore.keyword"
            />
            <button type="submit" class="music-search-btn" :disabled="musicStore.isSearching">
              {{ musicStore.isSearching ? '搜索中' : '搜索' }}
            </button>
          </form>

          <p v-if="musicStore.error" class="music-error">{{ musicStore.error }}</p>

          <div v-if="musicStore.searchResults.length > 0" class="music-results">
            <button
              v-for="music in musicStore.searchResults"
              :key="`${music.source}-${music.id}`"
              type="button"
              class="music-result"
              @click="musicStore.play(music)"
            >
              <img v-if="music.coverUrl" :src="music.coverUrl" alt="" class="music-cover" />
              <img v-else src="../assets/pics/emptyCover.png" alt="" class="music-cover" />

              <div class="music-info">
                <span class="music-name">{{ music.name }}</span>
                <span class="music-artist">{{ formatArtists(music.artist) }}</span>
              </div>
            </button>
          </div>
          <div v-else class="player-empty-state">搜索你想播放的音乐</div>
        </section>

        <!-- 收藏/歌单页 -->
        <section v-else-if="activePage === 'library'" class="player-page player-placeholder">
          <span>歌单收藏</span>
          <p>暂未开放</p>
        </section>

        <!-- 设置页 -->
        <section v-else class="player-page player-placeholder">
          <span>设置</span>
          <p>暂未开放</p>
        </section>
      </main>

      <nav class="music-panel-tabs">
        <button
          type="button"
          class="panel-tab-btn"
          :class="{ active: activePage === 'home' }"
          @click="activePage = 'home'"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 11.2 12 4l8 7.2v8.3c0 .8-.7 1.5-1.5 1.5H15v-6h-6v6H5.5c-.8 0-1.5-.7-1.5-1.5z"
            />
          </svg>
        </button>
        <button
          type="button"
          class="panel-tab-btn"
          :class="{ active: activePage === 'search' }"
          @click="activePage = 'search'"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M10.8 4a6.8 6.8 0 0 1 5.3 11.1l3.4 3.4-1.4 1.4-3.4-3.4A6.8 6.8 0 1 1 10.8 4m0 2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6"
            />
          </svg>
        </button>
        <button
          type="button"
          class="panel-tab-btn"
          :class="{ active: activePage === 'library' }"
          @click="activePage = 'library'"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 4h12c1.1 0 2 .9 2 2v14l-8-3.6L4 20V6c0-1.1.9-2 2-2m0 2v10.9l6-2.7 6 2.7V6z"
            />
          </svg>
        </button>
        <button
          type="button"
          class="panel-tab-btn"
          :class="{ active: activePage === 'settings' }"
          @click="activePage = 'settings'"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 2.5A8 8 0 0 0 7 6L4.6 5l-2 3.5 2 1.5c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5L10 22h4l.4-2.5A8 8 0 0 0 17 18l2.4 1 2-3.5zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8"
            />
          </svg>
        </button>
      </nav>
    </section>
  </Teleport>
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

const volume = ref(0.8)

// 完整播放器是否展开
const isPanelOpen = ref(false)

// 控制鼠标悬浮显示迷你控制器
const isMiniVisible = ref(false)

type PlayerPage = 'home' | 'search' | 'library' | 'settings'

const activePage = ref<PlayerPage>('home')

// 打开完整播放器
function openPanel() {
  isPanelOpen.value = true
  isMiniVisible.value = false
}

// 关闭完整播放器
function closePanel() {
  isPanelOpen.value = false
}

// 显示迷你控制栏
function showMiniPlayer() {
  if (isPanelOpen.value) return
  isMiniVisible.value = true
}

// 隐藏迷你控制栏(){
function hideMiniPlayer() {
  isMiniVisible.value = false
}

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

watch(volume, (value) => {
  if (audioRef.value) audioRef.value.volume = value
})
</script>

<style scoped>
.music-player-shell {
  position: fixed;
  right: 0;
  top: 58%;
  z-index: 130;
  transform: translateY(-50%);
}

.music-edge-tab {
  width: 76px;
  height: 76px;
  padding: 0;
  border: 0;
  border-radius: 999px 0 0 999px;
  background: transparent;
  cursor: pointer;
  transform: translateX(32px);
  transition:
    transform 0.24s ease,
    filter 0.24s ease;
}

.music-edge-tab:hover {
  transform: translateX(18px);
  filter: drop-shadow(0 0 18px rgba(159, 93, 255, 0.45));
}

.vinyl-disc {
  position: relative;
  display: block;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, #15151d 0 8px, #050509 9px 14px, transparent 15px),
    repeating-radial-gradient(circle at center, #111118 0 3px, #050507 4px 6px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 0 18px rgba(255, 255, 255, 0.05),
    0 12px 30px rgba(0, 0, 0, 0.45);
}

.vinyl-disc::before {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.vinyl-disc::after {
  content: '';
  position: absolute;
  inset: 19px;
  border-radius: 50%;
  border: 1px solid rgba(168, 105, 255, 0.35);
}

.vinyl-cover {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(159, 93, 255, 0.95), rgba(95, 224, 255, 0.8));
  color: white;
  font-size: 0.9rem;
  transform: translate(-50%, -50%);
}

.vinyl-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-edge-tab.is-spinning .vinyl-disc {
  animation: vinyl-spin 4s linear infinite;
}

@keyframes vinyl-spin {
  to {
    transform: rotate(360deg);
  }
}

.music-mini-player {
  position: absolute;
  right: 58px;
  top: 50%;
  width: 292px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(168, 105, 255, 0.22);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(20, 22, 34, 0.96), rgba(12, 14, 22, 0.92)), rgba(10, 12, 18, 0.94);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.42),
    0 0 28px rgba(137, 84, 255, 0.16);
  backdrop-filter: blur(18px);
  transform: translateY(-50%);
  cursor: pointer;
  animation: mini-player-in 0.2s ease both;
}

.music-mini-player::after {
  content: '';
  position: absolute;
  right: -18px;
  top: 0;
  width: 28px;
  height: 100%;
}

.mini-track {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-cover {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  object-fit: cover;
}

.mini-cover-empty {
  display: grid;
  place-items: center;
  background: rgba(159, 93, 255, 0.18);
  color: #c78bff;
}

.mini-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mini-name,
.mini-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-name {
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 700;
}

.mini-artist {
  color: var(--text-muted);
  font-size: 0.76rem;
}

.mini-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-control-btn,
.mini-play-btn {
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: var(--text-main);
  cursor: pointer;
}

.mini-control-btn svg,
.mini-play-btn svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.mini-play-btn svg {
  width: 16px;
  height: 16px;
}

.mini-control-btn {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 1.2rem;
}

.mini-play-btn {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #9f5dff, #c77dff);
  color: #fff;
  box-shadow: 0 0 18px rgba(159, 93, 255, 0.42);
  font-size: 0.8rem;
  font-weight: 700;
}

.mini-control-btn:disabled,
.mini-play-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

@keyframes mini-player-in {
  from {
    opacity: 0;
    transform: translate(12px, -50%);
  }

  to {
    opacity: 1;
    transform: translate(0, -50%);
  }
}

.music-player {
  position: fixed;
  display: flex;
  flex-direction: column;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 140;
  width: min(410px, 100vw);
  height: 100vh;
  padding: 22px;
  overflow: hidden;
  overscroll-behavior: contain;
  border: 1px solid rgba(168, 105, 255, 0.22);
  border-radius: 12px 0 0 12px;
  background:
    linear-gradient(160deg, rgba(18, 21, 32, 0.97), rgba(8, 10, 16, 0.95)), rgba(12, 14, 22, 0.96);
  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.52),
    0 0 38px rgba(137, 84, 255, 0.16);
  backdrop-filter: blur(22px);
  transform: none;
  animation: music-panel-in 0.22s ease both;
}

.music-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.music-panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 88px;
  overscroll-behavior: contain;
}

.player-page {
  animation: player-page-in 0.18s ease both;
}

.player-placeholder {
  min-height: 420px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--text-muted);
}

.player-placeholder span {
  color: var(--text-main);
  font-weight: 700;
}

.player-placeholder p {
  margin: 0;
  font-size: 0.85rem;
}

.player-empty-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.music-panel-tabs {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 12px 18px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 10, 16, 0.86);
  backdrop-filter: blur(18px);
}

.panel-tab-btn {
  height: 44px;
  display: grid;
  place-items: center;
  gap: 3px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.68rem;
}

.panel-tab-btn svg {
  width: 26px;
  height: 26px;
  fill: currentColor;
}

.panel-tab-btn.active {
  background: rgba(159, 93, 255, 0.16);
  color: #97d1c0;
}

@keyframes player-page-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.music-panel-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  font-size: 0.95rem;
  font-weight: 800;
}

.panel-brand-icon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(199, 125, 255, 0.14);
  color: #75fbcf;
}

.panel-brand-icon svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.music-close-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  cursor: pointer;
}

.music-close-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.music-close-btn:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.1);
}

.panel-cover-wrap {
  margin-top: 18px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.panel-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.panel-track-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 18px;
}
.panel-track-title {
  font-weight: 400;
}

.panel-track-text strong {
  overflow: hidden;
  color: var(--text-main);
  font-size: 1.12rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-track-text span {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.86rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.play-controls svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.play-btn svg {
  width: 22px;
  height: 22px;
}

@keyframes music-panel-in {
  from {
    opacity: 0;
    transform: translateX(24px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
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
  margin-top: var(--space-sm);
  overflow: visible;
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

.volume-row {
  display: grid;
  grid-template-columns: 22px 1fr 36px;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  color: var(--text-muted);
}

.volume-row svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.volume-input {
  width: 100%;
  accent-color: var(--color-primary);
}

.volume-row span {
  color: var(--text-disabled);
  font-size: 0.76rem;
  text-align: right;
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
  justify-content: space-evenly;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.time-text {
  color: var(--text-main);
  font-size: 0.75rem;
}

.progress-input {
  grid-column: 1/-1;
  width: 100%;
  accent-color: var(--color-primary);
}
@media (max-width: 768px) {
  .music-player {
    right: 0;
    width: 100vw;
    border-radius: 0;
  }

  .music-edge-tab {
    transform: translateX(36px);
  }

  .music-mini-player {
    display: none;
  }
}
</style>
