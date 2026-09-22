export type LineSide = 'addition' | 'deletion'

/** A rendered diff row, reduced to what anchoring needs. */
export interface AnchorRow {
  file: string
  line: number
  side: LineSide | 'context'
  top: number
}

export interface Anchor {
  file: string
  line: number
  side: LineSide
  /** How far the row sat below the viewport top when it was captured. */
  offset: number
}

type ChangedRow = AnchorRow & { side: LineSide }

function isChanged(row: AnchorRow): row is ChangedRow {
  return row.side !== 'context'
}

/**
 * Picks the changed row a context change should scroll back to.
 *
 * Context rows are never picked, because they are the rows a context change
 * adds and removes (FR-004).
 */
export function pickAnchor(rows: AnchorRow[], viewportTop: number): Anchor | null {
  const topmost = rows
    .filter((row) => isChanged(row) && row.top >= viewportTop)
    .reduce<ChangedRow | null>((best, row) => (best === null || row.top < best.top ? (row as ChangedRow) : best), null)

  if (topmost === null) return null
  return { file: topmost.file, line: topmost.line, side: topmost.side, offset: topmost.top - viewportTop }
}

/** How far to scroll so the anchored row sits where it sat, or null while it is absent. */
export function anchorDelta(rows: AnchorRow[], anchor: Anchor, viewportTop: number): number | null {
  const row = rows.find((r) => r.file === anchor.file && r.line === anchor.line && r.side === anchor.side)
  return row === undefined ? null : row.top - viewportTop - anchor.offset
}
