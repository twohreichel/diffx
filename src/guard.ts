import type { MiddlewareHandler } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'

const LOOPBACK = new Set(['127.0.0.1', '::1'])

export interface GuardOptions {
  /** The address the server is bound to. */
  host: string
  port: number
  /** Further client addresses allowed besides loopback and `host`. */
  allowFrom: string[]
}

export function isLoopback(address: string): boolean {
  return LOOPBACK.has(address) || address === 'localhost'
}

/**
 * Rejects every request with 403 unless it comes from an allowed address
 * and names this server in `Host` and, when present, `Origin`.
 *
 * The header checks stop DNS rebinding and cross-site requests from a web page
 * open in an allowed browser. Writing settings stays loopback-only, because
 * they choose the browser the CLI launches on this machine.
 */
export function createGuard({ host, port, allowFrom }: GuardOptions): MiddlewareHandler {
  const clients = new Set([...LOOPBACK, host, ...allowFrom])
  const hosts = new Set([host, 'localhost', '127.0.0.1'].map((name) => `${name}:${port}`))
  const origins = new Set([...hosts].map((name) => `http://${name}`))

  return async (c, next) => {
    const address = (getConnInfo(c).remote.address ?? '').replace(/^::ffff:/, '')
    const origin = c.req.header('origin')
    const allowed =
      clients.has(address) &&
      hosts.has(c.req.header('host') ?? '') &&
      (origin === undefined || origins.has(origin)) &&
      !(c.req.method === 'PUT' && c.req.path === '/api/settings' && !LOOPBACK.has(address))
    if (!allowed) return c.text('Forbidden', 403)
    await next()
  }
}
