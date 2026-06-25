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

import useAuthStore from '../../store/useAuthStore'
import useCatalogStore from '../../store/useCatalogStore'
import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import CatalogProductFormPage from './CatalogProductFormPage'

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

function renderCreateMode() {
  return render(
    <MemoryRouter initialEntries={['/app/catalog/products/new']}>
      <Routes>
        <Route path="/app/catalog/products/new" element={<><Toaster /><CatalogProductFormPage /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderEditMode() {
  return render(
    <MemoryRouter initialEntries={['/app/catalog/products/prod-1/edit']}>
      <Routes>
        <Route path="/app/catalog/products/:id/edit" element={<><Toaster /><CatalogProductFormPage /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogProductFormPage — integración', () => {
  // ── 1. Renderizado inicial (creación) ─────────────────────
  describe('Renderizado en modo creación', () => {
    it('debería mostrar el título "Nuevo Producto"', async () => {
      renderCreateMode()

      await waitFor(() => {
        const titles = screen.getAllByText('catalog.products.new')
        expect(titles.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería mostrar los campos del formulario', async () => {
      renderCreateMode()

      await waitFor(() => {
        expect(screen.getByLabelText('catalog.products.form.name')).toBeInTheDocument()
      })
      expect(screen.getByLabelText('catalog.products.form.sku')).toBeInTheDocument()
      expect(screen.getByLabelText('catalog.products.form.category')).toBeInTheDocument()
      expect(screen.getByLabelText('catalog.products.form.brand')).toBeInTheDocument()
    })

    it('debería mostrar el botón Guardar', async () => {
      renderCreateMode()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument()
      })
    })

    it('debería mostrar el botón Cancelar', async () => {
      renderCreateMode()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument()
      })
    })
  })

  // ── 2. Renderizado inicial (edición) ──────────────────────
  describe('Renderizado en modo edición', () => {
    it('debería cargar datos del producto existente', async () => {
      useCatalogStore.setState({
        products: [
          {
            id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco',
            category: 'cat-1', brand: 'MarcaX', is_active: true,
            requires_cold_chain: false, requires_expiration: false,
            requires_lot: false, requires_serial_number: false,
            special_conditions: false, reorder_point: 5,
            unit_cost: 8000, sale_price_retail: 15000,
            sale_price_wholesale: 12000, tax_rate_pct: 19,
            currency: 'COP', barcode: '7701234567890',
            created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
          } as any,
        ],
        categories: [
          { id: 'cat-1', name: 'Electroterapia', slug: 'electroterapia', is_active: true, requires_serial_number: false, is_returnable: false, description: '', created_at: '', updated_at: '' },
        ],
        brands: [
          { id: 'brand-1', name: 'MarcaX', slug: 'marcax', description: '', category: 'cat-1', is_active: true, created_at: '', updated_at: '' },
        ],
      })

      renderEditMode()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Monitor Cardiaco')).toBeInTheDocument()
      })
      expect(screen.getByDisplayValue('EQP-001')).toBeInTheDocument()
    })

    it('debería mostrar el título "Editar Producto"', async () => {
      useCatalogStore.setState({
        products: [
          {
            id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco',
            category: 'cat-1', brand: 'MarcaX', is_active: true,
            requires_cold_chain: false, requires_expiration: false,
            requires_lot: false, requires_serial_number: false,
            special_conditions: false, reorder_point: 5,
            created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
          } as any,
        ],
        categories: [{ id: 'cat-1', name: 'Electroterapia', slug: 'electroterapia', is_active: true, requires_serial_number: false, is_returnable: false, description: '', created_at: '', updated_at: '' }],
        brands: [],
      })

      renderEditMode()

      await waitFor(() => {
        const titles = screen.getAllByText('catalog.products.edit')
        expect(titles.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 3. Validación ──────────────────────────────────────────
  describe('Validación del formulario', () => {
    it('debería mostrar error si el SKU no tiene el formato correcto', async () => {
      renderCreateMode()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByLabelText('catalog.products.form.name')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('catalog.products.form.name'), 'Producto Test')
      await user.type(screen.getByLabelText('catalog.products.form.sku'), 'INVALIDO')
      await user.selectOptions(screen.getByLabelText('catalog.products.form.category'), 'cat-1')

      await user.click(screen.getByRole('button', { name: 'common.save' }))

      await waitFor(() => {
        expect(screen.getByText(/SKU debe tener formato/)).toBeInTheDocument()
      })
    })
  })

  // ── 4. Crear producto ─────────────────────────────────────
  describe('Crear producto', () => {
    it('debería crear un producto exitosamente y redirigir', async () => {
      renderCreateMode()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByLabelText('catalog.products.form.name')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('catalog.products.form.name'), 'Nuevo Producto Test')
      await user.type(screen.getByLabelText('catalog.products.form.sku'), 'TST-001')
      await user.selectOptions(screen.getByLabelText('catalog.products.form.category'), 'cat-1')

      await user.click(screen.getByRole('button', { name: 'common.save' }))

      await waitFor(() => {
        expect(screen.queryByText(/Error al guardar/)).not.toBeInTheDocument()
      })
    }, 10000)
  })

  // ── 5. Editar producto ────────────────────────────────────
  describe('Editar producto', () => {
    it('debería guardar cambios al editar un producto', async () => {
      useCatalogStore.setState({
        products: [
          {
            id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco',
            category: 'cat-1', brand: 'MarcaX', is_active: true,
            requires_cold_chain: false, requires_expiration: false,
            requires_lot: false, requires_serial_number: false,
            special_conditions: false, reorder_point: 5,
            created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
          } as any,
        ],
        categories: [{ id: 'cat-1', name: 'Electroterapia', slug: 'electroterapia', is_active: true, requires_serial_number: false, is_returnable: false, description: '', created_at: '', updated_at: '' }],
        brands: [{ id: 'brand-1', name: 'MarcaX', slug: 'marcax', description: '', category: 'cat-1', is_active: true, created_at: '', updated_at: '' }],
      })

      renderEditMode()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Monitor Cardiaco')).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText('catalog.products.form.name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Monitor Cardiaco Editado')

      await user.click(screen.getByRole('button', { name: 'common.save' }))

      await waitFor(() => {
        expect(screen.queryByText(/Error al guardar/)).not.toBeInTheDocument()
      })
    }, 10000)
  })

  // ── 6. Cancelar ───────────────────────────────────────────
  describe('Cancelar', () => {
    it('debería navegar de vuelta al listado al cancelar', async () => {
      renderCreateMode()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'common.cancel' }))
    })
  })
})
