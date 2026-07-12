import { describe, expect, it } from 'vitest'
import { extractSearchResults } from '@/utils/xpathParser'
import type { KazumiSourceRule } from '@/utils/sourceRule'

/** 用于验证 XPath 搜索结果解析的最小规则。 */
const rule: KazumiSourceRule = {
  api: '1',
  type: 'anime',
  name: '演示来源',
  version: '1.0',
  baseURL: 'https://example.com/',
  searchURL: 'https://example.com/search?wd=@keyword',
  searchList: '//li[@class="result"]',
  searchName: '//a[@class="title"]',
  searchResult: '//a[@class="play"]',
  chapterRoads: '//div[@class="episodes"]',
  chapterResult: '//a',
}

describe('extractSearchResults', () => {
  it('在每个搜索结果卡片内提取标题与完整详情地址', () => {
    const document = new DOMParser().parseFromString(
      `
        <ul>
          <li class="result">
            <a class="title">葬送的芙莉莲</a>
            <a class="play" href="/anime/frieren">观看</a>
          </li>
          <li class="result">
            <a class="title">孤独摇滚！</a>
            <a class="play" href="https://cdn.example.com/bocchi">观看</a>
          </li>
        </ul>
      `,
      'text/html',
    )

    expect(extractSearchResults(document, rule)).toEqual([
      {
        name: '葬送的芙莉莲',
        url: 'https://example.com/anime/frieren',
      },
      {
        name: '孤独摇滚！',
        url: 'https://cdn.example.com/bocchi',
      },
    ])
  })
})
