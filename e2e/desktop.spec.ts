import { test, expect } from '@playwright/test'

// The baselines were taken before the mobile layout existed, so they pin the desktop view to it.
test.describe('desktop view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('describeTotal').first()).toBeVisible()
  })

  test('looks as before', async ({ page }) => {
    await expect(page).toHaveScreenshot('review.png', { fullPage: true, mask: [page.locator('.toolbar-version')] })
  })

  test('shows the settings menu as before', async ({ page }) => {
    await page.getByTitle('Settings').click()
    await expect(page).toHaveScreenshot('settings.png', { mask: [page.locator('.toolbar-version')] })
  })
})
