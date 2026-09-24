// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDefinitions } from './useDefinitions'

const definition = { path: 'src/app.ts', line: 3, kind: 'function' as const, lines: ['export function render() {'] }

function serve(body: unknown) {
  const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body))))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useDefinitions', () => {
  it('looks nothing up until it is asked', () => {
    serve({})
    const { result } = renderHook(() => useDefinitions())
    expect(result.current.lookup).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('asks the server for the declarations of a name', async () => {
    const fetcher = serve({ name: 'render', definitions: [definition] })
    const { result } = renderHook(() => useDefinitions())
    act(() => result.current.find('render'))
    await waitFor(() => expect(result.current.lookup?.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledWith('/api/definitions?name=render')
    expect(result.current.lookup).toEqual({ name: 'render', loading: false, definitions: [definition] })
  })

  it('shows the name while the search is still running', () => {
    serve({ name: 'render', definitions: [] })
    const { result } = renderHook(() => useDefinitions())
    act(() => result.current.find('render'))
    expect(result.current.lookup).toEqual({ name: 'render', loading: true, definitions: [] })
  })

  it('forgets the lookup when it is closed', async () => {
    serve({ name: 'render', definitions: [definition] })
    const { result } = renderHook(() => useDefinitions())
    act(() => result.current.find('render'))
    await waitFor(() => expect(result.current.lookup?.loading).toBe(false))
    act(() => result.current.close())
    expect(result.current.lookup).toBeNull()
  })
})
