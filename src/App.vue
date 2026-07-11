<template>
  <div class="app">
    <MusicPlayer @fullscreen-change="handleFullscreenChange"></MusicPlayer>
    
    <template v-if="!isMusicFullscreen">
      <NavBar />
      <main class="main-content">
        <PearBlossom></PearBlossom>
        <MouseEffect></MouseEffect>
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="['HomeView']">
            <Component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
    </template>
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
