// 音乐来源
export type MusicSource =
  | 'netease'
  | 'qq'
  | 'kugou'
  | 'kuwo'
  | 'migu'
  | 'bilibili'
  | 'xiami'
  | 'joox'
  | 'baidu'
  | 'youtube'
  | 'spotify'
  | 'soundcloud'
  | 'applemusic'
  | 'deezer'
  | 'tidal'

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
  url: string | null
}
