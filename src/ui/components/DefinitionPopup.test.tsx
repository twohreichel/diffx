// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DefinitionPopup } from './DefinitionPopup'
import type { Definition } from '../../definitions'

const definition: Definition = {
  path: 'src/app.ts',
  line: 3,
  kind: 'function',
  lines: ['export function render(value: number): number {', '  return helper(value) + 1', '}'],
}

describe('DefinitionPopup', () => {
  it('names the symbol it looked up', () => {
    render(<DefinitionPopup name="render" loading={false} definitions={[definition]} onClose={vi.fn()} onJump={vi.fn()} />)
    expect(screen.getByText('render')).toBeInTheDocument()
    expect(screen.getByText('src/app.ts:3')).toBeInTheDocument()
    expect(screen.getByText(/export function render/)).toBeInTheDocument()
  })

  it('says when the search is still running', () => {
    render(<DefinitionPopup name="render" loading={true} definitions={[]} onClose={vi.fn()} onJump={vi.fn()} />)
    expect(screen.getByText(/Searching/)).toBeInTheDocument()
  })

  it('says when the name is declared nowhere', () => {
    render(<DefinitionPopup name="render" loading={false} definitions={[]} onClose={vi.fn()} onJump={vi.fn()} />)
    expect(screen.getByText(/No declaration of “render”/)).toBeInTheDocument()
  })

  it('closes on request', async () => {
    const onClose = vi.fn()
    render(<DefinitionPopup name="render" loading={false} definitions={[definition]} onClose={onClose} onJump={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on escape', async () => {
    const onClose = vi.fn()
    render(<DefinitionPopup name="render" loading={false} definitions={[definition]} onClose={onClose} onJump={vi.fn()} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('offers the way to the declaration', async () => {
    const onJump = vi.fn()
    render(<DefinitionPopup name="render" loading={false} definitions={[definition]} onClose={vi.fn()} onJump={onJump} />)
    await userEvent.click(screen.getByRole('button', { name: /src\/app\.ts:3/ }))
    expect(onJump).toHaveBeenCalledWith(definition)
  })
})
