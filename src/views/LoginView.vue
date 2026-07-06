<template>
  <div class="login-view w">
    <div class="login-card">
      <h1 class="title">Bangumi 登录</h1>

      <!-- 已登录用户信息 -->
      <div v-if="authStore.isLoggedIn && authStore.user" class="user-info">
        <img :src="authStore.user.avatar?.large" alt="avatar" class="avatar" />
        <div class="names">
          <div class="nickname">{{ authStore.user.nickname }}</div>
          <div class="username">@{{ authStore.user.username }}</div>
        </div>
        <button class="btn btn-danger" @click="handleLogout">登出</button>
      </div>

      <!-- 登录表单 -->
      <form v-else class="login-form" @submit.prevent="handleLogin">
        <p class="hint">请在Bangumi中生成的Access token 粘贴到下方</p>
        <a href="https://next.bgm.tv/demo/access-token">点击这里生成Access token</a>
        <input
          type="password"
          v-model="tokenInput"
          placeholder="粘贴 Bangumi Acess Token"
          :disabled="isLoading"
        />
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="isLoading || !tokenInput.trim()">
          {{ isLoading ? '验证中...' : '保存并登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts" name="LoginView">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const tokenInput = ref('')
const isLoading = ref(false)
const error = ref('')

// 提交登录
async function handleLogin() {
  const token = tokenInput.value.trim()
  if (!token) return

  isLoading.value = true
  error.value = ''

  try {
    await authStore.setToken(token)
    if (!authStore.user) {
      throw new Error('token无效')
    }
    tokenInput.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登陆失败,请检查token是否正确'
    authStore.logout()
  } finally {
    isLoading.value = false
  }
}

// 登出
function handleLogout() {
  authStore.logout()
  tokenInput.value = ''
  error.value = ''
}
</script>

<style scoped>
.login-view {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}
.login-card {
  width: 100%;
  max-width: 480px;
  padding: var(--space-xl);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.title {
  margin: 0 0 var(--space-lg);
  font-size: 1.75rem;
  text-align: center;
}
.hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: var(--space-md);
  line-height: 1.5;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.token-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.token-input:focus {
  border-color: var(--color-primary);
}
.token-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  color: #ff6b6b;
  font-size: 0.875rem;
  margin: 0;
}
.btn {
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.1s;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-danger {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}
.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
}
.names {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.nickname {
  font-size: 1.25rem;
  font-weight: 600;
}
.username {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}
</style>
