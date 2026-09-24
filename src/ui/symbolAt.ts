/** What a language calls a name, and nothing wider. */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/**
 * The identifier a click landed on, read from the token the renderer drew.
 *
 * The highlighter puts every token in its own element, so the innermost element
 * of the click path is the word itself. Anything wider than one name is ignored.
 */
export function symbolFromPath(path: EventTarget[]): string | null {
  const target = path[0]
  if (!(target instanceof Element)) return null
  const text = target.textContent?.trim() ?? ''
  return IDENTIFIER.test(text) ? text : null
}
