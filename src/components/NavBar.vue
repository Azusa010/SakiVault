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
  height: 82px;
  z-index: 100;

  background: rgba(15, 18, 25, 0.6);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.nav-container {
  max-width: 1280px;
  height: 100%;
  margin: 0 auto;
  padding: 0 40px;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* LOGO */
.nav-logo {
  font-family:
    'SF Pro Display', 'PingFang SC', sans-serif;

  font-size: 1.8rem;
  font-weight: 800;

  color: var(--color-primary);
  text-decoration: none;

  display: flex;
  align-items: center;
  gap: 6px;

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

  background: linear-gradient(
    90deg,
    transparent,
    var(--color-primary),
    transparent
  );

  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.nav-links a:hover {
  color: #fff;
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

/* 用户区域 */
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

/* 头像 */
.nav-avatar {
  width: 34px;
  height: 34px;

  border-radius: 50%;
  object-fit: cover;

  border: 1.5px solid rgba(255, 255, 255, 0.2);

  transition: all 0.3s ease;
}

.user-link:hover .nav-avatar {
  border-color: var(--color-primary);
  box-shadow: 0 0 8px rgba(255, 107, 139, 0.5);
}

/* 昵称 */
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
  background: linear-gradient(
    135deg,
    #ff6b8b,
    #ff8fa3
  );
  color: #fff !important;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 14px rgba(255, 107, 139, 0.35);
  transition: all 0.25s ease;
}

.nav-login:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 22px rgba(255, 107, 139, 0.45);
}

.nav-login:active {
  transform: scale(0.96);
}

.nav-login::after {
  display: none;
}
</style>
