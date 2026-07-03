<template>
  <div class="home-view">
    <!-- Hero轮播图 -->
    <HeroCarousel :items="currentSeasonAnime.slice(0, 5)" />
    <!-- Hero区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">SakiVault</h1>
        <p class="hero-subtitle">发现你的下一部神作</p>
        <!-- 搜索栏 -->
        <section class="search-section">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索番剧..."
              @keyup.enter="handleSearch"
            />
            <button @click="handleSearch">搜索</button>
          </div>
        </section>
      </div>
    </section>
    <!-- 当季新番 -->
    <section class="section">
      <h2 class="section-title">当季新番</h2>
      <div v-if="loading" class="grid">
        <SkeletonCard v-for="n in 10" :key="n" />
      </div>
      <div v-else class="grid">
        <AnimeCard v-for="anime in currentSeasonAnime" :key="anime.id" :anime="anime" />
      </div>
    </section>

    <!-- 热门番剧 -->
    <section class="section">
      <h2 class="section-title">热门番剧</h2>
      <div v-if="popularLoading" class="grid">
        <SkeletonCard v-for="n in 10" :key="n" />
      </div>
      <div v-else class="grid">
        <AnimeCard v-for="anime in popularAnime" :key="anime.id" :anime="anime" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts" name="HomeView">
import HeroCarousel from '@/components/HeroCarousel.vue'
import { ref, onMounted, reactive } from 'vue'
import { type Anime } from '@/types/anime'
import { getCurrentSeasonAnime, getPopularAnime } from '@/api/bangumi'
import { useRouter } from 'vue-router'
import AnimeCard from '@/components/AnimeCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'

// 搜索功能
const router = useRouter()
const searchQuery = ref('')

function handleSearch() {
  const query = searchQuery.value.trim()
  if (query !== '') {
    router.push({
      path: '/search',
      query: { q: query },
    })
  }
}

// 数据获取
const loading = ref(true)
const popularLoading = ref(true)
const popularError = ref('')
const popularAnime = ref<Anime[]>([])
const currentSeasonAnime = ref<Anime[]>([])

onMounted(async () => {
  loading.value = true
  popularLoading.value = true
  try {
    const [current, popular] = await Promise.all([getCurrentSeasonAnime(), getPopularAnime(12)])
    currentSeasonAnime.value = current
    popularAnime.value = popular
  } catch (error: any) {
    console.error(error)
    popularError.value = '获取数据失败'
  } finally {
    loading.value = false
    popularLoading.value = false
  }
})
</script>

<style scoped>
.hero {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  background: radial-gradient(circle at 50% 50%, rgba(52, 109, 186, 0.15), transparent 60%);
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
}

.search-section {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
}
.search-box {
  display: flex;
  gap: var(--space-sm);
  max-width: 520px;
  margin: 0 auto;
}

.search-box input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-overlay);
  background-color: var(--surface-card);
  color: var(--text-main);
  font-size: 1rem;
}

.search-box input:focus {
  outline: 2px solid var(--color-primary);
}

.search-box button {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  border: none;
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--duration-fast);
}

.search-box button:hover {
  background-color: var(--color-primary-hover);
}

.section {
  padding: var(--space-xl) var(--space-md);
  max-width: 1280px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: var(--space-lg);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-lg);
}
</style>
