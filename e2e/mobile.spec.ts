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
})
