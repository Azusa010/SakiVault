import type { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const url = new URL(req.url)
  const pathSegments = url.pathname.replace('/api/proxy/', '').split('/')
  const targetPath = pathSegments.join('/')
  const targetUrl = `https://next.bgm.tv/p1/${targetPath}${url.search}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Accept: 'application/json',
      },
    })

    const data = await response.text()

    return new Response(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Proxy failed' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
