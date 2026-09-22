// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from './Toolbar'
import type { ContextWidth } from '../../context'
import type { LineDiffMode } from '../../lineDiff'
import type { AutoBlink, ViewMode } from '../../blink'

function renderToolbar(overrides: Partial<Parameters<typeof Toolbar>[0]> = {}) {
  const onContextChange = vi.fn()
  const onLineDiffChange = vi.fn()
  const onDiffStyleChange = vi.fn()
  const onAutoBlinkChange = vi.fn()
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
      lineDiff="word"
      onLineDiffChange={onLineDiffChange}
      blinkState="after"
      autoBlink="off"
      reducedMotion={false}
      onAutoBlinkChange={onAutoBlinkChange}
      onDiffStyleChange={onDiffStyleChange}
      onDiffOptionsChange={vi.fn()}
      onDefaultTabSizeChange={vi.fn()}
      onSoftWrapChange={vi.fn()}
      onBrowserChange={vi.fn()}
      onCopyComments={vi.fn()}
      {...overrides}
    />,
  )
  return { onContextChange, onLineDiffChange, onDiffStyleChange, onAutoBlinkChange }
}

async function openSettings(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
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

  it('disables the control in blink mode, which renders the whole file', () => {
    renderToolbar({ diffStyle: 'blink' })
    expect(contextButton('3')).toBeDisabled()
    expect(screen.getByRole('group', { name: 'Context' }).getAttribute('title')).toMatch(/blink/i)
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

describe('Toolbar intra-line granularity', () => {
  it('offers word, character and off', async () => {
    renderToolbar()
    await openSettings()
    const options = [...screen.getByLabelText('Intra-line diff').querySelectorAll('option')]
    expect(options.map((option) => option.value)).toEqual(['word', 'char', 'off'])
  })

  it('shows the granularity in force', async () => {
    renderToolbar({ lineDiff: 'char' })
    await openSettings()
    expect(screen.getByLabelText('Intra-line diff')).toHaveValue('char')
  })

  it('reports the chosen granularity', async () => {
    const { onLineDiffChange } = renderToolbar()
    await openSettings()
    await userEvent.selectOptions(screen.getByLabelText('Intra-line diff'), 'char')
    expect(onLineDiffChange).toHaveBeenCalledWith<[LineDiffMode]>('char')
  })
})

describe('Toolbar blink mode', () => {
  it('offers Blink beside Split and Unified', async () => {
    const { onDiffStyleChange } = renderToolbar()
    await userEvent.click(screen.getByRole('button', { name: 'Blink' }))
    expect(onDiffStyleChange).toHaveBeenCalledWith<[ViewMode]>('blink')
  })

  it('names the state on screen, not by the pane colour alone', () => {
    renderToolbar({ diffStyle: 'blink', blinkState: 'before' })
    expect(screen.getByRole('status', { name: 'Blink state' })).toHaveTextContent('BEFORE')
  })

  it('says nothing about a state the other modes do not have', () => {
    renderToolbar({ diffStyle: 'split' })
    expect(screen.queryByRole('status', { name: 'Blink state' })).toBeNull()
  })

  it('offers off and the three auto-blink intervals', async () => {
    renderToolbar({ diffStyle: 'blink' })
    await openSettings()
    const options = [...screen.getByLabelText('Auto blink').querySelectorAll('option')]
    expect(options.map((option) => option.value)).toEqual(['off', '400', '800', '1600'])
  })

  it('reports the chosen interval as a number', async () => {
    const { onAutoBlinkChange } = renderToolbar({ diffStyle: 'blink' })
    await openSettings()
    await userEvent.selectOptions(screen.getByLabelText('Auto blink'), '1600')
    expect(onAutoBlinkChange).toHaveBeenCalledWith<[AutoBlink]>(1600)
  })

  it('withholds auto blink from a reader who asked for no motion', async () => {
    renderToolbar({ diffStyle: 'blink', reducedMotion: true })
    await openSettings()
    expect(screen.queryByLabelText('Auto blink')).toBeNull()
  })

  it('withholds auto blink outside blink mode', async () => {
    renderToolbar({ diffStyle: 'unified' })
    await openSettings()
    expect(screen.queryByLabelText('Auto blink')).toBeNull()
  })
})
