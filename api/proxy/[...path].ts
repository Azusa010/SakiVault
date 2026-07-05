export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathSegments = url.pathname.replace('/api/proxy/', '').split('/').filter(Boolean)
    const targetPath = pathSegments.join('/')
    const queryString = url.search

    const targetUrl = `https://next.bgm.tv/p1/${targetPath}${queryString}`

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          Accept: 'application/json',
        },
      })

      const data = await response.text()
      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch {
      return Response.json({ error: 'Proxy failed' }, { status: 502 })
    }
  },
}
