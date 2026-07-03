<template>
  <!-- banner -->
  <div class="detail-view" v-if="anime">
    <!-- banner背景 -->
    <div class="banner" :style="`background-image: url(${anime.coverImage})`">
      <div class="banner-overlay"></div>
    </div>

    <!-- 内容区 -->
    <div class="content">
      <!-- 信息卡片 -->
      <div class="info-card">
        <img :src="anime.coverImage" alt="Anime Cover" class="poster" />
        <div class="info-text">
          <h1 class="title">{{ anime.title }}</h1>
          <div class="meta">
            <div class="scoreBox" style="display: flex; flex-direction: column; gap: 0px">
              <span v-if="count">{{ count }} 人评分:</span>
              <StarRating v-if="anime.averageScore" :score="anime.averageScore" />
            </div>
            <div class="dateBox" style="display: flex; flex-direction: column; gap: 0px;">
              <p>{{ (anime.infobox as Array<{ key: string }>)[3]?.key }}:</p>
              <span v-if="anime.date" style="color: white; font-size: 20px;" >{{ anime.date }}</span>
            </div>
            <span v-if="anime.episodes" style="color:white; font-size: 20px;" >{{ anime.episodes }} 集</span>
          </div>
          <button class="fav-btn">收藏</button>
        </div>
      </div>
    </div>
    <!-- 剧情简介 -->
    <!-- <section class="summary">
      <h2>剧情简介</h2>
      <p>{{ anime.summary }}</p>
    </section> -->
  </div>
</template>

<script setup lang="ts" name="">
import { useRoute } from 'vue-router'
import { getAnimeById } from '@/api/bangumi'
import { onMounted, ref } from 'vue'
import '@/assets/font_ftpgxlinezk/iconfont.css'
import StarRating from '@/components/StarRating.vue'

const route = useRoute()
const id = Number(route.params.id)
interface Anime {
  id: number
  title: string
  coverImage: string
  averageScore: number
  episodes: number
  summary: string
  date: string
  tags: string[]
  infobox: Array<{ key: string } | null | undefined>
  rating: { count: Record<string, number> }
  meta_tags: string[]
}
const anime = ref<Anime | null>(null)
const count = ref(0)
onMounted(async () => {
  anime.value = await getAnimeById(id)
  const ratingCount = anime.value?.rating?.count
  if (!ratingCount) return
  for (const key in ratingCount) {
    count.value += ratingCount[key] ?? 0
  }
  console.log(anime.value);

})
</script>

<style scoped>
.detail-view {
  min-height: 100vh;
  color: var(--text-main);
}
.banner {
  position: absolute;
  top: 80px;
  width: 100%;
  height: 500px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  filter: blur(10px);
  animation: alternate-reverse bannerMove 30s infinite ease-in-out;
}

@keyframes bannerMove {
  0% {
    background-position: top;
  }
  100% {
    background-position: bottom;
  }
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(17, 22, 34, 1));
}
.content {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 20px;
  margin-top: 150px;
}

.info-card {
  padding: 0 115px;
  display: flex;
  gap: var(--space-xl);
  margin-top: -103px;
  position: relative;
  z-index: 1;
}
.poster {
  width: 200px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  flex-shrink: 0;
}

.info-text {
  padding-top: 0px;
}

.title {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: var(--space-md);
}

.meta {
  font-size: 16px;
  display: flex;
  gap: var(--space-md);
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
  flex-direction: column;
}

.score {
  color: var(--color-primary);
}

.fav-btn {
  padding: var(--space-sm) var(--space-xl);
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.summary-section {
  margin-top: var(--space-xl);
  max-width: 800px;
}

.summary-section h2 {
  font-size: 1.25rem;
  margin-bottom: var(--space-md);
}

.summary-text {
  line-height: 1.8;
  color: var(--text-muted);
}

.summary-text.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toggle-btn {
  margin-top: var(--space-md);
  background: transparent;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 600;
}
</style>
