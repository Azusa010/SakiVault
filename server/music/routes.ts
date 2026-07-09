import { Router } from 'express'
import { getPlayableUrl } from './service'

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
