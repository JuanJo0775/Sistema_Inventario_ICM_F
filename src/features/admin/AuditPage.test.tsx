import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { Toaster } from 'sonner'

import useAuthStore from '../../store/useAuthStore'
import { adminHandlers, resetAdminData } from '../../test/mocks/handlers/admin.handlers'

const server = setupServer(...adminHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  resetAdminData()
  server.resetHandlers()
})
afterAll(() => server.close())

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      username: 'carlos.almacen',
      email: 'carlos@icm.com',
      first_name: 'Carlos',
      last_name: 'Almacén',
      phone: '3001112233',
      role: 'almacenista',
      is_active: true,
    },
    token: 'fake-token',
    refreshToken: 'fake-refresh',
    isAuthenticated: true,
  })
})

afterEach(() => {
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  resetAdminData()
})

import AuditPage from './AuditPage'

function renderAuditPage() {
  return render(
    <MemoryRouter>
      <Toaster />
      <AuditPage />
    </MemoryRouter>,
  )
}

describe('AuditPage — integración', () => {
  describe('Renderizado inicial', () => {
    it('debería mostrar el título y subtítulo', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByText('Log de auditoría')).toBeInTheDocument()
      })
      expect(screen.getByText('Trazabilidad de movimientos físicos de inventario')).toBeInTheDocument()
    })

    it('debería cargar y mostrar los movimientos en la tabla', async () => {
      renderAuditPage()
      await waitFor(() => {
        const skus = screen.getAllByText('EQP-001')
        expect(skus.length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.getAllByText('INS-001').length).toBeGreaterThanOrEqual(1)
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(2)
    })

    it('debería mostrar las tarjetas de métricas', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByText('Total registros')).toBeInTheDocument()
      })
      expect(screen.getByText('Operarios')).toBeInTheDocument()
      expect(screen.getByText('Tipos de operación')).toBeInTheDocument()
    })

    it('debería mostrar el botón Exportar', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })

    it('debería mostrar los filtros', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por SKU…')).toBeInTheDocument()
      })
      expect(screen.getByText('Filtrar')).toBeInTheDocument()
    })

    it('debería mostrar los tipos de movimiento correctos en los badges', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByText('Entrada')).toBeInTheDocument()
      })
      const badgeLabels = screen.getAllByText(/^(Entrada|Salida|Transferencia|Ajuste -|Recepción)$/)
      expect(badgeLabels.length).toBeGreaterThanOrEqual(5)
    })

    it('debería mostrar el nombre del operario', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getAllByText('Carlos Almacén').length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.getAllByText('María Auxiliar').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Estado vacío', () => {
    it('debería mostrar mensaje de vacío cuando no hay movimientos', async () => {
      const { http, HttpResponse } = await import('msw')
      server.use(
        http.get('http://localhost:8000/api/v1/movements/', () =>
          HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
        ),
      )
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByText('No se encontraron registros de movimientos de auditoría.')).toBeInTheDocument()
      })
    })
  })

  describe('Estado de error', () => {
    it('debería mostrar mensaje de error cuando falla la API', async () => {
      const { http, HttpResponse } = await import('msw')
      server.use(
        http.get('http://localhost:8000/api/v1/movements/', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      )
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('debería cerrar el error al hacer clic en X', async () => {
      const { http, HttpResponse } = await import('msw')
      server.use(
        http.get('http://localhost:8000/api/v1/movements/', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 }),
        ),
      )
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      const alert = screen.getByRole('alert')
      const closeBtns = within(alert).getAllByRole('button')
      expect(closeBtns.length).toBeGreaterThanOrEqual(1)
      await userEvent.click(closeBtns[closeBtns.length - 1])
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Búsqueda y filtros', () => {
    async function applyFilter(sku: string) {
      const skuInput = screen.getByPlaceholderText('Buscar por SKU…') as HTMLInputElement
      await userEvent.clear(skuInput)
      await userEvent.type(skuInput, sku)
      const form = skuInput.closest('form') as HTMLFormElement
      fireEvent.submit(form)
    }

    it('debería filtrar por SKU', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por SKU…')).toBeInTheDocument()
      })
      await applyFilter('EQP-001')
      await waitFor(() => {
        expect(screen.getByText(/Filtros activos/)).toBeInTheDocument()
      })
    })

    it('debería mostrar el botón de limpiar filtros cuando hay filtros activos', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por SKU…')).toBeInTheDocument()
      })
      await applyFilter('EQP-001')
      await waitFor(() => {
        const form = screen.getByPlaceholderText('Buscar por SKU…').closest('form')!
        const buttons = form.querySelectorAll('button')
        expect(buttons.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('debería filtrar por operario', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByText('Todos los operarios')).toBeInTheDocument()
      })
      const operarioSelect = screen.getByText('Todos los operarios').closest('select') as HTMLSelectElement
      await userEvent.selectOptions(operarioSelect, 'user-2')
      const form = operarioSelect.closest('form') as HTMLFormElement
      fireEvent.submit(form)
      await waitFor(() => {
        expect(screen.getByText(/Filtros activos/)).toBeInTheDocument()
      })
    })

    it('debería limpiar los filtros', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por SKU…')).toBeInTheDocument()
      })
      await applyFilter('EQP-001')
      await waitFor(() => {
        expect(screen.getByText(/Filtros activos/)).toBeInTheDocument()
      })
      const form = screen.getByPlaceholderText('Buscar por SKU…').closest('form')!
      const clearBtn = form.querySelector('button[type="button"]')
      expect(clearBtn).toBeInTheDocument()
      await userEvent.click(clearBtn!)
      await waitFor(() => {
        expect(screen.queryByText(/Filtros activos/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Exportar', () => {
    it('debería abrir el dropdown de exportación', async () => {
      renderAuditPage()
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Exportar'))
      await waitFor(() => {
        expect(screen.getByText('📊 Descargar CSV')).toBeInTheDocument()
      })
      expect(screen.getByText('📈 Descargar Excel')).toBeInTheDocument()
      expect(screen.getByText('📄 Descargar PDF')).toBeInTheDocument()
    })
  })
})
