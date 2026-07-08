import axios from 'axios'
import type { Music, MusicUrl } from '@/types/music'

// 歌手
interface NeteaseArtist {
  id: number
  name: string
  img1v1Url?: string
}

// 专辑
interface NeteaseAlbum {
  picId?: number
  id: number
  name: string
}

// 歌曲
interface NeteaseSong {
  id: number
  name: string
  artists: NeteaseArtist[]
  ar?: NeteaseArtist[]
  album: NeteaseAlbum
  al?: NeteaseAlbum
  duration: number
  dt?: number
}

// 歌曲详细信息
interface NeteaseDetailAlbum {
  id: number
  name: string
  picid?: number
  picUrl?: string
}

// 歌曲详情
interface NeteaseDetailSong {
  id: number
  al?: NeteaseDetailAlbum
}

// 播放地址
interface NeteaseSongUrl {
  id: number
  url: string | null
}

const musicClient = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000, // 设置请求超时时间为 10 秒
})

// 获得歌曲详情
async function getSongDetail(ids: string[]) {
  if (ids.length === 0) return new Map<string, NeteaseDetailSong>()

  const response = await musicClient.get('/song/detail', {
    params: {
      ids: ids.join(','),
    },
  })
  const songs = response.data.songs as NeteaseDetailSong[]
  return new Map(songs.map((song) => [String(song.id), song]))
}

// 统一音乐结构
function normalizeMusic(song: NeteaseSong, detail?: NeteaseDetailSong): Music {
  const artists = song.artists || song.ar || []
  const searchAlbum = song.album || song.al
  const detailAlbum = detail?.al
  const coverUrl = detailAlbum?.picUrl || ''
  return {
    id: song.id.toString(),
    source: 'netease',
    name: song.name,
    artist: artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      img1v1Url: artist.img1v1Url || '',
    })),
    album: {
      picId: detailAlbum?.picid || searchAlbum.picId,
      imglvUrl: coverUrl,
      name: detailAlbum?.name || searchAlbum.name || '未知专辑',
      id: detailAlbum?.id || searchAlbum.id,
    },
    coverUrl,
    duration: song.duration || song.dt || 0,
  }
}

// 搜索音乐
export async function searchMusic(keywords: string): Promise<Music[]> {
  const response = await musicClient.get('/search', {
    params: {
      keywords,
      type: 1,
      limit: 30,
    },
  })

  const songs = (response.data.result?.songs || []) as NeteaseSong[]
  const detailMap = await getSongDetail(songs.map((song) => String(song.id)))
  return songs.map((song) => normalizeMusic(song, detailMap.get(String(song.id))))
}

// 获取音乐url
export async function getMusicUrl(music: Music): Promise<MusicUrl> {
  const response = await musicClient.get('/song/url', {
    params: {
      id: music.id,
    },
  })

  const item = response.data.data[0] as NeteaseSongUrl | undefined
  return {
    id: music.id,
    source: music.source,
    url: item?.url || null,
  }
}
