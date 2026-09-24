// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentBubble } from './CommentBubble'
import type { ReviewComment } from '../../types'

const comment: ReviewComment = {
  id: 'c1',
  filePath: 'src/app.ts',
  side: 'additions',
  lineNumber: 12,
  lineContent: 'const value = 1',
  body: 'Rename this',
  status: 'open',
  createdAt: Date.now(),
  replies: [],
}

function renderBubble(overrides: Partial<ReviewComment> = {}) {
  const onDelete = vi.fn()
  const onEdit = vi.fn()
  const onStatusChange = vi.fn()
  render(
    <CommentBubble
      comment={{ ...comment, ...overrides }}
      onDelete={onDelete}
      onEdit={onEdit}
      onStatusChange={onStatusChange}
    />,
  )
  return { onDelete, onEdit, onStatusChange }
}

describe('CommentBubble editing', () => {
  it('opens the body in a field and reports the rewritten text', async () => {
    const { onEdit } = renderBubble()

    await userEvent.click(screen.getByRole('button', { name: /edit comment/i }))
    const field = screen.getByRole('textbox')
    expect(field).toHaveValue('Rename this')
    await userEvent.clear(field)
    await userEvent.type(field, 'Rename it to value')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onEdit).toHaveBeenCalledWith('c1', 'Rename it to value')
  })

  it('leaves the comment untouched on cancel', async () => {
    const { onEdit } = renderBubble()

    await userEvent.click(screen.getByRole('button', { name: /edit comment/i }))
    await userEvent.type(screen.getByRole('textbox'), ' more')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('Rename this')).toBeInTheDocument()
  })
})

describe('CommentBubble status', () => {
  it('marks a comment as done without deleting it', async () => {
    const { onStatusChange } = renderBubble()

    await userEvent.click(screen.getByRole('button', { name: /mark as resolved/i }))

    expect(onStatusChange).toHaveBeenCalledWith('c1', 'resolved')
  })

  it('takes a resolved comment back to open', async () => {
    const { onStatusChange } = renderBubble({ status: 'resolved' })

    await userEvent.click(screen.getByRole('button', { name: /reopen/i }))

    expect(onStatusChange).toHaveBeenCalledWith('c1', 'open')
  })

  it('keeps a resolved comment deletable', async () => {
    const { onDelete } = renderBubble({ status: 'resolved' })

    await userEvent.click(screen.getByRole('button', { name: /delete comment/i }))

    expect(onDelete).toHaveBeenCalledWith('c1')
  })

  it('names the line range of a comment that spans several lines', () => {
    renderBubble({ endLine: 18 })
    expect(screen.getByText('Lines 12–18')).toBeInTheDocument()
  })
})
