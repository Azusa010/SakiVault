import { createPinia,setActivePinia } from "pinia";
import { useFavorites,STATUS_LABELS,STATUS_OPTIONS } from "../useFavorites";
import type { FavoriteAnimeSnapshot } from "@/types/favorite";
import { describe,vi,beforeEach,it,expect } from "vitest";


// 创建一个模拟的番剧快照对象
function createAnime(id:number): FavoriteAnimeSnapshot {
  return {
    id,
    title: `Anime ${id}`,
    coverImage: `https://example.com/anime${id}.jpg`
  }
}

describe('useFavorites',()=>{
  beforeEach(()=>{
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useRealTimers()
  })
  // 创建测试用例
  it('初始状态为空',()=>{
    const {favorites,groupedByStatus} = useFavorites()

    expect(favorites.value).toHaveLength(0)
    expect(groupedByStatus.value).toEqual({
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    })

  })

  it("添加收藏后写入LocalStorage",()=>{
    const { setFavoriteStatus,getStatus,isFavorited } = useFavorites()
    const anime = createAnime(1)

    setFavoriteStatus(anime.id,1,anime)

    expect(isFavorited(1)).toBe(true)
    expect(getStatus(1)).toBe(1)
    expect(localStorage.getItem('saki-favorites')).toContain(JSON.stringify(anime))
  })

  it("更新已有的收藏的状态",()=>{
    const { setFavoriteStatus,getStatus } = useFavorites()
    const anime = createAnime(1)

    setFavoriteStatus(anime.id,1,anime)
    setFavoriteStatus(anime.id,3,anime)
    expect(getStatus(1)).toBe(3)
  })

  it('状态设置为0时移除收藏',()=>{
    const {setFavoriteStatus,isFavorited} = useFavorites()
    const anime = createAnime(1)

    setFavoriteStatus(anime.id,1,anime)
    setFavoriteStatus(anime.id,0,anime)

    expect(isFavorited(1)).toBe(false)
  })

  it('可以显式移出收藏',()=>{
    const {setFavoriteStatus,isFavorited,removeFavorite}=useFavorites()
    const anime = createAnime(1)

    setFavoriteStatus(anime.id,1,anime)
    removeFavorite(anime.id)

    expect(isFavorited(1)).toBe(false)
  })
  it("按updateAt倒序排列",()=>{
    vi.useFakeTimers()
    const {favorites,setFavoriteStatus} = useFavorites()
    const anime1 = createAnime(1)
    const anime2 = createAnime(2)

    vi.setSystemTime(new Date('2000-01-01'))
    setFavoriteStatus(anime1.id,1,anime1)

    vi.setSystemTime(new Date('2000-01-02'))
    setFavoriteStatus(anime2.id,1,anime2)

    expect(favorites.value.map(item => item.id)).toEqual([2, 1])

  })

  it('按状态分组',()=>{
    const {setFavoriteStatus,groupedByStatus} = useFavorites()

    const anime1 = createAnime(1)
    const anime2 = createAnime(2)
    const anime3 = createAnime(3)

    setFavoriteStatus(anime1.id,1,anime1)
    setFavoriteStatus(anime2.id,3,anime2)
    setFavoriteStatus(anime3.id,1,anime3)

    expect(groupedByStatus.value[1]).toHaveLength(2)
    expect(groupedByStatus.value[3]).toHaveLength(1)
  })
  it('STATUS_LABELS和STATUS_OPTIONS保持一致',()=>{
    for (const option of STATUS_OPTIONS){
      expect(STATUS_LABELS[option.value]).toBe(option.label)
    }
  })
})

