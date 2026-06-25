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
import { locationsHandlers, resetLocationsData } from '../../test/mocks/handlers/locations.handlers'
import TransfersPage from './TransfersPage'

const server = setupServer(...locationsHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetLocationsData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
})
afterAll(() => server.close())

beforeAll(() => {
  useAuthStore.setState({
    user: {
      id: 'user-1',
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
    <MemoryRouter initialEntries={['/app/locations/transfers']}>
      <Toaster />
      <TransfersPage />
    </MemoryRouter>,
  )
}

describe('TransfersPage — integración', () => {
  // ── 1. Renderizado inicial ───────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el título y subtítulo', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Transferencias')).toBeInTheDocument()
      })
      expect(screen.getByText('Gestiona los traslados de stock físico entre ubicaciones')).toBeInTheDocument()
    })

    it('debería cargar y mostrar las transferencias', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
      expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
    })

    it('debería mostrar las tarjetas de métricas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Total Transferencias')).toBeInTheDocument()
      })
      expect(screen.getByText('Unidades Transferidas')).toBeInTheDocument()
      expect(screen.getByText('Productos Transferidos')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nueva transferencia', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+ Nueva Transferencia' })).toBeInTheDocument()
      })
    })

    it('debería mostrar el SKU del producto en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('SKU: EQP-001')).toBeInTheDocument()
      })
      expect(screen.getByText('SKU: INS-001')).toBeInTheDocument()
    })
  })

  // ── 2. Búsqueda ─────────────────────────────────────────
  describe('Búsqueda', () => {
    it('debería filtrar transferencias por nombre de producto', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const searchInput = screen.getByLabelText('Buscar transferencia')
      await user.type(searchInput, 'Guantes')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.queryByText('Monitor Cardiaco')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
    })

    it('debería mostrar mensaje de vacío si no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const searchInput = screen.getByLabelText('Buscar transferencia')
      await user.type(searchInput, 'ZZZZ')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.getByText('No se encontraron transferencias.')).toBeInTheDocument()
      })
    })

    it('debería limpiar el filtro de búsqueda', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const searchInput = screen.getByLabelText('Buscar transferencia')
      await user.type(searchInput, 'Guantes')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.queryByText('Monitor Cardiaco')).not.toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Limpiar filtro' }))

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Detalle de transferencia ─────────────────────────
  describe('Detalle de transferencia', () => {
    it('debería abrir el modal de detalle', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const detailButtons = screen.getAllByRole('button', { name: 'Ver detalle' })
      await user.click(detailButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Detalle de Transferencia')).toBeInTheDocument()
      })
    })

    it('debería mostrar los datos de la transferencia en el detalle', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const detailButtons = screen.getAllByRole('button', { name: 'Ver detalle' })
      await user.click(detailButtons[0])

      await waitFor(() => {
        expect(screen.getByText('5 uds')).toBeInTheDocument()
      })
      const principalMatches = screen.getAllByText(/Bodega Principal/)
      expect(principalMatches.length).toBeGreaterThanOrEqual(1)
      const consumiblesMatches = screen.getAllByText(/Bodega Consumibles/)
      expect(consumiblesMatches.length).toBeGreaterThanOrEqual(1)
      const adminMatches = screen.getAllByText('Admin ICM')
      expect(adminMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar "No requiere lote" cuando no tiene lote', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const detailButtons = screen.getAllByRole('button', { name: 'Ver detalle' })
      await user.click(detailButtons[0])

      await waitFor(() => {
        expect(screen.getByText('No requiere lote')).toBeInTheDocument()
      })
    })

    it('debería mostrar información del lote cuando existe', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
      })

      const detailButtons = screen.getAllByRole('button', { name: 'Ver detalle' })
      await user.click(detailButtons[1])

      await waitFor(() => {
        expect(screen.getByText(/LOTE-001/)).toBeInTheDocument()
      })
    })

    it('debería cerrar el modal de detalle', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      const detailButtons = screen.getAllByRole('button', { name: 'Ver detalle' })
      await user.click(detailButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Detalle de Transferencia')).toBeInTheDocument()
      })

      const closeButtons = screen.getAllByRole('button', { name: 'Cerrar' })
      await user.click(closeButtons[closeButtons.length - 1])

      await waitFor(() => {
        expect(screen.queryByText('Detalle de Transferencia')).not.toBeInTheDocument()
      })
    })
  })

  // ── 4. Crear transferencia ──────────────────────────────
  describe('Crear transferencia', () => {
    it('debería abrir el modal de creación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Transferencia' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Transferencia')).toBeInTheDocument()
      })
    })

    it('debería mostrar productos disponibles para seleccionar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Transferencia' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Transferencia')).toBeInTheDocument()
      })
      expect(screen.getByPlaceholderText('Escribe para buscar producto...')).toBeInTheDocument()
    })

    it('debería seleccionar un producto y mostrar opciones de origen', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Transferencia' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Transferencia')).toBeInTheDocument()
      })

      const productButtons = screen.getAllByText('EQP-001')
      await user.click(productButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText(/Disponible: 60 uds/)).toBeInTheDocument()
      })
    })

    it('debería permitir seleccionar origen, destino, cantidad y motivo', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Transferencia' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Transferencia')).toBeInTheDocument()
      })

      const productButtons = screen.getAllByText('EQP-001')
      await user.click(productButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText(/Bodega Principal.*Disponible: 60 uds/)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Ubicación de Origen *'), 'loc-1')

      await waitFor(() => {
        expect(screen.getByLabelText('Ubicación de Destino *')).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Ubicación de Destino *'), 'loc-2')

      await waitFor(() => {
        expect(screen.getByLabelText(/Cantidad a Transferir/)).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText(/Cantidad a Transferir/)
      await user.clear(qtyInput)
      await user.type(qtyInput, '5')

      await user.selectOptions(screen.getByLabelText(/Motivo del traslado/), 'reposicion_vitrina')

      await waitFor(() => {
        expect(screen.getByText(/Máximo disponible/)).toBeInTheDocument()
      })
    })

    it('debería mostrar campos de lote para productos con vencimiento', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Transferencia' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Transferencia')).toBeInTheDocument()
      })

      const productButtons = screen.getAllByText('INS-001')
      await user.click(productButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText(/Disponible: 40 uds/)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Ubicación de Origen *'), 'loc-2')

      await waitFor(() => {
        expect(screen.getByLabelText('Lote de Producto *')).toBeInTheDocument()
      })

      expect(screen.getByText(/LOTE-001/)).toBeInTheDocument()
    })

    it('debería mostrar checkboxes de cadena de frío para productos con esa condición', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Transferencia' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Transferencia')).toBeInTheDocument()
      })

      const productButtons = screen.getAllByText('MVL-001')
      await user.click(productButtons[0].closest('button')!)

      await waitFor(() => {
        expect(screen.getByText(/Disponible: 60 uds/)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Ubicación de Origen *'), 'loc-1')
      await user.selectOptions(screen.getByLabelText('Ubicación de Destino *'), 'loc-2')

      await waitFor(() => {
        expect(screen.getByText(/Alerta de Cadena de Frío/)).toBeInTheDocument()
      })
    })
  })
})
