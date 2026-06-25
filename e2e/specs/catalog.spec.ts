import { test, expect } from '@playwright/test'
import { seedAuthStorage } from '../fixtures/auth.fixture'

test.describe('Catalog — products list', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStorage(page)
    await page.goto('/app/catalog/products')
    await page.waitForLoadState('networkidle')
  })

  test('renders product list', async ({ page }) => {
    await expect(page.getByText(/Ultrasonido 3MHz/i)).toBeVisible()
    await expect(page.getByText(/CAN-US-007/i)).toBeVisible()
  })

  test('filters products by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i)
    await searchInput.fill('TENS')
    await expect(page.getByText(/Estimulador TENS/i)).toBeVisible()
    await expect(page.getByText(/Ultrasonido 3MHz/i)).not.toBeVisible()
  })

  test('navigates to product detail', async ({ page }) => {
    await page.getByRole('link', { name: /ver detalle/i }).first().click()
    await page.waitForURL(/\/catalog\/products\/prod-001/, { timeout: 10000 })
    await expect(page.getByText(/CAN-US-007/i)).toBeVisible()
  })
})

test.describe('Catalog — categories', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStorage(page)
    await page.goto('/app/catalog/categories')
    await page.waitForLoadState('networkidle')
  })

  test('renders category list', async ({ page }) => {
    await expect(page.getByText(/Electroterapia/i)).toBeVisible()
    await expect(page.getByText(/Consumibles/i)).toBeVisible()
  })
})

test.describe('Catalog — brands', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthStorage(page)
    await page.goto('/app/catalog/brands')
    await page.waitForLoadState('networkidle')
  })

  test('renders brand list', async ({ page }) => {
    await expect(page.getByText(/Ultrasonido/i)).toBeVisible()
  })
})
