import { describe, it, expect } from 'vitest'
import { pickAnchor, anchorDelta, type AnchorRow } from './anchor'

function row(overrides: Partial<AnchorRow> = {}): AnchorRow {
  return { file: 'src/app.ts', line: 10, side: 'addition', top: 100, ...overrides }
}

describe('pickAnchor', () => {
  it('takes the topmost changed row at or below the viewport top', () => {
    const rows = [row({ line: 40, top: 300 }), row({ line: 20, top: 120 }), row({ line: 30, top: 200 })]
    expect(pickAnchor(rows, 100)?.line).toBe(20)
  })

  it('never takes a context line, even when it is the topmost row', () => {
    const rows = [row({ line: 19, side: 'context', top: 100 }), row({ line: 20, top: 120 })]
    expect(pickAnchor(rows, 100)?.line).toBe(20)
  })

  it('records how far the row sat below the viewport top', () => {
    expect(pickAnchor([row({ top: 175 })], 100)?.offset).toBe(75)
  })

  it('ignores rows scrolled above the viewport top', () => {
    expect(pickAnchor([row({ top: 40 })], 100)).toBeNull()
  })

  it('reports nothing when the diff holds no changed row', () => {
    expect(pickAnchor([row({ side: 'context', top: 120 })], 100)).toBeNull()
  })
})

describe('anchorDelta', () => {
  it('reports how far the anchored row moved', () => {
    const anchor = pickAnchor([row({ top: 175 })], 100)!
    expect(anchorDelta([row({ top: 250 })], anchor, 100)).toBe(75)
  })

  it('reports no movement when the row stayed put', () => {
    const anchor = pickAnchor([row({ top: 175 })], 100)!
    expect(anchorDelta([row({ top: 175 })], anchor, 100)).toBe(0)
  })

  it('reports nothing when the anchored row is gone', () => {
    const anchor = pickAnchor([row({ top: 175 })], 100)!
    expect(anchorDelta([row({ line: 99, top: 175 })], anchor, 100)).toBeNull()
  })

  it('does not confuse the two sides of the same line number', () => {
    const anchor = pickAnchor([row({ side: 'deletion', top: 175 })], 100)!
    expect(anchorDelta([row({ side: 'addition', top: 175 })], anchor, 100)).toBeNull()
  })
})
