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

  <!-- 音频常驻 -->
  <audio
    ref="audioRef"
    crossorigin="anonymous"
    :src="musicStore.currentUrl || undefined"
    @loadedmetadata="handleLoadedMetadata"
    @timeupdate="handleTimeUpdate"
    @ended="handleEnded"
    @play="handlePlay"
    @pause="handlePause"
  />

  <!-- 完整播放器 -->
  <Teleport to="body">
    <!-- 调整大小标签 -->
    <button
      v-if="isPanelOpen && !isPlayerFullscreen"
      type="button"
      class="music-resize-tab"
      :class="{ 'is-resizing': isResizing, 'is-snapping': isSnappingFullscreen }"
      :style="{ '--player-width': `${panelWidth}px` }"
      @pointerdown="handleResizeStart"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5v14M12 5v14M16 5v14" />
      </svg>
    </button>

    <section
      v-if="isPanelOpen"
      class="music-player"
      ref="playerPanelRef"
      :class="{ 'is-fullscreen': isPlayerFullscreen, 'is-snapping': isSnappingFullscreen }"
      :style="{
        '--player-width': `${panelWidth}px`,
      }"
    >
      <MusicBackground
        :cover-url="musicStore.currentMusic?.coverUrl || ''"
        :audio="backgroundAudio"
        :is-playing="isPlaying"
        :is-active="isPlayerFullscreen && isPlaying"
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
          <div class="player-home-control">
            <!-- 专辑封面 -->
            <div class="panel-cover-wrap" :class="{ 'is-reduce': !isPlaying }">
              <img
                v-if="musicStore.currentMusic?.coverUrl"
                :src="musicStore.currentMusic.coverUrl"
                alt=""
                class="panel-cover"
              />
              <img v-else src="../assets/pics/emptyCover.png" class="panel-cover" />
            </div>

            <!-- 歌曲信息 -->
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

            <!-- 进度条 -->
            <div class="progress-row">
              <input
                class="progress-input"
                type="range"
                min="0"
                :max="duration || 0"
                :disabled="!duration"
                :value="currentTime"
                :style="{
                  '--progress-ratio': `${duration ? (currentTime / duration) * 100 : 0}%`,
                }"
                @input="handleSeek"
              />
              <span class="time-text">{{ formatTime(currentTime) }}</span>
              <span></span>
              <span class="time-text" style="text-align: end">{{ formatTime(duration) }}</span>
            </div>

            <!-- 播放控制 -->
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
                :style="{ '--volume-ratio': `${volume * 100}%` }"
              />
              <svg
                v-if="isPlayerFullscreen"
                class="volume-max-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4 9v6h4l5 4V5L8 9z" />
                <path d="M16 8.5a5 5 0 0 1 0 7l1.4 1.4a7 7 0 0 0 0-9.8z" />
              </svg>
              <span v-else>{{ Math.round(volume * 100) }}</span>
            </div>

            <!-- 当前播放队列 -->
            <section class="playlist-section">
              <div class="playlist-header">
                <h3>播放队列</h3>
                <span>{{ musicStore.playlist.length }}首</span>
              </div>

              <!-- 播放列表 -->
              <div v-if="musicStore.playlist.length > 0" class="playlist-list">
                <div
                  v-for="(music, index) in musicStore.playlist"
                  :key="`${music.source}-${music.id}`"
                  class="playlist-item"
                  :class="{ 'is-current': musicStore.currentIndex === index }"
                >
                  <button type="button" class="playlist-item-main" @click="musicStore.play(music)">
                    <img
                      v-if="music.coverUrl"
                      :src="music.coverUrl"
                      alt=""
                      class="playlist-cover"
                    />
                    <img v-else src="../assets/pics/emptyCover.png" alt="" class="playlist-cover" />

                    <span class="playlist-index">{{ String(index + 1).padStart(2, '0') }}</span>

                    <span class="playlist-text">
                      <strong>{{ music.name }}</strong>
                      <small>{{ formatArtists(music.artist) }}</small>
                    </span>

                    <svg
                      v-if="musicStore.currentIndex === index"
                      class="playlist-playing-icon"
                      viewBox="0 0 24 24"
                      aria-label="当前播放"
                    >
                      <path d="M5 9h3v6H5zM10.5 5h3v14h-3zM16 8h3v8h-3z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="playlist-remove-btn"
                    aria-label="从播放列表移出歌曲"
                    @click="musicStore.removeFromPlaylist(music)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="m19 6-1 14H6L5 6" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                  </button>
                </div>
              </div>

              <p v-else class="playlist-empty">从搜索页添加音乐到播放队列</p>
            </section>
          </div>

          <!-- 歌词面板 -->
          <aside v-if="isPlayerFullscreen" class="lyrics-panel">
            <p v-if="isLyricsLoading" class="lyrics-status">歌词加载中</p>

            <p v-else-if="lyricsError" class="lyrics-status">{{ lyricsError }}</p>

            <div v-else ref="lyricsTrackRef" class="lyrics-track">
              <p
                v-for="(line, index) in lyricLines"
                :key="`${line.time}-${index}`"
                :data-lyric-index="index"
                class="lyric-line"
                :class="{
                  'is-current': index === currentLyricIndex,
                  'is-past': index < currentLyricIndex,
                }"
              >
                <span>{{ line.text }}</span>
                <small v-if="line.translation">{{ line.translation }}</small>
              </p>
            </div>
          </aside>
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

          <!-- 搜索结果 -->

          <div
            v-for="music in musicStore.searchResults"
            :key="`${music.source}-${music.id}`"
            class="music-result"
          >
            <button
              type="button"
              class="music-result-main"
              @click="musicStore.enqueueAndPlay(music)"
            >
              <img v-if="music.coverUrl" :src="music.coverUrl" alt="" class="music-cover" />
              <img v-else src="../assets/pics/emptyCover.png" alt="" class="music-cover" />

              <span class="music-info">
                <span class="music-name">{{ music.name }}</span>
                <span class="music-artist">{{ formatArtists(music.artist) }}</span>
              </span>
            </button>

            <button
              type="button"
              class="music-enqueue-btn"
              :class="{ 'is-queued': musicStore.isInPlaylist(music) }"
              :aria-label="musicStore.isInPlaylist(music) ? '已加入播放队列' : '添加到播放队列'"
              :disabled="musicStore.isInPlaylist(music)"
              @click="musicStore.enqueue(music)"
            >
              <svg v-if="musicStore.isInPlaylist(music)" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12.5 4.3 4.3L19.5 6.6l-1.4-1.4-8.8 8.8-2.9-2.9z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
              </svg>
            </button>
          </div>

          <div v-if="!musicStore.searchResults.length" class="player-empty-state">
            搜索你想播放的音乐
          </div>
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

        <!-- 全屏播放右侧抽屉，点击外部内容时关闭 -->
        <div
          v-if="isPlayerFullscreen && isFullscreenPlaylistOpen"
          class="fullscreen-playlist-backdrop"
          @click="isFullscreenPlaylistOpen = false"
        />
        <Transition name="fullscreen-playlist-drawer">
          <section
            v-if="isPlayerFullscreen && isFullscreenPlaylistOpen"
            id="fullscreen-playlist"
            class="fullscreen-playlist-popover"
            @click.stop
          >
            <div class="fullscreen-playlist-header">
              <h3>播放列表</h3>
              <span>{{ musicStore.playlist.length }}</span>
            </div>

            <div v-if="musicStore.playlist.length > 0" class="fullscreen-playlist-list">
              <div
                v-for="(music, index) in musicStore.playlist"
                :key="`${music.source}-${music.id}`"
                class="playlist-item"
                :class="{ 'is-current': musicStore.currentIndex === index }"
              >
                <button type="button" class="playlist-item-main">
                  <img v-if="music.coverUrl" :src="music.coverUrl" alt="" class="playlist-cover" />
                  <img v-else src="../assets/pics/emptyCover.png" alt="" class="playlist-cover" />
                  <span class="playlist-index">{{ String(index + 1).padStart(2, '0') }}</span>

                  <span class="playlist-text">
                    <strong>{{ music.name }}</strong>
                    <small>{{ formatArtists(music.artist) }}</small>
                  </span>

                  <svg
                    v-if="musicStore.currentIndex === index"
                    class="playlist-playing-icon"
                    viewBox="0 0 24 24"
                    aria-label="当前播放"
                  >
                    <path d="M5 9h3v6H5zM10.5 5h3v14h-3zM16 8h3v8h-3z" />
                  </svg>
                </button>

                <button
                  type="button"
                  class="playlist-remove-btn"
                  @click="musicStore.removeFromPlaylist(music)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="m19 6-1 14H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </button>
              </div>
            </div>

            <p v-else class="playlist-empty">从搜索页添加音乐到播放列表</p>
          </section>
        </Transition>
      </main>

      <!-- 全屏模式下右下角列表开关 -->
      <button
        v-if="isPlayerFullscreen"
        type="button"
        class="fullscreen-playlist-toggle"
        :class="{ 'is-active': isFullscreenPlaylistOpen }"
        @click.stop="isFullscreenPlaylistOpen = !isFullscreenPlaylistOpen"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h14v2H5zM5 11h14v2H5zM5 16h9v2H5zM17 15v4l3-2z" />
        </svg>
        <span>{{ musicStore.playlist.length }}</span>
      </button>

      <div v-if="isPlayerFullscreen" class="fullscreen-sidebar-hotspot" />
      <!-- 底部导航 -->
      <nav class="music-panel-tabs" :class="{ 'is-fullscreen-sidebar': isPlayerFullscreen }">
        <button
          v-if="isPlayerFullscreen"
          type="button"
          class="fullscreen-collapse-tab"
          aria-label="向右拖动缩小播放器"
          @pointerdown="handleResizeStart"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14M12 5v14M16 5v14" />
          </svg>
        </button>
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
import { nextTick, ref, watch, onBeforeUnmount, computed, reactive, onMounted } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import type { Music } from '@/types/music'
import { getMusicLyric } from '@/api/music'
import { parseLrc, type LyricLine } from '@/utils/lrc'
import MusicBackground from './MusicBackground.vue'
import { createAudioReactiveState, updateAudioReactiveState } from '@/utils/audioReactive'

