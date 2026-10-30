import { test, expect, type Page } from '@playwright/test'

async function openSettings(page: Page) {
  const more = page.getByTitle('More', { exact: true })
  if (await more.isVisible()) await more.tap()
  await page.getByTitle('Settings').tap()
}

/** Answers the comments API in the page, so a comment never reaches the server the other devices share. */
async function keepCommentsInPage(page: Page) {
  let comments: Record<string, unknown>[] = []
  await page.route('**/api/comments**', (route) => {
    const request = route.request()
    const id = request.url().split('/api/comments/')[1]
    if (request.method() === 'POST') {
      comments.push({ ...request.postDataJSON(), id: 'c1', status: 'open', createdAt: Date.now(), replies: [] })
      return route.fulfill({ status: 201, json: comments.at(-1) })
    }
    if (request.method() === 'PUT') {
      const comment = comments.find((comment) => comment.id === id)!
      Object.assign(comment, request.postDataJSON())
      return route.fulfill({ json: comment })
    }
    if (request.method() === 'DELETE') {
      comments = comments.filter((comment) => comment.id !== id)
      return route.fulfill({ json: { ok: true } })
    }
    return route.fulfill({ json: comments })
  })
}

test.describe('mobile view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('describeTotal').first()).toBeVisible()
  })

  test('AC-M1: a phone shows one column and wraps long lines', async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 768, 'only a phone is too narrow for two columns')
    await expect(page.locator('[data-unified]').first()).toBeAttached()
    await expect(page.locator('pre[data-overflow="wrap"]').first()).toBeAttached()
  })

  test('AC-M1: the toolbar fits the screen without scrolling sideways', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const toolbar = document.querySelector('.toolbar')!
      return [toolbar.scrollWidth - toolbar.clientWidth, document.documentElement.scrollWidth - window.innerWidth]
    })
    expect(overflow).toEqual([0, 0])
  })

  test('AC-M6: the menu on a phone holds every toolbar function', async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 768, 'only a phone moves the toolbar into a menu')
    await expect(page.getByTitle('Change map', { exact: true })).toBeHidden()
    await page.getByTitle('More', { exact: true }).tap()
    for (const name of ['Split', 'Unified', 'Blink', 'Structural', 'Change map']) {
      await expect(page.locator('.toolbar').getByRole('button', { name, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('group', { name: 'Context' })).toBeVisible()
    await expect(page.getByTitle('Settings')).toBeVisible()
  })

  test('AC-M6: a tap swaps before and after in blink mode', async ({ page }) => {
    await page.route('**/api/settings', async (route) => {
      const response = await route.fetch()
      await route.fulfill({ response, json: { ...(await response.json()), diffStyle: 'blink' } })
    })
    await page.goto('/')
    const swap = page.getByTitle('Swap before and after')
    await expect(swap).toHaveText('AFTER')
    await swap.tap()
    await expect(swap).toHaveText('BEFORE')
  })

  test('AC-M3: a finger comments on a range of lines, edits, resolves and deletes it', async ({ page }) => {
    await keepCommentsInPage(page)
    const fullFile = page.waitForResponse((response) => response.url().includes('/api/file-versions?path=math.ts'))
    await page.goto('/')
    await fullFile
    const card = page.locator('[id="file-math.ts"]')
    const add = card.getByRole('button', { name: 'Add a comment' })
    await card.locator('[data-column-number="11"] [data-line-number-content]').tap()
    await add.tap()
    await card.locator('[data-column-number="10"] [data-line-number-content]').tap()
    await add.tap()
    await expect(card.getByText('Lines 10–11')).toBeVisible()
    await card.getByPlaceholder('Leave a review comment...').fill('Extract the sum')
    await card.getByRole('button', { name: 'Comment', exact: true }).tap()
    await card.getByRole('button', { name: 'Edit comment' }).tap()
    await card.locator('.comment-bubble textarea').fill('Extract the total')
    await card.getByRole('button', { name: 'Save', exact: true }).tap()
    await expect(card.getByText('Extract the total')).toBeVisible()
    await card.getByRole('button', { name: 'Mark as resolved' }).tap()
    await expect(card.getByRole('button', { name: 'Reopen comment' })).toBeVisible()
    await card.getByRole('button', { name: 'Delete comment' }).tap()
    await expect(card.locator('.comment-bubble')).toHaveCount(0)
  })

  test('AC-M4: a phone opens the file tree over the diff and closes it on a file tap', async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 768, 'only a phone shows the file tree as an overlay')
    const overlay = page.locator('.sidebar-overlay')
    await expect(page.locator('.sidebar')).toHaveCount(0)
    await page.getByTitle('Files', { exact: true }).tap()
    await overlay.getByTitle('notes.md').tap()
    await expect(overlay).toHaveCount(0)
    await expect(page.locator('[id="file-notes.md"]')).toBeInViewport()
  })

  test('AC-M8: the phone view leaves the saved settings unchanged', async ({ page }) => {
    const saved = await (await page.request.get('/api/settings')).json()
    expect(saved.diffStyle).toBe('split')
    expect(saved.softWrap).toBeFalsy()
  })

  test('AC-M9: text fields are large enough that focusing them does not zoom', async ({ page }) => {
    await openSettings(page)
    const sizes = await page
      .locator('input:not([type="checkbox"]), textarea, select')
      .evaluateAll((fields) => fields.map((field) => parseFloat(getComputedStyle(field).fontSize)))
    expect(sizes.length).toBeGreaterThan(0)
    expect(sizes.every((size) => size >= 16)).toBe(true)
  })

  test('AC-M2: every control is large enough to hit with a finger', async ({ page }) => {
    await openSettings(page)
    const tooSmall = await page
      .locator('button, select, input:not([type="checkbox"]), label:has(> input[type="checkbox"]), [role=button], .ft-row')
      .evaluateAll((controls) =>
        controls
          .map((control) => ({ control, box: control.getBoundingClientRect() }))
          .filter(({ box }) => box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44))
          .map(({ control, box }) => `${control.outerHTML.slice(0, 80)} ${box.width}x${box.height}`),
      )
    expect(tooSmall).toEqual([])
  })
})
