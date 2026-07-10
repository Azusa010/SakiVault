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

  function getMusicKey(music: Music): string {
    return `${music.source}-${music.id}`
  }
  // 当前歌曲的下标
  const currentIndex = computed(() => {
    if (!currentMusic.value) return -1
    const currentKey = getMusicKey(currentMusic.value)
    return playlist.value.findIndex((item) => getMusicKey(item) === currentKey)
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
  async function play(music: Music) {
    isLoadingUrl.value = true
    error.value = null

    try {
      currentMusic.value = music

      const result = await getMusicUrl(music)
      if (!result.url) {
        currentUrl.value = null
        throw new Error('无可用播放地址')
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

  // 将未在队列中的歌曲追加到末尾，并且播放
  async function enqueueAndPlay(music: Music) {
    await enqueue(music)
    await play(music)
  }

  function isInPlaylist(music: Music): boolean {
    const musicKey = getMusicKey(music)
    return playlist.value.some((item) => getMusicKey(item) === musicKey)
  }

  async function enqueue(music: Music) {
    if (!isInPlaylist(music)) {
      playlist.value.push(music)
    }
  }

  // 从队列中移除歌曲，如果当前播放的歌曲被移除，则播放下一首或上一首
  async function removeFromPlaylist(music: Music) {
    const musicKey = getMusicKey(music)
    const removeIndex = playlist.value.findIndex((item) => getMusicKey(item) === musicKey)

    if (removeIndex === -1) return

    const isCurrentMusic = removeIndex === currentIndex.value
    const fallbackMusic = playlist.value[removeIndex+1] ??playlist.value[removeIndex-1] ?? null

    playlist.value.splice(removeIndex, 1)

    if(!isCurrentMusic) return

    if(fallbackMusic) {
      await play(fallbackMusic)
      return
    }

    clearCurrent()
  }

  // playNext() 播放下一首
  async function playNext() {
    if (!hasNext.value) return

    const nextMusic = playlist.value[currentIndex.value + 1]
    if (nextMusic) {
      await play(nextMusic)
    }
  }

  // playPrev() 播放上一首
  async function playPrev() {
    if (!hasPrev.value) return

    const prevMusic = playlist.value[currentIndex.value - 1]
    if (prevMusic) {
      await play(prevMusic)
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
    enqueueAndPlay,
    enqueue,
    isInPlaylist,
    removeFromPlaylist,
  }
})
