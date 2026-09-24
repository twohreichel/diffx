import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { findDefinitions } from './definitions.js'
import { createApp } from './server.js'

const APP = `import { helper } from './helper'

export function render(value: number): number {
  return helper(value) + 1
}

export const total = render(2)
`

const HELPER = `export function helper(value: number): number {
  return value * 2
}
`

let repo: string
let previousCwd: string

beforeAll(() => {
  previousCwd = process.cwd()
  repo = mkdtempSync(join(tmpdir(), 'diffx-definitions-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
  git('init', '-q')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')
  mkdirSync(join(repo, 'src'))
  writeFileSync(join(repo, 'src', 'app.ts'), APP)
  writeFileSync(join(repo, 'src', 'helper.ts'), HELPER)
  git('add', '.')
  git('commit', '-qm', 'seed')
  process.chdir(repo)
})

afterAll(() => {
  process.chdir(previousCwd)
  rmSync(repo, { recursive: true, force: true })
})

describe('findDefinitions', () => {
  it('finds where a function is declared, not where it is called', () => {
    const found = findDefinitions('render')
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ path: 'src/app.ts', line: 3, kind: 'function' })
    expect(found[0].lines[0]).toContain('export function render')
  })

  it('reaches a declaration in another file', () => {
    expect(findDefinitions('helper')).toMatchObject([{ path: 'src/helper.ts', line: 1 }])
  })

  it('carries the lines below the declaration as the preview', () => {
    expect(findDefinitions('helper')[0].lines).toEqual([
      'export function helper(value: number): number {',
      '  return value * 2',
      '}',
    ])
  })

  it('says nothing about a name that is only used', () => {
    expect(findDefinitions('value')).toEqual([])
  })

  it('refuses anything that is not an identifier', () => {
    expect(findDefinitions('render; rm -rf /')).toEqual([])
  })
})

describe('GET /api/definitions', () => {
  const app = createApp(join(previousCwd ?? process.cwd(), 'dist', 'client'))

  it('answers with the declarations of the name', async () => {
    const res = await app.request('/api/definitions?name=render')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ name: 'render', definitions: [{ path: 'src/app.ts', line: 3 }] })
  })

  it('turns down a request without a name', async () => {
    expect((await app.request('/api/definitions')).status).toBe(400)
  })
})
