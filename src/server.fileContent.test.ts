import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './server.js'

const app = createApp(join(process.cwd(), 'dist', 'client'))

let repo: string
let previousCwd: string

beforeAll(() => {
  previousCwd = process.cwd()
  repo = mkdtempSync(join(tmpdir(), 'diffx-file-content-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
  git('init', '-q')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')
  writeFileSync(join(repo, 'changed.png'), 'before')
  writeFileSync(join(repo, 'unchanged.env'), 'SECRET=1')
  git('add', '.')
  git('commit', '-qm', 'seed')
  writeFileSync(join(repo, 'changed.png'), 'after')
  writeFileSync(join(repo, 'untracked.png'), 'new')
  process.chdir(repo)
})

afterAll(() => {
  process.chdir(previousCwd)
  rmSync(repo, { recursive: true, force: true })
})

describe('GET /api/file-content', () => {
  it.each([
    ['changed.png', 'old', 'before'],
    ['changed.png', 'new', 'after'],
    ['untracked.png', 'new', 'new'],
  ])('serves %s (%s) because the diff contains it', async (path, version, body) => {
    const res = await app.request(`/api/file-content?path=${path}&version=${version}`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(body)
  })

  it('refuses a repository file the diff does not contain', async () => {
    const res = await app.request('/api/file-content?path=unchanged.env&version=new')
    expect(res.status).toBe(404)
  })
})
