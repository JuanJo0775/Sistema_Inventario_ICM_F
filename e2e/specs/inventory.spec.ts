import { test, expect } from '@playwright/test'
import { seedAuthStorage } from '../fixtures/auth.fixture'

test.describe('InventoryPage', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStorage(page)
    await page.goto('/app/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('renders inventory page', async ({ page }) => {
    await expect(page.getByLabel('Categoria', { exact: true })).toBeVisible()
  })

  test('displays search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/buscar|search|sku/i).first()).toBeVisible()
  })
})
