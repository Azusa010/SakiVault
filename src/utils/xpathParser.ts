import type { KazumiSourceRule } from './sourceRule'

// 单个来源规则返回的番剧搜索结果
export interface AnimeSourceSearchResult {
  name: string
  url: string
}

// 单集播放页面信息
export interface AnimeSourceEpisode {
  //集数或页面显示名称。
  title:string
  url:string
}

// 一条播放线路及其剧集列表
export interface AnimeSourceEpisodeRoute {
  name:string
  episodes: AnimeSourceEpisode[]
}

export interface AnimeStreamSource {
  url:string
  referer:string
}





//  将 Kazumi 的 // XPath 转成以当前卡片为范围的相对查询
function toRelativeXPath(xpath: string): string {
  return xpath.startsWith('//') ? `.${xpath}` : xpath
}

// 在指定DOM节点范围内执行Xpath并返回所有匹配节点
function evaluateXPath(context: Node, xpath: string): Node[] {
  const document = context.ownerDocument ?? (context as Document)
  const resultType = document.defaultView?.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE

  if (resultType === undefined) return []

  const result = document.evaluate(xpath, context, null, resultType, null)
  const nodes: Node[] = []

  for (let index = 0; index < result.snapshotLength; index += 1) {
    const node = result.snapshotItem(index)
    if (node) nodes.push(node)
  }
  return nodes
}

//读取XPATH 匹配节点的首个结果
function getFirstXPathNode(context: Node, xpath: string): Node | null {
  return evaluateXPath(context, toRelativeXPath(xpath))[0] ?? null
}

// 从节点读取href属性，菲元素节点会返回空值
function getHref(node: Node | null): string | null {
  if (!node || !('getAttribute' in node) || typeof node.getAttribute !== 'function') return null

  return node.getAttribute('href')
}

// 将来源页面给出的相对地址转换为可访问的绝对地址。
function resolveUrl(url: string, baseURL: string): string | null {
  try {
    return new URL(url, baseURL).toString()
  } catch {
    return null
  }
}

// 依据 Kazumi XPath 规则，从搜索页面 DOM 中提取番剧结果。
export function extractSearchResults(
  document: Document,
  rule: KazumiSourceRule,
): AnimeSourceSearchResult[] {
  const resultCard = evaluateXPath(document, toRelativeXPath(rule.searchList))

  return resultCard.flatMap((card) => {
    const nameNode = getFirstXPathNode(card, rule.searchName)
    const resultNode = getFirstXPathNode(card, rule.searchResult)
    const name = nameNode?.textContent?.trim() ?? ''
    const href = getHref(resultNode)

    if (!name || !href) return []

    const url = resolveUrl(href, rule.baseURL)
    return url ? [{ name, url }] : []
  })
}
