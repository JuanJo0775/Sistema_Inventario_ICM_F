import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'

const tStable = (key: string) => key

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tStable,
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
  }),
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

import { billingHandlers, resetBillingData } from '../../test/mocks/handlers/billing.handlers'
import useAuthStore from '../../store/useAuthStore'
import InvoicesPage from './InvoicesPage'
import InvoiceResultModal from './InvoiceResultModal'

const API_BASE = 'http://localhost:8000/api/v1'

const server = setupServer(...billingHandlers)

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/app/invoices']}>
      {children}
      <Toaster />
    </MemoryRouter>
  )
}

function renderPage() {
  return render(<InvoicesPage />, { wrapper: Wrapper })
}

beforeAll(() => {
  server.listen({
    onUnhandledRequest: (req) => {
      if (req.url.includes('/api/v1/')) {
        console.warn(`Unhandled ${req.method} ${req.url}`)
      }
    },
  })
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

afterEach(() => {
  server.resetHandlers()
  resetBillingData()
})

afterAll(() => {
  server.close()
})

const waitForLoad = () =>
  waitFor(() => {
    expect(screen.getByText('ICM-000001')).toBeInTheDocument()
  })

describe('InvoicesPage — integración', () => {
  it('debería mostrar el título y subtítulo después de cargar', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('Facturas')).toBeInTheDocument()
    expect(screen.getByText('Historial de facturación')).toBeInTheDocument()
  })

  it('debería mostrar las tarjetas de estadísticas', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('Vendido hoy')).toBeInTheDocument()
    expect(screen.getByText('Vendido este mes')).toBeInTheDocument()
    expect(screen.getByText('Facturas hoy')).toBeInTheDocument()
    expect(screen.getByText('Facturas este mes')).toBeInTheDocument()
  })

  it('debería mostrar el formulario de filtros', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('Desde')).toBeInTheDocument()
    expect(screen.getByText('Hasta')).toBeInTheDocument()
    expect(screen.getAllByText('Tipo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByPlaceholderText('N° factura, cliente o NIT...')).toBeInTheDocument()
    expect(screen.getAllByText('Buscar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Limpiar')).toBeInTheDocument()
  })

  it('debería mostrar la tabla con facturas', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('ICM-000001')).toBeInTheDocument()
    expect(screen.getByText('ICM-000002')).toBeInTheDocument()
    expect(screen.getByText('ICM-000003')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Salud Total EPS')).toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
  })

  it('debería mostrar los encabezados de la tabla', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('N° Factura')).toBeInTheDocument()
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Acciones')).toBeInTheDocument()
  })

  it('debería mostrar tipo Menor para retail y Mayor para wholesale', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getAllByText('Menor').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Mayor')).toBeInTheDocument()
  })

  it('debería mostrar estado ANULADA para facturas anuladas', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('ANULADA')).toBeInTheDocument()
  })

  it('debería mostrar estado Activa para facturas activas', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getAllByText('Activa').length).toBeGreaterThanOrEqual(1)
  })

  it('debería mostrar el estado de carga inicialmente', async () => {
    renderPage()

    expect(screen.getByText('Cargando facturas...')).toBeInTheDocument()
  })

  it('debería mostrar mensaje vacío cuando no hay facturas', async () => {
    server.use(
      http.get(`${API_BASE}/billing/invoices/`, () =>
        HttpResponse.json({ results: [], count: 0 }),
      ),
    )
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('No se encontraron facturas')).toBeInTheDocument()
    })
  })

  it('debería mostrar error cuando falla la carga', async () => {
    server.use(
      http.get(`${API_BASE}/billing/invoices/`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('debería abrir el modal de detalle al hacer clic en Ver detalle', async () => {
    renderPage()
    await waitForLoad()

    const detailButtons = screen.getAllByTitle('Ver detalle')
    await userEvent.setup().click(detailButtons[0])

    await waitFor(() => {
      expect(screen.getAllByText('ICM-000001').length).toBeGreaterThanOrEqual(2)
    })
    expect(screen.getByText('Venta minorista')).toBeInTheDocument()
    expect(screen.getByText('Cerrar')).toBeInTheDocument()
    expect(screen.getByText('Reimprimir')).toBeInTheDocument()
  })

  it('debería mostrar el modal de anulación al hacer clic en Anular', async () => {
    renderPage()
    await waitForLoad()

    const anularButtons = screen.getAllByTitle('Anular')
    await userEvent.setup().click(anularButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Anular factura ICM-000001')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('Describe por qué se anula esta factura...')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Sí, anular factura')).toBeInTheDocument()
  })

  it('debería anular una factura exitosamente', async () => {
    renderPage()
    await waitForLoad()

    const anularButtons = screen.getAllByTitle('Anular')
    await userEvent.setup().click(anularButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Anular factura ICM-000001')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const reasonInput = screen.getByPlaceholderText('Describe por qué se anula esta factura...')
    await user.type(reasonInput, 'Error en el cliente')

    const confirmButton = screen.getByText('Sí, anular factura')
    await user.click(confirmButton)

    await waitFor(() => {
      const toast = screen.getByText('Factura ICM-000001 anulada')
      expect(toast).toBeInTheDocument()
    })
  })

  it('debería filtrar por tipo de factura', async () => {
    renderPage()
    await waitForLoad()

    const user = userEvent.setup()
    const typeSelect = screen.getByDisplayValue('Todos')
    await user.selectOptions(typeSelect, 'wholesale')
    const searchButton = screen.getAllByText('Buscar')[1]
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('Salud Total EPS')).toBeInTheDocument()
    })
  })

  it('debería limpiar filtros con el botón Limpiar', async () => {
    renderPage()
    await waitForLoad()

    const user = userEvent.setup()
    const limpiarButton = screen.getByText('Limpiar')
    await user.click(limpiarButton)

    await waitForLoad()
  })

  it('debería mostrar el botón Anular solo en facturas activas', async () => {
    renderPage()
    await waitForLoad()

    const anularButtons = screen.getAllByTitle('Anular')
    expect(anularButtons.length).toBe(2)
  })

  it('debería tener 3 facturas en la lista', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(4)
  })

  it('debería llamar a handlePrint al hacer clic en Reimprimir en el modal', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderPage()
    await waitForLoad()

    const detailButtons = screen.getAllByTitle('Ver detalle')
    await userEvent.setup().click(detailButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Reimprimir')).toBeInTheDocument()
    })

    await userEvent.setup().click(screen.getByText('Reimprimir'))

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })

  it('debería mostrar paginación cuando hay muchas facturas', async () => {
    const manyInvoices = Array.from({ length: 20 }, (_, i) => ({
      id: `inv-many-${i}`,
      number: `ICM-MANY-${String(i + 1).padStart(6, '0')}`,
      invoice_type: 'retail',
      customer_name: `Cliente ${i + 1}`,
      customer_id_number: `${1000000000 + i}`,
      total_amount: 50000 + i * 1000,
      currency: 'COP',
      issued_by_username: 'almacenista1',
      issued_at: new Date().toISOString(),
      is_voided: false,
      item_count: 1,
    }))

    server.use(
      http.get(`${API_BASE}/billing/invoices/`, () =>
        HttpResponse.json({ results: manyInvoices, count: 25 }),
      ),
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('ICM-MANY-000001')).toBeInTheDocument()
    })

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByText('Siguiente'))

    await waitFor(() => {
      expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Anterior'))

    await waitFor(() => {
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    })
  })

  it('debería mostrar alerta de factura anulada en el modal de detalle', async () => {
    renderPage()
    await waitForLoad()

    server.use(
      http.get(`${API_BASE}/billing/invoices/:id/`, () =>
        HttpResponse.json({
          id: 'inv-003',
          number: 'ICM-000003',
          invoice_type: 'retail',
          customer_name: 'María López',
          customer_id_number: '987654321',
          customer_email: 'maria@mail.com',
          customer_phone: '300 333 4455',
          customer_address: 'Calle 10 # 5-30',
          subtotal: 50000,
          discount_total: 0,
          tax_total: 7500,
          total_amount: 57500,
          currency: 'COP',
          pdf: null,
          issued_by: 'user-1',
          issued_by_username: 'auxiliar1',
          issued_at: new Date(Date.now() - 86400000).toISOString(),
          is_voided: true,
          void_reason: 'Error en datos del cliente',
          voided_at: new Date().toISOString(),
          voided_by: 'user-1',
          voided_by_username: 'almacenista1',
          movements_detail: [],
        }),
      ),
    )

    const detailButtons = screen.getAllByTitle('Ver detalle')
    await userEvent.setup().click(detailButtons[2])

    await waitFor(() => {
      expect(screen.getByText(/Factura anulada/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Error en datos del cliente/)).toBeInTheDocument()
  })
})

