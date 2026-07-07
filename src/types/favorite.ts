import { type Anime } from '@/types/anime'

/**
 * Bangumi 收藏状态码
 * 0 = 未追 / 未收藏
 * 1 = 想看
 * 2 = 看过
 * 3 = 在看
 * 4 = 搁置
 * 5 = 抛弃
 */

export type CollectionStatus = 'want' | 'watching' | 'watched' | 'onhold' | 'dropped' | 0

export const BangumiCollectionType = {
  Want: 1,
  Watching: 3,
  Watched: 2,
  Onhold: 4,
  Dropped: 5,
}

export type FavoriteAnimeSnapshot = Pick<Anime, 'id' | 'title' | 'coverImage'>

export interface FavoriteItem {
  id: number
  status: CollectionStatus
  anime: FavoriteAnimeSnapshot
  updatedAt: number
  // 上次成功同步的时间戳
  syncedAt?: number
  // Bangumi最后更新时间戳
  bgmUpdatedAt?: number
  // 用户的吐槽
  comment?: string
  rate?: number
}

// SakiVault to Bangumi 收藏状态码
export function toBangumiCollectionType(status: CollectionStatus): number {
  switch (status) {
    case 'want':
      return BangumiCollectionType.Want
    case 'watching':
      return BangumiCollectionType.Watching
    case 'watched':
      return BangumiCollectionType.Watched
    case 'onhold':
      return BangumiCollectionType.Onhold
    case 'dropped':
      return BangumiCollectionType.Dropped
  }
}


// Bangumi to SakiVault 收藏状态码
export function toSakiVaultCollectionType(type:number):CollectionStatus{
  switch (type) {
    case BangumiCollectionType.Want:
      return 'want'
    case BangumiCollectionType.Watching:
      return 'watching'
    case BangumiCollectionType.Watched:
      return 'watched'
    case BangumiCollectionType.Onhold:
      return 'onhold'
    case BangumiCollectionType.Dropped:
      return 'dropped'
    default:
      throw new Error(`Unknown Bangumi collection type: ${type}`)
  }
}


// 比较本地收藏和Bangumi收藏的更新时间戳，返回需要更新的收藏条目
export function compareFavoriteTimeStamps(local:FavoriteItem, remoteUpdateAt:number):'remote-newer'|'local-newer'|'equal' {
  if(remoteUpdateAt > local.updatedAt) return 'remote-newer'
  if(remoteUpdateAt < local.updatedAt) return 'local-newer'
  return 'equal'
}

