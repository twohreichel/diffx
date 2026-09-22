import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ShapeError, detectDifft, parseDifft, structuralDiff, withTempPair } from './structural.js'

describe('detectDifft', () => {
  it('reads the version of an installed difftastic', () => {
    const result = detectDifft(() => 'Difftastic 0.65.0 (dc3bbe6 2025-01-01)\n')
    expect(result).toEqual({ available: true, version: '0.65.0' })
  })

  it('names the missing binary and how to get it', () => {
    const result = detectDifft(() => {
      throw new Error('spawnSync difft ENOENT')
    })
    expect(result.available).toBe(false)
    expect(result.reason).toContain('difftastic not installed')
    expect(result.reason).toContain('brew install difftastic')
  })

  it('treats an unreadable version line as not installed', () => {
    expect(detectDifft(() => 'some other tool\n').available).toBe(false)
  })
})

describe('withTempPair', () => {
  it('offers both sides as files named like the original', () => {
    const seen = withTempPair('src/app.ts', 'old\n', 'new\n', (oldPath, newPath) => {
      expect(readFileSync(oldPath, 'utf-8')).toBe('old\n')
      expect(readFileSync(newPath, 'utf-8')).toBe('new\n')
      expect(oldPath.endsWith('app.ts')).toBe(true)
      expect(newPath.endsWith('app.ts')).toBe(true)
      expect(oldPath).not.toBe(newPath)
      return [oldPath, newPath]
    })
    expect(existsSync(seen[0])).toBe(false)
    expect(existsSync(seen[1])).toBe(false)
  })

  it('clears the files when the body throws', () => {
    let paths: string[] = []
    expect(() =>
      withTempPair('src/app.ts', 'old\n', 'new\n', (oldPath, newPath) => {
        paths = [oldPath, newPath]
        throw new Error('difft failed')
      }),
    ).toThrow('difft failed')
    expect(paths.every((path) => !existsSync(path))).toBe(true)
  })
})

const sample = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, '..', 'specs', '005-structural-diff', 'contracts', name), 'utf-8'))

describe('parseDifft', () => {
  it('reads the changed lines of a real result', () => {
    const file = parseDifft(sample('sample-difft.json'))
    expect(file.language).toBe('TypeScript')
    expect(file.unchanged).toBe(false)
    expect(file.fellBack).toBe(false)
    expect(file.changes).toEqual([
      {
        before: { lineNumber: 2, ranges: [{ start: 9, end: 24 }] },
        after: { lineNumber: 2, ranges: [{ start: 9, end: 21 }] },
      },
    ])
  })

  it('reports a reformat as structurally unchanged', () => {
    const file = parseDifft(sample('sample-difft-unchanged.json'))
    expect(file.unchanged).toBe(true)
    expect(file.changes).toEqual([])
  })

  it('reports a file without a grammar as a fallback', () => {
    const file = parseDifft(sample('sample-difft-text.json'))
    expect(file.fellBack).toBe(true)
    expect(file.changes).toHaveLength(1)
  })

  it('refuses a result that lost its shape', () => {
    expect(() => parseDifft({ path: 'a.ts', status: 'changed', chunks: 'nonsense' })).toThrow(ShapeError)
    expect(() => parseDifft(null)).toThrow(ShapeError)
  })
})

const installed = detectDifft().available

describe.skipIf(!installed)('structuralDiff against the real binary', () => {
  const reformatted = 'export function f(\n    a: number,\n) {\n      return a + 1\n}\n'

  it('reports a pure reformat as unchanged', () => {
    const result = structuralDiff('src/f.ts', 'export function f(a: number) {\n  return a + 1\n}\n', reformatted, {
      ignoreComments: false,
    })
    expect(result.result?.unchanged).toBe(true)
  })

  it('marks the wrapper and leaves the wrapped block alone', () => {
    const before = 'function f(a) {\n  doWork(a)\n  return a\n}\n'
    const after = 'function f(a) {\n  if (a) {\n    doWork(a)\n    return a\n  }\n}\n'
    const result = structuralDiff('src/f.js', before, after, { ignoreComments: false })
    const changed = result.result?.changes ?? []
    expect(changed.length).toBeGreaterThan(0)
    // The old side of a wrapped block is carried for alignment and stays unmarked.
    expect(changed.every((change) => (change.before?.ranges.length ?? 0) === 0)).toBe(true)
    expect(changed.some((change) => (change.after?.ranges.length ?? 0) > 0)).toBe(true)
  })

  it('leaves the comment out of the comparison on request', () => {
    const before = 'const a = 1\n// one\n'
    const after = 'const a = 1\n// two\n'
    expect(structuralDiff('src/c.js', before, after, { ignoreComments: true }).result?.unchanged).toBe(true)
    expect(structuralDiff('src/c.js', before, after, { ignoreComments: false }).result?.unchanged).toBe(false)
  })
})

describe('structuralDiff', () => {
  const changed = readFileSync(join(__dirname, '..', 'specs', '005-structural-diff', 'contracts', 'sample-difft.json'), 'utf-8')

  it('asks difftastic once per file state', () => {
    let calls = 0
    const run = () => {
      calls++
      return changed
    }
    structuralDiff('src/a.ts', 'old\n', 'new\n', { ignoreComments: false }, run)
    structuralDiff('src/a.ts', 'old\n', 'new\n', { ignoreComments: false }, run)
    expect(calls).toBe(1)
    structuralDiff('src/a.ts', 'old\n', 'newer\n', { ignoreComments: false }, run)
    expect(calls).toBe(2)
    structuralDiff('src/a.ts', 'old\n', 'new\n', { ignoreComments: true }, run)
    expect(calls).toBe(3)
  })

  it('passes the comment setting on', () => {
    const seen: string[][] = []
    const run = (args: string[]) => {
      seen.push(args)
      return changed
    }
    structuralDiff('src/b.ts', 'old\n', 'new\n', { ignoreComments: true }, run)
    expect(seen[0]).toContain('--ignore-comments')
    expect(seen[0]).toContain('--display')
    expect(seen[0]).toContain('json')
  })

  it('reports a missing binary instead of failing', () => {
    const result = structuralDiff('src/c.ts', 'old\n', 'new\n', { ignoreComments: false }, () => {
      throw new Error('spawnSync difft ENOENT')
    })
    expect(result.available).toBe(false)
    expect(result.reason).toContain('difftastic not installed')
  })

  it('reports an unreadable result instead of failing', () => {
    const result = structuralDiff('src/d.ts', 'old\n', 'new\n', { ignoreComments: false }, () => '{"nonsense":true}')
    expect(result.result).toBeUndefined()
    expect(result.reason).toContain('could not be read')
  })
})
