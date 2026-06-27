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

import useAuthStore from '../../store/useAuthStore'
import useReceptionStore from '../../store/useReceptionStore'
import { http, HttpResponse } from 'msw'
import { receptionHandlers, resetReceptionData } from '../../test/mocks/handlers/reception.handlers'
const API_BASE = 'http://localhost:8000/api/v1'
import ReceptionPage from './ReceptionPage'

const server = setupServer(...receptionHandlers)

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetReceptionData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  useReceptionStore.setState({ pendingOrders: [], completedOrders: [], selectedOrder: null, loading: false, error: null })
})
afterAll(() => server.close())

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/reception']}>
      <Toaster />
      <ReceptionPage />
    </MemoryRouter>,
  )
}

describe('ReceptionPage — integración', () => {
  beforeAll(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        username: 'almacenista',
        email: 'almacenista@icm.com',
        first_name: 'Almacenista',
        last_name: 'ICM',
        role: 'almacenista',
      },
      token: 'fake-token',
      isAuthenticated: true,
    })
  })

  // ── 1. Renderizado inicial ───────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el título y subtítulo', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Recepción de Mercancía')).toBeInTheDocument()
      })
      expect(screen.getByText('Recibe órdenes de compra y registra ingresos en el inventario')).toBeInTheDocument()
    })

    it('debería mostrar las 4 métricas KPI', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Pendientes')).toBeInTheDocument()
      })
      expect(screen.getByText('Parciales')).toBeInTheDocument()
      expect(screen.getByText('Completadas')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('debería mostrar los tabs Pendientes/Historial', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Pendientes de recibir')).toBeInTheDocument()
      })
      expect(screen.getByText('Historial completado')).toBeInTheDocument()
    })

    it('debería mostrar las órdenes pendientes en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })
      expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
      const med = screen.getAllByText('Medical SAS')
      expect(med.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('2 Productos')).toBeInTheDocument()
      const pendiente = screen.getAllByText('Pendiente')
      expect(pendiente.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Parcial')).toBeInTheDocument()
    })
  })

  // ── 2. Tabs ──────────────────────────────────────────────
  describe('Tabs', () => {
    it('debería cambiar a historial y mostrar órdenes completadas', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Historial completado'))

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0003')).toBeInTheDocument()
      })
      expect(screen.queryByText('OC-2026-0001')).not.toBeInTheDocument()
    })

    it('debería cambiar a pendientes desde historial', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Historial completado'))

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0003')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Pendientes de recibir'))

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })
    })

    it('debería mostrar botón Recibir en pendientes y Ver Detalle en historial', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        const recibirBtns = screen.getAllByText('Recibir')
        expect(recibirBtns.length).toBeGreaterThanOrEqual(1)
      })

      await user.click(screen.getByText('Historial completado'))

      await waitFor(() => {
        expect(screen.getByText('Ver Detalle')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Navegación ────────────────────────────────────────
  describe('Navegación', () => {
    it('debería navegar al detalle al hacer clic en Recibir', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        const recibirBtns = screen.getAllByText('Recibir')
        expect(recibirBtns.length).toBeGreaterThanOrEqual(1)
      })

      await user.click(screen.getAllByText('Recibir')[0])

      expect(navigateMock).toHaveBeenCalledWith('/app/reception/oc-1')
    })

    it('debería navegar al detalle al hacer clic en Ver Detalle', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.click(screen.getByText('Historial completado'))

      await waitFor(() => {
        expect(screen.getByText('Ver Detalle')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Ver Detalle'))

      expect(navigateMock).toHaveBeenCalledWith('/app/reception/oc-3')
    })
  })

  // ── 4. Búsqueda y filtro ─────────────────────────────────
  describe('Búsqueda y filtro', () => {
    it('debería filtrar por número de orden', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText('Buscar por número de orden o proveedor...'), 'OC-2026-0002')

      await waitFor(() => {
        expect(screen.queryByText('OC-2026-0001')).not.toBeInTheDocument()
      })
      expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
    })

    it('debería filtrar por nombre de proveedor', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText('Buscar por número de orden o proveedor...'), 'Medical SAS')

      expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
    })

    it('debería filtrar por estado', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      const statusSelect = screen.getByRole('combobox')
      await user.selectOptions(statusSelect, 'parcialmente_recibida')

      await waitFor(() => {
        expect(screen.queryByText('OC-2026-0001')).not.toBeInTheDocument()
      })
      expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
    })

    it('debería mostrar Limpiar filtros cuando hay búsqueda activa', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText('Buscar por número de orden o proveedor...'), 'algo')

      await waitFor(() => {
        expect(screen.getByText('Limpiar filtros')).toBeInTheDocument()
      })
    })

    it('debería limpiar filtros al hacer clic en Limpiar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText('Buscar por número de orden o proveedor...'), 'ZZZZ')

      await waitFor(() => {
        expect(screen.getByText('No se encontraron órdenes de compra')).toBeInTheDocument()
      })

      const limpiar = screen.getByText('Limpiar filtros')
      await user.click(limpiar)

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })
    })
  })

  // ── 5. Estados de carga y error ──────────────────────────
  describe('Estados de carga y error', () => {
    it('debería mostrar mensaje de vacío si no hay órdenes pendientes', async () => {
      server.use(
        http.get(`${API_BASE}/purchasing/purchase-orders/`, () =>
          HttpResponse.json([]),
        ),
      )
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('No se encontraron órdenes de compra')).toBeInTheDocument()
      })
    })

    it('debería mostrar mensaje de error cuando hay error', async () => {
      server.use(
        http.get(`${API_BASE}/purchasing/purchase-orders/`, () =>
          HttpResponse.json({ error: 'Error de conexión.' }, { status: 500 }),
        ),
      )
      renderPage()

      await waitFor(() => {
        const matches = screen.getAllByText(/Error de conexión/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería limpiar el error al hacer clic en X', async () => {
      server.use(
        http.get(`${API_BASE}/purchasing/purchase-orders/`, () =>
          HttpResponse.json({ error: 'Error de conexión.' }, { status: 500 }),
        ),
      )
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        const matches = screen.getAllByText(/Error de conexión/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })

      const closeButtons = screen.getAllByRole('button', { name: '' })
      const closeError = closeButtons.find(btn => btn.querySelector('svg'))
      if (closeError) await user.click(closeError)

      await waitFor(() => {
        expect(screen.queryByText(/Error de conexión/)).not.toBeInTheDocument()
      })
    })
  })

  // ── 6. Refresh ───────────────────────────────────────────
  describe('Refresh', () => {
    it('debería mostrar botón Actualizar', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Actualizar')).toBeInTheDocument()
      })
    })
  })
})
