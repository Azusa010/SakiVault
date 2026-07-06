
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

export type CollectionStatus = 0 | 1 | 2 | 3 | 4 | 5

export type FavoriteAnimeSnapshot = Pick<Anime, 'id' | 'title' | 'coverImage'>

export interface FavoriteItem {
  id:number,
  status: CollectionStatus,
  anime: FavoriteAnimeSnapshot,
  updatedAt: number,
}



