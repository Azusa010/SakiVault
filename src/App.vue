<template>
  <div class="app">
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
  </div>
</template>

<script setup lang="ts" name="">
import NavBar from './components/NavBar.vue'
import { RouterView } from 'vue-router'
import PearBlossom from '@/components/PearBlossom.vue'
import MouseEffect from '@/components/MouseEffect.vue';
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
