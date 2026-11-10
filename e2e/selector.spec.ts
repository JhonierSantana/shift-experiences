import { expect, test } from '@playwright/test'

test.describe('Experience selector', () => {
  test('switches into an experience via the view-transition link', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'SHIFT', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: /Brasa & Co\./ }).click()
    const cards = page.getByRole('link').filter({ hasText: 'Brasa & Co.' })
    await expect(cards).toHaveCount(1)
    await cards.click()

    // The engine lazy-loads the experience chunk and mounts its own shell/home route.
    await page.waitForURL('**/food')
    await expect(page.getByRole('link', { name: 'Brasa & Co., inicio' })).toBeVisible()
  })
})
