import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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
import { receptionHandlers, resetReceptionData } from '../../test/mocks/handlers/reception.handlers'
import ReceptionOrderDetailPage from './ReceptionOrderDetailPage'

const server = setupServer(...receptionHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetReceptionData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  useReceptionStore.setState({ pendingOrders: [], completedOrders: [], selectedOrder: null, loading: false, error: null })
})
afterAll(() => server.close())

async function clickConfirmarRecepcion() {
  const btn = screen.getByText('Confirmar Recepción')
  const formEl = btn.closest('form')
  if (formEl) {
    fireEvent.submit(formEl)
  } else {
    await userEvent.click(btn)
  }
}

function renderPage(orderId: string = 'oc-1') {
  return render(
    <MemoryRouter initialEntries={[`/app/reception/${orderId}`]}>
      <Toaster />
      <Routes>
        <Route path="/app/reception/:orderId" element={<ReceptionOrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReceptionOrderDetailPage — integración', () => {
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

  // ── 1. Estados de carga y error ──────────────────────────
  describe('Estados de carga y error', () => {
    it('debería mostrar Cargando... mientras se obtienen los datos', async () => {
      useReceptionStore.setState({
        loading: true,
        selectedOrder: null,
      })
      renderPage()

      expect(screen.getByText('Cargando información de la orden...')).toBeInTheDocument()
    })

    it('debería mostrar error cuando la orden no existe', async () => {
      renderPage('nonexistent-id')

      await waitFor(() => {
        expect(screen.getByText('No se pudo cargar la orden de compra especificada.')).toBeInTheDocument()
      })
      expect(screen.getByText('Volver a la lista')).toBeInTheDocument()
    })
  })

  // ── 2. Renderizado de orden pendiente ────────────────────
  describe('Renderizado de orden pendiente', () => {
    it('debería mostrar el título con el número de orden', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Recepción: OC-2026-0001')).toBeInTheDocument()
      })
    })

    it('debería mostrar el nombre del proveedor', async () => {
      renderPage()

      await waitFor(() => {
        const matches = screen.getAllByText('Medical SAS')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería mostrar el estado Pendiente de recibir', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Pendiente de recibir')).toBeInTheDocument()
      })
    })

    it('debería mostrar las cantidades total esperado y recibido', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/Total esperado/)).toBeInTheDocument()
      })
      expect(screen.getByText(/Total recibido/)).toBeInTheDocument()
    })

    it('debería mostrar el botón Volver a Recepciones', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Volver a Recepciones')).toBeInTheDocument()
      })
    })

    it('debería mostrar los productos en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })
      expect(screen.getByText('EQP-001')).toBeInTheDocument()
      expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
      expect(screen.getByText('INS-001')).toBeInTheDocument()
    })

    it('debería mostrar botón Recibir para productos pendientes', async () => {
      renderPage()

      await waitFor(() => {
        const receiveButtons = screen.getAllByText('Recibir')
        expect(receiveButtons.length).toBe(2)
      })
    })

    it('debería mostrar badge Sin recibir para productos no recibidos', async () => {
      renderPage()

      await waitFor(() => {
        const badges = screen.getAllByText('Sin recibir')
        expect(badges.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 3. Renderizado de orden completada ───────────────────
  describe('Renderizado de orden completada', () => {
    it('debería mostrar estado Completada', async () => {
      renderPage('oc-3')

      await waitFor(() => {
        expect(screen.getByText('Completada')).toBeInTheDocument()
      })
    })

    it('debería mostrar ✓ Recibido para productos completados', async () => {
      renderPage('oc-3')

      await waitFor(() => {
        expect(screen.getByText('✓ Recibido')).toBeInTheDocument()
      })
    })
  })

  // ── 4. Modal: abrir y cerrar ─────────────────────────────
  describe('Modal: abrir y cerrar', () => {
    it('debería abrir modal al hacer clic en Recibir', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })
    })

    it('debería cerrar modal al hacer clic en Cancelar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Cancelar'))

      await waitFor(() => {
        expect(screen.queryByText('Registrar Recepción')).not.toBeInTheDocument()
      })
    })
  })

  // ── 5. Modal: validaciones ───────────────────────────────
  describe('Modal: validaciones', () => {
    it('debería mostrar error si la cantidad es 0', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '0')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches = screen.getAllByText('La cantidad recibida debe ser un número entero mayor que 0.')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería mostrar error si la cantidad excede la pendiente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '999')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches = screen.getAllByText(/No puede recibir más de la cantidad esperada/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 6. Modal: producto con lote y vencimiento ────────────
  describe('Modal: producto con lote y vencimiento', () => {
    it('debería mostrar campos de lote y vencimiento para producto con fecha de vencimiento', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[1])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Lote *')).toBeInTheDocument()
      expect(screen.getByLabelText('Vencimiento *')).toBeInTheDocument()
    })

    it('debería validar lote obligatorio para producto con vencimiento', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[1])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '50')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches = screen.getAllByText(/lote es obligatorio/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería validar vencimiento obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Guantes Quirúrgicos')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[1])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '50')

      const lotInput = screen.getByLabelText('Lote *')
      await user.type(lotInput, 'LOT-001')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches2 = screen.getAllByText('Este producto requiere fecha de vencimiento.')
        expect(matches2.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 7. Modal: producto con serial ────────────────────────
  describe('Modal: producto con serial', () => {
    it('debería mostrar campo de número de serie para electroterapia', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Número de serie *')).toBeInTheDocument()
    })

    it('debería validar serial obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '5')

      const locationSelect = screen.getByLabelText('Ubicación destino *')
      await user.selectOptions(locationSelect, 'loc-bod-01')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches = screen.getAllByText('El número de serie es obligatorio para este producto.')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 8. Modal: discrepancia ───────────────────────────────
  describe('Modal: discrepancia', () => {
    it('debería mostrar campo de nota de discrepancia cuando la cantidad difiere', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '3')

      await waitFor(() => {
        expect(screen.getByText('Diferencia detectada')).toBeInTheDocument()
      })
    })

    it('debería validar nota de discrepancia obligatoria', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '3')

      await waitFor(() => {
        expect(screen.getByText('Diferencia detectada')).toBeInTheDocument()
      })

      const locationSelect = screen.getByLabelText('Ubicación destino *')
      await user.selectOptions(locationSelect, 'loc-bod-01')

      const serialInput = screen.getByLabelText('Número de serie *')
      await user.type(serialInput, 'SN-001')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches = screen.getAllByText(/Debe especificar el motivo/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 9. Modal: ubicación obligatoria ──────────────────────
  describe('Modal: ubicación obligatoria', () => {
    it('debería mostrar error si no se selecciona ubicación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '5')

      const serialInput = screen.getByLabelText('Número de serie *')
      await user.type(serialInput, 'SN-001')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches = screen.getAllByText('Debe seleccionar una ubicación de destino.')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ── 10. Modal: recepción exitosa ─────────────────────────
  describe('Modal: recepción exitosa', () => {
    it('debería registrar recepción correctamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Recibir')[0])

      await waitFor(() => {
        expect(screen.getByText('Registrar Recepción')).toBeInTheDocument()
      })

      const qtyInput = screen.getByLabelText('Cantidad a recibir *')
      await user.clear(qtyInput)
      await user.type(qtyInput, '5')

      const serialInput = screen.getByLabelText('Número de serie *')
      await user.type(serialInput, 'SN-001')

      const locationSelect = screen.getByLabelText('Ubicación destino *')
      await user.selectOptions(locationSelect, 'loc-bod-01')

      await clickConfirmarRecepcion()

      await waitFor(() => {
        const matches = screen.getAllByText(/Se ha registrado la recepción/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    }, 12000)
  })
})
