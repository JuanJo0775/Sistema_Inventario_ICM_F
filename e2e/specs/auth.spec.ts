import { test, expect } from '@playwright/test'
import { mockAuthApi, clearAuthStorage } from '../fixtures/auth.fixture'

test.describe('Auth — login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await mockAuthApi(page)
  })

  test('renders login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /bienvenido/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /usuario o correo/i })).toBeVisible()
    await expect(page.getByPlaceholder(/contraseña/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
  })

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]')
    await expect(page.getByText(/ingresa tu usuario/i)).toBeVisible()
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.fill('input[name="identifier"]', 'admin@icm.com')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/incorrectos/i)).toBeVisible()
  })

  test('shows error for server error', async ({ page }) => {
    await page.fill('input[name="identifier"]', 'admin@icm.com')
    await page.fill('input[name="password"]', 'servererror')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/error interno/i)).toBeVisible()
  })

  test('successful login redirects to /app', async ({ page }) => {
    await page.fill('input[name="identifier"]', 'admin@icm.com')
    await page.fill('input[name="password"]', 'correctpass')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app')
    await expect(page).toHaveURL(/\/app$/)
  })

  test('navigates to forgot-password page', async ({ page }) => {
    await page.getByRole('link', { name: /olvidé/i }).click()
    await page.waitForURL('**/forgot-password')
    await expect(page.getByRole('heading', { name: /recuperar/i })).toBeVisible()
  })

  test('logs out from authenticated state', async ({ page }) => {
    await page.fill('input[name="identifier"]', 'admin@icm.com')
    await page.fill('input[name="password"]', 'correctpass')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app')

    await page.getByRole('button', { name: /cerrar sesion/i }).click()
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/app')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Auth — logout', () => {
  test('cannot access /app after logout', async ({ page }) => {
    await page.goto('/login')
    await mockAuthApi(page)

    await page.fill('input[name="identifier"]', 'admin@icm.com')
    await page.fill('input[name="password"]', 'correctpass')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app')

    await page.getByRole('button', { name: /cerrar sesion/i }).click()
    await page.waitForURL('**/login')

    await page.goto('/app')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })
})
