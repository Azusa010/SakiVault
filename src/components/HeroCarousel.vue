<template>
  <div class="hero-carousel" :style="{ opacity: opacity ,transform: `scale(${1 + (1 - opacity) * 0.05})`, transition: 'opacity 0.15s ease-in-out' }" v-if="opacity!=0">
    <div class="images" :style="trackStyle">
      <RouterLink class="slide" v-for="item in props.items" :key="item.id" :to="`/anime/${item.id}`">
        <img :src="item.coverImage" :alt="item.title" />
        <div class="slide-info">
          <h3>{{ item.title }}</h3>
        </div>
      </RouterLink>
    </div>
    <button class="arrow arrow-left" @click="prev">
      <span class="iconfont icon-youjiantou"></span>
    </button>
    <button class="arrow arrow-right" @click="next">
      <span class="iconfont icon-zuojiantou"></span>
    </button>
    <div class="dots">
      <button
        v-for="(item, index) in props.items"
        :key="item.id"
        :class="{ active: index === currentIndex }"
        @click="goTo(index)"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Anime } from '@/types/anime'
import { computed, ref, onUnmounted ,onMounted } from 'vue'
import '@/assets/font_ftpgxlinezk/iconfont.css'

onUnmounted(() => {
  window.removeEventListener('scroll', updateOpacity)
  clearTimeout(timeOut)
  clearInterval(timer)
})
const props = defineProps<{
  items: Anime[]
}>()

const currentIndex = ref(0)

let timeOut: ReturnType<typeof setTimeout>

function next() {
  clearTimeout(timeOut)
  timeOut = setTimeout(() => {
    clearInterval(timer)
    currentIndex.value = (currentIndex.value + 1) % props.items.length
    startTimer()
  }, 200)
}

function prev() {
  clearTimeout(timeOut)
  timeOut = setTimeout(() => {
    clearInterval(timer)
    currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length
    startTimer()
  }, 200)
}

function goTo(index: number) {
  currentIndex.value = index
}

const trackStyle = computed(() => {
  return {
    transform: `translateX(-${currentIndex.value * 100}%)`,
  }
})

let timer: ReturnType<typeof setInterval>
startTimer()
function startTimer() {
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.items.length
  }, 5000)
}

const scrollY = ref(0)

function updateOpacity(){
  scrollY.value = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', updateOpacity)
})

const opacity = computed(() => {
  const fadeDistance = window.innerHeight * 0.9
  return Math.max(0, 1 - scrollY.value / fadeDistance)
})
</script>

<style scoped>
.hero-carousel {
  position: fixed;
  inset:0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
.images {
  position: relative;
  display: flex;
  height: 100%;
  transition: transform 0.5s ease-in-out;
}
.slide {
  position: relative;
  min-width: 100%;
  height: 100%;

  flex-shrink: 0;
}

.slide img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  flex-shrink: 0;
}

.slide-info {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0px;
  color: white;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.7);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: var(--space-md);
  text-align: center;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.6), transparent);
  font-size: 3rem;
}

.arrow {
  position: absolute;
  display: flex;
  top: 50%;
  transform: translateY(-50%) scale(2);
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
}

.arrow-left {
  left: 150px;
  padding-right: 5px;
}

.arrow-right {
  right: 150px;
  padding: 5px;
}

.dots {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 9px;
}

.dots button {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.3s;
}

.dots button.active {
  background: white;
}
</style>
