import { test, expect } from '@playwright/test'
import { seedAuthStorage } from '../fixtures/auth.fixture'

test.describe('DispatchPage', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStorage(page)
    await page.goto('/app/dispatch')
    await page.waitForLoadState('networkidle')
  })

  test('renders dispatch form with type selector', async ({ page }) => {
    await expect(page.getByRole('group', { name: /tipo de salida/i })).toBeVisible()
  })

  test('displays dispatch mode options', async ({ page }) => {
    await expect(page.getByText(/Venta Mayor/i).first()).toBeVisible()
  })
})
