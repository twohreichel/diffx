// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { FileDiffMetadata } from '@pierre/diffs'

const captured: { options?: Record<string, unknown> } = {}

vi.mock('@pierre/diffs/react', () => ({
  FileDiff: (props: { options: Record<string, unknown> }) => {
    captured.options = props.options
    return <div data-testid="file-diff" />
  },
}))

const { FileDiffCard } = await import('./FileDiffCard')

const fileDiff: FileDiffMetadata = {
  name: 'src/app.ts',
  type: 'change',
  hunks: [],
  splitLineCount: 0,
  unifiedLineCount: 0,
  isPartial: true,
  deletionLines: [],
  additionLines: [],
}

function renderCard(overrides: Partial<Parameters<typeof FileDiffCard>[0]> = {}) {
  render(
    <FileDiffCard
      fileDiff={fileDiff}
      filePath="src/app.ts"
      annotations={[]}
      diffStyle="split"
      lineDiff="word"
      tabSize={4}
      softWrap={false}
      viewed={false}
      onViewedChange={vi.fn()}
      onAddComment={vi.fn()}
      onDeleteComment={vi.fn()}
      {...overrides}
    />,
  )
  return captured.options!
}

beforeEach(() => {
  captured.options = undefined
})

describe('FileDiffCard intra-line options', () => {
  it.each(['split', 'unified'] as const)('asks for word emphasis in %s', (diffStyle) => {
    expect(renderCard({ diffStyle }).lineDiffType).toBe('word-alt')
  })

  it.each(['split', 'unified'] as const)('asks for character emphasis in %s', (diffStyle) => {
    expect(renderCard({ diffStyle, lineDiff: 'char' }).lineDiffType).toBe('char')
  })

  it('turns emphasis off on request', () => {
    expect(renderCard({ lineDiff: 'off' }).lineDiffType).toBe('none')
  })

  it('diffs inside lines up to two thousand characters', () => {
    expect(renderCard().maxLineDiffLength).toBe(2000)
  })

  it('carries the emphasis by an underline as well as a background', () => {
    expect(renderCard().unsafeCSS).toMatch(/\[data-diff-span\][^}]*border-bottom/)
  })
})
