import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CollectionStatus, FavoriteAnimeSnapshot, FavoriteItem } from '@/types/favorite'

const STORAGE_KEY = 'saki-favorites'

export const useFavStore = defineStore('favStore', () => {
  const items = ref<Record<number, FavoriteItem>>({})

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        items.value = JSON.parse(raw)
      }
    } catch (error) {
      console.error('Failed to load favorites from LocalStorage', error)
      items.value = {}
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch (error) {
      console.error('Failed to write favorites to LocalStorage', error)
    }
  }

  function setStatus(id: number, status: CollectionStatus, anime: FavoriteAnimeSnapshot) {
    if (status === 0) {
      remove(id)
      return
    }

    items.value = {
      ...items.value,
      [id]: {
        id,
        status,
        anime,
        updatedAt: Date.now(),
      },
    }
    saveToStorage()
  }

  function remove(id: number) {
    const { [id]: _, ...rest } = items.value
    items.value = rest
    saveToStorage()
  }

  function getById(id: number): FavoriteItem | undefined {
    return items.value[id]
  }

  loadFromStorage()

  return {
    items,
    setStatus,
    remove,
    getById,
  }
})
