// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from './Toolbar'
import type { ContextWidth } from '../../context'

function renderToolbar(overrides: Partial<Parameters<typeof Toolbar>[0]> = {}) {
  const onContextChange = vi.fn()
  render(
    <Toolbar
      repoName="diffx"
      branch="main"
      fileCount={1}
      additions={1}
      deletions={1}
      commentCount={0}
      diffStyle="split"
      diffOptions={{ staged: true, untracked: true, context: 3 }}
      defaultTabSize={4}
      softWrap={false}
      customMode={false}
      context={3}
      contextDisabled={false}
      onContextChange={onContextChange}
      onDiffStyleChange={vi.fn()}
      onDiffOptionsChange={vi.fn()}
      onDefaultTabSizeChange={vi.fn()}
      onSoftWrapChange={vi.fn()}
      onBrowserChange={vi.fn()}
      onCopyComments={vi.fn()}
      {...overrides}
    />,
  )
  return { onContextChange }
}

function contextButton(label: string): HTMLButtonElement {
  return screen.getByRole('group', { name: 'Context' }).querySelector<HTMLButtonElement>(
    `button[data-context="${label}"]`,
  )!
}

describe('Toolbar context control', () => {
  it('offers every step of the range', () => {
    renderToolbar()
    for (const step of ['0', '3', '10', 'full']) {
      expect(contextButton(step)).toBeInTheDocument()
    }
  })

  it('marks the current step for assistive technology, not by colour alone', () => {
    renderToolbar({ context: 10 })
    expect(contextButton('10')).toHaveAttribute('aria-pressed', 'true')
    expect(contextButton('3')).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports the chosen step', async () => {
    const { onContextChange } = renderToolbar()
    await userEvent.click(contextButton('0'))
    expect(onContextChange).toHaveBeenCalledWith<[ContextWidth]>(0)
    await userEvent.click(contextButton('full'))
    expect(onContextChange).toHaveBeenCalledWith<[ContextWidth]>('full')
  })

  it('disables the control when context cannot apply, and says why', () => {
    renderToolbar({ contextDisabled: true })
    expect(contextButton('0')).toBeDisabled()
    const group = screen.getByRole('group', { name: 'Context' })
    expect(group.getAttribute('title')).toMatch(/binary/i)
  })

  it('leaves the split and unified toggle in place', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Split' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unified' })).toBeInTheDocument()
  })
})
