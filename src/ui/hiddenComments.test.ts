import { describe, it, expect } from 'vitest'
import { hiddenAnnotations, isLineRendered, type DiffFileSpans } from './hiddenComments'

const file: DiffFileSpans = {
  isPartial: true,
  hunks: [
    { additionStart: 10, additionCount: 4, deletionStart: 10, deletionCount: 3 },
    { additionStart: 80, additionCount: 2, deletionStart: 79, deletionCount: 2 },
  ],
}

describe('isLineRendered', () => {
  it('accepts a line inside a hunk', () => {
    expect(isLineRendered(file, 'additions', 12)).toBe(true)
  })

  it('rejects a line between two hunks', () => {
    expect(isLineRendered(file, 'additions', 40)).toBe(false)
  })

  it('rejects the line just past a hunk', () => {
    expect(isLineRendered(file, 'additions', 14)).toBe(false)
  })

  it('reads the deletion span for the deletion side', () => {
    expect(isLineRendered(file, 'deletions', 12)).toBe(true)
    expect(isLineRendered(file, 'deletions', 13)).toBe(false)
  })

  it('renders every line of a file that is not partial', () => {
    expect(isLineRendered({ ...file, isPartial: false }, 'additions', 40)).toBe(true)
  })
})

describe('hiddenAnnotations', () => {
  it('returns only the annotations the current width leaves out', () => {
    const annotations = [
      { side: 'additions' as const, lineNumber: 11 },
      { side: 'additions' as const, lineNumber: 40 },
      { side: 'deletions' as const, lineNumber: 200 },
    ]
    expect(hiddenAnnotations(file, annotations)).toEqual([
      { side: 'additions', lineNumber: 40 },
      { side: 'deletions', lineNumber: 200 },
    ])
  })

  it('returns nothing when every annotated line is on screen', () => {
    expect(hiddenAnnotations(file, [{ side: 'additions' as const, lineNumber: 81 }])).toEqual([])
  })
})
