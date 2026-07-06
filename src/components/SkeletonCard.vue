<template>
  <div class="skeleton-card">
    <div class="skeleton-cover"></div>
    <div class="skeleton-title"></div>
    <div class="skeleton-meta"></div>
  </div>
</template>

<script setup lang="ts" name=""></script>

<style scoped>
.skeleton-card {
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--surface-card);
}

.skeleton-cover {
  aspect-ratio: 3 / 4;
  background: linear-gradient(
    90deg,
    var(--surface-hover) 0%,
    var(--surface-overlay) 50%,
    var(--surface-hover) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title,
.skeleton-meta {
  height: 1rem;
  margin: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
}

.skeleton-title {
  width: 80%;
}

.skeleton-meta {
  width: 40%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
