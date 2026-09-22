// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { isTypingTarget, useShortcuts } from './useShortcuts'

function Harness({ handlers }: { handlers: Record<string, () => void> }) {
  useShortcuts(handlers)
  return (
    <div>
      <input aria-label="comment" />
      <button>plain</button>
    </div>
  )
}

describe('isTypingTarget', () => {
  it('is true for the fields a reviewer types into', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const editable = document.createElement('div')
    // jsdom does not reflect the contentEditable property, so set the attribute
    // a browser would set for it.
    editable.setAttribute('contenteditable', 'true')
    expect(isTypingTarget(input)).toBe(true)
    expect(isTypingTarget(textarea)).toBe(true)
    expect(isTypingTarget(editable)).toBe(true)
  })

  it('is false for everything else', () => {
    expect(isTypingTarget(null)).toBe(false)
    expect(isTypingTarget(document.createElement('button'))).toBe(false)
    expect(isTypingTarget(document.body)).toBe(false)
  })
})

describe('useShortcuts', () => {
  it('runs the handler for a bare key', async () => {
    const widen = vi.fn()
    render(<Harness handlers={{ ']': widen }} />)
    await userEvent.keyboard(']')
    expect(widen).toHaveBeenCalledTimes(1)
  })

  it('stays silent while the user types a comment', async () => {
    const widen = vi.fn()
    const { getByLabelText } = render(<Harness handlers={{ ']': widen }} />)
    await userEvent.click(getByLabelText('comment'))
    await userEvent.keyboard(']')
    expect(widen).not.toHaveBeenCalled()
  })

  it('leaves browser and system chords alone', async () => {
    const widen = vi.fn()
    render(<Harness handlers={{ ']': widen }} />)
    await userEvent.keyboard('{Meta>}]{/Meta}')
    await userEvent.keyboard('{Control>}]{/Control}')
    expect(widen).not.toHaveBeenCalled()
  })

  it('ignores keys it was not given', async () => {
    const widen = vi.fn()
    render(<Harness handlers={{ ']': widen }} />)
    await userEvent.keyboard('x')
    expect(widen).not.toHaveBeenCalled()
  })
})
