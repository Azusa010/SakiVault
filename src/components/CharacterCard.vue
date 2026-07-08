<template>
  <div
    class="character-card"
    ref="cardRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="$emit('select', character!)"
  >
    <img
      :src="
        character?.images.medium || 'http://lain.bgm.tv/r/400/pic/crt/l/1d/85/17529_crt_0dRZE.jpg'
      "
      alt=""
      style="
        position: absolute;
        z-index: -1;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(12px) brightness(0.2);
        border-radius: var(--radius-md);
      "
    />
    <img
      class="character-card-img"
      :src="
        character?.images.medium || 'http://lain.bgm.tv/r/400/pic/crt/l/1d/85/17529_crt_0dRZE.jpg'
      "
      :alt="character?.name"
    />
    <div class="body">
      <div class="name">{{ cnName || character?.name }}</div>
      <div class="sex" v-if="character?.gender === 'female'">性别: 女</div>
      <div class="sex" v-if="character?.gender === 'male'">性别: 男</div>
      <div class="birthday" v-if="birthday !== null">生日: {{ birthday }}</div>
      <div class="birthday" v-else>生日: 暂无</div>
      <div class="character-cv">
        <div class="cv" v-for="(a, index) in props.actors" :key="index">CV:{{ a.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="">
import { getDetailCharacterById } from '@/api/bangumi'
import { computed, ref, watch } from 'vue'
const props = defineProps<{ characterId: number; actors: Array<{ name: string }> }>()

const emit = defineEmits<{
  select: [character: NonNullable<typeof character.value>]
}>()

type InfoboxItem = { key: string; value: string | string[] }
const character = ref<{
  birth_year: number
  birth_mon: number
  birth_day: number
  gender: string
  name: string
  images: { medium: string }
  summary: string
  infobox: InfoboxItem[]
} | null>(null)
const cardRef = ref<HTMLElement | null>(null)
watch(
  () => props.characterId,
  async (id) => {
    if (!id) return
    try {
      const res = await getDetailCharacterById(id)
      character.value = res.data
    } catch (e) {
      console.error(e)
    }
  },
  { immediate: true },
)

const cnName = computed(() => {
  const item = character.value?.infobox?.find((i) => {
    return i.key === '简体中文名'
  })
  const value = item?.value
  return Array.isArray(value) ? value[0] : value
})

function handleMouseMove(e: MouseEvent) {
  const card = cardRef.value
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateY = ((x - centerX) / centerX) * 8
  const rotateX = -((y - centerY) / centerY) * 8

  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.08)`
}

function handleMouseLeave() {
  const card = cardRef.value
  if (!card) return
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)'
}

const birthday = computed(() => {
  const item = character.value || { birth_year: 0, birth_mon: 0, birth_day: 0 }
  if (
    item.birth_mon === null ||
    item.birth_day === null ||
    item.birth_mon === 0 ||
    item.birth_day === 0
  )
    return null
  return item.birth_year === null || item.birth_year === 0
    ? `${item.birth_mon}月${item.birth_day}日`
    : `${item.birth_year}年${item.birth_mon}月${item.birth_day}日`
})
</script>

<style scoped>
.character-card {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 14px;
  cursor: pointer;
  border-radius: var(--radius-md);
  align-items: flex-start;
  width: 97%;
  background: linear-gradient(180deg, var(--surface-card) 0%, var(--surface-base) 100%);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: var(--shadow-sm);
  transform: perspective(1000px);
  transition:
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    background var(--duration-normal) var(--ease-out);
}

.character-card:hover {
  background: linear-gradient(180deg, var(--surface-hover) 0%, var(--surface-card) 100%);
  border-color: rgba(0, 255, 204, 0.25);
  box-shadow:
    var(--shadow-md),
    0 0 16px rgba(0, 255, 204, 0.08);
}

.character-card-img {
  width: 100px;
  aspect-ratio: 3/4;
  border-radius: 10px;
  flex-shrink: 0;
  object-fit: cover;
  object-position: top;
  border: 2px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.name {
  color: var(--text-main);
  display: flex;
  align-items: center;
  font-size: 20px;
}

.character-card-summary {
  color: var(--text-muted);
  font-size: 14px;
}

* {
  font-weight: normal;
}

.sex,
.birthday,
.cv {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

@media (max-width: 768px) {
  .character-card {
    align-items: center;
    text-align: center;
  }

  .character-card-img {
    width: 80px;
    aspect-ratio: 3/4;
  }
  .name,
  .sex,
  .birthday,
  .cv {
    display: block;
    text-align:start;
  }


}
</style>
