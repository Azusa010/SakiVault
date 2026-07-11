import { describe, expect, it } from 'vitest'
import { parseLrc } from '../lrc'

describe('parseLrc', () => {
  it('解析并按时间排序歌词行', () => {
    const lines = parseLrc(`
[00:10.50]第一句
[00:02.00]第二句
`)

    expect(lines).toEqual([
      { time: 2000, text: '第二句' },
      { time: 10500, text: '第一句' },
    ])
  })

  it('一行多个时间标签生成多条歌词行', () => {
    const lines = parseLrc(`[00:01.00][00:03.00]重复副歌`)

    expect(lines).toEqual([
      { time: 1000, text: '重复副歌' },
      { time: 3000, text: '重复副歌' },
    ])
  })

  it('忽略元数据、空文本和无效行', () => {
    const lines = parseLrc(`
    [ar:RADWIMPS]
    [00:01.00]
    没有时间标签
    [00:02.20]有效歌词
    `)
    expect(lines).toEqual([{ time: 2200, text: '有效歌词' }])
  })
})
