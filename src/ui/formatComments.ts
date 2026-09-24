import type { ReviewComment } from '../types'

/** The line label of a comment, a range once it spans more than one line. */
function lineLabel(comment: ReviewComment): string {
  const end = comment.endLine
  return end !== undefined && end !== comment.lineNumber ? `${comment.lineNumber}-${end}` : `${comment.lineNumber}`
}

/**
 * Renders the open comments as the block an agent is handed.
 *
 * Resolved comments stay in the review for reference but are done, so they are left out.
 */
export function formatComments(comments: ReviewComment[]): string {
  const open = comments.filter((comment) => comment.status !== 'resolved')
  if (open.length === 0) return ''

  const grouped = new Map<string, ReviewComment[]>()
  for (const comment of open) {
    const list = grouped.get(comment.filePath) ?? []
    list.push(comment)
    grouped.set(comment.filePath, list)
  }

  const lines: string[] = ['<code-review-comments>']
  for (const [filePath, fileComments] of grouped) {
    lines.push(`<file path="${filePath}">`)
    for (const comment of fileComments) {
      lines.push(`<comment line="${lineLabel(comment)}">`)
      const prefix = comment.side === 'additions' ? '+' : '-'
      lines.push(`<code>${prefix} ${comment.lineContent}</code>`)
      lines.push(comment.body)
      lines.push('</comment>')
    }
    lines.push('</file>')
  }
  lines.push('</code-review-comments>')

  return lines.join('\n')
}
