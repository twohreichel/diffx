import { describe, it, expect } from 'vitest'
import { formatComments } from './formatComments'
import type { ReviewComment } from '../types'

function comment(overrides: Partial<ReviewComment> = {}): ReviewComment {
  return {
    id: 'c1',
    filePath: 'src/app.ts',
    side: 'additions',
    lineNumber: 12,
    lineContent: 'const value = 1',
    body: 'Rename this',
    status: 'open',
    createdAt: 0,
    replies: [],
    ...overrides,
  }
}

describe('formatComments', () => {
  it('leaves resolved comments out', () => {
    const text = formatComments([comment(), comment({ id: 'c2', body: 'Done already', status: 'resolved' })])
    expect(text).toContain('Rename this')
    expect(text).not.toContain('Done already')
  })

  it('returns nothing when every comment is resolved', () => {
    expect(formatComments([comment({ status: 'resolved' })])).toBe('')
  })

  it('names the range of a multi-line comment', () => {
    const text = formatComments([comment({ endLine: 18 })])
    expect(text).toContain('<comment line="12-18">')
  })

  it('names a single line without a range', () => {
    expect(formatComments([comment()])).toContain('<comment line="12">')
  })
})