const musicStore = useMusicStore()

const emit = defineEmits<{
  'fullscreen-change': [isFullscreen: boolean]
}>()

onBeforeUnmount(() => {
  stopAudioAnalysis()
  void audioContext?.close()
})

onMounted(() => {
  if (audioRef.value) audioRef.value.volume = volume.value
})

function formatArtists(artists: Music['artist']): string {
  return artists.map((artist) => artist.name).join(' / ')
}

const audioRef = ref<HTMLAudioElement | null>(null)
const playerPanelRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
type PlayerLyricLine = LyricLine & { translation?: string }
const lyricLines = ref<PlayerLyricLine[]>([])

/** 右侧可滚动歌词容器。 */
const lyricsTrackRef = ref<HTMLElement | null>(null)

const isLyricsLoading = ref(false)
const lyricsError = ref('')

/** 当前播放时间命中的歌词下标；没有歌词时为 -1。 */
const currentLyricIndex = computed(() => {
  const currentMilliseconds = currentTime.value * 1000
  let index = -1

  for (let lineIndex = 0; lineIndex < lyricLines.value.length; lineIndex += 1) {
    if (lyricLines.value[lineIndex]!.time > currentMilliseconds) break
    index = lineIndex
  }
  return index
})

function scrollLyric() {
  const track = lyricsTrackRef.value

  if (!track || currentLyricIndex.value < 0) return

  const currentLine = track.querySelector<HTMLElement>(
    `[data-lyric-index="${currentLyricIndex.value}"]`,
  )

  if (!currentLine) return

  const trackBounds = track.getBoundingClientRect()
  const lineBounds = currentLine.getBoundingClientRect()

  track.scrollTo({
    top:
      track.scrollTop +
      lineBounds.top -
      trackBounds.top -
      track.clientHeight / 2 +
      currentLine.clientHeight / 2,
    behavior: 'smooth',
  })
}

