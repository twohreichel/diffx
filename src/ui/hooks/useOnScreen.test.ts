// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnScreen } from './useOnScreen'

type Callback = (entries: { isIntersecting: boolean }[]) => void

function stubObserver(): { enter: () => void; leave: () => void; disconnected: () => boolean } {
  let callback: Callback = () => {}
  let disconnected = false
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(received: Callback) {
        callback = received
      }
      observe() {}
      disconnect() {
        disconnected = true
      }
    },
  )
  return {
    enter: () => act(() => callback([{ isIntersecting: true }])),
    leave: () => act(() => callback([{ isIntersecting: false }])),
    disconnected: () => disconnected,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function refTo(element: Element) {
  return { current: element } as React.RefObject<Element | null>
}

describe('useOnScreen', () => {
  it('reports an element that has not been reached yet', () => {
    stubObserver()
    const { result } = renderHook(() => useOnScreen(refTo(document.createElement('div'))))
    expect(result.current).toBe(false)
  })

  it('stays true once the element has been in view', () => {
    const observer = stubObserver()
    const { result } = renderHook(() => useOnScreen(refTo(document.createElement('div'))))
    observer.enter()
    expect(result.current).toBe(true)
    observer.leave()
    expect(result.current).toBe(true)
  })

  it('stops observing when the element goes away', () => {
    const observer = stubObserver()
    const { unmount } = renderHook(() => useOnScreen(refTo(document.createElement('div'))))
    unmount()
    expect(observer.disconnected()).toBe(true)
  })

  it('treats everything as visible where the browser cannot tell', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { result } = renderHook(() => useOnScreen(refTo(document.createElement('div'))))
    expect(result.current).toBe(true)
  })
})
