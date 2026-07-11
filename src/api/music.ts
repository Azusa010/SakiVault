import axios from 'axios'
import type { Music, MusicUrl,MusicLyric } from '@/types/music'

// 歌手
interface NeteaseArtist {
  id: number
  name: string
  img1v1Url?: string
}

// 专辑
interface NeteaseAlbum {
  picid?: number
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

const MUSIC_SERVER_BASE_URL = 'http://localhost:3100'

const musicClient = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000, // 设置请求超时时间为 10 秒
})

const serverClient = axios.create({
  baseURL: MUSIC_SERVER_BASE_URL,
  timeout: 15000,
})

// 构造本地音频流代理地址，避免浏览器直接播放跨域上游地址
function createMusicStreamUrl(music:Music){
  const params = new URLSearchParams({
    id:music.id,
    name:music.name,
    artist:music.artist.map(a => a.name).join(','),
  })

  return `${MUSIC_SERVER_BASE_URL}/music/stream?${params.toString()}`
}

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
      picId: detailAlbum?.picid || searchAlbum?.picid,
      imglvUrl: coverUrl,
      name: detailAlbum?.name || searchAlbum?.name || '未知专辑',
      id: detailAlbum?.id || searchAlbum?.id,
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
  const response = await serverClient.get('/music/url', {
    params:{
      id:music.id,
      name:music.name,
      artist:music.artist.map(a => a.name).join(','),
    }
  })

  const data = response.data.data as MusicUrl

  return {
    id: data.id,
    source: data.source || music.source,
    url: data.url ? createMusicStreamUrl(music) : undefined,
    isPreview: data.isPreview,
  }
}

export async function getMusicLyric(id:string): Promise<MusicLyric> {
  const response = await serverClient.get<{ok:boolean,data:MusicLyric}>('/music/lyric',{
    params:{
      id
    }
  })
  return response.data.data
}
