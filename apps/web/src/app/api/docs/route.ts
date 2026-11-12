import { NextResponse, type NextRequest } from 'next/server'

import { withApiObservability } from '@/lib/observability/api'
import { getOpenApiDocument } from '@/lib/openapi/document'

export const dynamic = 'force-dynamic'

function swaggerHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SofLIA Academy API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/docs?format=json',
        dom_id: '#swagger-ui'
      });
    </script>
  </body>
</html>`
}

async function docsHandler(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const url = new URL(request.url)
  const acceptsJson = request.headers.get('accept')?.includes('application/json') === true

  if (url.searchParams.get('format') === 'json' || acceptsJson) {
    return NextResponse.json(getOpenApiDocument(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return new NextResponse(swaggerHtml(), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

export const GET = withApiObservability('openapi.docs', docsHandler)
