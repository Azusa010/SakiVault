<template>
  <Transition name="sheet">
    <div v-if="character" class="sheet-overlay" @click.self="close">
      <div class="sheet">
        <div class="sheet-header">
          <div class="sheet-handle" />
          <button class="sheet-close" @click="close">×</button>
        </div>

        <div class="sheet-body">
          <div class="sheet-hero">
            <img
              :src="character.images?.medium || fallbackImage"
              :alt="character.name"
              style="object-position: top"
            />
            <div class="sheet-title">
              <h2>{{ cnName || character.name }}</h2>
              <p v-if="cnName" class="original-name">{{ character.name }}</p>
              <div class="meta">
                <span v-if="genderText">性别：{{ genderText }}</span>
                <span v-if="birthday">生日：{{ birthday }}</span>
              </div>
            </div>
          </div>

          <div class="section summary" v-if="summaryParagraphs.length">
            <h3>角色简介</h3>
            <p v-for="(p, i) in summaryParagraphs" :key="i">{{ p }}</p>
          </div>

          <div class="section infobox" v-if="visibleInfobox.length">
            <h3>基本信息</h3>
            <dl>
              <div v-for="item in visibleInfobox" :key="item.key" class="info-row">
                <dt>{{ item.key }}</dt>
                <dd>{{ formatValue(item.value) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type InfoboxItem = { key: string; value: string | string[] }

const props = defineProps<{
  character: {
    name: string
    gender: string
    birth_year: number | null
    birth_mon: number | null
    birth_day: number | null
    images: { medium: string }
    summary: string
    infobox: InfoboxItem[]
  } | null
}>()

const emit = defineEmits(['close'])

const fallbackImage = 'http://lain.bgm.tv/r/400/pic/crt/l/1d/85/17529_crt_0dRZE.jpg'

function close() {
  emit('close')
}

const cnName = computed(() => {
  const item = props.character?.infobox?.find((i) => i.key === '简体中文名')
  const value = item?.value
  return Array.isArray(value) ? value[0] : value
})

const genderText = computed(() => {
  const g = props.character?.gender
  if (g === 'female') return '女'
  if (g === 'male') return '男'
  return ''
})

const birthday = computed(() => {
  const item = props.character
  if (!item || item.birth_mon === null || item.birth_day === null) return null
  return item.birth_year === null
    ? `${item.birth_mon}月${item.birth_day}日`
    : `${item.birth_year}年${item.birth_mon}月${item.birth_day}日`
})

const summaryParagraphs = computed(() => {
  return props.character?.summary?.split(/\r?\n/).filter((p) => p.trim()) || []
})

const visibleInfobox = computed(() => {
  return (
    props.character?.infobox?.filter((item) => {
      const v = item.value
      return v !== null && v !== undefined && v !== ''
    }) || []
  )
})

function formatValue(value: string | string[] | Array<{ k: string; v: string } | string>) {
  if (!Array.isArray(value)) return String(value)

  return value
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') return `${item.k}: ${item.v}`
      return String(item)
    })
    .join(`\n`)
}
</script>

<style scoped>
.sheet-overlay {
  padding: 0 150px;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  height: 65vh;
  background: var(--surface-card);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
}

.sheet-header {
  position: relative;
  padding: 12px;
  flex-shrink: 0;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto;
}

.sheet-close {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 24px;
  overscroll-behavior: contain;
}

.sheet-hero {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.sheet-hero img {
  width: 120px;
  aspect-ratio: 3/4;
  border-radius: 12px;
  object-fit: cover;
}

.sheet-title h2 {
  margin: 0;
  font-size: 24px;
  color: var(--text-main);
}

.original-name {
  color: var(--text-muted);
  margin: 4px 0 12px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 16px;
  color: var(--text-main);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.summary p {
  color: var(--text-main);
  line-height: 1.7;
  margin: 0 0 12px;
  font-weight: 300;
}

.infobox dl {
  margin: 0;
}

.info-row {
  display: flex;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.info-row dt {
  width: 100px;
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.info-row dd {
  margin: 0;
  color: var(--text-main);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

@media (max-width: 768px) {
  .sheet-overlay {
    padding: 0 16px;
    align-items: flex-end;
  }
  .sheet {
    height: min(72vh, 720px);
  }

  .sheet-header {
    padding: 10px 12px;
  }

  .sheet-close {
    top: 10px;
    right: 12px;
  }

  .sheet-body {
    padding: 0 16px 20px;
  }

  .sheet-hero {
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }

  .sheet-hero img {
    width: 96px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .sheet-title {
    min-width: 0;
    flex: 1;
  }

  .sheet-title h2 {
    max-width: 80%;
    font-size: 20px;
    line-height: 1.3;
    word-break: break-all;
  }
  .original-name {
    margin: 4px 0 10px;
    font-size: 0.9rem;
  }

  .meta {
    gap: 6px;
    font-size: 0.88rem;
  }

  .section {
    margin-bottom: 20px;
  }

  .section h3 {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .summary p {
    line-height: 1.65;
    font-size: 0.92rem;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
    padding: 10px 0;
  }

  .info-row dt {
    width: auto;
    font-size: 13px;
  }

  .info-row dd {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
}
</style>
