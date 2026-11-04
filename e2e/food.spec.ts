import { expect, test } from '@playwright/test'

test.describe('Food (Brasa & Co.): browse to confirmation', () => {
  test('customizes a dish, orders for pickup and confirms', async ({ page }) => {
    await page.goto('/food/menu')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.locator('a[href^="/food/plato/"]').first().click()
    await page.waitForURL('**/food/plato/**')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Satisfy every required option group (badged "Requerido · Elige N" / "Elige de N a M")
    // by picking as many distinct options as the group's minimum requires.
    const requiredGroups = page.locator('fieldset:has-text("Requerido")')
    const requiredCount = await requiredGroups.count()
    for (let i = 0; i < requiredCount; i += 1) {
      const group = requiredGroups.nth(i)
      const hint = await group.locator('legend').innerText()
      const match = /Elige (?:de )?(\d+)/.exec(hint)
      const min = match?.[1] ? Number(match[1]) : 1
      const labels = group.locator('label')
      for (let pick = 0; pick < min; pick += 1) {
        await labels.nth(pick).click()
      }
    }

    await page.getByRole('button', { name: /Añadir al pedido/ }).click()

    // The success status includes a "Ver pedido" button that opens the order drawer.
    await page.getByRole('button', { name: 'Ver pedido', exact: true }).click()
    // Pickup has no delivery minimum, so a single dish always clears checkout.
    await page.getByRole('radio', { name: 'Recoger' }).check({ force: true })
    await page.getByRole('link', { name: /^Ir a pagar/ }).click()
    await page.waitForURL('**/food/checkout')

    await page.getByLabel('Nombre').fill('Camilo Ríos')
    await page.getByLabel('Teléfono').fill('3009876543')
    await page.getByLabel('Correo').fill('camilo@example.com')
    await page.getByRole('button', { name: /Confirmar pedido/ }).click()

    await page.waitForURL('**/food/pedido/**')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
