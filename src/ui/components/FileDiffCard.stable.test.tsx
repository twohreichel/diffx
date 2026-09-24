// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { FileDiffMetadata } from '@pierre/diffs'

const captured: Record<string, unknown>[] = []

vi.mock('@pierre/diffs/react', () => ({
  FileDiff: (props: Record<string, unknown>) => {
    captured.push(props)
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

const noAnnotations: never[] = []
const noMoves: never[] = []
const structuralQuery = { staged: true, untracked: true, ignoreComments: false }

function card(onStructuralResult: () => void) {
  return (
    <FileDiffCard
      fileDiff={fileDiff}
      filePath="src/app.ts"
      annotations={noAnnotations}
      moves={noMoves}
      onJumpToMove={vi.fn()}
      structuralQuery={structuralQuery}
      onStructuralResult={onStructuralResult}
      structuralAvailable={false}
      onToggleStructural={vi.fn()}
      diffStyle="blink"
      blinkState="after"
      lineDiff="word"
      tabSize={4}
      softWrap={false}
      viewed={false}
      onViewedChange={vi.fn()}
      onAddComment={vi.fn()}
      onDeleteComment={vi.fn()}
      onEditComment={vi.fn()}
      onCommentStatusChange={vi.fn()}
    />
  )
}

describe('FileDiffCard render cost', () => {
  it('hands the renderer the same options and annotations across a re-render', () => {
    const { rerender } = render(card(vi.fn()))
    rerender(card(vi.fn()))
    expect(captured).toHaveLength(2)
    const [first, second] = captured
    expect(second.options).toBe(first.options)
    expect(second.lineAnnotations).toBe(first.lineAnnotations)
    expect(second.renderAnnotation).toBe(first.renderAnnotation)
    expect(second.renderGutterUtility).toBe(first.renderGutterUtility)
  })
})
