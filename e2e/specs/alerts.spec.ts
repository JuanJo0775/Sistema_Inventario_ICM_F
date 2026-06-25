import { test, expect } from '@playwright/test'
import { seedAuthStorage } from '../fixtures/auth.fixture'

test.describe('AlertsPage', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStorage(page)
    await page.goto('/app/alerts')
    await page.waitForLoadState('networkidle')
  })

  test('renders alerts page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /panel de alertas/i })).toBeVisible()
  })

  test('displays active alert sections', async ({ page }) => {
    await expect(page.getByText(/stock mínimo|vencimiento|manejo especial/i).first()).toBeVisible()
  })

  test('shows product reference in alert cards', async ({ page }) => {
    await expect(page.getByText(/CAN-APS-001/i).first()).toBeVisible()
  })
})
