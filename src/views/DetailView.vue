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
      <div class="follor-wrapper" ref="folloWrapperRef">
        <button class="fav-btn" @click="clickBtn($event)" ref="btnRef">
          <span
            v-for="p in particles"
            :key="p.id"
            class="particle"
            :style="{ left: `${p.x}px`, top: `${p.y}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }"
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
              @click="selectStatus(v)"
              :style="{ '--index': index }"
            >
              <span :class="`iconfont ${v.icon}`"></span>
              {{ v.label }}
            </div>
          </div>
        </Transition>
      </div>
    </div>
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
import { useRoute } from 'vue-router'
import { getAnimeById } from '@/api/bangumi'
import { onMounted, ref, computed, nextTick, watch } from 'vue'
import { onClickOutside, useResizeObserver } from '@vueuse/core'
import '@/assets/font_ftpgxlinezk/iconfont.css'
import StarRating from '@/components/StarRating.vue'
import RatingChart from '@/components/RatingChar.vue'
import '@/assets/styles/DetailView.css'
import { useFavorites, STATUS_LABELS, STATUS_OPTIONS } from '@/composables/useFavorites'
import type { CollectionStatus } from '@/types/favorite'

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
  // 同步收藏状态
  const savedStatus = getStatus(id)
  followStatus.value = STATUS_LABELS[savedStatus ?? 0] || '未追'
  nextTick(updateIndicator)

})


// 追番按钮
const followStatus = ref('未追')
const isDropdownOpen = ref(false)

function selectStatus(params:{value: number, label: string}) {
  followStatus.value = params.label
  isDropdownOpen.value = false

  if(anime.value){
    setFavoriteStatus(id,params.value as CollectionStatus, {
      id: anime.value.id,
      title: anime.value.title,
      coverImage: anime.value.coverImage,
    })
  }
}

const { getStatus, setFavoriteStatus } = useFavorites()


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

<style scoped></style>
