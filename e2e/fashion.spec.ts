import { expect, test } from '@playwright/test'

test.describe('Fashion (Maison Vela): browse to confirmation', () => {
  test('adds a product to the bag and completes checkout', async ({ page }) => {
    await page.goto('/fashion/catalogo')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.locator('a[href^="/fashion/producto/"]').first().click()
    await page.waitForURL('**/fashion/producto/**')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Pick the first in-stock size (disabled sizes render but can't be selected).
    await page
      .locator('fieldset:has(legend:has-text("Talla")) label:not(:has(input:disabled))')
      .first()
      .click()
    await page.getByRole('button', { name: 'Añadir a la bolsa' }).click()
    await expect(page.getByText('añadido a tu bolsa', { exact: false })).toBeVisible()

    await page.getByRole('button', { name: /^Bolsa,/ }).click()
    await page.getByRole('link', { name: 'Finalizar compra' }).click()
    await page.waitForURL('**/fashion/checkout')

    await page.getByLabel('Correo').fill('cliente@example.com')
    await page.getByLabel('Nombre completo').fill('Ana Restrepo')
    await page.getByLabel('Teléfono').fill('3001234567')
    await page.getByLabel('Dirección').fill('Calle 10 # 5-30')
    await page.getByLabel('Ciudad').fill('Medellín')
    await page.getByLabel('Departamento').fill('Antioquia')
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Delivery step: "standard" is preselected, so this step needs no input.
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.getByRole('button', { name: 'Confirmar pedido' }).click()
    await page.waitForURL('**/fashion/confirmacion/**')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
