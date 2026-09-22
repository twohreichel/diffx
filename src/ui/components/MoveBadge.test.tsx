// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoveBadge } from './MoveBadge'
import type { MovePair } from '../../moves'

const pair: MovePair = {
  id: 'M1',
  from: { path: 'src/a.ts', side: 'deletions', startLine: 12, lineCount: 7 },
  to: { path: 'src/b.ts', side: 'additions', startLine: 40, lineCount: 7 },
  kind: 'exact',
  changedLines: [],
  ambiguous: false,
}

describe('MoveBadge', () => {
  it('names where an unchanged block went', () => {
    render(<MoveBadge pair={pair} role="from" onJump={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveTextContent('7 lines moved to src/b.ts:40 — unchanged')
  })

  it('names where a block came from', () => {
    render(<MoveBadge pair={pair} role="to" onJump={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveTextContent('7 lines moved from src/a.ts:12 — unchanged')
  })

  it('counts the lines that were edited on the way', () => {
    render(<MoveBadge pair={{ ...pair, kind: 'modified', changedLines: [41, 43] }} role="to" onJump={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveTextContent('2 lines changed')
  })

  it('says when more than one block could have been the origin', () => {
    render(<MoveBadge pair={{ ...pair, ambiguous: true }} role="to" onJump={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveTextContent('more than one match')
  })

  it('jumps to the counterpart when clicked', async () => {
    const onJump = vi.fn()
    render(<MoveBadge pair={pair} role="to" onJump={onJump} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onJump).toHaveBeenCalledWith(pair.from)
  })

  it('carries the pair id, so the two ends read as one pair', () => {
    render(<MoveBadge pair={pair} role="to" onJump={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveTextContent('M1')
  })
})
