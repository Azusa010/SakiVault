import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFavStore } from '../favStore'
import type { FavoriteAnimeSnapshot } from '@/types/favorite'


// 创建动漫快照
function  createAnime(id:number):FavoriteAnimeSnapshot {
  return {
    id,
    title: `Anime ${id}`,
    coverImage: `https://example.com/anime${id}.jpg`
  }
}

describe('favStore',()=>{
  beforeEach(()=>{
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('初始状态为空',()=>{
    const store = useFavStore()
    expect(store.items).toEqual({})
  })

  it('创建时从localStorage加载数据',()=>{
    const saved = {
      1:{
        id:1,
        status:1,
        anime:createAnime(1),
        updatedAt:Date.now()
      }
    }
    localStorage.setItem('saki-favorites',JSON.stringify(saved))

    const store = useFavStore()

    expect(store.items[1]).toBeDefined()
    expect(store.items[1]).toEqual(saved[1])
  })

  it('setStatus 添加新收藏',()=>{
    const store = useFavStore()
    const anime = createAnime(1)

    store.setStatus(1,'want',anime)

    expect(store.items[1]).toBeDefined()
    expect(store.items[1]?.status).toBe('want')
    expect(store.items[1]?.anime).toEqual(anime)
  })

  it('setStatus 更新已有收藏',()=>{
    const store = useFavStore()
    const anime = createAnime(1)

    store.setStatus(1,'want',anime)
    store.setStatus(1,'watching',anime)

    expect(store.items[1]).toBeDefined()
    expect(store.items[1]?.status).toBe('watching')
  })

  it('setStatus 状态为0时删除收藏',()=>{
    const store = useFavStore()
    const anime = createAnime(1)

    store.setStatus(1,'want',anime)
    store.setStatus(1,0,anime)

    expect(store.items[1]).toBeUndefined()
  })

  it('remove 移出收藏',()=>{
    const store = useFavStore()
    const anime = createAnime(1)

    store.setStatus(1,'want',anime)

    store.remove(1)

    expect(store.items[1]).toBeUndefined()
  })

  it('getById 获取收藏项',()=>{
    const store = useFavStore()
    const anime = createAnime(1)

    store.setStatus(1,'want',anime)

    expect(store.getById(1)?.status).toBe('want')
    expect(store.getById(1)?.anime).toEqual(anime)
  })

  it('写出入后会持久化到localStorage',()=>{
    const store = useFavStore()
    const anime = createAnime(1)

    store.setStatus(1,'want',anime)
    const saved = localStorage.getItem('saki-favorites')
    expect(saved).not.toBeNull()
    const parsed = JSON.parse(saved!)
    expect(parsed[1]).toBeDefined()
    expect(parsed[1].status).toBe('want')
    expect(parsed[1].anime).toEqual(anime)
  })

  it('localStorage数据损坏时不崩溃',()=>{
    localStorage.setItem('saki-favorites','not a json')
    const store = useFavStore()
    expect(Object.keys(store.items)).toHaveLength(0)
  })
})
