import axios from 'axios'

interface BangumiCollection {
  on_hold?: number
  dropped?: number
  wish?: number
  collect?: number
  doing?: number
}

interface BangumiSubject {
  id: number
  name: string
  name_cn?: string
  eps?: number
  rating?: { score?: number }
  collection?: BangumiCollection
}

const bangumiClient = axios.create({
  baseURL: 'https://api.bgm.tv',
  headers: {
    Accept: 'application/json',
    // 'User-Agent': 'SakiVault/1.0 (https://github.com/Azusa010/SakiVault)',
  },
})

const isDev = import.meta.env.DEV

const bangumiPrivateClient = axios.create({
  baseURL: isDev ? '/p1' : '/api/proxy',
  headers: {
    Accept: 'application/json',
  },
})

// 获得番剧封面图片的 URL
export function getAnimeImageUrl(
  subjectId: number,
  type: 'small' | 'grid' | 'medium' | 'large' | 'common' = 'large',
) {
  return `https://api.bgm.tv/v0/subjects/${subjectId}/image?type=${type}`
}

// 获取当前已播出集数
export async function getAnimeCurrentEpisodes(id: number): Promise<number> {
  try {
    const response = await bangumiClient.get(`/v0/episodes`, {
      params: { subject_id: id, type: 0 }, // 0 表示本篇
    })
    const episodes = response.data.data || []
    const today: any = new Date().toISOString().split('T')[0]
    return episodes.filter((ep: any) => ep.airdate < today).length
  } catch {
    return 0
  }
}

// 获取当前季度的番剧列表
export async function getCurrentSeasonAnime() {
  const response = await bangumiClient.get('/calendar')
  const allItems = response.data.flatMap((day: any) => day.items || [])

  const detailedItems = await Promise.all(
    allItems.map(async (item: any) => {
      try {
        const detail = await bangumiClient.get(`/v0/subjects/${item.id}`)
        return {
          ...item,
          eps: detail.data.eps ?? item.eps ?? item.eps_count,
        }
      } catch {
        return item
      }
    }),
  )

  return detailedItems.map((item: any) => ({
    id: item.id,
    title: item.name_cn || item.name,
    coverImage: getAnimeImageUrl(item.id, 'large'),
    averageScore: item.rating?.score ?? 0,
    episodes: item.eps ?? item.eps_count ?? 0,
  }))
}

// 获取最受欢迎的番剧列表
export async function getPopularAnime(limit = 10) {
  const response = await bangumiClient.get('/v0/subjects', {
    params: { type: 2, sort: 'rank', limit },
  })

  return response.data.data.map((item: any) => ({
    id: item.id,
    title: item.name_cn || item.name,
    coverImage: getAnimeImageUrl(item.id, 'large'),
    averageScore: item.rating?.score,
    episodes: item.eps,
  }))
}

// 合并 rank 和 date 两个维度的近期番剧，按 collection 热度分排序
export async function getRecentPopularAnime(limit = 30) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [rankResponse, dateResponse] = await Promise.all([
    bangumiClient.get('/v0/subjects', {
      params: { type: 2, sort: 'rank', year, month },
    }),
    bangumiClient.get('/v0/subjects', {
      params: { type: 2, sort: 'date', year, month },
    }),
  ])

  const merged = new Map()

  const addItems = (items: BangumiSubject[]) => {
    for (const item of items || []) {
      if (!merged.has(item.id)) {
        merged.set(item.id, item)
      }
    }
  }

  addItems(rankResponse.data.data)
  addItems(dateResponse.data.data)

  return Array.from(merged.values())
    .map((item: BangumiSubject) => {
      const collection = item.collection || {}
      const heatScore =
        (collection.on_hold ?? 0) +
        (collection.dropped ?? 0) +
        (collection.wish ?? 0) +
        (collection.collect ?? 0) +
        (collection.doing ?? 0)

      return {
        id: item.id,
        title: item.name_cn || item.name,
        coverImage: getAnimeImageUrl(item.id, 'large'),
        averageScore: item.rating?.score,
        episodes: item.eps,
        heatScore,
      }
    })
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, limit)
}

// 获得番剧的详细信息
export async function getAnimeById(id: number) {
  const [detailRes, currentEpisodes] = await Promise.all([
    bangumiClient.get(`/v0/subjects/${id}`),
    getAnimeCurrentEpisodes(id),
  ])
  const item = detailRes.data
  return {
    id: item.id,
    title: item.name_cn || item.name,
    coverImage: getAnimeImageUrl(item.id, 'large'),
    averageScore: item.rating?.score,
    episodes: item.total_episodes,
    summary: item.summary,
    date: item.date,
    tags: item.tags,
    infobox: item.infobox,
    rating: item.rating,
    meta_tags: item.meta_tags,
    collection: item.collection,
    current_episodes: currentEpisodes,
  }
}

// 获得番剧吐槽信息
export async function getCommentsById(id: number) {
  const response = await bangumiPrivateClient.get(`/subjects/${id}/comments`, {
    params: {
      limit: 100,
    },
  })
  return response.data
}
export async function getReviewsById(id: number) {
  const response = await bangumiPrivateClient.get(`/subjects/${id}/reviews`, {
    params: {
      limit: 20,
    },
  })
  return response.data
}

// 获得番剧角色信息
export async function getCharactersById(id: number) {
  const response = await bangumiClient.get(`/v0/subjects/${id}/characters`)
  return response
}

// 获得角色详细信息
export async function getDetailCharacterById(id: number) {
  const response = await bangumiClient.get(`/v0/characters/${id}`)
  return response
}

// 获得Staff信息
export async function getStaffById(id: number) {
  const response = await bangumiPrivateClient.get(`/subjects/${id}/staffs/persons`, {
    params: {
      limit: 100,
    },
  })
  return response
}

interface SearchSubjectParmas {
  keyword: string
  year?: string
  rating?: number
  tag?: string
  limit?: number
  offset?: number
}

// 搜索番剧
export async function searchSubjects(params: SearchSubjectParmas) {
  const { keyword, year, rating, tag, limit = 20, offset = 0 } = params
  const filter: Record<string, any> = {
    type: [2],
  }
  if (year) filter.air_date = [`>=${year}-01-01`, `<${Number(year) + 1}-01-01`]

  if (rating !== undefined) filter.rating = [`>=${rating}`]

  if (tag) filter.tag = [tag]

  const response = await bangumiClient.post('/v0/search/subjects', {
    keyword,
    filter,
    sort: 'rank',
    limit,
    offset,
  })

  const items = response.data.data || []

  return items.map((item:any)=>{
    return {
      id: item.id,
      title: item.name_cn || item.name,
      coverImage: getAnimeImageUrl(item.id, 'large'),
      averageScore: item.rating?.score,
      episodes: item.eps,
    }
  })
}
