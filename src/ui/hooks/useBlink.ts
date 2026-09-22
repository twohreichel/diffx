import { useCallback, useEffect, useRef, useState } from 'react'
import { regionLine, stepRegion, toggleBlink, type AutoBlink, type BlinkState, type ChangeRegion } from '../../blink'
import { useShortcuts } from './useShortcuts'

/** The renderer owns the scroll container and takes only a class name. */
const SCROLLER = '.main-scroll'

/** How far down the pane `n` and `p` place the change they jump to. */
const VIEWPORT_FRACTION = 3

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function shadowHost(card: Element): Element | undefined {
  return [...card.querySelectorAll('*')].find((element) => element.shadowRoot !== null)
}

/** Where a line sits in the column the given state puts on screen. */
function columnRowTop(file: string, line: number, state: BlinkState): number | null {
  const card = document.getElementById(`file-${file}`)
  const shadow = card ? shadowHost(card)?.shadowRoot : undefined
  const column = shadow?.querySelector(state === 'after' ? '[data-additions]' : '[data-deletions]')
  const row = column?.querySelector(`[data-column-number="${line}"]`)
  return row ? row.getBoundingClientRect().top : null
}

/**
 * Brings a change into the upper third of the pane.
 *
 * Falls back to the file header while the row is outside the rendered window,
 * which the virtualizer keeps small.
 */
function scrollToRegion(region: ChangeRegion, state: BlinkState): void {
  const scroller = document.querySelector(SCROLLER)
  if (!scroller) return
  const top = columnRowTop(region.file, regionLine(region, state), state)
  if (top === null) {
    document.getElementById(`file-${region.file}`)?.scrollIntoView({ block: 'start' })
    return
  }
  scroller.scrollTop += top - scroller.getBoundingClientRect().top - scroller.clientHeight / VIEWPORT_FRACTION
}

/** True while the reader has asked the system for as little motion as possible. */
export function usePrefersReducedMotion(): boolean {
  const query = typeof window === 'undefined' ? null : window.matchMedia?.(REDUCED_MOTION)
  const [reduced, setReduced] = useState(() => query?.matches ?? false)

  useEffect(() => {
    if (!query) return
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [query])

  return reduced
}

interface BlinkOptions {
  enabled: boolean
  regions: ChangeRegion[]
  autoBlink: AutoBlink
  reducedMotion: boolean
}

/**
 * Drives the A/B blink view: the state on screen, `Space`, `n`, `p` and auto-blink.
 *
 * Neither state is re-rendered on a toggle. Both columns stay in the DOM and only
 * the visible one changes, which is what keeps every shared line in place.
 */
export function useBlink({ enabled, regions, autoBlink, reducedMotion }: BlinkOptions): { blinkState: BlinkState } {
  const [blinkState, setBlinkState] = useState<BlinkState>('after')
  const [autoStopped, setAutoStopped] = useState(false)
  const current = useRef<BlinkState>(blinkState)
  const region = useRef(-1)
  current.current = blinkState

  const navigate = useCallback(
    (direction: -1 | 1) => {
      region.current = stepRegion(regions.length, region.current, direction)
      const target = regions[region.current]
      if (target) scrollToRegion(target, current.current)
    },
    [regions],
  )

  useShortcuts(
    enabled
      ? {
          ' ': () => setBlinkState(toggleBlink),
          n: () => navigate(1),
          p: () => navigate(-1),
        }
      : {},
  )

  useEffect(() => setAutoStopped(false), [autoBlink, enabled])

  const interval = enabled && !reducedMotion && !autoStopped && autoBlink !== 'off' ? autoBlink : null

  useEffect(() => {
    if (interval === null) return
    const timer = setInterval(() => setBlinkState(toggleBlink), interval)
    const stop = () => setAutoStopped(true)
    document.addEventListener('keydown', stop)
    return () => {
      clearInterval(timer)
      document.removeEventListener('keydown', stop)
    }
  }, [interval])

  return { blinkState }
}
