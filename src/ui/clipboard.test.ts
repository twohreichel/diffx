// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { copyText } from './clipboard'

function stubClipboard(writeText: (() => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText && { writeText },
    configurable: true,
  })
}

describe('copyText', () => {
  afterEach(() => {
    stubClipboard(undefined)
    vi.restoreAllMocks()
  })

  it.each([
    ['the Clipboard API', () => Promise.resolve(), () => false, true],
    ['the selection when the Clipboard API rejects', () => Promise.reject(new Error('denied')), () => true, true],
    ['the selection when the Clipboard API is missing', undefined, () => true, true],
    ['nothing when both ways fail', undefined, () => false, false],
    ['nothing when execCommand throws', undefined, () => { throw new Error('unsupported') }, false],
  ])('copies via %s', async (_, writeText, execCommand, expected) => {
    stubClipboard(writeText)
    document.execCommand = vi.fn(execCommand)
    await expect(copyText('comments')).resolves.toBe(expected)
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('selects the full text before copying it', async () => {
    stubClipboard(undefined)
    let selected = ''
    document.execCommand = vi.fn(() => {
      const area = document.querySelector('textarea')!
      selected = area.value.slice(area.selectionStart, area.selectionEnd)
      return true
    })
    await copyText('line 1\nline 2')
    expect(selected).toBe('line 1\nline 2')
  })
})
