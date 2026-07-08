<template>
  <div class="favorites-view w">
    <!-- 状态筛选 pill：带滑动指示器 -->
    <ul class="side-bar" ref="sideBarRef">
      <li
        v-for="o in filterOptions"
        :key="o.value"
        :class="{ active: activeFilter === o.value }"
        :style="{ width: itemWidth + 'px' }"
        @click="handleFilterClick(o.value, $event)"
      >
        <a>{{ o.label }} {{ optionCount(o.value) }}</a>
        <span class="ripple" ref="rippleRefs"></span>
      </li>
      <div class="tab-indicator" :style="indicatorStyle"></div>
    </ul>

    <!-- 内容区 -->
    <Transition name="content-switch" mode="out-in">
      <div v-if="shelves.length === 0" class="empty-state" key="empty">
        <div class="empty-icon">
          <span class="iconfont icon-shoucang"></span>
        </div>
        <p class="empty-title">还没有{{ currentStatusLabel }}的番剧</p>
        <p class="empty-hint">
          <RouterLink to="/">去首页</RouterLink> 或
          <RouterLink to="/search">搜索</RouterLink> 找找看
        </p>
      </div>

      <div v-else class="bookshelf" key="shelves">
        <div
          v-for="(shelf, shelfIndex) in shelves"
          :key="shelf.monthKey"
          class="shelf-layer"
          :style="{ '--shelf-index': shelfIndex }"
        >
          <div class="shelf-content">
            <div class="month-label">
              <span class="month-text">{{ shelf.label }}</span>
              <span class="month-count">{{ shelf.count }}</span>
            </div>
            <div class="shelf-board">
              <div v-for="day in shelf.days" :key="day.day" class="day-group">
                <div class="cards-row">
                  <BookshelfCard v-for="item in day.items" :key="item.id" :anime="item.anime" />
                </div>
                <div class="day-tick">{{ day.day }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick,onMounted,onUnmounted } from 'vue'
import { STATUS_OPTIONS, useFavorites, STATUS_LABELS } from '@/composables/useFavorites'
import type { CollectionStatus, FavoriteItem } from '@/types/favorite'
import { RouterLink } from 'vue-router'
import BookshelfCard from '@/components/BookshelfCard.vue'

const { groupedByStatus } = useFavorites()
const filterOptions = STATUS_OPTIONS.filter((o) => o.value !== 0) as {
  label: string
  value: CollectionStatus
}[]

const activeFilter = ref<CollectionStatus>('want') // 默认显示“想看”状态的收藏项
const sideBarRef = ref<HTMLElement | null>(null)
const itemWidth = ref(120)

// 计算当前激活的筛选项索引，用于指示器位置
const activeIndex = computed(() => filterOptions.findIndex((o) => o.value === activeFilter.value))

const indicatorStyle = computed(() => {
  return {
    width: `${itemWidth.value}px`,
    transform: `translateX(${activeIndex.value * itemWidth.value}px)`,
  }
})

// 按月份和日期把收藏项分组，生成书架的层数据
interface DayGroup {
  day: string
  items: FavoriteItem[]
}

interface MonthShelf {
  monthKey: string
  label: string
  count: number
  days: DayGroup[]
}

const shelves = computed<MonthShelf[]>(() => {
  const items = groupedByStatus.value[activeFilter.value as CollectionStatus] ?? []
  const monthMap = new Map<string, Map<string, FavoriteItem[]>>()

  // 按收藏时间从新到旧排序
  const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt)

  for (const item of sorted) {
    const date = new Date(item.updatedAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const day = String(date.getDate()).padStart(2, '0')

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, new Map())
    }
    const dayMap = monthMap.get(monthKey)!
    if (!dayMap.has(day)) {
      dayMap.set(day, [])
    }
    dayMap.get(day)!.push(item)
  }

  const result: MonthShelf[] = []
  for (const [monthKey, dayMap] of monthMap) {
    const days: DayGroup[] = []
    for (const [day, dayItems] of dayMap) {
      days.push({ day, items: dayItems })
    }
    // 同一月份内按日期升序排列
    days.sort((a, b) => Number(a.day) - Number(b.day))

    result.push({
      monthKey,
      label: monthKey,
      count: [...dayMap.values()].flat().length,
      days,
    })
  }

  // 月份从新到旧排列
  result.sort((a, b) => b.monthKey.localeCompare(a.monthKey))
  return result
})

const currentStatusLabel = computed(() => {
  return STATUS_LABELS[activeFilter.value as CollectionStatus]
})

function optionCount(filterValue: CollectionStatus | number): number {
  return (groupedByStatus.value[filterValue as CollectionStatus] ?? []).length
}

