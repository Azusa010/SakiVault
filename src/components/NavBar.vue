<template>
  <nav class="navbar">
    <div class="nav-container">
      <RouterLink to="/" class="nav-logo">◆<i>SakiVault</i></RouterLink>
      <div class="nav-links">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/search">搜索</RouterLink>
        <RouterLink to="/favorite">收藏</RouterLink>
        <template v-if="authStore.isLoggedIn&&authStore.user">
          <RouterLink to="/login" class="user-link">
            <img :src="authStore.user.avatar?.small" alt="avatar" class="nav-avatar">
            <span class="nav-nickname">{{ authStore.user.nickname }}</span>
            <!-- <button class="nav-logout" @click="handleLogout">登出</button> -->
          </RouterLink>
        </template>
        <RouterLink v-else class="nav-login" to="/login">登陆</RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts" name="">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

</script>
<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 90px;
  z-index: 100;
  background: rgba(11, 14, 20, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.nav-container {
  max-width: 1280px;
  height: 100%;
  margin: 0 115px;
  padding: 0 var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  font-family:
    'SF Pro SC', 'SF Pro Display', 'PingFang SC', 'Lucida Grande', 'Helvetica Neue', Helvetica,
    Arial, sans-serif;
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--color-primary);
  text-decoration: none;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 0.35em;
  transition: filter 0.3s ease;
}
.nav-logo:hover {
  filter: drop-shadow(0 0 6px rgba(255, 107, 139, 0.5));
}
.nav-links {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
}
.nav-links a {
  position: relative;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: 500;
  padding: 0.4em 0;
  transition: color 0.25s ease;
}
.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 0.3s var(--ease-out);
}
.nav-links a:hover {
  color: rgba(255, 255, 255, 1);
}
.nav-links a:hover::after {
  width: 100%;
}
.nav-links a.router-link-active {
  color: var(--color-primary);
}
.nav-links a.router-link-active::after {
  width: 100%;
}
.user-link {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.nav-nickname {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
}
.nav-login {
  padding: 6px 16px;
  border-radius: 20px;
  background: var(--color-primary);
  color: #fff !important;
}
.nav-login::after {
  display: none;
}
.nav-logout {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-logout:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
}
</style>