const retailInvoice = {
  id: 'inv-001',
  number: 'ICM-000001',
  invoice_type: 'retail' as const,
  customer_name: 'Juan Pérez',
  customer_id_number: '1234567890',
  customer_email: 'juan@mail.com',
  customer_phone: '300 111 2233',
  customer_address: 'Cra 25 # 10-20',
  subtotal: 175000,
  discount_total: 0,
  tax_total: 11400,
  total_amount: 186400,
  currency: 'COP',
  pdf: null,
  issued_by: 'user-1',
  issued_by_username: 'almacenista1',
  issued_at: new Date().toISOString(),
  is_voided: false,
  void_reason: '',
  voided_at: null,
  voided_by: null,
  voided_by_username: null,
  movements_detail: [],
}

const wholesaleInvoice = {
  ...retailInvoice,
  id: 'inv-002',
  number: 'ICM-000002',
  invoice_type: 'wholesale' as const,
  customer_name: 'Salud Total EPS',
}

describe('InvoiceResultModal', () => {
  it('debería renderizar modal con factura retail', async () => {
    render(
      <MemoryRouter>
        <InvoiceResultModal invoice={retailInvoice} onClose={vi.fn()} onNewSale={vi.fn()} />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Factura generada — ICM-000001')).toBeInTheDocument()
    })
    const retailMatches = screen.getAllByText((c) => c.includes('Venta minorista'))
    expect(retailMatches.length).toBeGreaterThanOrEqual(1)
  })

  it('debería renderizar modal con factura mayorista', async () => {
    render(
      <MemoryRouter>
        <InvoiceResultModal invoice={wholesaleInvoice} onClose={vi.fn()} onNewSale={vi.fn()} />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Factura generada — ICM-000002')).toBeInTheDocument()
    })
    const mayoristaMatches = screen.getAllByText((c) => c.includes('Venta mayorista'))
    expect(mayoristaMatches.length).toBeGreaterThanOrEqual(1)
  })

  it('debería llamar a onClose al hacer clic en Cerrar', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <InvoiceResultModal invoice={retailInvoice} onClose={onClose} onNewSale={vi.fn()} />
      </MemoryRouter>,
    )
    await userEvent.setup().click(await screen.findByText('Cerrar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('debería llamar a onNewSale al hacer clic en Nueva venta', async () => {
    const onNewSale = vi.fn()
    render(
      <MemoryRouter>
        <InvoiceResultModal invoice={retailInvoice} onClose={vi.fn()} onNewSale={onNewSale} />
      </MemoryRouter>,
    )
    await userEvent.setup().click(await screen.findByText('Nueva venta'))
    expect(onNewSale).toHaveBeenCalled()
  })
})
