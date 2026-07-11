// 一条按照时间定为的普通歌词
export interface LyricLine {
  // 歌词开始时间，单位毫秒
  time:number
  // 当前时间对应的歌词文本
  text:string
}

const timestampPattern = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g

// 将LRC原文本解析为时间升序排列的歌词行
export function parseLrc(lyric:string): LyricLine[]{
  return lyric.split('\n').flatMap((rowline)=>{
    const timestamps = [...rowline.matchAll(timestampPattern)]
    const text = rowline.replace(timestampPattern,'').trim()

    if(timestamps.length ===0 || !text) return []

    return timestamps.map((timestamp)=>{
      const minutes = Number(timestamp[1])
      const seconds = Number(timestamp[2])

      return {
        time: Math.round((minutes * 60 + seconds) * 1000),
        text,
      }
    })
  }).sort((first,second)=>first.time - second.time)
}
