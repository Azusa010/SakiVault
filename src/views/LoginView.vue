<template>
  <div class="login-view w">
    <div class="login-card">
      <h1 class="title">{{ authStore.isLoggedIn ? '个人主页' : 'Bangumi 登录' }}</h1>

      <!-- 已登录用户信息 -->
      <div v-if="authStore.isLoggedIn && authStore.user" class="user-info">
        <section class="profile-header">
          <img :src="authStore.user.avatar?.large" alt="avatar" class="avatar" />
          <div class="names">
            <div class="nickname">{{ authStore.user.nickname }}</div>
            <div class="username">@{{ authStore.user.username }}</div>
          </div>
        </section>

        <!-- 同步区域 -->
        <section class="sync-section">
          <div class="sync-head">
            <div>
              <h2 class="sync-title">收藏同步</h2>
              <p class="sync-desc">同步 Bangumi 收藏到本地收藏列表</p>
            </div>

            <button class="btn btn-primary" @click="handleSync" :disabled="syncStore.isSyncing">
              {{ syncStore.isSyncing ? '同步中...' : '开始同步' }}
            </button>
          </div>

          <p v-if="syncStore.lastSyncAt" class="sync-meta">
            上次同步：{{ formatTime(syncStore.lastSyncAt) }}
          </p>

          <p v-if="syncStore.syncError" class="error">{{ syncStore.syncError }}</p>
        </section>

        <div v-if="hasStats" class="sync-stats">
          <div class="stat-item">
            <span class="stat-value">{{ syncStore.stats.pulled }}</span>
            <span class="stat-label">拉取</span>
          </div>

          <div class="stat-item">
            <span class="stat-value">{{ syncStore.stats.pushed }}</span>
            <span class="stat-label">推送</span>
          </div>

          <div v-if="syncStore.stats.conflicts" class="stat-item">
            <span class="stat-value">{{ syncStore.stats.conflicts }}</span>
            <span class="stat-label">待推送</span>
          </div>
        </div>
        <button class="btn btn-danger" @click="handleLogout">登出</button>
      </div>

      <!-- 登录表单 -->
      <form v-else class="login-form" @submit.prevent="handleLogin">
        <div class="login-intro">
          <p class="hint">请先在 Bangumi 生成 Access Token，再粘贴到下方完成登录。</p>
          <a class="token-link" href="https://next.bgm.tv/demo/access-token" target="_blank">
            生成 Access Token
          </a>
        </div>
        <input
          class="token-input"
          type="password"
          v-model="tokenInput"
          placeholder="粘贴 Bangumi Access Token"
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
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useSyncStore } from '@/stores/syncStore'

const authStore = useAuthStore()
const syncStore = useSyncStore()

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

const hasStats = computed(() => {
  const { pulled, pushed, conflicts } = syncStore.stats
  return pulled > 0 || pushed > 0 || conflicts > 0
})

// 同步收藏
async function handleSync() {
  try {
    await syncStore.sync()
  } catch {}
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString()
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
  font-size: 0.86rem;
  margin-bottom: var(--space-md);
  line-height: 1.5;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.login-intro {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.token-link {
  width: fit-content;
  color: var(--color-primary);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
}

.token-link:hover {
  text-decoration: underline;
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
  background: rgba(0, 255, 204, 0.6);
  color: #fff;
}
.btn-danger {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-md);
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) 0 var(--space-lg);
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.04);
}

.names {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nickname {
  font-size: 1.35rem;
  font-weight: 700;
}

.username {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.92rem;
}

.sync-section {
  width: 100%;
  padding: var(--space-md);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.sync-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.sync-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.sync-desc {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.86rem;
  line-height: 1.5;
}

.sync-meta {
  margin: var(--space-sm) 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.sync-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-sm);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.stat-value {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
}

.stat-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.82rem;
}

.btn-danger {
  align-self: center;
}

@media (max-width: 520px) {
  .login-view {
    align-items: flex-start;
    padding: var(--space-md);
  }

  .login-card {
    padding: var(--space-lg);
  }

  .sync-head {
    flex-direction: column;
    align-items: stretch;
  }

  .sync-stats {
    grid-template-columns: 1fr;
  }
}
</style>
