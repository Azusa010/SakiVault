<template>
  <div class="">

  </div>
</template>

<script setup lang="ts" name="HomeView">
import { onMounted } from "vue";
import { getCurrentSeasonAnime, getPopularAnime } from "@/api/anilist";

onMounted(async () => {
  const current = await getCurrentSeasonAnime()
  const popular = await getPopularAnime()
  console.log('当季新番:', current)
  console.log('热门番剧:', popular)
})
</script>

<style scoped>
</style>
