import { describe, it, expect } from 'vitest'
import { detectDifft, structuralDiff, type StructuralFile } from './structural.js'

const installed = detectDifft().available

const ORIGINAL = `export function run(value: number): number {
  const doubled = value * 2
  return doubled
}
`

const REFORMATTED = `export function run(value: number): number
{
      const doubled
            = value * 2
      return doubled
}
`

const WRAPPED = `export function run(value: number): number {
  if (value > 0) {
    const doubled = value * 2
    return doubled
  }
  return 0
}
`

/** The one-based lines difftastic reports as changed on the new side. */
function changedLines(file: StructuralFile): number[] {
  return [...new Set(file.changes.flatMap((change) => (change.after ? [change.after.lineNumber] : [])))]
}

function textOf(source: string, line: number): string {
  return source.split('\n')[line - 1]
}

describe.skipIf(!installed)('structuralDiff against the installed difftastic', () => {
  it('reports no change when only the formatting differs', () => {
    const response = structuralDiff('run.ts', ORIGINAL, REFORMATTED, { ignoreComments: false })
    expect(response.available).toBe(true)
    expect(response.result?.fellBack).toBe(false)
    expect(response.result?.unchanged).toBe(true)
  })

  it('marks the wrapper of a block, not the lines it moved', () => {
    const response = structuralDiff('run.ts', ORIGINAL, WRAPPED, { ignoreComments: false })
    const result = response.result
    expect(result?.unchanged).toBe(false)
    const marked = changedLines(result as StructuralFile).map((line) => textOf(WRAPPED, line).trim())
    expect(marked).toContain('if (value > 0) {')
    expect(marked).not.toContain('const doubled = value * 2')
  })
})
