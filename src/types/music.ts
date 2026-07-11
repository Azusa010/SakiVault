// 音乐来源
export type MusicSource =
  | 'netease'
  | 'lx'
  | 'qq'
  | 'kugou'
  | 'kuwo'
  | 'bodian'
  | 'migu'
  | 'joox'
  | 'youtube'
  | 'youtubedl'
  | 'ytdlp'
  | 'bilibili'
  | 'bilivideo'
  | 'pyncmd'

// 音乐信息
export interface Music {
  id: string
  source: MusicSource
  name: string
  artist: { img1v1Url: string; name: string; id: number }[]
  album: {
    picId?: number
    imglvUrl?: string
    name?: string
    id?: number
  }
  coverUrl: string
  duration: number
}

// 播放地址请求结果
export interface MusicUrl {
  id: string
  source?: MusicSource
  url: string | null | undefined
  isPreview?: boolean
  proxyUrl?: string
}

// 单曲的普通歌词/翻译歌词/逐字歌词
export interface MusicLyric {
  id:string
  lyric: string
  translation: string | ''
  wordLyric: string | ''
}