// 涟漪动画效果
function handleFilterClick(value: CollectionStatus | number, event: MouseEvent) {
  activeFilter.value = value as CollectionStatus

  // 涟漪动画
  const li = event.currentTarget as HTMLElement
  const ripple = li.querySelector('.ripple') as HTMLElement | null
  if (!ripple) return

  const rect = li.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`
  ripple.classList.remove('animating')
  void ripple.offsetWidth
  ripple.classList.add('animating')
}

// 计算每个筛选项的宽度，保证在侧边栏中均分显示
function updateItemWidth() {
  if (!sideBarRef.value) return
  const width = sideBarRef.value.getBoundingClientRect().width
  itemWidth.value = Math.max(90, Math.floor((width - 12) / filterOptions.length))
}

// 初始化与响应式更新
onMounted(() => {
  nextTick(() => updateItemWidth())
  window.addEventListener('resize', updateItemWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateItemWidth)
})
</script>

<style scoped>
.favorites-view {
  padding-top: var(--space-xl);
  padding-bottom: var(--space-xl);
}

/* 状态筛选 pill */
.side-bar {
  position: relative;
  display: inline-flex;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px;
  margin-bottom: var(--space-xl);
  border-radius: 999px;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  list-style: none;
  overflow: hidden;
}

.side-bar li {
  position: relative;
  list-style: none;
  cursor: pointer;
  padding: 10px 0;
  text-align: center;
  z-index: 2;
  overflow: hidden;
  border-radius: 999px;
  transition: color var(--duration-fast) var(--ease-out);
}

.side-bar li a {
  display: block;
  color: #dbe4ff;
  font-weight: 500;
  font-size: 0.92rem;
  position: relative;
  z-index: 2;
}

.side-bar li.active a {
  color: var(--color-primary);
}

.side-bar li:hover a {
  color: #fff;
}

/* 滑动指示器 */
.tab-indicator {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 6px;
  border-radius: 999px;
  background: rgba(0, 255, 204, 0.12);
  box-shadow: 0 0 16px rgba(0, 255, 204, 0.15);
  pointer-events: none;
  transition: transform 0.35s var(--ease-pop);
}

/* 涟漪效果 */
.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 255, 204, 0.25);
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.ripple.animating {
  animation: ripple-spread 0.5s var(--ease-out);
}

@keyframes ripple-spread {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-xl) 0;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-disabled);
  margin-bottom: var(--space-md);
}

.empty-title {
  font-size: 1.1rem;
  color: var(--text-main);
  margin-bottom: var(--space-sm);
}

.empty-hint {
  color: var(--text-muted);
}

.empty-hint a {
  color: var(--color-primary);
}

.empty-hint a:hover {
  color: var(--color-primary-hover);
}

/* 书架整体容器 */
.bookshelf {
  perspective: 1400px;
  perspective-origin: 50% 0%;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* 每一层书架 */
.shelf-layer {
  --shelf-index: 0;
  transform-style: preserve-3d;
  animation: shelf-in 0.55s var(--ease-out) both;
  animation-delay: calc(var(--shelf-index) * 0.1s);
}

@keyframes shelf-in {
  0% {
    opacity: 0;
    transform: translateY(-30px) rotateX(12deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateX(0deg);
  }
}

.shelf-content {
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(6deg);
}

/* 月份标签 */
.month-label {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) rotateX(-6deg);
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  z-index: 2;
}

.month-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.05em;
}

.month-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 书架层板 */
.shelf-board {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  min-height: 130px;
  margin-left: 80px;
  padding: 8px 20px 0;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 14px 32px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform-style: preserve-3d;
}

.shelf-board::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  background: linear-gradient(90deg, transparent, rgba(0, 255, 204, 0.2), transparent);
  opacity: 0.5;
}

/* 日期分组 */
.day-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding-bottom: 8px;
}

.cards-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  transform-style: preserve-3d;
}

.day-tick {
  font-size: 0.9rem;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
  padding-left: 4px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

/* 分类切换时的淡入淡出 */
.content-switch-enter-active,
.content-switch-leave-active {
  transition:
    opacity 0.3s var(--ease-out),
    transform 0.3s var(--ease-out);
}

.content-switch-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.content-switch-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

/* 移动端 */
@media (max-width: 768px) {
  .favorites-view {
    padding-top: var(--space-md);
  }

  .side-bar {
    width: 100%;
    left: 0;
    transform: none;
    display: flex;
    overflow-x: auto;
    border-radius: var(--radius-lg);
  }

  .side-bar li {
    flex-shrink: 0;
    padding: 10px 16px;
  }

  .tab-indicator {
    display: none;
  }

  .bookshelf {
    perspective: none;
    gap: var(--space-lg);
  }

  .shelf-layer {
    animation: none;
  }

  .shelf-content {
    transform: none;
  }

  .month-label {
    position: static;
    transform: none;
    margin-bottom: var(--space-sm);
  }

  .shelf-board {
    margin-left: 0;
    flex-wrap: wrap;
    min-height: auto;
    padding: var(--space-md);
    background: var(--surface-card);
    border-radius: var(--radius-md);
    transform: none;
  }

  .shelf-board::after {
    display: none;
  }

  .day-group {
    width: 100%;
  }

  .cards-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: var(--space-md);
    width: 100%;
  }

  .day-tick {
    display: none;
  }
}
</style>
