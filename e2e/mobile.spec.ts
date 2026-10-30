import { test, expect } from '@playwright/test'

test.describe('mobile view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('describeTotal').first()).toBeVisible()
  })

  test('AC-M9: text fields are large enough that focusing them does not zoom', async ({ page }) => {
    await page.getByTitle('Settings').tap()
    const sizes = await page
      .locator('input:not([type="checkbox"]), textarea, select')
      .evaluateAll((fields) => fields.map((field) => parseFloat(getComputedStyle(field).fontSize)))
    expect(sizes.length).toBeGreaterThan(0)
    expect(sizes.every((size) => size >= 16)).toBe(true)
  })

  test('AC-M2: every control is large enough to hit with a finger', async ({ page }) => {
    await page.getByTitle('Settings').tap()
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
