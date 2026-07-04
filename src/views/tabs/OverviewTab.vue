<template>
  <div class="w overview-tab">
    <section class="summary-section" v-if="anime.summary">
      <h2>剧情简介</h2>
      <p class="summary-text">{{ anime.summary }}</p>
    </section>
    <section class="tags-section">
      <h2>标签</h2>
      <div class="tags-list">
        <span
          v-for="(tag, index) in anime?.tags"
          :key="index"
          class="tag-item"
        >
          {{ tag.name }}  <span style="color: var(--color-primary);">{{ tag.count }}</span>
        </span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts" name="">
defineProps<{
  anime: any
}>()


</script>

<style scoped>
.overview-tab {
  padding: 0 115px;
  display: flex;
  gap: 10px;
}

.summary-section,
.tags-section {
  margin-top: 40px;
  max-width: 800px;
}

.summary-section h2,
.tags-section h2 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: var(--text-main);
}

.summary-text {
  line-height: 1.8;
  color: var(--text-muted);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-size: 14px;
}

.tag-count {
  color: var(--color-primary);
  margin-left: 6px;
}
</style>
