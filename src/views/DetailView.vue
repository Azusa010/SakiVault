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
        <h1 class="mobile-title">{{ anime.title }}</h1>
        <img :src="anime.coverImage" alt="Anime Cover" class="poster" />
        <div class="info-text">
          <h1 class="title">{{ anime.title }}</h1>
          <div class="meta">
            <div class="scoreBox" style="display: flex; flex-direction: column; gap: 0px">
              <span v-if="count">{{ count }} 人评分: {{ anime.averageScore?.toFixed(1) }}分</span>
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
        <RatingChart :rating="anime?.rating" class="rating-chart" />
      </div>
      <div class="mobile-wrapper-spacer"></div>
      <div class="action-row">
        <div class="follor-wrapper" ref="folloWrapperRef">
          <button class="fav-btn" @click="clickBtn($event)" ref="btnRef">
            <span
              v-for="p in particles"
              :key="p.id"
              class="particle"
              :style="{
                left: `${p.x}px`,
                top: `${p.y}px`,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
              }"
            ></span>
            <span :class="`iconfont ${currentIcon}`"></span>
            {{ followStatus }}
          </button>
          <Transition name="dropdown">
            <div class="dropdown-menu" v-if="isDropdownOpen">
              <div
                class="dropdown-item"
                v-for="(v, index) in STATUS_OPTIONS"
                :key="v.value"
                @click="selectStatus({ value: v.value as CollectionStatus, label: v.label })"
                :style="{ '--index': index }"
              >
                <span :class="`iconfont ${v.icon}`"></span>
                {{ v.label }}
              </div>
            </div>
          </Transition>
        </div>

        <button type="button" class="watch-btn" @click="isSourcePickerOpen = true">
          <span>▶</span>
          观看
        </button>
      </div>
    </div>
    <AnimeSourcePicker
      :open="isSourcePickerOpen"
      :keyword="anime.title"
      @close="isSourcePickerOpen = false"
      @select="handleSourceSelect"
    />
    <div class="anime-detail">
      <div class="tab-nav" ref="tabNavRef">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :to="{
            name: `${tab.value}`,
          }"
        >
          {{ tab.label }}
        </RouterLink>
        <div class="tab-indicator" ref="tabIndicator"></div>
      </div>
      <RouterView :anime="anime" />
    </div>
  </div>
  <!-- 详情内容 -->
</template>

<script setup lang="ts" name="">
import { useRoute, useRouter } from 'vue-router'
import { getAnimeById } from '@/api/bangumi'
import { onMounted, ref, computed, nextTick, watch } from 'vue'
import { onClickOutside, useResizeObserver } from '@vueuse/core'
import '@/assets/font_ftpgxlinezk/iconfont.css'
import StarRating from '@/components/StarRating.vue'
import RatingChart from '@/components/RatingChar.vue'
import '@/assets/styles/DetailView.css'
import { useFavorites, STATUS_LABELS, STATUS_OPTIONS } from '@/composables/useFavorites'
import type { CollectionStatus } from '@/types/favorite'
import type { Anime } from '@/types/anime'
import AnimeSourcePicker from '@/components/AnimeSourcePicker.vue'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const anime = ref<Anime | null>(null)
const count = ref(0)
onMounted(async () => {
  anime.value = await getAnimeById(id)

  const ratingCount = anime.value?.rating?.count
  if (!ratingCount) return
  for (const key in ratingCount) {
    count.value += ratingCount[key] ?? 0
  }
  // 同步收藏状态
  const savedStatus = getStatus(id)
  followStatus.value = savedStatus ? STATUS_LABELS[savedStatus] : '未追'
  nextTick(updateIndicator)
})

// 追番按钮
const followStatus = ref('未追')
const isDropdownOpen = ref(false)

const isSourcePickerOpen = ref(false)

function handleSourceSelect(ruleName: string): void {
  isSourcePickerOpen.value = false

  void router.push({
    name: 'watch',
    params: { id },
    query: { source: ruleName },
  })
}