let lyricRequestId = 0

const PLAYER_VOLUME_STORAGE_KEY = 'sakivault:player-volume'

function readPlayerVolume(): number {
  try {
    const savedValue = Number(window.localStorage.getItem(PLAYER_VOLUME_STORAGE_KEY))

    if (Number.isFinite(savedValue) && savedValue >= 0 && savedValue <= 1) {
      return savedValue
    }
  } catch {}
  return 0.8
}

const volume = ref(readPlayerVolume())

// 新背景使用同一份响应式状态；下一步会由新节拍检测更新它。
const backgroundAudio = reactive(createAudioReactiveState())

type CoverPalette = {
  primary: string
  secondary: string
  accent: string
}

const defaultCoverPalette: CoverPalette = {
  primary: '#7b5cff',
  secondary: '#2878c9',
  accent: '#42b99b',
}

const coverPalette = ref<CoverPalette>(defaultCoverPalette)
let paletteRequestId = 0

let audioContext: AudioContext | null = null
let audioSourceNode: MediaElementAudioSourceNode | null = null
let analyserNode: AnalyserNode | null = null
let analysisFrameId: number | null = null

// 完整播放器是否展开
const isPanelOpen = ref(false)

// 右侧播放器当前宽度
const panelWidth = ref(410)

// 是否正在拖动调整播放器宽度
const isResizing = ref(false)

// 播放器是否全屏
const isPlayerFullscreen = ref(false)

// 是否播放2全屏过渡动画
const isSnappingFullscreen = ref(false)

let resizeStartX = 0
let resizeStartWidth = 0

// 控制鼠标悬浮显示迷你控制器
const isMiniVisible = ref(false)

type PlayerPage = 'home' | 'search' | 'library' | 'settings'

const activePage = ref<PlayerPage>('home')

const isFullscreenPlaylistOpen = ref(false)

// 打开完整播放器
function openPanel() {
  isPanelOpen.value = true
  isMiniVisible.value = false

  if (window.innerWidth <= 768) {
    panelWidth.value = window.innerWidth
  }

  updatePlayerFullscreen()
}

// 关闭完整播放器
function closePanel() {
  isPanelOpen.value = false
  panelWidth.value = 410
  updatePlayerFullscreen()
}

