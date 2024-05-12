import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { apiReference } from '@scalar/hono-api-reference'
import { OpenAPIHono } from '@hono/zod-openapi'
import { Home } from './pages/home'
import type { Routes } from '#common/types'
import type { HTTPException } from 'hono/http-exception'

export class App {
  private app: OpenAPIHono

  constructor(routes: Routes[]) {
    this.app = new OpenAPIHono()

    this.initializeGlobalMiddlewares()
    this.initializeRoutes(routes)
    this.initializeSwaggerUI()
    this.initializeRouteFallback()
    this.initializeErrorHandler()
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      route.initRoutes()
      this.app.route('/api', route.controller)
    })

    this.app.route('/', Home)
  }

  private initializeGlobalMiddlewares() {
    this.app.use(logger())
    this.app.use(prettyJSON())
  }

  private initializeSwaggerUI() {
    this.app.doc31('/swagger', (c) => {
      const { protocol: urlProtocol, hostname, port } = new URL(c.req.url)
      const protocol = c.req.header('x-forwarded-proto') ? `${c.req.header('x-forwarded-proto')}:` : urlProtocol

      return {
        openapi: '3.1.0',

        info: {
          version: '1.0.0',
          title: 'AudioFlare API',
          description: `# Introduction 
        \nAudioFlare API, accessible at [AudioFlare.com/api-service](https://audioflare-api.vercel.app), is an official API that allows users to download high-quality songs from [AudioFlare](https://audioflare.vercel.app). 
        It offers a fast, reliable, and easy-to-use API for developers. \n`
        },
        servers: [{ url: `${protocol}//${hostname}${port ? `:${port}` : ''}`, description: 'Current environment' }]
      }
    })

    this.app.get(
      '/docs',
      apiReference({
        pageTitle: 'AudioFlare API Documentation',
        theme: 'deepSpace',
        isEditable: false,
        layout: 'modern',
        darkMode: true,
        metaData: {
          applicationName: 'AudioFlare API',
          author: 'Satyam Singh',
          creator: 'Satyam Singh',
          publisher: 'Universe Corporation',
          robots: 'index, follow',
          description:
            'AudioFlare API is an official wrapper written in TypeScript for AudioFlare.com providing programmatic access to a vast library of songs, albums, artists, playlists, and more.'
        },
        spec: { url: '/swagger' }
      })
    )
  }

  private initializeRouteFallback() {
    this.app.notFound((ctx) => {
      return ctx.json({ success: false, message: 'route not found, check docs at https://audioflare-api.vercel.app/docs' }, 404)
    })
  }

  private initializeErrorHandler() {
    this.app.onError((err, ctx) => {
      const error = err as HTTPException
      return ctx.json({ success: false, message: error.message }, error.status || 500)
    })
  }

  public getApp() {
    return this.app
  }
}
