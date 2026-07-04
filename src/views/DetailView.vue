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
        <RatingChart :rating="anime?.rating" class="rating-chart"/>
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
      <div class="anime-detail">
    <div class="tab-nav">
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
    </div>
    <RouterView :anime="anime" />
  </div>
  </div>

  <!-- 详情内容 -->

</template>

<script setup lang="ts" name="">
import { useRoute } from 'vue-router'
import { getAnimeById } from '@/api/bangumi'
import { onMounted, ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import '@/assets/font_ftpgxlinezk/iconfont.css'
import StarRating from '@/components/StarRating.vue'
import RatingChart from '@/components/RatingChar.vue'
import '@/assets/styles/DetailView.css'

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

const currentIcon = computed(() => {
  const currentStatus = statusList.find((v) => v.label === followStatus.value)
  return currentStatus ? currentStatus.icon : ''
})

const folloWrapperRef = ref<HTMLElement | null>(null)

onClickOutside(folloWrapperRef, () => {
  isDropdownOpen.value = false
})

const activeTab = ref('概览')
const tabs = [
  { label: '概览', value: 'overview' },
  { label: '吐槽', value: 'comments' },
  { label: '角色', value: 'characters' },
  { label: '评论', value: 'reviews' },
  { label: '制作人员', value: 'staff' },
]
</script>

<style scoped></style>
