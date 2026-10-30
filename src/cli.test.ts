import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { request } from 'node:http'
import getPort from 'get-port'

const CLI = ['--import', 'tsx', 'src/cli.ts', '--no-open']

describe('diffx CLI arguments', () => {
  it.each([
    [['--allow-from', '192.168.1.20,nope'], '--allow-from expects IP addresses, got "nope"'],
    [['--host', '0.0.0.0'], '--host needs one address'],
    [['--host', '::'], '--host needs one address'],
  ])('refuses %j before it opens a port', (args, message) => {
    const result = spawnSync(process.execPath, [...CLI, ...args], { encoding: 'utf-8', timeout: 10_000 })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(message)
  })
})

describe('diffx server started by the CLI', () => {
  let server: ChildProcess
  let port: number

  function status(host: string): Promise<number> {
    return new Promise((resolve, reject) => {
      request({ host: '127.0.0.1', port, path: '/api/diff', headers: { host } }, (res) => {
        res.resume()
        resolve(res.statusCode!)
      }).on('error', reject).end()
    })
  }

  beforeAll(async () => {
    port = await getPort()
    server = spawn(process.execPath, [...CLI, '-p', String(port)])
    await new Promise<void>((resolve, reject) => {
      server.stdout!.on('data', (chunk) => String(chunk).includes('running') && resolve())
      server.on('exit', (code) => reject(new Error(`diffx exited with code ${code} before it started`)))
    })
  })

  afterAll(() => {
    server.kill()
  })

  it('answers a request that names this server', async () => {
    expect(await status(`127.0.0.1:${port}`)).toBe(200)
  })

  it('rejects a request under a foreign host name, as after DNS rebinding', async () => {
    expect(await status(`evil.example:${port}`)).toBe(403)
  })
})
