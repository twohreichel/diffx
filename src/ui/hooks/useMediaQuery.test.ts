// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMediaQuery', () => {
  it('does not match where the browser has no matchMedia', () => {
    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'))
    expect(result.current).toBe(false)
  })

  it('follows the query when it starts and stops matching', () => {
    const listeners = new Set<() => void>()
    const list = {
      matches: false,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }
    const matchMedia = vi.fn(() => list)
    vi.stubGlobal('matchMedia', matchMedia)
    const change = (matches: boolean) =>
      act(() => {
        list.matches = matches
        listeners.forEach((listener) => listener())
      })

    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'))
    expect(matchMedia).toHaveBeenCalledWith('(pointer: coarse)')
    expect(result.current).toBe(false)
    change(true)
    expect(result.current).toBe(true)
    change(false)
    expect(result.current).toBe(false)
  })
})
