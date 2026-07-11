<template>
  <div class="app">
    <MusicPlayer @fullscreen-change="handleFullscreenChange"></MusicPlayer>

    <div v-show="!isMusicFullscreen">
      <NavBar :performance-mode="isPerformanceMode" @toggle-performance="togglePerformanceMode" />
      <main class="main-content">
        <PearBlossom v-if="!isPerformanceMode"></PearBlossom>
        <MouseEffect v-if="!isPerformanceMode"></MouseEffect>
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="['HomeView']">
            <Component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts" name="">
import MusicPlayer from './components/MusicPlayer.vue'
import NavBar from './components/NavBar.vue'
import { RouterView } from 'vue-router'
import PearBlossom from '@/components/PearBlossom.vue'
import MouseEffect from '@/components/MouseEffect.vue'
import { ref } from 'vue'

const isMusicFullscreen = ref(false)

function handleFullscreenChange(isFullscreen: boolean) {
  isMusicFullscreen.value = isFullscreen
}

const PERFORMANCE_MODE_STORAGE_KEY = 'sakivault:performance-mode'

function readPerformanceMode(): boolean {
  try {
    return window.localStorage.getItem(PERFORMANCE_MODE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const isPerformanceMode = ref(readPerformanceMode())

function togglePerformanceMode(): void {
  const nextMode = !isPerformanceMode.value

  isPerformanceMode.value = nextMode
  try {
    window.localStorage.setItem(PERFORMANCE_MODE_STORAGE_KEY, String(nextMode))
  } catch {}
}
</script>

<style scoped>
.app {
  min-height: 100vh;
}
.main-content {
  padding-top: var(--nav-offset-top);
  padding-bottom: var(--nav-offset-bottom);
}
</style>
