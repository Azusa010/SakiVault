import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSearchUrl, isKazumiSourceRule, isKazumiRuleSummary } from '../src/utils/sourceRule.ts'
import type { AnimeSourceSearchResult } from '../src/utils/xpathParser.ts'
import type { KazumiRuleSummary, KazumiSourceRule } from '../src/utils/sourceRule.ts'
// 获取当前Electron主进程文件夹所在目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// KazumiRules 的公开 Raw地址
const KAZUMI_RULES_BASE_URL = 'https://raw.githubusercontent.com/Predidit/KazumiRules/main'

//获取并检验规则库索引
async function listKazumiRules(): Promise<KazumiRuleSummary[]> {
  const response = await fetch(`${KAZUMI_RULES_BASE_URL}/index.json`)

  if (!response.ok) throw new Error('规则库索引加载失败')

  const data: unknown = await response.json()

  if (!Array.isArray(data)) throw new Error('规则库索引格式无效')

  return data.filter(isKazumiRuleSummary)
}

// 按规则名读取并检验JSON 文件
async function loadKazumiRule(name: unknown): Promise<KazumiSourceRule> {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error('规则名称无效')
  }

  const response = await fetch(`${KAZUMI_RULES_BASE_URL}/${name}.json`)

  if (!response.ok) throw new Error(`规则${name}加载失败`)

  const data: unknown = await response.json()

  if (!isKazumiSourceRule(data)) throw new Error(`规则${name}格式不兼容`)

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

/** 注册页面可调用的观看相关 IPC。 */
function registerWatchIpc(): void {
  ipcMain.handle('watch:list-rules',async()=> listKazumiRules())

  ipcMain.handle('watch:load-rule',async(_event,name)=>{
    return loadKazumiRule(name)
  })

  ipcMain.handle('watch:search',async(_event,rule,keyword)=>{
    return searchAnime(rule, keyword)
  })
}

app.on('ready', () => {
  registerWatchIpc()

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  void mainWindow.loadURL('http://localhost:5173')
  mainWindow.webContents.openDevTools()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
