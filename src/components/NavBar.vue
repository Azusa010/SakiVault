<template>
  <nav class="navbar">
    <div class="nav-container desktop-nav">
      <RouterLink to="/" class="nav-logo">SakiVault</RouterLink>

      <div class="nav-links">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/search">搜索</RouterLink>
        <RouterLink to="/favorite">收藏</RouterLink>

        <template v-if="authStore.isLoggedIn && authStore.user">
          <RouterLink to="/login" class="user-link">
            <img :src="authStore.user.avatar?.small" alt="avatar" class="nav-avatar" />
            <span class="nav-nickname">{{ authStore.user.nickname }}</span>
          </RouterLink>
        </template>

        <RouterLink v-else class="nav-login" to="/login">登录</RouterLink>

        <button
          type="button"
          class="nav-performance-toggle"
          :class="{ 'is-active': !performanceMode }"
          @click="emit('toggle-performance')"
        >
          {{ performanceMode ? '性能' : '特效' }}
        </button>
      </div>
    </div>

    <!-- 移动端顶部导航 -->
    <div class="mobile-topbar">
      <RouterLink to="/" class="nav-logo mobile-logo">SakiVault</RouterLink>

      <div class="mobile-actions">
        <RouterLink to="/search" class="mobile-icon-btn" aria-label="搜索">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28h.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14"
              fill="currentColor"
            />
          </svg>
        </RouterLink>

        <RouterLink to="/login" class="mobile-user-entry" aria-label="我的">
          <img
            v-if="authStore.isLoggedIn && authStore.user?.avatar?.small"
            :src="authStore.user.avatar.small"
            alt="avatar"
            class="nav-avatar"
          />
          <span v-else class="mobile-user-text">登录</span>
        </RouterLink>
      </div>
    </div>

    <!-- 移动端底部标签 -->
    <div class="mobile-bottom-tab">
      <RouterLink to="/" class="tab-item">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3.5 4 9.75V20a1 1 0 0 0 1 1h4.5v-5.5h5V21H19a1 1 0 0 0 1-1V9.75z"
            fill="currentColor"
          />
        </svg>
        <span>首页</span>
      </RouterLink>

      <RouterLink to="/search" class="tab-item">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28h.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14"
            fill="currentColor"
          />
        </svg>
        <span>搜索</span>
      </RouterLink>

      <RouterLink to="/favorite" class="tab-item">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.5 4.93 16.4A2 2 0 0 1 4 14.67V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8.17a2 2 0 0 1-.93 1.73z"
            fill="currentColor"
          />
        </svg>
        <span>收藏</span>
      </RouterLink>

      <RouterLink to="/login" class="tab-item">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4m0 2c-4.42 0-8 2.01-8 4.5V20h16v-1.5c0-2.49-3.58-4.5-8-4.5"
            fill="currentColor"
          />
        </svg>
        <span>我的</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

defineProps<{
  performanceMode: boolean
}>()
/** 全站登录态，供桌面端和移动端导航共用 */
const authStore = useAuthStore()

const emit = defineEmits<{
  'toggle-performance': []
}>()
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.desktop-nav {
  height: 82px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 18, 25, 0.6);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.nav-logo {
  font-family: 'SF Pro Display', 'PingFang SC', sans-serif;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary);
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: all 0.3s ease;
}

.nav-logo:hover {
  transform: translateY(-1px);
  text-shadow: 0 0 12px rgba(255, 107, 139, 0.6);
}

.nav-links {
  display: flex;
  gap: 28px;
  align-items: center;
}

.nav-links a {
  position: relative;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 4px 0;
  transition: all 0.25s ease;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.nav-links a:hover {
  color: #fff;
}

.nav-links a:hover::after,
.nav-links a.router-link-active::after {
  width: 100%;
}

.nav-links a.router-link-active {
  color: var(--color-primary);
}

.user-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 30px;
  transition: all 0.25s ease;
}

.user-link:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nav-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
}
.nav-nickname {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.nav-login {
  box-sizing: border-box;
  min-width: 50px;
  text-align: center;
  padding: 6px 28px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #ff6b8b, #ff8fa3);
  color: #fff !important;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 4px 14px rgba(255, 107, 139, 0.35);
}

.nav-login::after {
  display: none;
}

.mobile-topbar,
.mobile-bottom-tab {
  display: none;
}

@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 16px;
    background: rgba(15, 18, 25, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .mobile-logo {
    font-size: 1.35rem;
    letter-spacing: 0;
  }

  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .mobile-icon-btn,
  .mobile-user-entry {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 0 10px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-main);
  }

  .mobile-icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .mobile-user-text {
    font-size: 0.85rem;
    color: var(--text-main);
  }

  .mobile-bottom-tab {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 68px;
    padding: 8px 10px max(8px, env(safe-area-inset-bottom));
    background: rgba(15, 18, 25, 0.96);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .tab-item svg {
    width: 20px;
    height: 20px;
  }

  .tab-item.router-link-active {
    color: var(--color-primary);
  }
}

.nav-performance-toggle {
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.72);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.nav-performance-toggle:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.nav-performance-toggle.is-active {
  border-color: rgba(255, 143, 163, 0.7);
  background: rgba(255, 107, 139, 0.2);
  color: #ffd9e2;
}

</style>
