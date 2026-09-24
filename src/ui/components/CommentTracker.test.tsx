// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentTracker } from './CommentTracker'
import type { ReviewComment } from '../../types'

function comment(overrides: Partial<ReviewComment> = {}): ReviewComment {
  return {
    id: 'c1',
    filePath: 'src/app.ts',
    side: 'additions',
    lineNumber: 12,
    lineContent: 'const value = 1',
    body: 'Rename this',
    status: 'open',
    createdAt: Date.now(),
    replies: [],
    ...overrides,
  }
}

describe('CommentTracker actions', () => {
  it('resolves a comment from the list', async () => {
    const onStatusChange = vi.fn()
    render(<CommentTracker comments={[comment()]} onStatusChange={onStatusChange} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /mark as resolved/i }))
    expect(onStatusChange).toHaveBeenCalledWith('c1', 'resolved')
  })

  it('deletes a resolved comment from the list', async () => {
    const onDelete = vi.fn()
    render(<CommentTracker comments={[comment({ status: 'resolved' })]} onStatusChange={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete comment/i }))
    expect(onDelete).toHaveBeenCalledWith('c1')
  })
})
