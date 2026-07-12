<template>
  <section v-if="source" class="anime-video-player">
    <video
      ref="videoElement"
      class="video"
      controls
      autoplay
      playsinline
      @error="emit('error', '视频加载失败')"
    />
  </section>
</template>

<script setup lang="ts" name="AnimeVideoPlayer">
import Hls from 'hls.js'
import { onBeforeUnmount, ref, watch } from 'vue'
import type { AnimeStreamSource } from '@/utils/xpathParser'

const props = defineProps<{
  source: AnimeStreamSource | null
}>()

const emit = defineEmits<{
  error: [message: string]
}>()

const videoElement = ref<HTMLVideoElement | null>(null)

let hls: Hls | null = null

// 停止当前媒体并释放HLS资源
function disposePlayer(): void {
  hls?.destroy()
  hls = null

  if (videoElement.value) {
    videoElement.value.pause()
    videoElement.value.removeAttribute('src')
    videoElement.value.load()
  }
}

// 按流类型初始化原生播放器或hls.js
function loadSource(source: AnimeStreamSource): void {
  disposePlayer()

  const video = videoElement.value

  if (!video || !source) return

  const isHlsStream = new URL(source.url).pathname.toLowerCase().endsWith('.m3u8')

  if (isHlsStream && Hls.isSupported()) {
    hls = new Hls()
    hls.loadSource(source.url)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      void video.play().catch(() => {})
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) emit('error', 'HLS视频流加载失败')
    })
    return
  }
  video.src = source.url
  void video.play().catch(() => {})
}

watch(
  () => props.source,
  (source) => {
    if (source) loadSource(source)
  },
  { flush: 'post' },
)
onBeforeUnmount(disposePlayer)
</script>

<style scoped>
.anime-video-player {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: #000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}
</style>
