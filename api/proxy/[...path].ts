import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query
  const targetPath = Array.isArray(path) ? path.join('/') : path

  const queryIndex = req.url?.indexOf('?') ?? -1
  const queryString = queryIndex > 0 ? req.url!.slice(queryIndex) : ''

  const targetUrl = `https://next.bgm.tv/p1/${targetPath}${queryString}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Accept: 'application/json',
      },
    })

    const data = await response.text()
    res
      .status(response.status)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Content-Type', 'application/json')
      .send(data)
  } catch {
    res.status(502).json({ error: 'Proxy failed' })
  }
}
