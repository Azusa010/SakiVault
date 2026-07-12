export interface KazumiSourceRule {
  api: string
  type: 'anime'
  name: string //来源展示名称
  version: string //规则版本号
  baseURL: string //来源网站根地址
  searchURL: string //带有 @keyword 占位符的搜索地址
  searchList: string //搜索结果列表的 XPath。
  searchName: string //单个搜索结果标题的 XPath。
  searchResult: string //单个搜索结果详情地址的 XPath。
  chapterRoads: string //剧集区域的 XPath。
  chapterResult: string //单集播放页地址的 XPath。
}
// KazumiRules index.json 中的一条规则摘要。
export interface KazumiRuleSummary {
  name: string
  version: string //规则版本号
  useNatviePlayer?: boolean
  antiCrawlerEnabled?: boolean //是否标记为需要反爬处理
  anthor?: string //规则作者
  lastUpdate?: number //规则最后更新时间戳
}

const REQUIRED_STRING_FIELDS = [
  'api',
  'name',
  'version',
  'baseURL',
  'searchURL',
  'searchList',
  'searchName',
  'searchResult',
  'chapterRoads',
  'chapterResult',
]

//校验规则库索引中的单条规则摘要
export function isKazumiRuleSummary(value: unknown): value is KazumiRuleSummary {
  if (!isRecord(value)) return false

  return isNonEmptyString(value.name) && isNonEmptyString(value.version)
}

// 单个来源对当前番剧的检测结果
export interface AnimeSourceCheckResult extends KazumiRuleSummary {
  status: 'available' | 'unavailable'
  resultCount:number
}

// 判断未知值是否为普通对象
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// 判断字段是否是去除空白后仍有内容的字符串
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

// 校验未知 JSON 是否符合当前支持的 Kazumi 动画规则格式
export function isKazumiSourceRule(value: unknown): value is KazumiSourceRule {
  if (!isRecord(value) || value.type !== 'anime') {
    return false
  }
  return REQUIRED_STRING_FIELDS.every((field) => isNonEmptyString(value[field]))
}

/** 根据 Kazumi 规则和用户输入生成已编码的搜索地址。 */
export function buildSearchUrl(rule: KazumiSourceRule, keyword: string): string {
  const encodedKeyword = encodeURIComponent(keyword.trim())

  return rule.searchURL.split('@keyword').join(encodedKeyword)
}
