import { Router } from 'express'
import { Readable } from 'node:stream'
import { getPlayableUrl, getMusicStream } from './service'

export const musicRouter = Router()

// 音乐健康状态
musicRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'music',
  })
})

musicRouter.get('/url', async (req, res) => {
  const id = String(req.query.id || '')
  const name = req.query.name ? String(req.query.name) : undefined
  const artist = req.query.artist ? String(req.query.artist) : undefined

  if (!id) {
    res.status(400).json({
      ok: false,
      message: '缺少音乐id',
    })
    return
  }

  try {
    const data = await getPlayableUrl({ id, name, artist })
    res.json({
      ok: true,
      data,
    })
  } catch (error) {
    console.error('[music]获取播放地址失败', error)

    res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  }
})

musicRouter.get('/stream', async (req, res) => {
  const id = String(req.query.id || '')
  const name = req.query.name ? String(req.query.name) : undefined
  const artist = req.query.artist ? String(req.query.artist) : undefined

  if (!id) {
    res.status(400).json({
      ok: false,
      message: '缺少音乐id',
    })
    return
  }

  try {
    const { response } = await getMusicStream({ id, name, artist }, req.headers.range)

    const headersToForward = [
      'accept-ranges',
      'content-length',
      'content-range',
      'content-type',
      'etag',
      'last-modified',
    ]

    res.status(response.status)

    for (const header of headersToForward) {
      const value = response.headers.get(header)
      if (value) {
        res.setHeader(header, value)
      }
    }

    if (!response.body) {
      res.end()
      return
    }

    const audioStream = Readable.fromWeb(
      response.body as unknown as import('node:stream/web').ReadableStream,
    )

    // 上游连接中断时关闭当前响应，避免 Express 继续等待。
    audioStream.on('error', (error) => {
      console.error('[music]音频流传输错误', error)
      res.destroy(error)
    })

    audioStream.pipe(res)

    
  } catch (error) {
    console.error('[music]代理音频流失败', error)
    if (!res.headersSent) {
      res.status(502).json({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
})
