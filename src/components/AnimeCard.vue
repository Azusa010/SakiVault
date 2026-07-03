<template>
  <RouterLink :to="`/anime/${anime.id}`" class="anime-card">
    <div class="cover-wrapper">
      <img :src="anime.coverImage" :alt="anime.title" loading="lazy" />
    </div>
    <div class="info">
      <h3 class="title">{{ anime.title }}</h3>
      <div class="meta">
        <span v-if="anime.averageScore" class="score">{{ anime.averageScore }}⭐</span>
        <span v-if="anime.episodes">{{ anime.episodes }} 集</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts" name="">
import { RouterLink } from 'vue-router'
import  {type Anime}  from '@/types/anime'

defineProps<{
  anime: Anime
}>()
</script>

<style scoped>
.anime-card {
  display: block;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--surface-card);
  transition:
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.anime-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.cover-wrapper {
  aspect-ratio: 3 / 4;
  overflow: hidden;
}

.cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-normal) var(--ease-out);
}

.anime-card:hover .cover-wrapper img {
  transform: scale(1.05);
}

.title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.95rem;
  color: var(--text-main);
  margin: var(--space-sm) 0;
  padding: 0 var(--space-sm);
}

.meta {
  display: flex;
  gap: var(--space-sm);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.score {
  color: var(--color-primary);
}
</style>
