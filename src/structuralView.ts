import type { StructuralFile } from './structural.js'

type LineType = 'change-deletion' | 'change-addition'

/** Upper bound on restored lines per file, so the generated rule stays small. */
const MAX_COLOURED_LINES = 2000

const NEUTRAL = 'var(--diffs-bg-context,var(--diffs-bg))'

function row(type: LineType, line: number | null): string {
  const selector = line === null ? '[data-line]' : `[data-line="${line}"]`
  return `[data-line-type="${type}"]${selector}[data-line-index]`
}

function number(type: LineType, line: number | null): string {
  const selector = line === null ? '[data-column-number]' : `[data-column-number="${line}"]`
  return `[data-line-type="${type}"]${selector}[data-line-index]`
}

function colouredLines(file: StructuralFile): { type: LineType; line: number }[] {
  const lines: { type: LineType; line: number }[] = []
  for (const change of file.changes) {
    if (change.before && change.before.ranges.length > 0) lines.push({ type: 'change-deletion', line: change.before.lineNumber })
    if (change.after && change.after.ranges.length > 0) lines.push({ type: 'change-addition', line: change.after.lineNumber })
  }
  return lines.slice(0, MAX_COLOURED_LINES)
}

/**
 * Shadow-root CSS that colours only the rows difftastic calls changed.
 *
 * Every changed row goes neutral first, then the structurally changed lines get
 * their colour back. The restoring rules carry the same specificity and come
 * later, so they win. A reformat ends up without a single coloured row.
 */
export function structuralCSS(file: StructuralFile): string {
  const types: LineType[] = ['change-deletion', 'change-addition']
  const neutral = types.flatMap((type) => [row(type, null), number(type, null)]).join(',')
  const restored = colouredLines(file)
    .map(({ type, line }) => {
      const colour = type === 'change-addition' ? 'var(--diffs-bg-addition)' : 'var(--diffs-bg-deletion)'
      return `${row(type, line)},${number(type, line)}{background-color:${colour}}`
    })
    .join('')
  return `${neutral}{background-color:${NEUTRAL}}${restored}`
}

/** The one line that explains a result which shows no changes of its own. */
export function structuralNotice(file: StructuralFile): string {
  if (file.fellBack) return `difftastic has no grammar for this file and compared it as text.`
  if (file.unchanged) return `No structural change — only formatting differs.`
  return ''
}
