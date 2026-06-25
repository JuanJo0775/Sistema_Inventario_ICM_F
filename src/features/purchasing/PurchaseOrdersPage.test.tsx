import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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
import usePurchaseOrderStore from '../../store/usePurchaseOrderStore'
import useSupplierStore from '../../store/useSupplierStore'
import useCatalogStore from '../../store/useCatalogStore'
import { purchasingHandlers, resetPurchasingData } from '../../test/mocks/handlers/purchasing.handlers'
import { PurchaseOrdersPage } from './PurchaseOrdersPage'

const server = setupServer(...purchasingHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetPurchasingData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  usePurchaseOrderStore.setState({ orders: [], currentOrder: null, loading: false, error: null })
  useSupplierStore.setState({ suppliers: [], selectedSupplier: null, loading: false, error: null })
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/purchasing/purchase-orders']}>
      <Toaster />
      <PurchaseOrdersPage />
    </MemoryRouter>,
  )
}

async function selectComboboxOption(placeholder: string, optionText: string) {
  const input = screen.getByPlaceholderText(placeholder)
  const combobox = input.closest('div[style*="width: 100%"]') as HTMLElement
  await userEvent.click(input)
  await waitFor(() => {
    expect(within(combobox).getByText(optionText)).toBeInTheDocument()
  })
  await userEvent.click(within(combobox).getByText(optionText))
}

describe('PurchaseOrdersPage — integración', () => {
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
    it('debería mostrar el título, subtítulo y métricas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Órdenes de Compra')).toBeInTheDocument()
      })
      expect(screen.getByText('Planificación y abastecimiento de insumos')).toBeInTheDocument()
      expect(screen.getByText('Órdenes Totales')).toBeInTheDocument()
      expect(screen.getByText('Pendientes')).toBeInTheDocument()
      expect(screen.getByText('Parciales')).toBeInTheDocument()
      expect(screen.getByText('Completadas')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nueva orden', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+ Nueva Orden' })).toBeInTheDocument()
      })
    })

    it('debería cargar y mostrar las órdenes en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })
      expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
    })

    it('debería mostrar los números de orden en formato código', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })
    })

    it('debería mostrar las métricas de conteo correctas', async () => {
      renderPage()

      await waitFor(() => {
        const metricCells = screen.getAllByText('Órdenes Totales')
        expect(metricCells.length).toBeGreaterThanOrEqual(1)
      })
      // 2 orders total: 1 borrador + 1 pendiente + 0 parcial + 0 completada
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── 2. Búsqueda y filtro ─────────────────────────────────
  describe('Búsqueda y filtro', () => {
    it('debería filtrar por número de orden al escribir', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar orden'), 'OC-2026-0002')

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

      await user.type(screen.getByLabelText('Buscar orden'), 'Medical SAS')

      expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
    })

    it('debería filtrar por estado', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'pendiente')

      await waitFor(() => {
        expect(screen.queryByText('OC-2026-0001')).not.toBeInTheDocument()
      })
      expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
    })

    it('debería mostrar mensaje de vacío si no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar orden'), 'ZZZZ_NO_EXISTE')

      await waitFor(() => {
        expect(screen.getByText('No se encontraron órdenes de compra.')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Crear orden ───────────────────────────────────────
  describe('Crear orden de compra', () => {
    it('debería abrir el modal de creación al hacer clic en Nueva Orden', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Orden' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Orden de Compra')).toBeInTheDocument()
      })
    })

    it('debería validar proveedor obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Orden' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Orden de Compra')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Guardar Borrador' }))

      await waitFor(() => {
        expect(screen.getByText('El proveedor es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería validar al menos un producto', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Orden' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Orden de Compra')).toBeInTheDocument()
      })

      // Select supplier via Combobox
      await selectComboboxOption('Seleccione o busque un proveedor...', 'Medical SAS')

      await user.click(screen.getByRole('button', { name: 'Guardar Borrador' }))

      await waitFor(() => {
        expect(screen.getByText('Debe agregar al menos un producto a la orden.')).toBeInTheDocument()
      })
    })

    it('debería guardar borrador exitosamente con proveedor y producto', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Orden' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Orden de Compra')).toBeInTheDocument()
      })

      // Select supplier via Combobox
      await selectComboboxOption('Seleccione o busque un proveedor...', 'Medical SAS')

      // Select product via Combobox
      await selectComboboxOption('Buscar producto...', 'Monitor Cardiaco')

      // Click "Agregar"
      await user.click(screen.getByRole('button', { name: 'Agregar' }))

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      // Save draft
      await user.click(screen.getByRole('button', { name: 'Guardar Borrador' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/guardada en borrador/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    }, 12000)

    it('debería emitir orden desde el formulario de creación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Orden' }))

      await waitFor(() => {
        expect(screen.getByText('Nueva Orden de Compra')).toBeInTheDocument()
      })

      // Select supplier
      await selectComboboxOption('Seleccione o busque un proveedor...', 'Medical SAS')

      // Select product
      await selectComboboxOption('Buscar producto...', 'Monitor Cardiaco')

      await user.click(screen.getByRole('button', { name: 'Agregar' }))

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      // Emit order
      await user.click(screen.getByRole('button', { name: 'Emitir Orden' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/emitida correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    }, 12000)
  })

  // ── 4. Emitir orden existente ────────────────────────────
  describe('Emitir orden existente', () => {
    it('debería emitir una orden en borrador', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      const tableEmitButtons = screen.getAllByRole('button', { name: 'Emitir' })
      await user.click(tableEmitButtons[0])

      const confirmDialog = screen.getByText(/Desea emitir esta Orden/)
      expect(confirmDialog).toBeInTheDocument()

      const confirmButtons = screen.getAllByRole('button', { name: 'Emitir' })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => {
        const matches = screen.getAllByText(/emitida correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 5. Cancelar orden ────────────────────────────────────
  describe('Cancelar orden', () => {
    it('debería abrir el modal de cancelación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancelar' })
      await user.click(cancelButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Cancelar Orden de Compra')).toBeInTheDocument()
      })
    })

    it('debería validar motivo de cancelación obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancelar' })
      await user.click(cancelButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Cancelar Orden de Compra')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Confirmar Cancelación' }))

      await waitFor(() => {
        expect(screen.getByText('El motivo de cancelación es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería cancelar la orden exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancelar' })
      await user.click(cancelButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Cancelar Orden de Compra')).toBeInTheDocument()
      })

      const reasonInput = screen.getByPlaceholderText('Ej. Cambio de cotización o proveedor')
      await user.type(reasonInput, 'Cambio de proveedor')

      await user.click(screen.getByRole('button', { name: 'Confirmar Cancelación' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/cancelada/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 6. Detalle de orden ──────────────────────────────────
  describe('Detalle de orden', () => {
    it('debería abrir el modal de detalle al hacer clic en el botón de ver', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0001')).toBeInTheDocument()
      })

      const viewButtons = screen.getAllByRole('button', { name: 'Ver detalle' })
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Detalle de Orden OC-2026-0001')).toBeInTheDocument()
      })
    })

    it('debería mostrar los productos en el detalle', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('OC-2026-0002')).toBeInTheDocument()
      })

      const viewButtons = screen.getAllByRole('button', { name: 'Ver detalle' })
      await user.click(viewButtons[1])

      await waitFor(() => {
        expect(screen.getByText('Detalle de Orden OC-2026-0002')).toBeInTheDocument()
      })
      expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
      expect(screen.getByText('INS-001')).toBeInTheDocument()
    })
  })
})
