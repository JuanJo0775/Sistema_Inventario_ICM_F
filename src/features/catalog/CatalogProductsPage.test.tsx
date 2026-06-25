import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
import CatalogProductsPage from './CatalogProductsPage'

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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/catalog/products']}>
      <Toaster />
      <CatalogProductsPage />
    </MemoryRouter>,
  )
}

describe('CatalogProductsPage — integración', () => {
  // ── 1. Renderizado inicial ───────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar los productos cargados en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
      expect(screen.getByText('Silla de Ruedas')).toBeInTheDocument()
      expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
    })

    it('debería mostrar los SKUs de los productos', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('EQP-001')).toBeInTheDocument()
      })
      expect(screen.getByText('MVL-001')).toBeInTheDocument()
      expect(screen.getByText('INS-001')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nuevo producto', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /catalog\.products\.new/ })).toBeInTheDocument()
      })
    })

    it('debería mostrar enlace de ver detalle para cada producto', async () => {
      renderPage()

      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: 'Ver detalle' })
        expect(links).toHaveLength(3)
        expect(links[0]).toHaveAttribute('href', '/app/catalog/products/prod-1')
      })
    })
  })

  // ── 2. Búsqueda y filtro ─────────────────────────────────
  describe('Búsqueda y filtro', () => {
    it('debería filtrar productos por nombre', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar producto'), 'Silla')

      await waitFor(() => {
        expect(screen.queryByText('Monitor Cardiaco')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Silla de Ruedas')).toBeInTheDocument()
    })

    it('debería mostrar "No hay productos" cuando no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar producto'), 'ZZZZ')

      await waitFor(() => {
        expect(screen.getByText('No hay productos que coincidan con la búsqueda.')).toBeInTheDocument()
      })
    })

    it('debería limpiar filtros al hacer clic en Limpiar filtros', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar producto'), 'Silla')

      await waitFor(() => {
        expect(screen.queryByText('Monitor Cardiaco')).not.toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Crear producto ────────────────────────────────────
  describe('Crear producto', () => {
    it('debería abrir el modal de creación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /catalog\.products\.new/ }))

      expect(screen.getByText('Nuevo producto')).toBeInTheDocument()
    })

    it('debería validar nombre obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /catalog\.products\.new/ }))

      await user.click(screen.getByText('Crear producto'))

      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    })

    it('debería crear un producto exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /catalog\.products\.new/ }))

      await user.type(screen.getByLabelText('Nombre del producto *'), 'Nuevo Producto Test')
      await user.type(screen.getByLabelText('SKU *'), 'TST-001')

      await user.selectOptions(screen.getByLabelText('Categoría *'), 'cat-1')

      await user.click(screen.getByText('Crear producto'))

      await waitFor(() => {
        expect(screen.getByText('Producto creado correctamente')).toBeInTheDocument()
      })
    }, 10000)
  })

  // ── 4. Editar producto ───────────────────────────────────
  describe('Editar producto', () => {
    it('debería abrir el modal de edición al hacer clic en Editar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      expect(screen.getByText('Editar producto')).toBeInTheDocument()
    })
  })

  // ── 5. Desactivar / Reactivar producto ───────────────────
  describe('Desactivar y reactivar producto', () => {
    it('debería abrir modal de confirmación al desactivar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      expect(screen.getByText('Desactivar producto')).toBeInTheDocument()
      const monitorMatches = screen.getAllByText(/Monitor Cardiaco/)
      expect(monitorMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('debería desactivar el producto al confirmar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await user.click(screen.getByRole('button', { name: 'Sí, desactivar' }))

      await waitFor(() => {
        expect(screen.getByText(/desactivado/)).toBeInTheDocument()
      })
    })

    it('debería permitir reactivar un producto inactivo', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
      })

      const reactivateButtons = screen.getAllByRole('button', { name: 'Reactivar' })
      const rowButton = reactivateButtons.find(b => b.closest('tr'))
      await user.click(rowButton!)

      expect(screen.getByText('Reactivar producto')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Sí, reactivar' }))

      await waitFor(() => {
        expect(screen.getByText(/reactivado/)).toBeInTheDocument()
      })
    })
  })
})
