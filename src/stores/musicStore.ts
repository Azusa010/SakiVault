import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { type Music } from '@/types/music'
import { getMusicUrl, searchMusic } from '@/api/music'

export const useMusicStore = defineStore('music', () => {
  const keyword = ref('')
  const searchResults = ref<Music[]>([])
  const playlist = ref<Music[]>([])
  const currentMusic = ref<Music | null>(null)
  const currentUrl = ref<string | null>(null)
  const isSearching = ref(false)
  const isLoadingUrl = ref(false)
  const error = ref<string | null>(null)

  // 当前歌曲的下标
  const currentIndex = computed(() => {
    if (!currentMusic.value) return -1
    return playlist.value.findIndex((item) => item.id === currentMusic.value?.id)
  })

  // 是否有下一首
  const hasNext = computed(
    () => currentIndex.value >= 0 && currentIndex.value < playlist.value.length - 1,
  )
  // 是否有上一首
  const hasPrev = computed(() => currentIndex.value > 0)

  // 搜索音乐
  async function search() {
    const value = keyword.value.trim()
    if (!value) return
    isSearching.value = true
    error.value = null
    try {
      searchResults.value = await searchMusic(value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '搜索音乐失败'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  // play()  设置队列，获取URL，准备播放
  async function play(music: Music, queue: Music[] = searchResults.value) {
    isLoadingUrl.value = true
    error.value = null
    try {
      playlist.value = queue
      currentMusic.value = music

      const result = await getMusicUrl(music)
      if (!result.url) {
        currentUrl.value = null
        throw new Error('没有可用播放地址')
      }
      currentUrl.value = result.url

      if (result.isPreview) {
        error.value = '备用音源不可用，当前播放试听片段'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取音乐播放地址失败'
    } finally {
      isLoadingUrl.value = false
    }
  }

  // playNext() 播放下一首
  async function playNext() {
    if (!hasNext.value) return

    const nextMusic = playlist.value[currentIndex.value + 1]
    if (nextMusic) {
      await play(nextMusic, playlist.value)
    }
  }

  // playPrev() 播放上一首
  async function playPrev() {
    if (!hasPrev.value) return

    const prevMusic = playlist.value[currentIndex.value - 1]
    if (prevMusic) {
      await play(prevMusic, playlist.value)
    }
  }

  //  清空当前播放
  function clearCurrent() {
    currentMusic.value = null
    currentUrl.value = null
    error.value = null
  }
  return {
    keyword,
    searchResults,
    playlist,
    currentMusic,
    currentUrl,
    isSearching,
    isLoadingUrl,
    error,
    currentIndex,
    hasNext,
    hasPrev,
    search,
    play,
    playNext,
    playPrev,
    clearCurrent,
  }
})
