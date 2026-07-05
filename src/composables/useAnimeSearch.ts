import { computed, ref, watch } from 'vue'
import { type Anime } from '@/types/anime'
import { searchSubjects } from '@/api/bangumi'
import { useDebounceFn } from '@vueuse/core'
const LIMIT = 20

interface UseAnimeSearchOptions {
  initialKeyword?: string
  initialYear?: string
  initialRating?: number
  initialTag?: string
}

export function useAnimeSearch(options: UseAnimeSearchOptions = {}) {
  const keyword = ref(options.initialKeyword ?? '')
  const year = ref<string | undefined>(options.initialYear)
  const rating = ref<number | undefined>(options.initialRating)
  const tag = ref<string | undefined>(options.initialTag)

  const results = ref<Anime[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const offset = ref(0)
  const hasMore = ref(true)
  const hasActiveFilter = computed(() => {
    return (
      keyword.value.trim() !== '' ||
      year.value !== undefined ||
      rating.value !== undefined ||
      tag.value !== undefined
    )
  })

  async function fetchSearch(reset: boolean) {
    if (hasActiveFilter.value === false) {
      results.value = []
      hasMore.value = false
      error.value = null
      return
    }

    if (reset) {
      offset.value = 0
      results.value = []
      hasMore.value = true
    }

    loading.value = true
    error.value = null

    try {
      const data = await searchSubjects({
        keyword: keyword.value,
        year: year.value,
        rating: rating.value,
        tag: tag.value,
        limit: LIMIT,
        offset: offset.value,
      })
      if(reset) {
        results.value = data
      } else {
        results.value = [...results.value, ...data]
      }

      hasMore.value = data.length === LIMIT
      offset.value += data.length
    } catch (err) {
      error.value = '搜索失败,请稍后再试'
      if(reset){
        results.value = []
      }
    }finally{
      loading.value = false
    }
  }

  // 防抖
  const debouncedSearch = useDebounceFn(() => fetchSearch(true), 300)

  // 监听关键字变化，触发搜索
  watch((keyword),()=>{
    debouncedSearch()
  })

  // 监听过滤条件变化，触发搜索
  watch([year, rating, tag], () => {
    fetchSearch(true)
  })

  // 进入页面有初始关键字时，触发搜索
  if (hasActiveFilter.value) {
    fetchSearch(true)
  }


  async function loadMore(){
    if (loading.value || !hasMore.value) {
      await fetchSearch(false)
    }
  }

  function resetFilters() {
    year.value = undefined
    rating.value = undefined
    tag.value = undefined
  }

  return {
    keyword,year,rating,tag,results,loading,error,hasMore,hasActiveFilter,
    search: () => fetchSearch(true),
    loadMore,
    resetFilters,
  }

}
