// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BinaryFileDiff } from './BinaryFileDiff'
import type { BlinkState } from '../../blink'

function renderImage(overrides: Partial<Parameters<typeof BinaryFileDiff>[0]> = {}) {
  render(
    <BinaryFileDiff
      filePath="docs/logo.png"
      info={{ path: 'docs/logo.png', type: 'changed' }}
      viewed={false}
      blinkState={null}
      onViewedChange={vi.fn()}
      {...overrides}
    />,
  )
}

function labels(): string[] {
  return screen.getAllByRole('img').map((img) => img.getAttribute('alt') ?? '')
}

describe('BinaryFileDiff image preview', () => {
  it('shows both states side by side outside blink mode', () => {
    renderImage()
    expect(labels()).toEqual(['docs/logo.png (before)', 'docs/logo.png (after)'])
  })

  it.each(['before', 'after'] as const)('shows only the %s image while blinking', (state: BlinkState) => {
    renderImage({ blinkState: state })
    expect(labels()).toEqual([`docs/logo.png (${state})`])
  })

  it('leaves a non-image binary alone', () => {
    render(
      <BinaryFileDiff
        filePath="build/app.wasm"
        info={{ path: 'build/app.wasm', type: 'changed' }}
        viewed={false}
        blinkState="before"
        onViewedChange={vi.fn()}
      />,
    )
    expect(screen.queryByRole('img')).toBeNull()
  })
})