// 同步全屏状态，避免重复出发父组件刷新
function updatePlayerFullscreen() {
  const nextFullscreen = panelWidth.value >= window.innerWidth - 1
  if (isPlayerFullscreen.value === nextFullscreen) return

  isPlayerFullscreen.value = nextFullscreen
  emit('fullscreen-change', nextFullscreen)
}

//开始拖动调整条/向左拓宽，向右变窄
function handleResizeStart(event: PointerEvent) {
  if (window.innerWidth <= 768) return

  event.preventDefault()
  isResizing.value = true
  resizeStartX = event.clientX
  resizeStartWidth = panelWidth.value

  window.addEventListener('pointermove', handleResizeMove)
  window.addEventListener('pointerup', handleResizeEnd, { once: true })
}

// 根据指针移动距离更新右侧播放器宽度
//拖动阶段只更新宽度，等松手后再切换全屏状态，避免布局提前跳变。
function handleResizeMove(event: PointerEvent) {
  const minimunWidth = Math.min(360, window.innerWidth)
  const nextWidth = resizeStartWidth + resizeStartX - event.clientX

  panelWidth.value = Math.min(window.innerWidth, Math.max(minimunWidth, nextWidth))
}

// 停止拖动并移处全局事务监听
function handleResizeEnd() {
  isResizing.value = false
  window.removeEventListener('pointermove', handleResizeMove)

  const widthRatio = panelWidth.value / window.innerWidth

  // 普通面板向左宽，超过55%宽度时，自动切换全屏模式
  const shouldEnterFullscreen = !isPlayerFullscreen.value && widthRatio >= 0.55

  // 全屏向右拉，低于65&才退出全屏
  const shouldKeepFullscreen = isPlayerFullscreen.value && widthRatio >= 0.65

  if (shouldEnterFullscreen || shouldKeepFullscreen) {
    isSnappingFullscreen.value = true
    panelWidth.value = window.innerWidth
    updatePlayerFullscreen()

    window.setTimeout(() => {
      isSnappingFullscreen.value = false
    }, 280)
    return
  }

  updatePlayerFullscreen()
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

type RgbColor = {
  red: number
  green: number
  blue: number
}

// 将RGB转换成十六进制颜色字符串
function toHexColor({ red, green, blue }: RgbColor): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

//判断两个候选色是否足够不同，避免颜色过于接近
function getColorDistance(first: RgbColor, second: RgbColor): number {
  return Math.hypot(first.red - second.red, first.green - second.green, first.blue - second.blue)
}

/** 计算 RGB 的感知亮度，范围为 0 到 255。 */
function getBrightness({ red, green, blue }: RgbColor): number {
  return (red * 299 + green * 587 + blue * 114) / 1000
}

/** 将过暗的封面色提亮到可作为动态背景的最低亮度。 */
function liftBackgroundColor(color: RgbColor): RgbColor {
  const brightness = getBrightness(color)
  const minimumBrightness = 52

  if (brightness >= minimumBrightness) return color

  const ratio = (minimumBrightness - brightness) / (255 - brightness)

  return {
    red: Math.round(color.red + (255 - color.red) * ratio),
    green: Math.round(color.green + (255 - color.green) * ratio),
    blue: Math.round(color.blue + (255 - color.blue) * ratio),
  }
}

// 以匿名跨域模式加载封面，允许后续 Canvas 读取像素
function loadCoverImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => res(image)
    image.onerror = () => rej(new Error('封面加载失败'))
    image.src = url
  })
}

// 从封面提取三个高饱和主色,失败返回默认色调
async function extractCoverPalette(url: string): Promise<CoverPalette> {
  try {
    const image = await loadCoverImage(url)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) return defaultCoverPalette

    canvas.width = 32
    canvas.height = 32
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const buckets = new Map<string, { color: RgbColor; count: number }>()

    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index] || 0
      const green = pixels[index + 1] || 0
      const blue = pixels[index + 2] || 0
      const alpha = pixels[index + 3] || 0

      const max = Math.max(red, green, blue)
      const min = Math.min(red, green, blue)
      const saturation = max === 0 ? 0 : (max - min) / max

      const brightness = getBrightness({ red, green, blue })

      if (alpha < 200 || brightness < 34 || max > 238 || saturation < 0.08) continue

      const color = {
        red: Math.floor(red / 32) * 32 + 16,
        green: Math.floor(green / 32) * 32 + 16,
        blue: Math.floor(blue / 32) * 32 + 16,
      }

      const key = `${color.red}-${color.green}-${color.blue}`

      const bucket = buckets.get(key)

      if (bucket) {
        bucket.count += 1
      } else {
        buckets.set(key, { color, count: 1 })
      }
    }

    const candidates = [...buckets.values()]
      .sort((first, second) => second.count - first.count)
      .map((bucket) => bucket.color)

    const colors: RgbColor[] = []

    for (const color of candidates) {
      if (colors.every((selected) => getColorDistance(selected, color) > 72)) {
        colors.push(color)
      }
      if (colors.length === 3) break
    }

    const primary = liftBackgroundColor(colors[0] || { red: 123, green: 92, blue: 255 })
    const secondary = liftBackgroundColor(colors[1] || { red: 40, green: 120, blue: 201 })
    const accent = liftBackgroundColor(colors[2] || { red: 66, green: 185, blue: 155 })
    return {
      primary: toHexColor(primary),
      secondary: toHexColor(secondary),
      accent: toHexColor(accent),
    }
  } catch {
    return defaultCoverPalette
  }
}

