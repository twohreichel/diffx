// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FileDiffMetadata, AnnotationSide } from '@pierre/diffs'

const hovered: { line: { side: AnnotationSide; lineNumber: number } | null } = { line: null }

vi.mock('@pierre/diffs/react', () => ({
  FileDiff: (props: {
    lineAnnotations: { lineNumber: number; metadata: unknown }[]
    renderAnnotation: (annotation: { lineNumber: number; metadata: unknown }) => React.ReactNode
    renderGutterUtility: (getHoveredLine: () => { side: AnnotationSide; lineNumber: number } | null) => React.ReactNode
  }) => (
    <div data-testid="file-diff">
      {props.renderGutterUtility(() => hovered.line)}
      {props.lineAnnotations.map((annotation, index) => (
        <div key={index}>{props.renderAnnotation(annotation)}</div>
      ))}
    </div>
  ),
}))

const { FileDiffCard } = await import('./FileDiffCard')

const fileDiff: FileDiffMetadata = {
  name: 'src/app.ts',
  type: 'change',
  hunks: [],
  splitLineCount: 0,
  unifiedLineCount: 0,
  isPartial: false,
  deletionLines: [],
  additionLines: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'const value = 1'],
}

function renderCard(onAddComment = vi.fn()) {
  render(
    <FileDiffCard
      fileDiff={fileDiff}
      filePath="src/app.ts"
      annotations={[]}
      moves={[]}
      onJumpToMove={vi.fn()}
      structuralQuery={{ staged: true, untracked: true, ignoreComments: false }}
      onStructuralResult={vi.fn()}
      structuralAvailable={false}
      onToggleStructural={vi.fn()}
      diffStyle="split"
      blinkState="after"
      lineDiff="word"
      tabSize={4}
      softWrap={false}
      viewed={false}
      onViewedChange={vi.fn()}
      onAddComment={onAddComment}
      onDeleteComment={vi.fn()}
      onEditComment={vi.fn()}
      onCommentStatusChange={vi.fn()}
    />,
  )
  return onAddComment
}

beforeEach(() => {
  hovered.line = null
})

describe('FileDiffCard comment range', () => {
  it('comments on a single line after a plain click', async () => {
    const user = userEvent.setup()
    const onAddComment = renderCard()
    hovered.line = { side: 'additions', lineNumber: 12 }
    await user.click(screen.getByRole('button', { name: 'Add a comment' }))
    await user.type(screen.getByRole('textbox'), 'Rename this')
    await user.click(screen.getByRole('button', { name: 'Comment' }))
    expect(onAddComment).toHaveBeenCalledWith({
      filePath: 'src/app.ts',
      side: 'additions',
      lineNumber: 12,
      endLine: 12,
      lineContent: 'const value = 1',
      body: 'Rename this',
    })
  })

  it('covers the lines between two clicks when the second one holds shift', async () => {
    const user = userEvent.setup()
    const onAddComment = renderCard()
    hovered.line = { side: 'additions', lineNumber: 8 }
    await user.click(screen.getByRole('button', { name: 'Add a comment' }))
    hovered.line = { side: 'additions', lineNumber: 12 }
    await user.keyboard('{Shift>}')
    await user.click(screen.getByRole('button', { name: 'Add a comment' }))
    await user.keyboard('{/Shift}')
    expect(screen.getByText('Lines 8–12')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'Extract these')
    await user.click(screen.getByRole('button', { name: 'Comment' }))
    expect(onAddComment).toHaveBeenCalledWith(
      expect.objectContaining({ lineNumber: 8, endLine: 12, lineContent: 'h' }),
    )
  })
})
