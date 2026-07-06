export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathSegments = url.pathname.replace('/api/proxy/', '').split('/').filter(Boolean)
    const targetPath = pathSegments.join('/')
    const queryString = url.search

    const targetUrl = `https://next.bgm.tv/p1/${targetPath}${queryString}`

    const headers: Record<string, string> = {
      Acceot: request.headers.get('Accept') || 'application/json',
    }

    const authorization = request.headers.get('Authorization')

    if (authorization) {
      headers.Authorization = authorization
    }

    const contentType = request.headers.get('Content-Type')
    if (contentType) {
      headers['Content-Type'] = contentType
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body:
          request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
      })

      const data = await response.text()
      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type')||'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch {
      return Response.json({ error: 'Proxy failed' }, { status: 502 })
    }
  },
}
