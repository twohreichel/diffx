import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createGuard } from './guard.js'

const LAN = '192.168.178.100'
const PHONE = '192.168.178.139'
const PORT = 3433

const app = new Hono()
app.use('*', createGuard({ host: LAN, port: PORT, allowFrom: [PHONE] }))
app.get('/api/diff', (c) => c.text('ok'))
app.put('/api/settings', (c) => c.text('ok'))

interface Case {
  remote: string
  host?: string
  origin?: string
  method?: string
  path?: string
}

function send({ remote, host = `${LAN}:${PORT}`, origin, method = 'GET', path = '/api/diff' }: Case) {
  const headers: Record<string, string> = { host }
  if (origin) headers.origin = origin
  return app.request(path, { method, headers }, { incoming: { socket: { remoteAddress: remote } } })
}

describe('createGuard', () => {
  it.each<[string, Case]>([
    ['loopback by IP', { remote: '127.0.0.1', host: `127.0.0.1:${PORT}` }],
    ['loopback by name', { remote: '::1', host: `localhost:${PORT}` }],
    ['the bound address itself', { remote: LAN }],
    ['an allowed device', { remote: PHONE }],
    ['an allowed device as IPv4-mapped IPv6', { remote: `::ffff:${PHONE}` }],
    ['a same-origin request', { remote: PHONE, origin: `http://${LAN}:${PORT}` }],
    ['settings written from loopback', { remote: '127.0.0.1', method: 'PUT', path: '/api/settings' }],
  ])('lets through %s', async (_, request) => {
    expect((await send(request)).status).toBe(200)
  })

  it.each<[string, Case]>([
    ['another device in the network', { remote: '192.168.178.104' }],
    ['a rebound DNS name', { remote: PHONE, host: `evil.example:${PORT}` }],
    ['the right host on another port', { remote: PHONE, host: `${LAN}:8080` }],
    ['a cross-site page', { remote: PHONE, origin: 'http://evil.example' }],
    ['an HTTPS origin', { remote: PHONE, origin: `https://${LAN}:${PORT}` }],
    ['settings written from an allowed device', { remote: PHONE, method: 'PUT', path: '/api/settings' }],
  ])('rejects %s', async (_, request) => {
    expect((await send(request)).status).toBe(403)
  })
})