// 初始化音频分析节点
function setupAudioAnalysis(): boolean {
  const audio = audioRef.value
  if (!audio) return false

  if (audioContext && analyserNode) return true

  audioContext = new AudioContext()
  audioSourceNode = audioContext.createMediaElementSource(audio)
  analyserNode = audioContext.createAnalyser()

  analyserNode.fftSize = 2048
  analyserNode.smoothingTimeConstant = 0.45

  audioSourceNode.connect(analyserNode)
  analyserNode.connect(audioContext.destination)

  return true
}

// 读取频谱，并将低中高频和节拍脉冲更新到背景状态。
async function startAudioAnalysis() {
  try {
    if (!setupAudioAnalysis() || !audioContext || !analyserNode) return

    await audioContext.resume()

    if (analysisFrameId !== null) return

    const context = audioContext
    const analyser = analyserNode
    const frequencyData = new Uint8Array(analyser.frequencyBinCount)
    let lastAnalysisTimestamp = 0

    const updateAnalysis = (timestamp: number) => {
      analyser.getByteFrequencyData(frequencyData)

      const elapsedSeconds =
        lastAnalysisTimestamp === 0
          ? 1 / 60
          : Math.min((timestamp - lastAnalysisTimestamp) / 1000, 0.1)
      lastAnalysisTimestamp = timestamp

      Object.assign(
        backgroundAudio,
        updateAudioReactiveState(
          backgroundAudio,
          frequencyData,
          context.sampleRate,
          elapsedSeconds,
        ),
      )

      analysisFrameId = requestAnimationFrame(updateAnalysis)
    }

    analysisFrameId = requestAnimationFrame(updateAnalysis)
  } catch (error) {
    console.warn('[music] 音频频谱初始化失败', error)
  }
}

// 停止帧循环，避免内存泄漏
function stopAudioAnalysis() {
  if (analysisFrameId !== null) {
    cancelAnimationFrame(analysisFrameId)
    analysisFrameId = null
  }

  Object.assign(backgroundAudio, createAudioReactiveState())
}

function handlePlay() {
  isPlaying.value = true
  void startAudioAnalysis()
}

function handlePause() {
  isPlaying.value = false
  stopAudioAnalysis()
}

// 播放/暂停 歌曲
async function togglePlay() {
  const audio = audioRef.value
  if (!audio || !musicStore.currentUrl) return

  if (audio.paused) {
    try {
      await audio.play()
    } catch {
      isPlaying.value = false
    }
    return
  }
  audio.pause()
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

// 切歌时请求歌词，请求序号防止旧歌曲慢响应覆盖新歌曲
watch(
  () => musicStore.currentMusic?.id,
  async (musicId) => {
    const requestId = ++lyricRequestId

    lyricLines.value = []
    lyricsError.value = ''

    if (!musicId) return

    isLyricsLoading.value = true

    try {
      const lyrics = await getMusicLyric(musicId)
      if (requestId !== lyricRequestId) return

      const translations = new Map(
        parseLrc(lyrics.translation).map((line) => [line.time, line.text]),
      )

      lyricLines.value = parseLrc(lyrics.lyric).map((line) => ({
        ...line,
        translation: translations.get(line.time),
      }))
    } catch (error) {
      if (requestId === lyricRequestId) {
        lyricsError.value = error instanceof Error ? error.message : '歌词加载失败'
      }
    } finally {
      if (requestId === lyricRequestId) {
        isLyricsLoading.value = false
      }
    }
  },
  { immediate: true },
)

/** 当前行变化或刚进入全屏时，将当前歌词定位到视觉中心。 */
watch([currentLyricIndex, isPlayerFullscreen], async ([index, isFullscreen]) => {
  if (!isFullscreen || index < 0) return

  await nextTick()
  scrollLyric()
})

// 监听当前音乐封面 URL 的变化
watch(
  () => musicStore.currentMusic?.coverUrl,
  async (coverUrl) => {
    const requestId = ++paletteRequestId
    if (!coverUrl) {
      coverPalette.value = defaultCoverPalette
      return
    }
    const palette = await extractCoverPalette(coverUrl)

    if (requestId === paletteRequestId) {
      coverPalette.value = palette
    }
  },
  { immediate: true },
)

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
    } catch {
      isPlaying.value = false
    }
  },
)

