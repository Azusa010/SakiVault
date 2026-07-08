export interface Anime {
  id: number
  title: string
  coverImage: string
  averageScore?: number
  episodes?: number
  rank?: number
  summary?: string
  date?: string
  tags?: string[]
  infobox?: Array<{ key: string } | null | undefined>
  rating?: { count: Record<string, number> }
  meta_tags?: string[]
  current_episodes?: number
  collection?: {
    on_hold: number
    dropped: number
    wish: number
    collect: number
    doing: number
  }
}
export interface Comment {
  comment: string
  id: number
  rate: number
  type: number
  updatedAt: number
  entry?: {
    summary: string
    updatedAt: number
  }
  user: {
    avatar: {
      large: string
      medium: string
      small: string
    }
    nickname: string
  }
}
