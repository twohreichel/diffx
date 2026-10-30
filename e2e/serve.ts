import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const clientDir = resolve('dist/client')
const root = mkdtempSync(join(tmpdir(), 'diffx-e2e-'))
const repo = join(root, 'repo')
mkdirSync(repo)

// A fresh HOME keeps the reviewer's own ~/.config/diffx settings out of the run.
process.env.HOME = root

const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
const write = (path: string, lines: string[]) => writeFileSync(join(repo, path), lines.join('\n') + '\n')

git('init', '-q', '-b', 'main')
git('config', 'user.email', 'e2e@example.invalid')
git('config', 'user.name', 'e2e')
write('math.ts', [
  'export function add(a: number, b: number): number {',
  '  return a + b',
  '}',
  '',
  'export function double(value: number): number {',
  '  return value * 2',
  '}',
])
git('add', '.')
git('commit', '-qm', 'seed')
write('math.ts', [
  'export function add(a: number, b: number): number {',
  '  return a + b',
  '}',
  '',
  'export function double(value: number): number {',
  '  return add(value, value)',
  '}',
  '',
  'export function describeTotal(values: number[]): string {',
  '  const total = values.reduce((sum, value) => add(sum, value), 0)',
  '  return `The total of ${values.length} values is ${total}, which is a long line on a phone`',
  '}',
])
write('notes.md', ['# Notes', '', 'An untracked file in the review.'])

process.chdir(repo)
const { startServer } = await import('../src/server.js')
await startServer({ port: 3434, host: '127.0.0.1', clientDir })
console.log('diffx e2e server running')
