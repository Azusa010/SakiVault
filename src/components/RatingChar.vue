<template>
  <div class="rating-chart">
    <div v-for="item in chartData" :key="item.label" class="rating-row">
      <span class="score-label">{{ item.label }}</span>
      <div class="bar-wrapper">
        <div
        class="bar"
        :style="{ width: item.percentage + '%' }"
        @mouseenter="showTooltip(item,$event)"
        @mousemove="moveTooltip"
        @mouseleave="hideTooltip"
        ></div>
      </div>
    </div>
    <div
      v-if="tooltip.visible"
      class="tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      {{ tooltip.text }}
    </div>
  </div>
</template>

<script setup lang="ts" name="RatingChart">
import { computed,ref } from 'vue';

const props = defineProps<{
  rating: { count: Record<string, number> } | undefined
}>()

const chartData = computed(()=>{
  const list:Array<{ label: string; value: number; percentage?: number ; ratio?:number}> = []
  let max = 0
  let total = 0
  for (let key in props.rating?.count) {
    const num = props.rating?.count[key] ?? 0
    total += num
    if(num > max) max = num
    list.push({
      label: key,
      value: num
    })
  }
  return list.map((item)=>{
    return {
      ...item,
      percentage: max > 0 ? (item.value / max) * 100 : 0,
      ratio: total > 0 ? (item.value / total) : 0
    }
  })
})

const tooltip = ref<{
  visible: boolean
  text: string
  x: number
  y: number
}>({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

function showTooltip(item:any,event:MouseEvent){
  tooltip.value={
    visible: true,
    text: ` ${item.label}⭐  ${(item.ratio*100).toFixed(2)}%  (${item.value}人)`,
    x: event.clientX,
    y: event.clientY
  }
}

function moveTooltip(event: MouseEvent) {
  tooltip.value.x = event.clientX
  tooltip.value.y = event.clientY - 40
}

function hideTooltip() {
  tooltip.value.visible = false
}
</script>

<style scoped>

.rating-chart {
  width: 100%;
  max-width: 400px;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.score-label {
  width: 36px;
  text-align: right;
  color: var(--text-muted);
  font-size: 16px;
  flex-shrink: 0;
}

.bar-wrapper {
  flex: 1;
  height: 16px;
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: rgba(0, 255, 204, 0.5);
  border-radius: 12px;
  transition: width 0.2s ease;
}

.bar:hover {
  background-color: rgba(0, 255, 204, 0.9);
  transition: all 0.1s ease;
}

.tooltip {
  position: fixed;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
  transform: translateX(-50%);
}


</style>
