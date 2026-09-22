// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { StructuralResponse } from '../../structural'
import { useStructural } from './useStructural'

const request = {
  path: 'src/app.ts',
  oldOid: '1111111',
  newOid: '2222222',
  staged: true,
  untracked: true,
  ignoreComments: false,
}

const reformat: StructuralResponse = {
  available: true,
  result: { path: 'src/app.ts', language: 'TypeScript', unchanged: true, fellBack: false, changes: [] },
}

function answer(body: StructuralResponse, init: ResponseInit = {}) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, ...init }))
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => answer(reformat)))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useStructural', () => {
  it('asks for nothing while no file is on screen', () => {
    const { result } = renderHook(() => useStructural(null))
    expect(result.current).toEqual({ loading: false, result: null, reason: null })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports the result of the file it was given', async () => {
    const { result } = renderHook(() => useStructural(request))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.result).toEqual(reformat.result))
    expect(result.current.loading).toBe(false)
  })

  it('asks only for the file version the diff already carries', async () => {
    renderHook(() => useStructural(request))
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('path=src%2Fapp.ts')
    expect(url).toContain('oldOid=1111111')
    expect(url).toContain('newOid=2222222')
    expect(url).toContain('ignoreComments=false')
  })

  it('drops the answer to a file it has left', async () => {
    const { result, rerender } = renderHook(({ path }) => useStructural({ ...request, path }), {
      initialProps: { path: 'src/app.ts' },
    })
    rerender({ path: 'src/other.ts' })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(vi.mocked(fetch).mock.calls).toHaveLength(2)
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true)
  })

  it('keeps the reason a result carries instead of one', async () => {
    vi.mocked(fetch).mockReturnValue(answer({ available: true, reason: 'could not be read' }))
    const { result } = renderHook(() => useStructural(request))
    await waitFor(() => expect(result.current.reason).toBe('could not be read'))
    expect(result.current.result).toBeNull()
  })

  it('reports a refused request as a reason of its own', async () => {
    vi.mocked(fetch).mockReturnValue(answer({ available: false }, { status: 404 }))
    const { result } = renderHook(() => useStructural(request))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.reason).toMatch(/unavailable/i)
  })
})
