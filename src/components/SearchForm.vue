<template>
  <div class="search-form">
    <!-- 搜索框区域 -->
    <div class="search-box">
      <!-- 搜索图标，纯装饰 -->
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z"
        />
      </svg>
      <input
        v-model="localKeyword"
        type="text"
        placeholder="搜索番剧..."
        @keydown.enter="handleEnter"
      />
    </div>

    <!-- 筛选器区域 -->
    <div class="filters">
      <!-- 年份筛选 -->
      <div class="filter-row">
        <span class="filter-label">年份</span>
        <div class="chip-group">
          <button
            v-for="option in yearOptions"
            :key="option.label"
            type="button"
            class="chip"
            :class="{ active: year === option.value }"
            @click="selectYear(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 评分筛选 -->
      <div class="filter-row">
        <span class="filter-label">评分</span>
        <div class="chip-group">
          <button
            v-for="option in ratingOptions"
            :key="option.label"
            type="button"
            class="chip"
            :class="{ active: rating === option.value }"
            @click="selectRating(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 标签筛选 -->
      <div class="filter-row">
        <span class="filter-label">标签</span>
        <div class="tag-input-wrapper">
          <input
            v-model="tagInput"
            type="text"
            placeholder="输入标签，按回车添加"
            @keydown.enter="addTag"
          />
          <!-- 已添加的标签，显示为可删除的小块 -->
          <span v-if="tag" class="tag-chip">
            {{ tag }}
            <button type="button" class="tag-remove" @click="clearTag">×</button>
          </span>
        </div>
      </div>

      <!-- 重置筛选按钮 -->
      <button type="button" class="reset-btn" @click="handleReset">重置筛选</button>
    </div>
  </div>
</template>

<script setup lang="ts" name="SearchForm">
import { ref } from 'vue'
import { computed } from 'vue'

interface Props {
  keyword: string
  year?: string
  rating?: number
  tag?: string
}

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:year': [value: string | undefined]
  'update:rating': [value: number | undefined]
  'update:tag': [value: string | undefined]
  reset: []
}>()

const props = defineProps<Props>()

// 年份
const yearOptions: { label: string; value: string | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '2026', value: '2026' },
  { label: '2025', value: '2025' },
  { label: '2024', value: '2024' },
  { label: '2023', value: '2023' },
  { label: '2022', value: '2022' },
  { label: '更早', value: 'earlier' },
]

// 评分
const ratingOptions: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '9.0+', value: 9 },
  { label: '8.0+', value: 8 },
  { label: '7.0+', value: 7 },
  { label: '6.0+', value: 6 },
]

// 关键词输入
const localKeyword = computed({
  get: () => props.keyword,
  set: (value) => emit('update:keyword', value),
})

const tagInput = ref('')

function selectYear(value: string | undefined) {
  emit('update:year', value)
}

function selectRating(value: number | undefined) {
  emit('update:rating', value)
}

function addTag() {
  const value = tagInput.value.trim()
  if (value) {
    emit('update:tag', value)
    tagInput.value = ''
  }
}

function clearTag() {
  emit('update:tag', undefined)
}

function handleEnter() {}

function handleReset() {
  emit('reset')
}
</script>

<style scoped>
.search-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-md);
  max-width: 1280px;
  margin: 0 auto;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-overlay);
  background-color: var(--surface-card);
}

.search-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 1rem;
  outline: none;
}

.search-box:focus-within {
  outline: 2px solid var(--color-primary);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  min-width: 2.5rem;
  flex-shrink: 0;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.chip {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  border: 1px solid var(--surface-overlay);
  background-color: var(--surface-card);
  color: var(--text-main);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.chip:hover {
  border-color: var(--color-primary);
}

.chip.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tag-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.tag-input-wrapper input {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-overlay);
  background-color: var(--surface-card);
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  min-width: 160px;
}

.tag-input-wrapper input:focus {
  outline: 2px solid var(--color-primary);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: white;
  font-size: 0.9rem;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.reset-btn {
  align-self: flex-start;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-overlay);
  background-color: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.reset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
