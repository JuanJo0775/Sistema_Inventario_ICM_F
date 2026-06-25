import { test, expect } from '@playwright/test'
import { seedAuthStorage } from '../fixtures/auth.fixture'

test.describe('DashboardPage — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStorage(page)
    await page.goto('/app')
    await page.waitForLoadState('networkidle')
  })

  test('loads dashboard page', async ({ page }) => {
    await expect(page.getByText(/rotación|rotacion|kpi|métrica|metric/i).first()).toBeVisible()
  })

  test('displays visual KPIs', async ({ page }) => {
    await expect(page.getByText(/Rotación de inventario/i).first()).toBeVisible()
  })

  test('displays alerts section', async ({ page }) => {
    await expect(page.getByText(/alertas/i).first()).toBeVisible()
  })
})