// 收藏状态选择
function selectStatus(params: { value: CollectionStatus; label: string }) {
  followStatus.value = params.label
  isDropdownOpen.value = false

  if (!anime.value) return
  if (params.value === 0) {
    removeFavorite(id)
  } else {
    setFavoriteStatus(id, params.value, {
      id: anime.value.id,
      title: anime.value.title,
      coverImage: anime.value.coverImage,
    })
  }
}

const { getStatus, setFavoriteStatus, removeFavorite } = useFavorites()

const currentIcon = computed(() => {
  const currentStatus = STATUS_OPTIONS.find((v) => v.label === followStatus.value)
  return currentStatus ? currentStatus.icon : ''
})

const folloWrapperRef = ref<HTMLElement | null>(null)

onClickOutside(folloWrapperRef, () => {
  isDropdownOpen.value = false
})

const tabs = [
  { label: '概览', value: 'overview' },
  { label: '吐槽', value: 'comments' },
  { label: '角色', value: 'characters' },
  { label: '评论', value: 'reviews' },
  { label: '制作人员', value: 'staff' },
]

// tab指示器
const tabNavRef = ref<HTMLElement | null>(null)
const tabIndicator = ref<HTMLElement | null>(null)
const indicatorReady = ref(false)

function updateIndicator() {
  const nav = tabNavRef.value
  const indicator = tabIndicator.value
  if (!nav || !indicator) return

  const active = nav.querySelector<HTMLElement>('.tab-item.router-link-active')
  if (!active) return

  indicator.style.width = `${active.offsetWidth}px`
  indicator.style.transform = `translateX(${active.offsetLeft}px)`

  if (!indicatorReady.value) {
    indicator.style.transition = 'none'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        indicator.style.transition = ''
        indicatorReady.value = true
      })
    })
  }
}

watch(
  () => route.name,
  () => {
    nextTick(updateIndicator)
  },
)

useResizeObserver(tabNavRef, () => {
  nextTick(updateIndicator)
})

interface Particle {
  id: number
  x: number
  y: number
  tx: number
  ty: number
}

const particles = ref<Particle[]>([])
let pid = 0

function spawnParticles(x: number, y: number, count = 28) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI
    const distance = 20 + Math.random() * 80
    const p: Particle = {
      id: pid++,
      x,
      y,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
    }
    particles.value.push(p)

    // 动画结束后移除
    setTimeout(() => {
      particles.value = particles.value.filter((item) => item.id !== p.id)
    }, 1000)
  }
}

function clickBtn(e: MouseEvent) {
  isDropdownOpen.value = !isDropdownOpen.value
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  spawnParticles(x, y)
}
</script>

<style scoped>
@media (max-width: 1232px) {
  .rating-chart {
    display: none;
  }
}

@media (max-width: 768px) {
  .rating-chart {
    display: none;
  }

  .banner {
    top: 64px;
    height: 200px;
  }

  .content {
    padding: 16px;
    margin-top: 120px;
  }
  .poster {
    width: 120px;
    height: 180px;
    transform: scale(1.05);
  }

  .info-card {
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    width: 296px;
    gap: 16px;
  }

  .episodesBox span,
  .dateBox span {
    font-size: 1rem !important;
  }

  .follor-wrapper {
    position: relative;
    width: 126px;
    margin-left: 0;
    top: 0;
    left: 0;
  }

  .dropdown-menu {
    position: absolute;
  }

  .mobile-wrapper-spacer {
    display: block;
    height: 35px;
  }

  .fav-btn,
  .dropdown-menu {
    width: 100%;
  }

  .tab-nav {
    width: 100%;
    margin: 32px 0 0;
    justify-content: space-evenly;
    gap: 24px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 16px 12px;
    white-space: nowrap;
  }

  .tab-nav::-webkit-scrollbar {
    display: none;
  }

  .tab-item {
    flex: 0 0 auto;
    font-size: 0.95rem;
  }

  .title {
    display: none;
  }

  .mobile-title {
    position: relative;
    display: block;
    font-size: 1.5rem;
    grid-column: 1 / -1;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: var(--space-md);
  }

  .action-row {
    position: relative;
    top: 0;
    left: 0;
    width: 296px;
    margin-left: 0;
  }

  .watch-btn {
    width: 126px;
  }
}
</style>
