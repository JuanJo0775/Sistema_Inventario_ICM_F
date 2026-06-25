import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const tStable = (key: string) => key

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tStable,
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
  }),
}))

vi.mock('../../components/ui/BarcodeScannerButton', () => ({
  BarcodeScannerButton: ({ label, onProductFound }: any) => (
    <button onClick={() => onProductFound({ id: 'prod-10', sku: 'CAN-US-007', name: 'Ultrasonido 3MHz' })}>
      {label}
    </button>
  ),
}))

vi.mock('../../components/layout/AppShell', () => ({
  default: ({ children, title, subtitle, actions }: any) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div data-testid="app-shell-actions">{actions}</div>
      {children}
    </div>
  ),
}))

const mockServiceControl = vi.hoisted(() => ({
  loadShouldFail: false,
  returnEmptyHistory: false,
  submitShouldFail: false,
}))

const mockUseMocks = vi.hoisted(() => ({ current: false }))

vi.mock('../../mocks/config', () => ({
  get useMocks() { return mockUseMocks.current },
}))

vi.mock('../../services/returns', () => ({
  fetchReturnsOverview: async () => {
    if (mockServiceControl.loadShouldFail) {
      throw new Error('Fallo de carga')
    }
    return {
      locations: [
        { id: 'loc-bod-01', code: 'BOD-01', name: 'Bodega Principal', capacityLabel: '' },
        { id: 'loc-bod-02', code: 'BOD-02', name: 'Bodega Consumibles', capacityLabel: '' },
        { id: 'loc-frio-01', code: 'FRIO-01', name: 'Cuarto Frío', capacityLabel: '' },
      ],
      products: [
        { id: 'prod-10', productId: 'prod-10', productName: 'Ultrasonido 3MHz', sku: 'CAN-US-007', barcode: '770000000101', category: 'Electroterapia', canReturn: false, blockReason: 'Solo Electroterapia retornable con serial', requiresSerial: true, stock: 10, stockLocations: [] },
        { id: 'prod-11', productId: 'prod-11', productName: 'TENS Bifasico Pro', sku: 'CAN-TENS-003', barcode: '770000000102', category: 'Movilidad', canReturn: true, requiresSerial: false, stock: 5, stockLocations: [] },
        { id: 'prod-12', productId: 'prod-12', productName: 'Mesa Hidraulica Basica', sku: 'MESA-HID-001', barcode: '770000000103', category: 'Movilidad', canReturn: true, requiresSerial: false, stock: 2, stockLocations: [] },
        { id: 'prod-13', productId: 'prod-13', productName: 'Agujas Puncion Seca 0.25mm', sku: 'CAN-APS-001', barcode: '770000000104', category: 'Consumibles', canReturn: false, blockReason: 'Consumibles no retornables', requiresSerial: false, stock: 100, stockLocations: [] },
      ],
      pendingReturns: mockUseMocks.current ? [
        { id: 'ret-pending-001', productId: 'prod-10', productName: 'Ultrasonido 3MHz', sku: 'CAN-US-007', serialNumber: 'US-2024-0091', quantity: 1, locationCode: 'BOD-01', reason: 'Falla al encender', productState: 'Con dano visible', registeredBy: 'Luis M.', registeredAt: '01 jun 2025, 10:00', status: 'pending', note: 'Se adjunto inspeccion visual inicial.', relatedMovementId: undefined },
      ] : [],
      history: mockServiceControl.returnEmptyHistory ? [] : [
        { id: 'ret-hist-001', productId: 'prod-11', productName: 'TENS Bifasico Pro', sku: 'CAN-TENS-003', serialNumber: 'TENS-1120', quantity: 1, locationCode: 'BOD-02', reason: 'Cliente reporto accesorio faltante', productState: 'Empaque abierto', registeredBy: 'Carolina R.', registeredAt: '01 jun 2025, 10:00', status: 'recorded' },
        { id: 'ret-hist-002', productId: 'prod-12', productName: 'Mesa Hidraulica Basica', sku: 'MESA-HID-001', serialNumber: null, quantity: 2, locationCode: 'BOD-01', reason: 'Error de referencia en pedido', productState: 'Bueno', registeredBy: 'Sistema', registeredAt: '15 may 2025, 14:30', status: 'recorded', relatedMovementId: 'mov-out-1' },
      ],
    }
  },
  fetchOutgoingMovements: async () => [
    { id: 'mov-out-1', movementType: 'SALIDA_VENTA_MAYOR', movementTypeLabel: 'Venta al por mayor', productId: 'prod-11', productName: 'CAN-TENS-003', productSku: 'CAN-TENS-003', quantity: 5, customerName: 'Clinica Del Norte', customerDoc: '900123456-7', createdAt: '2025-05-10T08:00:00Z' },
    { id: 'mov-out-2', movementType: 'SALIDA_VENTA_MENOR', movementTypeLabel: 'Venta al por menor', productId: 'prod-10', productName: 'CAN-US-007', productSku: 'CAN-US-007', quantity: 2, customerName: 'Dr. Lopez', customerDoc: 'CC-123456', createdAt: '2025-05-20T09:00:00Z' },
  ],
  submitReturn: async (payload: any) => {
    if (mockServiceControl.submitShouldFail) {
      throw new Error('HTTP error')
    }
    return {
      id: `ret-${Date.now()}`,
      productId: payload.productId,
      productName: payload.productId === 'prod-11' ? 'TENS Bifasico Pro' : 'Ultrasonido 3MHz',
      sku: payload.productId === 'prod-11' ? 'CAN-TENS-003' : 'CAN-US-007',
      serialNumber: payload.serialNumber ?? '-',
      quantity: payload.quantity,
      locationCode: 'BOD-02',
      reason: payload.reason,
      productState: payload.productState,
      registeredBy: 'Usuario Test',
      registeredAt: '2025-06-24T10:00:00Z',
      status: 'recorded',
      note: payload.note,
      relatedMovementId: payload.relatedMovementId,
    }
  },
  getSubmitReturnErrorMessage: (_error: unknown, fallback: string) => {
    if (mockServiceControl.submitShouldFail) return 'Error de prueba'
    return fallback
  },
}))

