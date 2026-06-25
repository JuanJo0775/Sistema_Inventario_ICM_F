import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { Toaster } from 'sonner'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
  }),
}))

import useAuthStore from '../../store/useAuthStore'
import useCatalogStore from '../../store/useCatalogStore'
import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import CatalogCategoryDetailPage from './CatalogCategoryDetailPage'

const server = setupServer(...catalogHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetCatalogData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  useCatalogStore.setState({
    products: [],
    categories: [],
    brands: [],
    loading: false,
    error: null,
    productCount: 0,
    productPage: 1,
    productPageSize: 25,
  })
})
afterAll(() => server.close())

beforeAll(() => {
  useAuthStore.setState({
    user: {
      id: '1',
      username: 'admin',
      email: 'admin@icm.com',
      first_name: 'Admin',
      last_name: 'ICM',
      role: 'administrador',
    },
    token: 'fake-token',
    isAuthenticated: true,
  })
})

function renderCategoryDetail(id: string = 'cat-1') {
  return render(
    <MemoryRouter initialEntries={[`/app/catalog/categories/${id}`]}>
      <Routes>
        <Route path="/app/catalog/categories/:id" element={<><Toaster /><CatalogCategoryDetailPage /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogCategoryDetailPage — integración', () => {
  // ── 1. Carga desde MSW ────────────────────────────────────
  describe('Renderizado desde MSW', () => {
    it('debería mostrar el nombre de la categoría cargada', async () => {
      renderCategoryDetail()

      await waitFor(() => {
        const titles = screen.getAllByText('Electroterapia')
        expect(titles.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería mostrar la descripción de la categoría', async () => {
      renderCategoryDetail()

      await waitFor(() => {
        expect(screen.getByText('Equipos de electroterapia')).toBeInTheDocument()
      })
    })

    it('debería mostrar el badge Activa', async () => {
      renderCategoryDetail()

      await waitFor(() => {
        expect(screen.getByText('Activa')).toBeInTheDocument()
      })
    })

    it('debería mostrar el enlace "Volver a categorías"', async () => {
      renderCategoryDetail()

      await waitFor(() => {
        expect(screen.getByText(/Volver a categorías/)).toBeInTheDocument()
      })
    })

    it('debería mostrar productos de la categoría en la tabla', async () => {
      renderCategoryDetail()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
    })
  })

  // ── 2. Categoría sin productos ─────────────────────────────
  describe('Categoría sin productos', () => {
    it('debería mostrar mensaje de vacío', async () => {
      useCatalogStore.setState({
        categories: [{ id: 'cat-empty', name: 'Vacía', slug: 'vacia', requires_serial_number: false, is_returnable: false, description: '', is_active: true, created_at: '', updated_at: '' }],
        products: [],
      })

      renderCategoryDetail('cat-empty')

      await waitFor(() => {
        expect(screen.getByText('No hay productos en esta categoría.')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Categoría no encontrada ────────────────────────────
  describe('Categoría no encontrada', () => {
    it('debería mostrar mensaje de no encontrada', async () => {
      renderCategoryDetail('nonexistent')

      await waitFor(() => {
        expect(screen.getByText('Categoría no encontrada.')).toBeInTheDocument()
      })
    })
  })

  // ── 4. Categoría inactiva ─────────────────────────────────
  describe('Categoría inactiva', () => {
    it('debería mostrar badge Inactiva', async () => {
      useCatalogStore.setState({
        categories: [{ id: 'cat-inactive', name: 'Inactiva Cat', slug: 'inactiva', requires_serial_number: false, is_returnable: false, description: '', is_active: false, created_at: '', updated_at: '' }],
        products: [],
      })

      renderCategoryDetail('cat-inactive')

      await waitFor(() => {
        expect(screen.getByText('Inactiva')).toBeInTheDocument()
      })
    })
  })

  // ── 5. Loading state ──────────────────────────────────────
  describe('Estado de carga', () => {
    it('debería mostrar "Cargando..." mientras loading es true', async () => {
      useCatalogStore.setState({ loading: true, categories: [], products: [] })

      renderCategoryDetail('cat-1')

      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })
  })
})
