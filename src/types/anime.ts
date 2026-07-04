export interface Anime {
  id:number;
  title:string;
  coverImage:string;
  averageScore:number;
  episodes?:number;
}

export interface Comment {
  comment: string
  id: number
  rate: number
  type: number
  updatedAt: number
  user: {
    avatar: {
      large: string
      medium: string
      small: string
    },
    nickname: string

  }
}
