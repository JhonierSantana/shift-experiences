import { expect, test } from '@playwright/test'

test.describe('Market (Plaza): browse to confirmation', () => {
  test('adds a product to the cart and completes checkout', async ({ page }) => {
    await page.goto('/market')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.locator('a[href^="/market/producto/"]').first().click()
    await page.waitForURL('**/market/producto/**')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Añadir al carrito' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'carrito' })).toBeVisible()

    await page.getByRole('button', { name: /^Carrito,/ }).click()
    await page.getByRole('link', { name: 'Ir a pagar' }).click()
    await page.waitForURL('**/market/checkout')

    await page.getByLabel('Correo').fill('valentina@example.com')
    await page.getByLabel('Nombre completo').fill('Valentina Gómez')
    await page.getByLabel('Teléfono').fill('3011122233')
    await page.getByLabel('Dirección').fill('Cra. 7 # 45-12')
    await page.getByLabel('Ciudad').fill('Bogotá')
    await page.getByLabel('Departamento', { exact: true }).fill('Cundinamarca')
    await page.getByRole('button', { name: 'Confirmar pedido' }).click()

    await page.waitForURL('**/market/confirmacion/**')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
