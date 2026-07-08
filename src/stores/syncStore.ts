import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './authStore'
import { useFavStore } from './favStore'
import { getUserCollections, updateUserCollection, getAnimeImageUrl } from '@/api/bangumi'
import {
  toBangumiCollectionType,
  toSakiVaultCollectionType,
  compareFavoriteTimeStamps,
  type FavoriteItem,
} from '@/types/favorite'
// 负责拉取 合并 推送

export interface SyncStats {
  pulled: number
  pushed: number
  conflicts: number
  skipped: number
}

export interface BangumiCollectionItem {
  subject_id: number
  subject_type: number
  rate: number
  type: number
  comment: string
  tags: string[]
  ep_status: number
  vol_status: number
  updated_at: string
  private: boolean
  subject: {
    id: number
    type: number
    name: string
    name_cn: string
    short_summary: string
    data: string
    images?: {
      large?: string
      common?: string
      medium?: string
      small?: string
      grid?: string
    }
  }
}

export const useSyncStore = defineStore('sync', () => {
  // isSyncing: 是否正在同步
  const isSyncing = ref(false)
  // lastSyncAt: 上次成功同步的时间戳
  const lastSyncAt = ref<number | null>(localStorage.getItem('lastSyncAt') ? parseInt(localStorage.getItem('lastSyncAt')!) : null)
  // syncError: 同步错误信息
  const syncError = ref<string | null>(null)
  // syncStats: 同步统计信息
  const stats = ref<SyncStats>({
    pulled: 0,
    pushed: 0,
    conflicts: 0,
    skipped: 0,
  })

  const authStore = useAuthStore()
  const favStore = useFavStore()
  const canSync = computed(() => {
    return authStore.isLoggedIn && !isSyncing.value
  })

  // 从Bangumi拉取收藏数据
  async function pullCollections() {
    if (!authStore.isLoggedIn || !authStore.user) {
      throw new Error('未登录，无法同步')
    }
    const allCollections: BangumiCollectionItem[] = []
    const limit = 50
    let offset = 0
    let total = Infinity

    // 分页拉取从Bangumi收藏数据
    while (offset < total) {
      const res = await getUserCollections(authStore.user.username, {
        limit,
        offset,
      })
      const pageData = (res.data || []) as BangumiCollectionItem[]
      allCollections.push(...pageData)

      total = res.total ?? 0
      offset += pageData.length

      if (pageData.length === 0) break
    }

    let pulledCount = 0
    let conflictCount = 0
    // 处理每个收藏项
    for (const collection of allCollections) {
      const id = collection.subject_id
      const remoteUpdatedAt = new Date(collection.updated_at).getTime()
      const existing = favStore.items[id]

      // 本地没有   Bangumi有  直接拉取
      if (!existing) {
        const newItem: FavoriteItem = {
          id,
          status: toSakiVaultCollectionType(collection.type),
          anime: {
            id,
            title: collection.subject.name_cn || collection.subject.name,
            coverImage: collection.subject.images?.large || getAnimeImageUrl(id, 'large'),
          },
          updatedAt: remoteUpdatedAt,
          bgmUpdatedAt: remoteUpdatedAt,
          comment: collection.comment,
          rate: collection.rate,
        }
        favStore.saveFavorite(newItem)
        pulledCount++
      } else {
        // 本地有   Bangumi有  比较时间戳
        const comparison = compareFavoriteTimeStamps(existing, remoteUpdatedAt)
        if (comparison === 'remote-newer') {
          // 远程更新更晚，拉取远程数据
          favStore.saveFavorite({
            ...existing,
            status: toSakiVaultCollectionType(collection.type),
            updatedAt: remoteUpdatedAt,
            bgmUpdatedAt: remoteUpdatedAt,
            comment: collection.comment,
            rate: collection.rate,
          })
          pulledCount++
        } else if (comparison === 'local-newer') {
          // 本地更新更晚，推送本地数据
          conflictCount++
        } else {
          stats.value.skipped++
        }
      }
    }
    stats.value.pulled = pulledCount
    stats.value.conflicts = conflictCount
  }
  // 把本地收藏数据推送到Bangumi
  async function pushCollections() {
    const pending = Object.values(favStore.items).filter((item) => {
      if (!item.bgmUpdatedAt) return true
      return item.updatedAt > item.bgmUpdatedAt
    })

    let pushedCount = 0

    for (const item of pending) {
      await updateUserCollection(item.id, {
        type: toBangumiCollectionType(item.status),
        rate: item.rate,
        comment: item.comment,
      })

      const now = Date.now()
      favStore.saveFavorite({
        ...item,
        syncedAt: now,
        bgmUpdatedAt: now,
      })
      pushedCount++
    }
    stats.value.pushed = pushedCount
  }

  // 执行一次完整的双向同步
  async function sync() {
    if (!canSync.value) {
      throw new Error('无法同步，可能未登录或正在同步中')
    }

    isSyncing.value = true
    syncError.value = null
    stats.value = {
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      skipped: 0,
    }

    try {
      await pullCollections()
      await pushCollections()
      lastSyncAt.value = Date.now()
      localStorage.setItem('lastSyncAt', lastSyncAt.value.toString())
    } catch (err) {
      syncError.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      isSyncing.value = false
    }
  }

  return {
    isSyncing,
    lastSyncAt,
    syncError,
    stats,
    canSync,
    pullCollections,
    pushCollections,
    sync,
  }
})
