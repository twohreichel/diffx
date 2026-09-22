import { useCallback, useEffect, useRef } from 'react'
import { anchorDelta, pickAnchor, type Anchor, type AnchorRow } from '../anchor'

const SIDES: Record<string, AnchorRow['side']> = {
  'change-addition': 'addition',
  'change-deletion': 'deletion',
}

/** The renderer owns the scroll container and takes only a class name. */
const SCROLLER = '.main-scroll'

/** Matches the 1 s interaction budget of Constitution VI. */
const RESTORE_DEADLINE_MS = 1000

function shadowHost(card: Element): Element | undefined {
  return [...card.querySelectorAll('*')].find((element) => element.shadowRoot !== null)
}

/**
 * Reads the diff rows currently rendered into the file cards.
 *
 * Rows live in an open shadow root, one per file card, and only those near the
 * viewport exist at all, because the renderer virtualizes the list.
 */
export function collectAnchorRows(root: ParentNode): AnchorRow[] {
  const rows: AnchorRow[] = []
  for (const card of root.querySelectorAll('.file-diff-card[id^="file-"]')) {
    const file = card.id.slice('file-'.length)
    const shadow = shadowHost(card)?.shadowRoot
    if (!shadow) continue
    for (const element of shadow.querySelectorAll<HTMLElement>('[data-line-type][data-column-number]')) {
      const line = Number(element.dataset.columnNumber)
      if (!Number.isInteger(line)) continue
      rows.push({
        file,
        line,
        side: SIDES[element.dataset.lineType ?? ''] ?? 'context',
        top: element.getBoundingClientRect().top,
      })
    }
  }
  return rows
}

/**
 * Keeps the nearest changed line in place across a re-rendered diff (FR-004).
 *
 * `capture` is called before the change is requested. The restore runs once the
 * new patch arrives and retries per frame, because rows highlight asynchronously.
 */
export function useScrollAnchor(patch: string | null): { capture: () => void } {
  const anchor = useRef<Anchor | null>(null)

  const capture = useCallback(() => {
    const scroller = document.querySelector(SCROLLER)
    if (!scroller) return
    anchor.current = pickAnchor(collectAnchorRows(document), scroller.getBoundingClientRect().top)
  }, [])

  useEffect(() => {
    const target = anchor.current
    anchor.current = null
    const scroller = document.querySelector(SCROLLER)
    if (!target || !scroller) return

    const deadline = performance.now() + RESTORE_DEADLINE_MS
    let frame = requestAnimationFrame(function settle() {
      const delta = anchorDelta(collectAnchorRows(document), target, scroller.getBoundingClientRect().top)
      if (delta !== null) {
        scroller.scrollTop += delta
        return
      }
      if (performance.now() < deadline) frame = requestAnimationFrame(settle)
    })
    return () => cancelAnimationFrame(frame)
  }, [patch])

  return { capture }
}
