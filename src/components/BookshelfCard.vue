<template>
  <RouterLink :to="`/anime/${anime.id}`" class="bookshelf-card">
    <div class="card-spine">
      <img :src="anime.coverImage" :alt="anime.title" loading="lazy" />
      <div class="spine-shine"></div>
    </div>
    <div class="card-info">
      <h3 class="title">{{ anime.title }}</h3>
      <div class="meta">
        <span v-if="anime.averageScore" class="score">{{ anime.averageScore }}分</span>
        <span v-if="anime.episodes">{{ anime.episodes }} 集</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Anime } from '@/types/anime'

interface Props {
  anime: Anime
}

defineProps<Props>()
</script>

<style scoped>
.bookshelf-card {
  position: relative;
  display: block;
  width: 180px;
  flex-shrink: 0;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-sm);
  overflow: hidden;
  transform-style: preserve-3d;
  transition:
    transform var(--duration-normal) var(--ease-pop),
    box-shadow var(--duration-normal) var(--ease-out);
  box-shadow:
    -2px 4px 8px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.card-spine {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-sm);
}

.card-spine img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-normal) var(--ease-out);
}

/* 封面高光：模拟塑料/纸质反光 */
.spine-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 35%,
    rgba(255, 255, 255, 0.08) 45%,
    transparent 55%
  );
  pointer-events: none;
  opacity: 0.6;
}

.card-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 8px 8px;
  background: linear-gradient(to top, rgba(11, 14, 20, 0.95), rgba(11, 14, 20, 0));
  transform: translateY(100%);
  transition: transform var(--duration-normal) var(--ease-out);
}

.title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.25;
  margin-bottom: 4px;
}

.meta {
  display: flex;
  gap: var(--space-xs);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.score {
  color: var(--color-primary);
}

/* hover：卡片向前弹出、回正、信息层上滑 */
.bookshelf-card:hover {
  transform: translateZ(28px) rotateY(0deg) scale(1.08);
  box-shadow:
    0 0 20px rgba(0, 255, 204, 0.25),
    0 12px 24px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.bookshelf-card:hover .card-spine img {
  transform: scale(1.08);
}

.bookshelf-card:hover .card-info {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .bookshelf-card {
    width: 100%;
    aspect-ratio: 3 / 4;
  }

  .card-info {
    transform: translateY(0);
    padding-top: 24px;
  }
}
</style>
