<template>
  <div class="home-view">
    <!-- Hero轮播图 -->
    <HeroCarousel :items="currentSeasonAnime.slice(0, 5)" />
    <div
      class="hero-spacer"
      style="position: relative; width: 1px; height: 100vh; pointer-events: none"
    ></div>
    <!-- Hero区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">SakiVault</h1>
        <p class="hero-subtitle"></p>
        <!-- 搜索栏 -->
        <section class="search-section">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索番剧..."
              @keyup.enter="handleSearch"
            />
            <div class="btn-container">
              <a @click="handleSearch" class="search-btn"
                >搜索
                <span
                  v-for="s in 40"
                  :key="s"
                  :style="{ top: s * 1.375 + 'px', transitionDelay: Math.random() * 0.5 + 's' }"
                ></span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </section>
    <!-- 当季新番 -->
    <section class="section">
      <h2 class="section-title">当下热门</h2>
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
import { ref, onMounted } from 'vue'
import { type Anime } from '@/types/anime'
import { getCurrentSeasonAnime, getPopularAnime, getRecentPopularAnime } from '@/api/bangumi'
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
      query: { keyword: query },
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
    const [current, popular] = await Promise.all([getRecentPopularAnime(), getPopularAnime(12)])
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
  position: relative;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  background: radial-gradient(circle at 50% 50%, rgba(52, 109, 186, 0.15), transparent 60%);;
}

.hero::after{
  content: '';
  position: absolute;
  inset: 0;
  background: url('https://anime.bang-dream.com/mygo/wordpress/wp-content/uploads/2023/08/31171520/%E5%8D%83%E6%97%A9%E6%84%9B%E9%9F%B3_%E3%81%B2%E3%81%92%E7%8C%AB.png')
  no-repeat center center/cover;
  filter: blur(9px) brightness(0.4);
  z-index: -1;
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
  width: 100vh;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
}
.search-box {
  display: flex;
  gap: var(--space-sm);
  max-width: 720px;
  height: 55px;
  margin: 0 auto;
  transition: all 0.5s ease-in-out;
}

.search-box:focus-within {
  max-width: 900px;
}

.btn-container {
  position: relative;
  display: flex;
}
.search-btn {
  position: relative;
  width: 110px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: rgba(25, 33, 50, 0.1);
  font-size: 1.2rem;
  font-weight: normal;
  transition: 0.2s;
  transition-delay: 0.2s;
}

.search-btn:hover {
  filter: drop-shadow(0 0 10px #00ffcc) drop-shadow(0 0 30px #00ffcc);
  color: rgb(25, 33, 50);
}

.search-btn span {
  position: absolute;
  left: 0;
  width: 100%;
  height: 1.375px;
  background-color: #00ffcc;
  z-index: -1;
  transform: scale(0);
  transform-origin: right;
  transition: transform 0.3s ease-in-out;
}

.search-btn:hover span {
  transform: scale(1);
  transform-origin: left;
}

.search-box input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-overlay);
  background-color: var(--surface-card);
  color: var(--text-main);
  font-size: 1rem;
  width: 600px;
}

.search-box input:focus {
  outline: 2px solid var(--color-primary);
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