watch(volume, (value) => {
  if (audioRef.value) audioRef.value.volume = value

  try {
    window.localStorage.setItem(PLAYER_VOLUME_STORAGE_KEY, String(value))
  } catch {}
})

watch(isPlayerFullscreen, (isFullscreen) => {
  if (!isFullscreen) {
    isMiniVisible.value = false
  }
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
  isolation: isolate;
  background: #15191c;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 140;
  width: min(var(--player-width, 410px), 100vw);
  height: 100vh;
  padding: 22px;
  overflow: hidden;
  overscroll-behavior: contain;
  border: 1px solid rgba(168, 105, 255, 0.22);
  border-radius: 12px 0 0 12px;
  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.52),
    0 0 38px rgba(137, 84, 255, 0.16);
  backdrop-filter: blur(22px);
  transform: none;
  animation: music-panel-in 0.22s ease both;
}

.music-player.is-snapping {
  border-radius: 0;
  transition: width 0.28s cubic-bezier(0.22, 0.8, 0.2, 1);
}

.music-resize-tab.is-snapping {
  transition:
    right 0.28s cubic-bezier(0.22, 0.8, 0.2, 1),
    width 0.16s ease,
    background 0.16s ease;
}

.music-player.is-fullscreen {
  border: 0;
  border-radius: 0;
  padding: 40px 22px 22px 140px;
}

.music-resize-tab {
  position: fixed;
  z-index: 141;
  top: 50%;
  right: calc(var(--player-width) - 1px);
  width: 36px;
  height: 76px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(168, 105, 255, 0.3);
  border-right: 0;
  border-radius: 10px 0 0 10px;
  background: rgba(17, 14, 30, 0.94);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.2);
  color: rgba(218, 189, 255, 0.88);
  cursor: col-resize;
  touch-action: none;
  transform: translateY(-50%);
  transition:
    width 0.16s ease,
    background 0.16s ease;
  animation: music-resize-tab-in 0.24s 0.25s ease-out both;
}

.music-resize-tab:hover,
.music-resize-tab.is-resizing {
  width: 42px;
}

