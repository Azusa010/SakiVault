import { app, BrowserWindow, ipcMain, net, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSearchUrl, isKazumiSourceRule, isKazumiRuleSummary } from '../src/utils/sourceRule.ts'
import type {
  AnimeSourceSearchResult,
  AnimeSourceEpisodeRoute,
  AnimeStreamSource,
} from '../src/utils/xpathParser.ts'
import type {
  KazumiRuleSummary,
  KazumiSourceRule,
  AnimeSourceCheckResult,
} from '../src/utils/sourceRule.ts'
import { readFile } from 'node:fs/promises'

// 获取当前Electron主进程文件夹所在目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// kazumi本地目录
const isDevelopment = !app.isPackaged

const KAZUMI_RULES_DIR = isDevelopment
  ? path.join(__dirname, 'KazumiRules')
  : path.join(process.resourcesPath, 'KazumiRules')

const PRELOAD_PATH = isDevelopment
  ? path.join(__dirname, 'preload.cjs')
  : path.join(__dirname, 'preload.cjs')

const RENDERER_INDEX_PATH = path.join(__dirname, '../dist/index.html')

// 允许桌面端请求的Bangumi Next API地址
const BANGUMI_NEXT_PATH_PATTERN =
  /^\/(?:trending\/subjects|subjects\/\d+\/(?:comments|reviews|staffs\/persons))$/

type BangumiNextQuery = Record<string, string | number | boolean>

function isBangumiNextQuery(value: unknown): value is BangumiNextQuery {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false

  return Object.values(value).every((item) => typeof item === 'string' || typeof item === 'number')
}

