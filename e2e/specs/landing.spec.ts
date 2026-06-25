import { test, expect } from '@playwright/test'

test.describe('LandingPage — unauthenticated', () => {
  test('loads and displays hero, categories, benefits, quality, footer', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByRole('link', { name: /iniciar sesión/i }).first()).toBeVisible()

    await expect(page.locator('#categorias')).toBeVisible()
    await expect(page.locator('#beneficios')).toBeVisible()
    await expect(page.locator('#calidad')).toBeVisible()
    await expect(page.locator('#contacto')).toBeVisible()
  })

  test('language switcher toggles between ES and EN', async ({ page }) => {
    await page.goto('/')
    const esBtn = page.getByRole('button', { name: 'ES', exact: true })
    const enBtn = page.getByRole('button', { name: 'EN', exact: true })

    await expect(esBtn).toHaveAttribute('aria-pressed', 'true')

    await enBtn.click()
    await expect(enBtn).toHaveAttribute('aria-pressed', 'true')

    await esBtn.click()
    await expect(esBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('login link navigates to /login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /iniciar sesión/i }).first().click()
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: /bienvenido/i })).toBeVisible()
  })
})
