<template>
  <div class="app">
    <NavBar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts" name="">
import NavBar from './components/NavBar.vue';
import { RouterView } from 'vue-router';


</script>

<style scoped>
 .app{
  min-height: 100vh;
 }
 .main-content{
  padding-top: 90px;
 }
</style>