.music-resize-tab svg {
  width: 18px;
  height: 28px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.music-mini-player::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.music-panel-header,
.music-panel-body,
.music-panel-tabs {
  position: relative;
  z-index: 1;
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

@media (min-width: 769px) {
  .music-player.is-fullscreen .music-panel-body {
    overflow: hidden;
  }

  .music-player.is-fullscreen .player-home {
    height: 100%;
    display: grid;
    grid-template-columns: minmax(330px, 36%) minmax(0, 1fr);
    gap: 48px;
  }

  .music-player.is-fullscreen .player-home-control {
    width: min(100%, 415px);
    min-width: 0;
    min-height: 0;
    justify-self: center;
    padding: 8px 0 32px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .music-player.is-fullscreen .panel-cover-wrap {
    width: 100%;
    max-width: none;
    margin-top: 0;
    transition: all 0.28s ease;
  }

  .music-player.is-fullscreen .panel-cover-wrap.is-reduce {
    transform: scale(0.94);
  }

  .music-player.is-fullscreen .panel-track-text,
  .music-player.is-fullscreen .progress-row,
  .music-player.is-fullscreen .play-controls,
  .music-player.is-fullscreen .volume-row {
    width: 100%;
  }

  .music-player.is-fullscreen .playlist-section {
    display: none;
  }

  .lyrics-panel {
    min-width: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    padding: 56px 9vw 96px 24px;
  }

  .lyrics-track {
    width: min(100%, 760px);
    max-height: 100%;
    padding: 42vh 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }

  .lyrics-track::-webkit-scrollbar {
    display: none;
  }

  .lyric-line {
    margin: 0 0 28px;
    color: var(--text-main);
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.2;
    opacity: 0.22;
    filter: blur(2px);
    transform: scale(0.98);
    transform-origin: left center;
    transition:
      opacity 0.28s ease,
      filter 0.28s ease,
      transform 0.28s ease;
  }

  .lyric-line.is-past {
    opacity: 0.42;
  }

  .lyric-line.is-current {
    opacity: 1;
    filter: none;
    transform: scale(1);
  }

  .lyric-line small {
    display: block;
    margin-top: 10px;
    color: var(--text-muted);
    font-size: 1rem;
    font-weight: 500;
  }

  .lyrics-status {
    width: 100%;
    margin: 0;
    color: var(--text-muted);
    font-size: 1rem;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .lyrics-panel {
    display: none;
  }
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

.fullscreen-sidebar-hotspot,
.fullscreen-collapse-tab {
  display: none;
}

@media (min-width: 769px) {
  .music-player.is-fullscreen .fullscreen-sidebar-hotspot {
    position: absolute;
    z-index: 3;
    top: 0;
    bottom: 0;
    left: 0;
    width: 48px;
    display: block;
  }

  .music-panel-tabs.is-fullscreen-sidebar {
    z-index: 4;
    top: 0;
    bottom: 0;
    left: 0;
    right: auto;
    width: 68px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 10px;
    border: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(8, 10, 16, 0.82);
    transform: translateX(calc(-100% - 34px));
    transition: transform 0.22s ease;
  }

  .fullscreen-sidebar-hotspot:hover + .music-panel-tabs.is-fullscreen-sidebar,
  .music-panel-tabs.is-fullscreen-sidebar:hover {
    transform: translateX(0);
  }

  .music-panel-tabs.is-fullscreen-sidebar .panel-tab-btn {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
  }

  .fullscreen-collapse-tab {
    position: absolute;
    top: 50%;
    right: -34px;
    width: 34px;
    height: 72px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid rgba(168, 105, 255, 0.3);
    border-left: 0;
    border-radius: 0 10px 10px 0;
    background: rgba(17, 14, 30, 0.94);
    color: rgba(218, 189, 255, 0.88);
    cursor: col-resize;
    touch-action: none;
  }

  .fullscreen-collapse-tab svg {
    width: 18px;
    height: 28px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-width: 2;
  }
}
.fullscreen-playlist-backdrop,
.fullscreen-playlist-popover,
.fullscreen-playlist-toggle {
  display: none;
}

@media (min-width: 769px) {
  /* 遮罩仅覆盖播放器内容区，点击后关闭右侧抽屉。 */
  .music-player.is-fullscreen .fullscreen-playlist-backdrop {
    position: absolute;
    z-index: 5;
    inset: 0;
    display: block;
  }

  /* 抽屉与 music-panel-body 等高，从内容区右侧滑入。 */
  .music-player.is-fullscreen .fullscreen-playlist-popover {
    position: absolute;
    z-index: 6;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(440px, 52%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(13, 16, 24, 0.86);
    box-shadow: -20px 0 48px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(24px) saturate(1.15);
  }

  .fullscreen-playlist-drawer-enter-active,
  .fullscreen-playlist-drawer-leave-active {
    transition:
      opacity 0.22s ease,
      transform 0.22s cubic-bezier(0.22, 0.8, 0.2, 1);
  }

  .fullscreen-playlist-drawer-enter-from,
  .fullscreen-playlist-drawer-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }

  .fullscreen-playlist-header {
    display: flex;
    flex: 0 0 auto;
    align-items: baseline;
    justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .fullscreen-playlist-header h3 {
    margin: 0;
    color: var(--text-main);
    font-size: 1rem;
  }

  .fullscreen-playlist-header span {
    color: var(--text-disabled);
    font-size: 0.75rem;
  }

  /* 只有歌曲区域滚动，标题始终保留在顶部。 */
  .fullscreen-playlist-list {
    min-height: 0;
    flex: 1;
    display: grid;
    align-content: start;
    gap: 5px;
    overflow-y: auto;
    padding: 10px 12px 16px;
    overscroll-behavior: contain;
  }

  .fullscreen-playlist-popover .playlist-empty {
    margin: auto 0;
    padding: 30px 18px;
  }

  /* 右下角开关在遮罩上方，因此可再次点击关闭。 */
  .music-player.is-fullscreen .fullscreen-playlist-toggle {
    position: absolute;
    z-index: 7;
    right: 32px;
    bottom: 24px;
    width: 52px;
    height: 52px;
    display: grid;
    grid-template-columns: 20px auto;
    place-content: center;
    align-items: center;
    gap: 3px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 50%;
    background: rgba(13, 16, 24, 0.72);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    color: rgba(255, 255, 255, 0.92);
    cursor: pointer;
    backdrop-filter: blur(16px);
    transition:
      transform 0.18s ease,
      background-color 0.18s ease;
  }

  .fullscreen-playlist-toggle:hover,
  .fullscreen-playlist-toggle.is-active {
    background: rgba(119, 79, 187, 0.72);
    transform: scale(1.06);
  }

  .fullscreen-playlist-toggle:active {
    transform: scale(0.94);
  }

  .fullscreen-playlist-toggle svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  .fullscreen-playlist-toggle span {
    align-self: end;
    font-size: 0.64rem;
    font-variant-numeric: tabular-nums;
  }
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
  font-weight: 600;
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
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: underline;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-md);
  transition: background-color 0.18s ease;
}

.music-result:hover {
  background: rgba(255, 255, 255, 0.06);
}

.music-result-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
}

.music-enqueue-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(159, 93, 255, 0.12);
  color: var(--color-primary);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.music-enqueue-btn:hover {
  background: rgba(117, 251, 207, 0.8);
  color: #2d2741;
  transform: scale(1.06);
}

.music-enqueue-btn.is-queued,
.music-enqueue-btn:disabled {
  background: rgba(117, 251, 207, 0.12);
  color: #75fbcf;
  cursor: default;
  opacity: 1;
}

.music-enqueue-btn:disabled:hover {
  background: rgba(117, 251, 207, 0.12);
  color: #75fbcf;
  transform: none;
}

.music-result-main:focus-visible,
.music-enqueue-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.music-enqueue-btn svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
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

.playlist-section {
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.playlist-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.playlist-header h3 {
  margin: 0;
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 700;
}

.playlist-header span {
  color: var(--text-disabled);
  font-size: 0.75rem;
}

.playlist-list {
  display: grid;
  gap: 5px;
}

.playlist-item {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  transition: background-color 0.18s ease;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.playlist-item.is-current {
  background: rgba(159, 93, 255, 0.14);
}

.playlist-item-main {
  min-width: 0;
  min-height: 54px;
  display: grid;
  grid-template-columns: 38px 26px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 9px;
  padding: 7px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
}

.playlist-remove-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-disabled);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.playlist-remove-btn:hover {
  background: rgba(255, 107, 107, 0.14);
  color: #ff7777;
}

.playlist-item-main:focus-visible,
.playlist-remove-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.playlist-remove-btn svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.playlist-cover {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  object-fit: cover;
}

.playlist-index {
  color: var(--text-disabled);
  font-size: 0.72rem;
  text-align: center;
}

.playlist-item.is-current .playlist-index {
  color: var(--color-primary);
}

.playlist-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.playlist-text strong,
.playlist-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-text strong {
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 600;
}

.playlist-text small {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.playlist-playing-icon {
  width: 18px;
  height: 18px;
  fill: var(--color-primary);
}

.playlist-empty {
  margin: 0;
  padding: 20px 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
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

@media (min-width: 769px) {
  .music-player.is-fullscreen .play-controls {
    align-items: center;
    gap: 16px;
    margin-top: 28px;
  }

  .music-player.is-fullscreen .control-btn,
  .music-player.is-fullscreen .play-btn {
    width: 54px;
    min-width: 0;
    height: 54px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: rgba(255, 255, 255, 0.94);
    transition:
      transform 0.18s ease,
      opacity 0.18s ease;
  }

  .music-player.is-fullscreen .play-btn {
    width: 64px;
    height: 64px;
    color: #ffffff;
  }

  .music-player.is-fullscreen .control-btn:hover:not(:disabled),
  .music-player.is-fullscreen .play-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.06);
  }

  .music-player.is-fullscreen .control-btn:active:not(:disabled),
  .music-player.is-fullscreen .play-btn:active:not(:disabled) {
    transform: scale(0.92);
  }

  .music-player.is-fullscreen .control-btn svg {
    width: 30px;
    height: 30px;
  }

  .music-player.is-fullscreen .play-btn svg {
    width: 36px;
    height: 36px;
  }

  .music-player.is-fullscreen .progress-input {
    appearance: none;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.88) 0 var(--progress-ratio),
      rgba(255, 255, 255, 0.28) var(--progress-ratio) 100%
    );
    cursor: pointer;
  }

  .music-player.is-fullscreen .progress-input::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 999px;
    background: transparent;
  }

  .music-player.is-fullscreen .progress-input::-webkit-slider-thumb {
    appearance: none;
    width: 0;
    height: 0;
    margin-top: 3px;
    border: 0;
    border-radius: 50%;
    background: #ffffff;
    opacity: 0;
    transition:
      width 0.16s ease,
      height 0.16s ease,
      margin 0.16s ease,
      opacity 0.16s ease;
  }

  .music-player.is-fullscreen .progress-input:hover::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    margin-top: -3px;
    opacity: 1;
  }

  .music-player.is-fullscreen .progress-input::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.28);
  }

  .music-player.is-fullscreen .progress-input::-moz-range-progress {
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
  }

  .music-player.is-fullscreen .volume-row {
    grid-template-columns: 24px 1fr 24px;
    gap: 14px;
    margin-top: 30px;
  }

  .music-player.is-fullscreen .volume-row > svg,
  .music-player.is-fullscreen .volume-max-icon {
    width: 22px;
    height: 22px;
    color: rgba(255, 255, 255, 0.88);
    fill: currentColor;
  }

  .music-player.is-fullscreen .volume-input {
    appearance: none;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.88) 0 var(--volume-ratio),
      rgba(255, 255, 255, 0.28) var(--volume-ratio) 100%
    );
    cursor: pointer;
  }

  .music-player.is-fullscreen .volume-input::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 999px;
    background: transparent;
  }

  .music-player.is-fullscreen .volume-input::-webkit-slider-thumb {
    appearance: none;
    width: 0;
    height: 0;
    margin-top: 3px;
    border: 0;
    opacity: 0;
  }

  .music-player.is-fullscreen .volume-input:hover::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    margin-top: -3px;
    border-radius: 50%;
    background: #ffffff;
    opacity: 1;
  }
}
</style>
