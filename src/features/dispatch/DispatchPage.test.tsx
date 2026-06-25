import { vi, describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { Toaster } from 'sonner'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
  }),
}))

import useAuthStore from '../../store/useAuthStore'
import useCatalogStore from '../../store/useCatalogStore'
import DispatchPage from './DispatchPage'
import { dispatchHandlers, API_BASE } from '../../test/mocks/handlers/dispatch.handlers'

// ── MSW server ──────────────────────────────────────────────
const server = setupServer(...dispatchHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
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

// ── Helpers ─────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/dispatch']}>
      <Toaster />
      <DispatchPage />
    </MemoryRouter>,
  )
}

describe('DispatchPage — integración', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        username: 'aux1',
        email: 'aux1@icm.com',
        first_name: 'Auxiliar',
        last_name: 'Despacho',
        role: 'auxiliar_despacho',
      },
      token: 'fake-token',
      isAuthenticated: true,
    })
  })

  // ── 1. Renderizado inicial ──────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el selector de tipo de salida y el campo de búsqueda', () => {
      renderPage()

      expect(screen.getByText('Venta Mayor')).toBeInTheDocument()
      expect(screen.getByText('Venta Menor')).toBeInTheDocument()
      expect(screen.getByText('Daño')).toBeInTheDocument()
      expect(screen.getByText('Vencimiento')).toBeInTheDocument()

      expect(
        screen.getByPlaceholderText('Buscar por nombre, SKU o código de barras...'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el formulario de cliente para Venta Mayor por defecto', () => {
      renderPage()

      expect(screen.getByText('Datos del cliente — Ley 1581')).toBeInTheDocument()
      expect(screen.getByText('Privacidad — Ley 1581')).toBeInTheDocument()
      expect(screen.getByLabelText(/Razón social/)).toBeInTheDocument()
    })

    it('debería mostrar el panel de movimientos recientes vacío', async () => {
      renderPage()

      expect(await screen.findByText('Sin movimientos recientes')).toBeInTheDocument()
    })
  })

  // ── 2. Búsqueda y selección de producto ─────────────
  describe('Búsqueda y selección de producto', () => {
    it('debería buscar y mostrar productos en el dropdown', async () => {
      renderPage()
      const user = userEvent.setup()

      const searchInput = screen.getByPlaceholderText(
        'Buscar por nombre, SKU o código de barras...',
      )
      await user.type(searchInput, 'Monitor')

      expect(await screen.findByText('Monitor Cardiaco')).toBeInTheDocument()
      expect(screen.getByText('EQP-001')).toBeInTheDocument()
    })

    it('debería seleccionar un producto y mostrar la configuración pendiente', async () => {
      renderPage()
      const user = userEvent.setup()

      const searchInput = screen.getByPlaceholderText(
        'Buscar por nombre, SKU o código de barras...',
      )
      await user.type(searchInput, 'Monitor')
      await user.click(await screen.findByText('Monitor Cardiaco'))

      // Pending product section appears
      expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      expect(screen.getByText('EQP-001')).toBeInTheDocument()
      expect(screen.getByLabelText('Cantidad')).toBeInTheDocument()
      expect(screen.getByLabelText('P/U')).toBeInTheDocument()
      expect(screen.getByLabelText('Ubicación')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /agregar al carrito/i }),
      ).toBeInTheDocument()
    })

    it('debería mostrar advertencia de stock insuficiente cuando la cantidad supera el disponible', async () => {
      renderPage()
      const user = userEvent.setup()

      const searchInput = screen.getByPlaceholderText(
        'Buscar por nombre, SKU o código de barras...',
      )
      await user.type(searchInput, 'Monitor')
      await user.click(await screen.findByText('Monitor Cardiaco'))

      const qtyInput = screen.getByLabelText('Cantidad')
      await user.clear(qtyInput)
      await user.type(qtyInput, '999')

      expect(screen.getByText('Stock insuficiente')).toBeInTheDocument()
    })
  })

  // ── 3. Agregar producto al carrito ─────────────────
  describe('Agregar producto al carrito', () => {
    it('debería agregar un producto al carrito y mostrar el resumen', async () => {
      renderPage()
      const user = userEvent.setup()

      // Search and select product
      const searchInput = screen.getByPlaceholderText(
        'Buscar por nombre, SKU o código de barras...',
      )
      await user.type(searchInput, 'Monitor')
      await user.click(await screen.findByText('Monitor Cardiaco'))

      // Set quantity
      const qtyInput = screen.getByLabelText('Cantidad')
      await user.clear(qtyInput)
      await user.type(qtyInput, '2')

      // Set price
      const priceInput = screen.getByLabelText('P/U')
      await user.clear(priceInput)
      await user.type(priceInput, '12000')

      // Select location
      const locationSelect = screen.getByLabelText('Ubicación')
      await user.selectOptions(locationSelect, 'loc-bod-01')

      // Click add to cart
      await user.click(screen.getByRole('button', { name: /agregar al carrito/i }))

      // Cart should show the item (text appears in multiple places due to search dropdown + step tracker + column headers)
      await waitFor(() => {
        expect(screen.getAllByText('EQP-001').length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/Carrito/)).toBeInTheDocument()

      // Summary should show totals (Subtotal appears in both table header and summary)
      expect(screen.getAllByText('Subtotal').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('IVA 19%')).toBeInTheDocument()
      expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── 4. Submit exitoso ──────────────────────────────
  describe('Confirmar despacho (submit)', () => {
    it('debería completar un despacho exitoso y mostrar la factura', async () => {
      renderPage()
      const user = userEvent.setup()

      // Search and select product
      const searchInput = screen.getByPlaceholderText(
        'Buscar por nombre, SKU o código de barras...',
      )
      await user.type(searchInput, 'Monitor')
      await user.click(await screen.findByText('Monitor Cardiaco'))

      // Set quantity
      const qtyInput = screen.getByLabelText('Cantidad')
      await user.clear(qtyInput)
      await user.type(qtyInput, '2')

      // Set price (auto-filled, but ensure it's set)
      const priceInput = screen.getByLabelText('P/U')
      await user.clear(priceInput)
      await user.type(priceInput, '12000')

      // Select location
      const locationSelect = screen.getByLabelText('Ubicación')
      await user.selectOptions(locationSelect, 'loc-bod-01')

      // Add to cart
      await user.click(screen.getByRole('button', { name: /agregar al carrito/i }))
      expect(await screen.findByText(/Carrito/)).toBeInTheDocument()

      // Fill customer data (wholesale: name + doc required)
      const nameInput = screen.getByLabelText(/Razón social/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Salud Total EPS')

      const docInput = screen.getByLabelText(/NIT/)
      await user.clear(docInput)
      await user.type(docInput, '900.123.456-7')

      // Click confirm
      await user.click(
        screen.getByRole('button', { name: /confirmar/i }),
      )

      // Wait for success toast
      await waitFor(() => {
        expect(screen.getByText(/salida.*registrada.*exitosamente/)).toBeInTheDocument()
      })

      // Invoice modal should appear (ICM-1234 appears in both modal and recent movements)
      expect(screen.getByText('Factura de venta')).toBeInTheDocument()
      expect(screen.getAllByText(/ICM-1234/).length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar error si la API devuelve un error', async () => {
      // Override the POST handler to return 400
      server.use(
        http.post(`${API_BASE}/movements/dispatches/`, () =>
          HttpResponse.json(
            { error: 'INSUFFICIENT_STOCK', message: 'Stock insuficiente para completar el despacho.' },
            { status: 400 },
          ),
        ),
      )

      renderPage()
      const user = userEvent.setup()

      // Search and select product
      const searchInput = screen.getByPlaceholderText(
        'Buscar por nombre, SKU o código de barras...',
      )
      await user.type(searchInput, 'Monitor')
      await user.click(await screen.findByText('Monitor Cardiaco'))

      // Set quantity
      const qtyInput = screen.getByLabelText('Cantidad')
      await user.clear(qtyInput)
      await user.type(qtyInput, '2')

      // Set price
      const priceInput = screen.getByLabelText('P/U')
      await user.clear(priceInput)
      await user.type(priceInput, '12000')

      // Select location
      const locationSelect = screen.getByLabelText('Ubicación')
      await user.selectOptions(locationSelect, 'loc-bod-01')

      // Add to cart
      await user.click(screen.getByRole('button', { name: /agregar al carrito/i }))
      expect(await screen.findByText(/Carrito/)).toBeInTheDocument()

      // Fill customer data
      const nameInput = screen.getByLabelText(/Razón social/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Salud Total EPS')
      const docInput = screen.getByLabelText(/NIT/)
      await user.clear(docInput)
      await user.type(docInput, '900.123.456-7')

      // Click confirm
      await user.click(screen.getByRole('button', { name: /confirmar/i }))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Stock insuficiente para completar el despacho.')).toBeInTheDocument()
      })
    })
  })

  // ── 5. Validaciones del formulario ─────────────────
  describe('Validaciones del formulario', () => {
    it('debería deshabilitar el botón confirmar cuando faltan datos del cliente', async () => {
      renderPage()
      const user = userEvent.setup()

      // Add a product to cart first
      const searchInput = screen.getByPlaceholderText(
        'Buscar por nombre, SKU o código de barras...',
      )
      await user.type(searchInput, 'Monitor')
      await user.click(await screen.findByText('Monitor Cardiaco'))

      const qtyInput = screen.getByLabelText('Cantidad')
      await user.clear(qtyInput)
      await user.type(qtyInput, '2')

      const priceInput = screen.getByLabelText('P/U')
      await user.clear(priceInput)
      await user.type(priceInput, '12000')

      const locationSelect = screen.getByLabelText('Ubicación')
      await user.selectOptions(locationSelect, 'loc-bod-01')

      await user.click(screen.getByRole('button', { name: /agregar al carrito/i }))
      expect(await screen.findByText(/Carrito/)).toBeInTheDocument()

      // Don't fill customer data — confirm button should be disabled
      const confirmBtn = screen.getByRole('button', { name: /confirmar/i })
      expect(confirmBtn).toBeDisabled()
    })
  })

  // ── 6. Cambio de modo de despacho ─────────────────
  describe('Cambio de modo de despacho', () => {
    it('debería cambiar a modo Daño y mostrar campo de descripción', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.click(screen.getByText('Daño'))

      expect(screen.getByText('Descripción del daño')).toBeInTheDocument()

      // Customer form should NOT be shown for damage mode
      expect(screen.queryByText('Datos del cliente — Ley 1581')).not.toBeInTheDocument()
    })

    it('debería cambiar a modo Venta Menor y mostrar cliente opcional', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.click(screen.getByText('Venta Menor'))

      // Documento should be present but not required
      expect(screen.getByText('Datos del cliente — Ley 1581')).toBeInTheDocument()
    })
  })
})
