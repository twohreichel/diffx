import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './server.js'
import { detectDifft } from './structural.js'

const FILE = 'app.ts'
const BEFORE = 'export function f(a: number) {\n  return a + 1\n}\n'
const REFORMATTED = 'export function f(\n    a: number,\n) {\n  return a + 1\n}\n'

const app = createApp(join(process.cwd(), 'dist', 'client'))

let repo: string
let previousCwd: string

function oids(): { oldOid: string; newOid: string } {
  const patch = execFileSync('git', ['diff', '--', FILE], { cwd: repo, encoding: 'utf-8' })
  const match = patch.match(/^index ([0-9a-f]+)\.\.([0-9a-f]+)/m)!
  return { oldOid: match[1], newOid: match[2] }
}

beforeAll(() => {
  previousCwd = process.cwd()
  repo = mkdtempSync(join(tmpdir(), 'diffx-structural-route-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
  git('init', '-q')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')
  writeFileSync(join(repo, FILE), BEFORE)
  git('add', FILE)
  git('commit', '-qm', 'seed')
  writeFileSync(join(repo, FILE), REFORMATTED)
  process.chdir(repo)
})

afterAll(() => {
  process.chdir(previousCwd)
  rmSync(repo, { recursive: true, force: true })
})

describe('GET /api/structural', () => {
  it.skipIf(!detectDifft().available)('reports a reformat as structurally unchanged', async () => {
    const { oldOid, newOid } = oids()
    const res = await app.request(`/api/structural?path=${FILE}&oldOid=${oldOid}&newOid=${newOid}`)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ available: true, result: { unchanged: true } })
  })

  it('refuses a file version the current diff does not contain', async () => {
    const res = await app.request(`/api/structural?path=${FILE}&oldOid=1234567&newOid=7654321`)
    expect(res.status).toBe(404)
  })

  it('asks for the parameters it needs', async () => {
    expect((await app.request('/api/structural')).status).toBe(400)
  })
})

describe('GET /api/diff', () => {
  it('says whether the structural mode can run', async () => {
    const res = await app.request('/api/diff')
    const body = (await res.json()) as { structural: { available: boolean; reason?: string } }
    expect(body.structural.available).toBe(detectDifft().available)
  })
})
