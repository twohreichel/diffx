/**
 * Copies text to the clipboard and reports whether it worked.
 *
 * Browsers grant `navigator.clipboard` only on secure origins, so a review over
 * plain HTTP from another device falls back to copying a selected textarea.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return copyViaSelection(text)
  }
}

function copyViaSelection(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.readOnly = true
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  area.setSelectionRange(0, text.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}