// 在主进程请求 Bangumi Next
async function fetchBangumiNext(pathname: unknown, query: unknown): Promise<unknown> {
  if (typeof pathname !== 'string' || !BANGUMI_NEXT_PATH_PATTERN.test(pathname)) {
    throw new Error('Bangumi Next API路径无效')
  }

  if (query !== undefined && !isBangumiNextQuery(query)) {
    throw new Error('Bangumi Next 查询参数无效')
  }

  const requestUrl = new URL(`https://next.bgm.tv/p1${pathname}`)

  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      requestUrl.searchParams.set(key, String(value))
    }
  }

  const response = await net.fetch(requestUrl.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Bangumi Next 请求失败：${response.status}`)
  }

  return response.json()
}

// 注册渲染进程可调用的Bangumi Next IPC
function registerBangumiIpc(): void {
  ipcMain.handle('bangumi:next-get', async (_event, pathname, query) => {
    return fetchBangumiNext(pathname, query)
  })
}

async function readLocalRuleJson(fileName: string, errorMessage: string): Promise<unknown> {
  try {
    const content = await readFile(path.join(KAZUMI_RULES_DIR, fileName), 'utf8')
    return JSON.parse(content) as unknown
  } catch {
    throw new Error(errorMessage)
  }
}

// 搜索结果缓存
const sourceSearchCache = new Map<string, AnimeSourceSearchResult[]>()

//获取并检验规则库索引
async function listKazumiRules(): Promise<KazumiRuleSummary[]> {
  const data: unknown = await readLocalRuleJson('index.json', '规则库索引加载失败')

  if (!Array.isArray(data)) throw new Error('规则库索引格式无效')

  return data.filter(isKazumiRuleSummary)
}

// 按规则名读取并检验JSON 文件
async function loadKazumiRule(name: unknown): Promise<KazumiSourceRule> {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error('规则名称无效')
  }

  const data = await readLocalRuleJson(`${name}.json`, `本地规则 ${name} 读取失败`)
  if (!isKazumiSourceRule(data)) throw new Error(`规则 ${name} 格式不兼容`)
  return data
}

// 判断地址是否只使用允许的网页协议。
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
// 生成在隐藏搜索窗口内执行的自包含 XPath 解析脚本。
function createSearchExtractionScript(rule: object): string {
  return `
    (() => {
      const rule = ${JSON.stringify(rule)}

      const evaluateXPath = (context, xpath) => {
        const normalizedXPath = xpath.startsWith('//') ? '.' + xpath : xpath
        const result = document.evaluate(
          normalizedXPath,
          context,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        )

        const nodes = []
        for (let index = 0; index < result.snapshotLength; index += 1) {
          const node = result.snapshotItem(index)
          if (node) nodes.push(node)
        }
        return nodes
      }

      return evaluateXPath(document, rule.searchList).flatMap((card) => {
        const nameNode = evaluateXPath(card, rule.searchName)[0]
        const resultNode = evaluateXPath(card, rule.searchResult)[0]
        const name = nameNode?.textContent?.trim() || ''
        const href = resultNode?.getAttribute?.('href') || ''

        if (!name || !href) return []

        try {
          return [{
            name,
            url: new URL(href, rule.baseURL).toString(),
          }]
        } catch {
          return []
        }
      })
    })()
  `
}

// 生成在隐藏窗口内提取播放线路与剧集的 XPath 脚本。
function createEpisodeExtractionScript(rule: object): string {
  return `
    (() => {
      const rule = ${JSON.stringify(rule)}

      const evaluateXPath = (context, xpath) => {
        const normalizedXPath = xpath.startsWith('//') ? '.' + xpath : xpath
        const result = document.evaluate(
          normalizedXPath,
          context,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        )

        const nodes = []
        for (let index = 0; index < result.snapshotLength; index += 1) {
          const node = result.snapshotItem(index)
          if (node) nodes.push(node)
        }
        return nodes
      }

      return evaluateXPath(document, rule.chapterRoads)
        .map((routeNode, routeIndex) => {
          const episodes = evaluateXPath(routeNode, rule.chapterResult)
            .map((episodeNode, episodeIndex) => {
              const href = episodeNode?.getAttribute?.('href') || ''

              if (!href) return null

              try {
                return {
                  title: episodeNode.textContent?.trim() || '第 ' + (episodeIndex + 1) + ' 集',
                  url: new URL(href, location.href).toString(),
                }
              } catch {
                return null
              }
            })
            .filter(Boolean)

          return {
            name: '线路 ' + (routeIndex + 1),
            episodes,
          }
        })
        .filter((route) => route.episodes.length > 0)
    })()
  `
}

//加载搜索结果对应的详情页，并解析播放线路与聚集
async function loadEpisodeRoutes(
  rawRule: unknown,
  rawResultUrl: unknown,
): Promise<AnimeSourceEpisodeRoute[]> {
  if (!isKazumiSourceRule(rawRule)) throw new Error('来源规则格式无效')

  if (typeof rawResultUrl !== 'string' || !isHttpUrl(rawResultUrl))
    throw new Error('播放页面地址无效')

  const episodeWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  episodeWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  try {
    await loadWithTimeout(episodeWindow, rawResultUrl)

    const result = await episodeWindow.webContents.executeJavaScript(
      createEpisodeExtractionScript(rawRule),
    )

    return Array.isArray(result) ? (result as AnimeSourceEpisodeRoute[]) : []
  } finally {
    if (!episodeWindow.isDestroyed()) {
      episodeWindow.destroy()
    }
  }
}

//判断网络请求是否为可直接播放的媒体清单或者视频文件
function isPlayableMediaUrl(value: string): boolean {
  try {
    const pathname = new URL(value).pathname.toLowerCase()
    return pathname.endsWith('.m3u8') || pathname.endsWith('.mp4') || pathname.endsWith('.webm')
  } catch {
    return false
  }
}

// 监听指定隐藏窗口的媒体请求，并在超时后清理监听器
function watchMediaRequest(window: BrowserWindow): {
  promise: Promise<AnimeStreamSource>
  dispose: () => void
} {
  const webRequest = window.webContents.session.webRequest
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let settled = false

  let resolveStream: (source: AnimeStreamSource) => void
  let rejectStream: (error: Error) => void

  const promise = new Promise<AnimeStreamSource>((resolve, reject) => {
    resolveStream = resolve
    rejectStream = reject
  })

  const dispose = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    webRequest.onBeforeRequest(null)
  }

  webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    callback({})

    if (
      settled ||
      details.webContentsId !== window.webContents.id ||
      !isPlayableMediaUrl(details.url)
    ) {
      return
    }

    settled = true
    dispose()

    resolveStream!({
      url: details.url,
      referer: details.referrer || window.webContents.getURL(),
    })
  })

  timeoutId = setTimeout(() => {
    if (settled) {
      return
    }

    settled = true
    dispose()
    rejectStream!(new Error('未能在播放页面中找到视频地址'))
  }, 20_000)

  return { promise, dispose }
}

// 加载单集播放页面，嗅探媒体请求并返回最终播放地址
async function resolveAnimeStream(rawEpisodeUrl: unknown): Promise<AnimeStreamSource> {
  if (typeof rawEpisodeUrl !== 'string' || !isHttpUrl(rawEpisodeUrl))
    throw new Error('单集播放地址无效')

  const sniffWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: 'watch-sniff',
    },
  })
  sniffWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  const watcher = watchMediaRequest(sniffWindow)

  try {
    await loadWithTimeout(sniffWindow, rawEpisodeUrl)

    await sniffWindow.webContents.executeJavaScript(`
      document.querySelectorAll('video').forEach((video) => {
        video.muted = true
        video.play().catch(() => {})
      })
    `)

    return await watcher.promise
  } finally {
    watcher.dispose()

    if (!sniffWindow.isDestroyed()) {
      sniffWindow.destroy()
    }
  }
}

// 加载搜索页面，超时后终止本次请求。
async function loadWithTimeout(window: BrowserWindow, url: string): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      window.loadURL(url),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('来源搜索超时，请稍后重试'))
        }, 15_000)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

// 在隐藏窗口中搜索，并保证无论成功或失败都销毁窗口。
async function searchAnime(rawRule: unknown, keyword: unknown): Promise<AnimeSourceSearchResult[]> {
  if (!isKazumiSourceRule(rawRule)) {
    throw new Error('来源规则格式无效')
  }

  if (typeof keyword !== 'string' || !keyword.trim()) {
    throw new Error('搜索关键词不能为空')
  }

  const searchUrl = buildSearchUrl(rawRule, keyword)

  if (!isHttpUrl(searchUrl)) {
    throw new Error('规则中的搜索地址不是合法网页地址')
  }

  const searchWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  searchWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  try {
    await loadWithTimeout(searchWindow, searchUrl)

    const result = await searchWindow.webContents.executeJavaScript(
      createSearchExtractionScript(rawRule),
    )

    return Array.isArray(result) ? (result as AnimeSourceSearchResult[]) : []
  } finally {
    if (!searchWindow.isDestroyed()) {
      searchWindow.destroy()
    }
  }
}

function createSearchCacheKey(rule: KazumiSourceRule, keyword: string): string {
  return `${rule.name}:${keyword.trim().toLowerCase()}`
}

async function searchAnimeWithCache(
  rawRule: unknown,
  keyword: unknown,
): Promise<AnimeSourceSearchResult[]> {
  if (!isKazumiSourceRule(rawRule)) {
    throw new Error('来源规则格式无效')
  }
  if (typeof keyword !== 'string' || !keyword.trim()) {
    throw new Error('搜索关键词不能为空')
  }
  const cacheKey = createSearchCacheKey(rawRule, keyword)
  const cachedResults = sourceSearchCache.get(cacheKey)
  if (cachedResults) {
    return cachedResults
  }
  const results = await searchAnime(rawRule, keyword)
  sourceSearchCache.set(cacheKey, results)
  return results
}

// 单个检测完成后推送给渲染进程的回调
type SourceCheckReporter = (result: AnimeSourceCheckResult) => void

/**
 * 搜索所有来源规则，并发数量限制3个
 *
 */
async function checkAnimeSources(
  keyword: unknown,
  reportResult: SourceCheckReporter,
): Promise<AnimeSourceCheckResult[]> {
  if (typeof keyword !== 'string' || !keyword.trim()) {
    throw new Error('搜索关键词不能为空')
  }

  const summaries = await listKazumiRules()
  const results: AnimeSourceCheckResult[] = []
  let index = 0
  // 从队列中取出一个规则并检测，直到没有剩余规则
  async function runWorker(): Promise<void> {
    while (index < summaries.length) {
      const summary = summaries[index]
      index++

      try {
        const rule = await loadKazumiRule(summary.name)
        const searchResults = await searchAnimeWithCache(rule, keyword)
        const result: AnimeSourceCheckResult = {
          ...summary,
          status: searchResults.length > 0 ? 'available' : 'unavailable',
          resultCount: searchResults.length,
        }

        results.push(result)
        reportResult(result)
      } catch {
        const result: AnimeSourceCheckResult = {
          ...summary,
          status: 'unavailable',
          resultCount: 0,
        }
        results.push(result)
        reportResult(result)
      }
    }
  }
  const workerCount = Math.min(6, summaries.length)
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))
  return results
}

// 注册自定义标题栏使用的窗口控制事件
function registerWindowControlsIpc(): void {
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.on('window:toggle-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    if (!window) return

    if (window.isMaximized()) {
      window.unmaximize()
      return
    }
    window.maximize()
  })
  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
}

// 注册页面可调用的观看相关 IPC。
function registerWatchIpc(): void {
  ipcMain.handle('watch:list-rules', async () => listKazumiRules())

  ipcMain.handle('watch:load-rule', async (_event, name) => {
    return loadKazumiRule(name)
  })

  ipcMain.handle('watch:load-episodes', async (_event, rule, resultUrl) => {
    return loadEpisodeRoutes(rule, resultUrl)
  })

  ipcMain.handle('watch:search', async (_event, rule, keyword) => {
    return searchAnimeWithCache(rule, keyword)
  })

  ipcMain.handle('watch:resolve-stream', async (_event, episodeUrl) => {
    return resolveAnimeStream(episodeUrl)
  })

  ipcMain.handle('watch:check-sources', async (event, keyword) => {
    return checkAnimeSources(keyword, (result) => {
      if (!event.sender.isDestroyed()) event.sender.send('watch:source-checked', result)
    })
  })
}

app.on('ready', async () => {
  await session.defaultSession.setProxy({ mode: 'system' })
  registerWatchIpc()
  registerBangumiIpc()
  registerWindowControlsIpc()

  const mainWindow = new BrowserWindow({
    frame: false,
    backgroundColor: '#0b0e14',
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: PRELOAD_PATH,
    },
  })

  if (isDevelopment) {
    void mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    void mainWindow.loadFile(RENDERER_INDEX_PATH)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
