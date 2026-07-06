<template>
  <div class="favorites-view w">
    <ul class="side-bar">
      <li v-for="o in filterOptions" :key="o.value" @click="activeFilter=o.value">
        <a>{{ o.label }} {{ optionCount(o.value) }}</a>
        <span class="ripple"></span>
      </li>
    </ul>


    <!-- 空状态 -->
    <div v-if="filteredList.length===0">
     <p>还没有{{ currentStatusLabel }}的番剧</p>
      <p>
        <RouterLink to="/">去首页</RouterLink>或
        <RouterLink to="/search">搜索</RouterLink>找找看
      </p>
     </div>


     <!-- 网格 -->
      <div v-else class="grid">
        <div v-for="item in filteredList" :key="item.id">
          <AnimeCard :anime="item.anime" />
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { STATUS_OPTIONS,useFavorites,STATUS_LABELS } from '@/composables/useFavorites'
import type { CollectionStatus } from '@/types/favorite'
import AnimeCard from '@/components/AnimeCard.vue'
import { RouterLink } from 'vue-router'

const { groupedByStatus}= useFavorites()
const filterOptions = STATUS_OPTIONS.filter((o) => o.value !== 0)

const activeFilter = ref<number>(1)

const filteredList = computed(()=>{
  return groupedByStatus.value[activeFilter.value as CollectionStatus] ?? []
})

const currentStatusLabel = computed(()=> {
  return STATUS_LABELS[activeFilter.value as CollectionStatus]
})

function optionCount(filterValue:number):number {
  return (groupedByStatus.value[filterValue as CollectionStatus] ?? []).length
}
</script>

<style scoped>
.side-bar {
  position: relative;
  display: flex;
  justify-content: space-evenly;
  padding: 8px;
  border-radius: 999px;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}

.side-bar li {
  position: relative;
  list-style: none;
  cursor: pointer;
}

.side-bar li a {
  display: block;
  padding: 12px 36px;
  color: #dbe4ff;
  font-weight: 500;
  z-index: 2;
  position: relative;
}

.side-bar li:hover a {
  color: #fff;
}

.side-bar li:active {
  transform: scale(0.92);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-lg);
}

</style>
