import { test as base, type Page } from '@playwright/test'

const API_BASE = 'http://localhost:8000/api/v1'

const MOCK_AUTH_RESPONSE = {
  access: 'e2e-fake-access-token',
  refresh: 'e2e-fake-refresh-token',
  user: {
    id: '1',
    username: 'admin',
    email: 'admin@icm.com',
    first_name: 'Admin',
    last_name: 'ICM',
    role: 'administrador' as const,
    is_active: true,
  },
}

const STORAGE_KEYS = {
  token: 'icm_auth_token',
  refresh: 'icm_auth_refresh',
  user: 'icm_auth_user',
}

export async function mockAuthApi(page: Page) {
  await page.route(`${API_BASE}/auth/login/`, async (route) => {
    const body = JSON.parse(route.request().postData() || '{}')

    if (body.password === 'wrongpass') {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Usuario o contraseña incorrectos' }),
      })
    }

    if (body.password === 'servererror') {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Error interno del servidor' }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_AUTH_RESPONSE),
    })
  })

  await page.route(`${API_BASE}/auth/logout/`, async (route) => {
    return route.fulfill({ status: 200, body: '' })
  })

  await page.route(`${API_BASE}/auth/token/refresh/`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: 'e2e-fake-refreshed-token' }),
    })
  })
}

export async function seedAuthStorage(page: Page) {
  await page.goto('/')
  await page.evaluate((keys) => {
    localStorage.setItem(keys.token, 'e2e-fake-access-token')
    localStorage.setItem(keys.refresh, 'e2e-fake-refresh-token')
    localStorage.setItem(
      keys.user,
      JSON.stringify({
        id: '1',
        username: 'admin',
        email: 'admin@icm.com',
        first_name: 'Admin',
        last_name: 'ICM',
        role: 'administrador',
        is_active: true,
      }),
    )
  }, STORAGE_KEYS)
}

export async function clearAuthStorage(page: Page) {
  await page.goto('/')
  await page.evaluate((keys) => {
    localStorage.removeItem(keys.token)
    localStorage.removeItem(keys.refresh)
    localStorage.removeItem(keys.user)
  }, STORAGE_KEYS)
}

export type AuthFixtures = {
  loginAsAdmin: () => Promise<void>
}

export const test = base.extend<AuthFixtures>({
  loginAsAdmin: [
    async ({ page }, use) => {
      await use(async () => {
        await page.goto('/login')
        await mockAuthApi(page)
        await page.fill('input[name="identifier"]', 'admin@icm.com')
        await page.fill('input[name="password"]', 'correctpass')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/app')
      })
    },
    { auto: false },
  ],
})

export { expect } from '@playwright/test'
