import type { MoveRun } from '../moves'

function shadowHost(card: Element): Element | undefined {
  return [...card.querySelectorAll('*')].find((element) => element.shadowRoot !== null)
}

/**
 * Brings the other end of a moved block on screen.
 *
 * Falls back to the file header while the row is outside the rendered window,
 * which the virtualizer keeps small. Returns false when the file is not on the page.
 */
export function jumpToMove(run: MoveRun): boolean {
  const card = document.getElementById(`file-${run.path}`)
  if (!card) return false
  const shadow = shadowHost(card)?.shadowRoot
  const column = shadow?.querySelector(run.side === 'additions' ? '[data-additions]' : '[data-deletions]')
  const row = column?.querySelector(`[data-column-number="${run.startLine}"]`)
  if (row) row.scrollIntoView({ block: 'center' })
  else card.scrollIntoView({ block: 'start' })
  return true
}
