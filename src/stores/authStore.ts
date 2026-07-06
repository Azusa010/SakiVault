import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCurrentUser } from '@/api/bangumi'
import type { BangumiUser } from '@/api/bangumi'

const STORAGE_KEY = 'bangumi-access-token'

export const useAuthStore = defineStore('auth', () => {
  // token初始从LocalStorage获取
  const token = ref<string>(loadToken())

  function loadToken():string {
    try {
      return localStorage.getItem(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  }

  // 当前登录用户信息
  const user = ref<BangumiUser | null>(null)

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value)

  // 保存token到LocalStorage
  function saveToken(value: string) {
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, value)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Failed to save token', error)
    }
  }

  // 设置token获取用户信息
  async function setToken(value:string){
    token.value = value
    saveToken(value)
    if(value){
      await fetchUser()
    }else {
      user.value = null
    }
  }

  async function fetchUser(){
    if(!token.value){
      user.value = null
      return
    }
    try {
      user.value = await getCurrentUser()
    } catch (error) {
      console.error('Failed to fetch user',error);
      user.value = null
    }
  }

  // 登出
  function logout(){
    token.value = ''
    user.value = null
    saveToken('')
  }

  fetchUser()

  return {
    token,
    user,
    isLoggedIn,
    setToken,
    fetchUser,
    logout
  }
})
