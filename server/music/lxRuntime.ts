import { pathToFileURL } from 'node:url'

export type LxSource = 'wy' | 'tx' | 'kw' | 'kg' | 'mg'

// 洛雪音源音乐信息
export interface LxMusicInfo {
  id: string
  songmid?: string
  hash?: string
  name?: string
  singer?: string
}

// 洛雪音源请求参数
export interface LxUrlParams {
  source: LxSource
  musicInfo: LxMusicInfo
  quality?: '128k' | '320k' | 'flac' | '24bit'
}

// 响应结构
export interface LxResponse {
  statusCode: number
  body: unknown
}

// 函数类型定义
type LxRequestHandler = (payload: {
  action: string
  source: string
  info: {
    musicInfo: LxMusicInfo
    type: string
  }
}) => Promise<string>



declare global {
  var lx:{
    EVENT_NAMES: typeof EVENT_NAMES,
    on: (eventName: string, handler: LxRequestHandler) => void,
    send: () =>void,
    request: typeof lxRequest
  }
}


let lxRequestHandler: LxRequestHandler | null = null

// Promise 用于确保落雪音源运行时只初始化一次
let lxRuntimeReady: Promise<void> | null = null

const LX_SOURCE_FILE = 'server/music/source/V260620/推荐/全豆要-聚合音源-V4.1.js'

const EVENT_NAMES = {
  request: 'request',
  inited: 'inited',
  updateAlert: 'updateAlert',
}

function parseBody(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// 模拟洛雪音源请求
function lxRequest(
  url: string,
  options: RequestInit & { timeout?: number },
  callback: (error: Error | null, response?: LxResponse) => void,
) {
  // controller用于取消请求
  const controller = new AbortController()
  // timeout 用于设置请求超时
  const timeout = setTimeout(() => {
    controller.abort()
  }, options.timeout ?? 5000)

  fetch(url, {
    method: options.method ?? 'GET',
    headers: options.headers,
    body: options.body,
    signal: controller.signal,
  })
    .then(async (response) => {
      const text = await response.text()

      callback(null, {
        statusCode: response.status,
        body: parseBody(text),
      })
    })
    .catch((error) => {
      callback(error instanceof Error ? error : new Error(String(error)))
    })
    .finally(() => {
      clearTimeout(timeout)
    })
}

// 初始化落雪音源
async function initLxRuntime() {
  if (lxRuntimeReady) return lxRuntimeReady

  lxRuntimeReady = (async () => {
    globalThis.lx = {
      EVENT_NAMES,

      // 注册落雪事件
      on(eventName: string, handler: LxRequestHandler) {
        if (eventName === EVENT_NAMES.request) {
          lxRequestHandler = handler
        }
      },
      send() {
        return undefined
      },

      request: lxRequest,
    }

    await import(pathToFileURL(LX_SOURCE_FILE).href)

    if (!lxRequestHandler) {
      throw new Error('洛雪音源运行时初始化失败，请检查音源脚本是否正确加载')
    }
  })()

  return lxRuntimeReady
}

// 获取落雪音源URL
export async function getLxMusicUrl(params: LxUrlParams) {
  await initLxRuntime()

  if (!lxRequestHandler) {
    throw new Error('落雪音源未初始化')
  }

  return lxRequestHandler({
    action: 'musicUrl',
    source: params.source,
    info: {
      musicInfo: params.musicInfo,
      type: params.quality ?? '128k',
    },
  })
}
