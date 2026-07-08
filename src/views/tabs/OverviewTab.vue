<template>
  <div class="w overview-tab" style="margin-top: 30px">
    <section class="summary-section" v-if="anime.summary">
      <h2>剧情简介</h2>
      <p class="summary-text">{{ anime.summary }}</p>
    </section>
    <section class="tags-section">
      <h2>标签</h2>
      <div class="tags-list">
        <RouterLink v-for="(tag, index) in anime?.tags" :key="index" class="tag-item" :to="{ name: 'search', query: { tag: tag.name } }">
          {{ tag.name }} <span style="color: var(--color-primary)">{{ tag.count }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts" name="">
defineProps<{
  anime: {
    summary: string;
    tags: { name: string; count: number }[];
  };
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
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;

  font-size: 13px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.85);
  text-decoration: none;

  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);

  border: 1px solid rgba(0, 0, 0, 0.08);

  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 🌫 微妙阴影（默认几乎看不见） */
.tag-item {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* 🍏 hover：轻微浮起 */
.tag-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.85);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06);
}

/* ⚡ 点击反馈（很克制） */
.tag-item:active {
  transform: scale(0.97);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* 💎 数字徽章 */
.tag-item span {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;

  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.7);

  transition: all 0.25s ease;
}

/* hover 时徽章微变化 */
.tag-item:hover span {
  background: rgba(0, 0, 0, 0.1);
}

/* 🌈 暗色模式（重点！苹果风必须支持） */
@media (prefers-color-scheme: dark) {
  .tag-item {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(30, 30, 30, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 1px 2px rgba(0,0,0,0.4);
  }

  .tag-item:hover {
    background: rgba(50, 50, 50, 0.85);
    box-shadow:
      0 6px 18px rgba(0,0,0,0.5),
      0 2px 6px rgba(0,0,0,0.4);
  }

  .tag-item span {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.85);
  }

  .tag-item:hover span {
    background: rgba(255, 255, 255, 0.16);
  }
}

.tag-count {
  color: var(--color-primary);
  margin-left: 6px;
}

@media (max-width:768px) {
  .w {
    padding: 0 16px;
  }

  .overview-tab {
    flex-direction: column;
    gap: 0;
  }
}
</style>
