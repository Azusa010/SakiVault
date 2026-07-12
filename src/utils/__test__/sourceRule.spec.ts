import { describe, expect, it } from 'vitest'
import { isKazumiSourceRule, buildSearchUrl } from '@/utils/sourceRule'

/** 与 KazumiRules JSON 字段对齐的最小可解析规则。 */
const validRule = {
  api: '1',
  type: 'anime',
  name: '演示来源',
  version: '1.0',
  baseURL: 'https://example.com/',
  searchURL: 'https://example.com/search?wd=@keyword',
  searchList: '//div[@class="result"]',
  searchName: '//h3/a',
  searchResult: '//h3/a',
  chapterRoads: '//div[@class="episodes"]',
  chapterResult: '//a',
}

describe('isKazumiSourceRule', () => {
  it('接受 KazumiRules 格式的完整来源规则', () => {
    expect(isKazumiSourceRule(validRule)).toBe(true)
  })

  it('拒绝缺少剧集解析字段的来源规则', () => {
    const incompleteRule = { ...validRule, chapterResult: undefined }
    delete incompleteRule.chapterResult

    expect(isKazumiSourceRule(incompleteRule)).toBe(false)
  })

  it('拒绝值为空白字符串的来源规则', () => {
    expect(
      isKazumiSourceRule({
        ...validRule,
        searchName: '   ',
      }),
    ).toBe(false)
  })
  it('使用 URL 编码后的关键词替换所有 @keyword 占位符', () => {
    const rule = {
      ...validRule,
      searchURL: 'https://example.com/search?wd=@keyword&title=@keyword',
    }

    expect(buildSearchUrl(rule, '葬送的芙莉莲 & Frieren')).toBe(
      'https://example.com/search?wd=%E8%91%AC%E9%80%81%E7%9A%84%E8%8A%99%E8%8E%89%E8%8E%B2%20%26%20Frieren&title=%E8%91%AC%E9%80%81%E7%9A%84%E8%8A%99%E8%8E%89%E8%8E%B2%20%26%20Frieren',
    )
  })
})
