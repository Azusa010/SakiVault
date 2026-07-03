import axios from 'axios'

const bangumiClient = axios.create({
  baseURL: 'https://api.bgm.tv',
  headers: {
    Accept: 'application/json',
    // 'User-Agent': 'SakiVault/1.0 (https://github.com/Azusa010/SakiVault)',
  },
})


// 获得番剧封面图片的 URL
export function getAnimeImageUrl(
  subjectId: number,
  type: 'small' | 'grid' | 'medium' | 'large' | 'common' = 'large'
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
    const today:any = new Date().toISOString().split('T')[0]
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
    averageScore: item.rating?.score,
    episodes: item.eps ?? item.eps_count,
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


// 获得番剧的详细信息
export async function getAnimeById(id:number){
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
    rating : item.rating,
    meta_tags: item.meta_tags,
    collection:item.collection,
    current_episodes: currentEpisodes,
  }
}
