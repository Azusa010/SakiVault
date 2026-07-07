import { useFavStore } from '@/stores/favStore'
import { computed } from 'vue'
import type { CollectionStatus, FavoriteAnimeSnapshot, FavoriteItem } from '@/types/favorite'

export const STATUS_LABELS: Readonly<Record<CollectionStatus, string>> = {
  0: '未追',
  want: '想看',
  watched: '看过',
  watching: '在看',
  onhold: '搁置',
  dropped: '抛弃',
}

// 下拉菜单选项
export const STATUS_OPTIONS: Readonly<{ value: (CollectionStatus | number); label: string; icon: string }[]> =
  [
    { value: 0, label: '未追', icon: 'icon-a-shoucang_quxiaoshoucang' },
    { value: 'want', label: '想看', icon: 'icon-shoucang' },
    { value: 'watching', label: '在看', icon: 'icon-wancheng' },
    { value: 'watched', label: '看过', icon: 'icon-bofang' },
    { value: 'onhold', label: '搁置', icon: 'icon-gezhi' },
    { value: 'dropped', label: '抛弃', icon: 'icon-paoqi' },
  ]

export function useFavorites() {
  const store = useFavStore()

  const favorites = computed<FavoriteItem[]>(() => {
    return Object.values(store.items).sort((a, b) => b.updatedAt - a.updatedAt)
  })

  // 按收藏状态分组
  const groupedByStatus = computed<Record<CollectionStatus, FavoriteItem[]>>(() => {
    const groups: Record<CollectionStatus, FavoriteItem[]> = {
      0:[],
      want: [],
      watching: [],
      watched: [],
      onhold: [],
      dropped: [],
    }

    for (const item of favorites.value) {
      groups[item.status].push(item)
    }
    return groups
  })

  function isFavorited(id: number): boolean {
    return store.items[id] !== undefined
  }

  // 获取番剧的收藏状态
  function getStatus(id: number): CollectionStatus | undefined {
    return store.items[id]?.status
  }

  // 设置收藏状态，保存番剧快照
  function setFavoriteStatus(id: number, status: CollectionStatus, anime: FavoriteAnimeSnapshot) {
    store.setStatus(id, status, anime)
  }

  // 从收藏中移出番剧
  function removeFavorite(id: number) {
    store.remove(id)
  }

  return {
    favorites,
    groupedByStatus,
    isFavorited,
    getStatus,
    setFavoriteStatus,
    removeFavorite,
    STATUS_LABELS,
    STATUS_OPTIONS,
  }
}
