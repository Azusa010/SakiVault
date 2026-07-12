<template>
  <header class="app-titlebar">
    <div class="titlebar-brand">
      <img :src="sakivaultMarkUrl" class="brand-mark" alt="" />
      <span class="brand-name">SakiVault</span>
      <span class="titlebar-divider" aria-hidden="true"></span>
      <span class="page-title">Anime&Music</span>
    </div>

    <div class="window-controls">
      <button type="button" class="window-control" aria-label="最小化" @click="minimizeWindow">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>

      <button
        type="button"
        class="window-control"
        aria-label="最大化"
        @click="toggleMaximizeWindow"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6.5" y="6.5" width="11" height="11" />
        </svg>
      </button>

      <button type="button" class="window-control is-close" aria-label="关闭" @click="closeWindow">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import sakivaultMarkUrl from '@/assets/logo/sakivault-mark.svg'

function minimizeWindow() {
  window.electronAPI?.minimizeWindow()
}

function toggleMaximizeWindow() {
  window.electronAPI?.toggleMaximizeWindow()
}

function closeWindow() {
  window.electronAPI?.closeWindow()
}
</script>

<style scoped>
.app-titlebar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding-left: 12px;
  background: rgba(11, 14, 20, 0.94);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  -webkit-app-region: drag;
  user-select: none;
}

.titlebar-brand {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.brand-mark {
  display: block;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
}
.brand-name {
  color: var(--text-main);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.titlebar-divider {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.14);
}

.page-title {
  overflow: hidden;
  color: var(--text-disabled);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-controls {
  display: flex;
  align-self: stretch;
  -webkit-app-region: no-drag;
}

.window-control {
  display: grid;
  width: 46px;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(240, 243, 248, 0.78);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.window-control:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.window-control.is-close:hover {
  background: #e81123;
  color: #fff;
}

.window-control svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}
</style>
