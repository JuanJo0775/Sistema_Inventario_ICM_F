import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { Toaster } from 'sonner'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
  }),
}))

vi.mock('../../components/ui/BarcodeDisplay', () => ({
  BarcodeDisplay: () => null,
}))

import useAuthStore from '../../store/useAuthStore'
import useCatalogStore from '../../store/useCatalogStore'
import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import CatalogProductDetailPage from './CatalogProductDetailPage'

const server = setupServer(...catalogHandlers)

const seedProducts = [
  {
    id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco',
    category: 'cat-1', category_slug: 'electroterapia', brand: 'MarcaX',
    barcode: '7701234567890',
    requires_cold_chain: false, requires_expiration: false,
    requires_lot: false, requires_serial_number: true,
    special_conditions: false, is_active: true,
    reorder_point: 5, unit_cost: 8000,
    sale_price_retail: 15000, sale_price_wholesale: 12000,
    tax_rate_pct: 19, currency: 'COP',
    created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
  } as any,
]

const seedCategories = [
  { id: 'cat-1', name: 'Electroterapia', slug: 'electroterapia', requires_serial_number: true, is_returnable: false, description: 'Equipos de electroterapia', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

const seedBrands = [
  { id: 'brand-1', name: 'MarcaX', slug: 'marcax', description: 'Marca líder', category: 'cat-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

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

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/app/catalog/products/prod-1']}>
      <Routes>
        <Route path="/app/catalog/products/:id" element={<><Toaster /><CatalogProductDetailPage /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderNotFound() {
  return render(
    <MemoryRouter initialEntries={['/app/catalog/products/nonexistent']}>
      <Routes>
        <Route path="/app/catalog/products/:id" element={<><Toaster /><CatalogProductDetailPage /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogProductDetailPage — integración', () => {
  // ── 1. Carga desde store pre-poblado ──────────────────────
  describe('Renderizado con datos desde el store', () => {
    it('debería mostrar el nombre del producto', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
    })

    it('debería mostrar el SKU del producto', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText(/EQP-001/)).toBeInTheDocument()
      })
    })

    it('debería mostrar el badge de estado Activo', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.active')).toBeInTheDocument()
      })
    })

    it('debería mostrar la categoría y la marca', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })
      expect(screen.getByText('MarcaX')).toBeInTheDocument()
    })

    it('debería mostrar stock desde la API', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.stock:')).toBeInTheDocument()
      })
    })

    it('debería mostrar el botón Editar', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.edit')).toBeInTheDocument()
      })
    })

    it('debería mostrar el botón Desactivar para producto activo', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.delete')).toBeInTheDocument()
      })
    })
  })

  // ── 2. Carga desde MSW (store vacío) ──────────────────────
  describe('Carga remota desde MSW', () => {
    it('debería cargar y mostrar el producto desde la API', async () => {
      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
    }, 10000)

    it('debería mostrar "Cargando..." mientras se obtienen los datos', async () => {
      useCatalogStore.setState({ loading: true })

      renderDetail()

      expect(screen.getByText('common.loading')).toBeInTheDocument()
    })
  })

  // ── 3. Producto no encontrado ─────────────────────────────
  describe('Producto no encontrado', () => {
    it('debería mostrar mensaje de no encontrado', async () => {
      renderNotFound()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.notFound')).toBeInTheDocument()
      })
    })
  })

  // ── 4. Desactivar ─────────────────────────────────────────
  describe('Desactivar producto', () => {
    it('debería desactivar el producto al confirmar', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true as any)

      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.delete')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('catalog.products.detail.delete'))

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.inactive')).toBeInTheDocument()
      })

      vi.restoreAllMocks()
    })

    it('NO debería desactivar si se cancela el confirm', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false as any)

      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.active')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('catalog.products.detail.delete'))

      expect(screen.getByText('catalog.products.detail.active')).toBeInTheDocument()

      vi.restoreAllMocks()
    })
  })

  // ── 5. Reactivar producto inactivo ────────────────────────
  describe('Reactivar producto', () => {
    it('debería mostrar botón Reactivar para producto inactivo', async () => {
      const inactiveProduct = [{ ...seedProducts[0], is_active: false }]

      useCatalogStore.setState({ products: inactiveProduct, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText('catalog.products.detail.restore')).toBeInTheDocument()
      })
    })
  })

  // ── 6. Precios ────────────────────────────────────────────
  describe('Visualización de precios', () => {
    it('debería mostrar precios cuando están disponibles', async () => {
      useCatalogStore.setState({ products: seedProducts, categories: seedCategories, brands: seedBrands })

      renderDetail()

      await waitFor(() => {
        expect(screen.getByText(/15000\.00/)).toBeInTheDocument()
      })
    })
  })
})
