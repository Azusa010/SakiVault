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
            <div class="dateBox" style="display: flex; flex-direction: column; gap: 0px">
              <p>{{ (anime.infobox as Array<{ key: string }>)[3]?.key }}:</p>
              <span v-if="anime.date" style="color: white; font-size: 20px">{{ anime.date }}</span>
            </div>
            <div class="episodesBox">
              <span v-if="anime.current_episodes === anime.episodes"
                >已完结 {{ anime.current_episodes }} 集</span
              >
              <span v-if="anime.current_episodes === 0">未上映</span>
            </div>
          </div>
        </div>
      </div>
      <div class="follor-wrapper" ref="folloWrapperRef">
        <button class="fav-btn" @click="() => (isDropdownOpen = !isDropdownOpen)">
          <span :class="`iconfont ${currentIcon}`"></span>
          {{ followStatus }}
        </button>
        <div class="dropdown-menu" v-if="isDropdownOpen">
          <div class="dropdown-item" v-for="v in statusList" :key="v.label" @click="selectSatus(v)">
            <span :class="`iconfont ${v.icon}`"></span>
            {{ v.label }}
          </div>
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
import { onMounted, ref ,computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
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
  current_episodes: number
  collection: {
    on_hold: number
    dropped: number
    wish: number
    collect: number
    doing: number
  }
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
  console.log(anime.value)
})

// 追番按钮
const isDropdownOpen = ref(false)
const followStatus = ref('未追')

const statusList = [
  { label: '未追', icon: 'icon-a-shoucang_quxiaoshoucang' },
  { label: '在看', icon: 'icon-bofang' },
  { label: '想看', icon: 'icon-shoucang' },
  { label: '搁置', icon: 'icon-gezhi' },
  { label: '看过', icon: 'icon-wancheng' },
  { label: '抛弃', icon: 'icon-paoqi' },
]

function selectSatus(params: { label: string }) {
  followStatus.value = params.label
  isDropdownOpen.value = false
}

const currentIcon = computed(()=>{
  const currentStatus = statusList.find((v) => v.label === followStatus.value)
  return currentStatus ? currentStatus.icon : ''
})

const folloWrapperRef = ref<HTMLElement|null>(null)

onClickOutside(folloWrapperRef,()=>{
  isDropdownOpen.value = false
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
  flex-direction: column;
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

.episodesBox span {
  color: white;
  font-size: 20px;
}

.fav-btn {
  width: 110px;
  height: 45px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  background-color: transparent;
  text-align: center;
  color: white;
  font-size: 18px;
  cursor: pointer;
  text-wrap: nowrap;
}

.fav-btn:hover {
  background-color: rgba(0, 255, 204, 0.1);
  color: white;
  transition: all 0.1s ease;
}

.fav-btn:active {
  background-color: rgba(0, 255, 204, 0.2);
  color: white;
}

.follor-wrapper {
  width: 110px;
  position: relative;
  display: inline-block;
  margin-left: 340px;
}

.dropdown-menu {
  width: 110px;
  left: 0;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 10;
}

.dropdown-item {
  position: relative;        /* 必须，让伪元素相对它定位 */
  overflow: hidden;          /* 必须，防止波纹溢出按钮 */
  padding: 10px;
  text-align: center;
  cursor: pointer;
  gap: 5px;
}

.dropdown-item:hover {
  background-color: rgba(0, 255, 204, 0.1);
}


.dropdown-item:active {
  background-color: rgba(0, 255, 204, 0.2);
  transition: all 0.1s ease;
}
</style>