import useAuthStore from '../../store/useAuthStore'
import ReturnsPage from './ReturnsPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/returns']}>
      <ReturnsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockServiceControl.loadShouldFail = false
  mockServiceControl.returnEmptyHistory = false
  mockServiceControl.submitShouldFail = false
  mockUseMocks.current = false
})

beforeAll(() => {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      username: 'almacenista1',
      role: 'almacenista',
      email: 'almacenista@icm.com',
    },
    token: 'fake-token',
    isAuthenticated: true,
  })
})

const waitForForm = () =>
  waitFor(() => {
    expect(screen.getByText('returns.title')).toBeInTheDocument()
  })

describe('ReturnsPage — integración', () => {
  it('debería mostrar el título y subtítulo después de cargar', async () => {
    renderPage()
    await waitForForm()

    expect(screen.getByText('returns.title')).toBeInTheDocument()
    expect(screen.getByText('returns.subtitle')).toBeInTheDocument()
  })

  it('debería mostrar la alerta de política de devoluciones', async () => {
    renderPage()
    await waitForForm()

    expect(screen.getByText('returns.alerts.policyPrefix')).toBeInTheDocument()
  })

  it('debería mostrar el modo backend cuando useMocks es false', async () => {
    renderPage()
    await waitForForm()

    expect(screen.getByText('returns.alerts.backendMode')).toBeInTheDocument()
  })

  it('debería mostrar el botón de refrescar', async () => {
    renderPage()
    await waitForForm()

    expect(screen.getByText('common.actions.refresh')).toBeInTheDocument()
  })

  it('debería mostrar el título del formulario de devolución', async () => {
    renderPage()
    await waitForForm()

    expect(screen.getByText('returns.form.title')).toBeInTheDocument()
  })

  it('debería cargar las ubicaciones en el selector', async () => {
    renderPage()
    await waitForForm()

    await waitFor(() => {
      expect(screen.getByText(/BOD-01 —/)).toBeInTheDocument()
    })
    expect(screen.getByText(/BOD-02 —/)).toBeInTheDocument()
    expect(screen.getByText(/FRIO-01 —/)).toBeInTheDocument()
  })

  it('debería mostrar el input de búsqueda de producto', async () => {
    renderPage()
    await waitForForm()

    const searchInput = screen.getByPlaceholderText(
      'Buscar producto por nombre, SKU o código...',
    )
    expect(searchInput).toBeInTheDocument()
  })

  it('debería permitir buscar productos devolvibles', async () => {
    renderPage()
    await waitForForm()

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(
      'Buscar producto por nombre, SKU o código...',
    )
    await user.type(searchInput, 'TENS')

    await waitFor(() => {
      expect(screen.getByText('TENS Bifasico Pro')).toBeInTheDocument()
    })
  })

  it('debería seleccionar un producto y mostrar la validación', async () => {
    renderPage()
    await waitForForm()

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(
      'Buscar producto por nombre, SKU o código...',
    )
    await user.type(searchInput, 'TENS')

    const productButton = await screen.findByText('TENS Bifasico Pro')
    await user.click(productButton)

    await waitFor(() => {
      expect(screen.getAllByText('TENS Bifasico Pro').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('debería mostrar validación al enviar sin producto seleccionado', async () => {
    renderPage()
    await waitForForm()

    const user = userEvent.setup()
    const submitButton = screen.getByText('returns.form.submit')
    await user.click(submitButton)

    await waitFor(() => {
      const validationMsg = screen.getByText('returns.errors.noProduct')
      expect(validationMsg).toBeInTheDocument()
    })
  })

  it('debería enviar una devolución exitosamente', async () => {
    renderPage()
    await waitForForm()

    const user = userEvent.setup()

    const searchInput = screen.getByPlaceholderText(
      'Buscar producto por nombre, SKU o código...',
    )
    await user.type(searchInput, 'TENS')

    const productButton = await screen.findByText('TENS Bifasico Pro')
    await user.click(productButton)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(
        'Buscar producto por nombre, SKU o código...',
      )).not.toBeInTheDocument()
    })

    const reasonInput = screen.getByPlaceholderText('returns.form.reasonPlaceholder')
    await user.type(reasonInput, 'Producto defectuoso')

    const submitButton = screen.getByText('returns.form.submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('returns.success.saved')).toBeInTheDocument()
    })
  }, 10000)

  it('debería mostrar error al fallar el envío', async () => {
    mockServiceControl.submitShouldFail = true
    renderPage()
    await waitForForm()

    const user = userEvent.setup()

    const searchInput = screen.getByPlaceholderText(
      'Buscar producto por nombre, SKU o código...',
    )
    await user.type(searchInput, 'TENS')

    const productButton = await screen.findByText('TENS Bifasico Pro')
    await user.click(productButton)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(
        'Buscar producto por nombre, SKU o código...',
      )).not.toBeInTheDocument()
    })

    const reasonInput = screen.getByPlaceholderText('returns.form.reasonPlaceholder')
    await user.type(reasonInput, 'Producto defectuoso')

    const submitButton = screen.getByText('returns.form.submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Error de prueba')).toBeInTheDocument()
    })
  }, 10000)

  it('debería cargar y mostrar el historial de devoluciones', async () => {
    renderPage()
    await waitForForm()

    await waitFor(() => {
      expect(screen.getByText('TENS Bifasico Pro — returns.status.recorded')).toBeInTheDocument()
    })
    expect(screen.getByText('Mesa Hidraulica Basica — returns.status.recorded')).toBeInTheDocument()
  })

  it('debería mostrar el título del historial', async () => {
    renderPage()
    await waitForForm()

    expect(screen.getByText('returns.history.title')).toBeInTheDocument()
  })

  it('debería cargar movimientos de salida disponibles', async () => {
    renderPage()
    await waitForForm()

    const movementSearchInput = screen.getByPlaceholderText(
      'Buscar movimiento por SKU, cliente o factura...',
    )
    expect(movementSearchInput).toBeInTheDocument()
  })

  it('debería mostrar historial vacío cuando no hay devoluciones', async () => {
    mockServiceControl.returnEmptyHistory = true
    renderPage()
    await waitForForm()

    await waitFor(() => {
      expect(screen.getByText('returns.history.empty')).toBeInTheDocument()
    })
  })

  it('debería manejar error al cargar el historial', async () => {
    mockServiceControl.loadShouldFail = true
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('returns.errors.load')).toBeInTheDocument()
    })
  })

  it('debería cancelar la selección de producto', async () => {
    renderPage()
    await waitForForm()

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(
      'Buscar producto por nombre, SKU o código...',
    )
    await user.type(searchInput, 'TENS')

    const productButton = await screen.findByText('TENS Bifasico Pro')
    await user.click(productButton)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(
        'Buscar producto por nombre, SKU o código...',
      )).not.toBeInTheDocument()
    })

    const cambiarButton = screen.getByText('Cambiar')
    await user.click(cambiarButton)

    expect(screen.getByPlaceholderText(
      'Buscar producto por nombre, SKU o código...',
    )).toBeInTheDocument()
  })

  it('debería mostrar el nombre del cliente en movimientos de salida', async () => {
    renderPage()
    await waitForForm()

    const user = userEvent.setup()
    const movementSearchInput = screen.getByPlaceholderText(
      'Buscar movimiento por SKU, cliente o factura...',
    )
    await user.type(movementSearchInput, 'Clinica')

    await waitFor(() => {
      expect(screen.getByText('Clinica Del Norte')).toBeInTheDocument()
    })
  })

  it('debería seleccionar un movimiento de salida y cerrar el dropdown', async () => {
    renderPage()
    await waitForForm()

    const user = userEvent.setup()
    const movementSearchInput = screen.getByPlaceholderText(
      'Buscar movimiento por SKU, cliente o factura...',
    )
    await user.type(movementSearchInput, 'Clinica')

    const movButton = (await screen.findByText('Clinica Del Norte')).closest('button')
    expect(movButton).toBeTruthy()
    await user.click(movButton!)

    await waitFor(() => {
      expect(screen.getByText('Cambiar')).toBeInTheDocument()
    })
  })
})

describe('ReturnsPage — devoluciones pendientes con useMocks=true', () => {
  it('debería mostrar el panel de devoluciones pendientes con datos', async () => {
    mockUseMocks.current = true
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('returns.pending.title')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Ultrasonido 3MHz').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Falla al encender')).toBeInTheDocument()
    expect(screen.getAllByText('Con dano visible').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Luis M.')).toBeInTheDocument()
    expect(screen.getByText('returns.pending.approve')).toBeInTheDocument()
    expect(screen.getByText('returns.pending.reject')).toBeInTheDocument()
  })

  it('debería resolver una devolución pendiente al aprobar', async () => {
    mockUseMocks.current = true
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('returns.pending.title')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('returns.pending.approve'))

    await waitFor(() => {
      expect(screen.getByText('returns.success.approved')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.queryByText('returns.pending.approve')).not.toBeInTheDocument()
    })
  }, 10000)
})
