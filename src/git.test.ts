import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getCustomGitDiff, getGitDiff } from './git.js'

const FILE = 'sample.txt'
const LINE_COUNT = 20
const CHANGED_LINE = 10

function contextLines(patch: string): number {
  return patch.split('\n').filter((line) => line.startsWith(' ')).length
}

function body(marker: string): string {
  return Array.from({ length: LINE_COUNT }, (_, i) =>
    i + 1 === CHANGED_LINE ? `line ${i + 1} ${marker}` : `line ${i + 1}`,
  ).join('\n') + '\n'
}

describe('git diff context width', () => {
  let repo: string
  let previousCwd: string

  beforeAll(() => {
    previousCwd = process.cwd()
    repo = mkdtempSync(join(tmpdir(), 'diffx-context-'))
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
    git('init', '-q')
    git('config', 'user.email', 'test@example.invalid')
    git('config', 'user.name', 'test')
    writeFileSync(join(repo, FILE), body('before'))
    git('add', FILE)
    git('commit', '-qm', 'seed')
    writeFileSync(join(repo, FILE), body('after'))
    process.chdir(repo)
  })

  afterAll(() => {
    process.chdir(previousCwd)
    rmSync(repo, { recursive: true, force: true })
  })

  it('emits no context at width 0', () => {
    expect(contextLines(getGitDiff({ context: 0 }))).toBe(0)
  })

  it('emits three lines on each side at width 3', () => {
    expect(contextLines(getGitDiff({ context: 3 }))).toBe(6)
  })

  it('emits the whole file at full', () => {
    expect(contextLines(getGitDiff({ context: 'full' }))).toBe(LINE_COUNT - 1)
  })

  it('keeps git default of three when no width is given', () => {
    expect(contextLines(getGitDiff({}))).toBe(6)
  })

  it('leaves an explicit width in the user arguments alone', () => {
    expect(contextLines(getCustomGitDiff(['-U1'], 10))).toBe(2)
  })

  it('applies the requested width when the user chose none', () => {
    expect(contextLines(getCustomGitDiff([], 0))).toBe(0)
  })
})
