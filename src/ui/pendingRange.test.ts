import { describe, it, expect } from 'vitest'
import { extendPending } from './pendingRange'

describe('extendPending', () => {
  it('starts a single-line comment on a plain click', () => {
    expect(extendPending(null, { side: 'additions', lineNumber: 12 }, false)).toEqual({
      side: 'additions',
      lineNumber: 12,
      endLine: 12,
    })
  })

  it('extends the open range down to the clicked line', () => {
    const pending = { side: 'additions' as const, lineNumber: 12, endLine: 12 }
    expect(extendPending(pending, { side: 'additions', lineNumber: 18 }, true)).toEqual({
      side: 'additions',
      lineNumber: 12,
      endLine: 18,
    })
  })

  it('extends upwards by moving the start line', () => {
    const pending = { side: 'additions' as const, lineNumber: 12, endLine: 14 }
    expect(extendPending(pending, { side: 'additions', lineNumber: 8 }, true)).toEqual({
      side: 'additions',
      lineNumber: 8,
      endLine: 14,
    })
  })

  it('starts over when the other side is clicked', () => {
    const pending = { side: 'additions' as const, lineNumber: 12, endLine: 14 }
    expect(extendPending(pending, { side: 'deletions', lineNumber: 5 }, true)).toEqual({
      side: 'deletions',
      lineNumber: 5,
      endLine: 5,
    })
  })

  it('starts over on a plain click while a range is open', () => {
    const pending = { side: 'additions' as const, lineNumber: 12, endLine: 14 }
    expect(extendPending(pending, { side: 'additions', lineNumber: 20 }, false)).toEqual({
      side: 'additions',
      lineNumber: 20,
      endLine: 20,
    })
  })
})
