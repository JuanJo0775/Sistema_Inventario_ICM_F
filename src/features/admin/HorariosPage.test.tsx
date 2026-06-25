import { vi, describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
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

vi.mock('../../components/layout/AppShell', () => ({
  default: ({ title, subtitle, children }: any) => (
    <div>
      <div>{title}</div>
      {subtitle && <div>{subtitle}</div>}
      {children}
    </div>
  ),
}))

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

import HorariosPage from './HorariosPage'

function renderHorariosPage() {
  return render(
    <MemoryRouter>
      <Toaster />
      <HorariosPage />
    </MemoryRouter>,
  )
}

describe('HorariosPage — integración', () => {
  describe('Renderizado inicial', () => {
    it('debería mostrar el título y subtítulo', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('horarios.title')).toBeInTheDocument()
      })
      expect(screen.getByText('horarios.subtitle')).toBeInTheDocument()
    })

    it('debería cargar y mostrar los usuarios en la tabla', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      expect(screen.getByText('Jorge Admin')).toBeInTheDocument()
    })

    it('debería mostrar las tarjetas de métricas', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('horarios.stats.total')).toBeInTheDocument()
      })
      expect(screen.getByText('horarios.stats.withCustom')).toBeInTheDocument()
      expect(screen.getByText('horarios.stats.unrestricted')).toBeInTheDocument()
    })

    it('debería mostrar los badges de rol', async () => {
      renderHorariosPage()
      await waitFor(() => {
        const almacenistaPills = screen.getAllByText('Almacenista')
        expect(almacenistaPills.length).toBeGreaterThanOrEqual(1)
      })
      const auxDespacho = screen.getAllByText('Aux. Despacho')
      expect(auxDespacho.length).toBeGreaterThanOrEqual(1)
      const admin = screen.getAllByText('Administrador')
      expect(admin.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Estado vacío', () => {
    it('debería mostrar mensaje de vacío cuando no hay usuarios', async () => {
      const { http, HttpResponse } = await import('msw')
      server.use(
        http.get('http://localhost:8000/api/v1/auth/users/', () => HttpResponse.json([])),
      )
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('No se encontraron usuarios que coincidan con la búsqueda.')).toBeInTheDocument()
      })
    })
  })

  describe('Filtros', () => {
    it('debería filtrar por búsqueda', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText('horarios.filters.searchPlaceholder')
      await userEvent.type(searchInput, 'María')
      await userEvent.click(screen.getByText('Buscar'))
      await waitFor(() => {
        expect(screen.queryByText('Carlos Almacén')).not.toBeInTheDocument()
      })
      expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
    })

    it('debería mostrar el botón de limpiar filtro', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByPlaceholderText('horarios.filters.searchPlaceholder')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText('horarios.filters.searchPlaceholder')
      await userEvent.type(searchInput, 'María')
      await userEvent.click(screen.getByText('Buscar'))
      await waitFor(() => {
        expect(screen.getByText('Limpiar filtro')).toBeInTheDocument()
      })
    })
  })

  describe('Modal de horarios — Abrir', () => {
    it('debería mostrar botón "Extender horario" para auxiliares activos', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      expect(extendBtns.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar "—" para no auxiliares', async () => {
      renderHorariosPage()
      await waitFor(() => {
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería abrir el modal al hacer clic en "Extender horario"', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
    })
  })

  describe('Modal — Schedule tab', () => {
    it('debería mostrar los campos de horario para un auxiliar', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
      expect(screen.getByText('horarios.modal.schedule.morningStart')).toBeInTheDocument()
      expect(screen.getByText('horarios.modal.schedule.morningEnd')).toBeInTheDocument()
      expect(screen.getByText('horarios.modal.schedule.afternoonStart')).toBeInTheDocument()
      expect(screen.getByText('horarios.modal.schedule.afternoonEnd')).toBeInTheDocument()
      expect(screen.getByText('horarios.modal.schedule.activeLabel')).toBeInTheDocument()
    })

    it('debería mostrar los valores pre-cargados del horario', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
      const mStartInput = screen.getByLabelText('horarios.modal.schedule.morningStart') as HTMLInputElement
      expect(mStartInput.value).toBe('07:00:00')
    })

    it('debería mostrar los botones Guardar y Restablecer para almacenista', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
      expect(screen.getByText('horarios.modal.schedule.saveBtn')).toBeInTheDocument()
      expect(screen.getByText('horarios.modal.schedule.resetBtn')).toBeInTheDocument()
    })
  })

  describe('Modal — Permits tab', () => {
    it('debería cambiar a la pestaña de permisos', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('horarios.modal.tabs.permits'))
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.permits.title')).toBeInTheDocument()
      })
    })

    it('debería mostrar el permiso activo existente', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('horarios.modal.tabs.permits'))
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.permits.active')).toBeInTheDocument()
      })
    })

    it('debería mostrar el botón de nuevo permiso temporal', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('horarios.modal.tabs.permits'))
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.permits.newBtn')).toBeInTheDocument()
      })
    })

    it('debería abrir el formulario de nuevo permiso', async () => {
      renderHorariosPage()
      await waitFor(() => {
        expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
      })
      const extendBtns = screen.getAllByText('horarios.actions.extend')
      await userEvent.click(extendBtns[0])
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.title')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('horarios.modal.tabs.permits'))
      await userEvent.click(await screen.findByText('horarios.modal.permits.newBtn'))
      await waitFor(() => {
        expect(screen.getByText('horarios.modal.permits.startLabel')).toBeInTheDocument()
        expect(screen.getByText('horarios.modal.permits.endLabel')).toBeInTheDocument()
        expect(screen.getByText('horarios.modal.permits.allow247')).toBeInTheDocument()
        expect(screen.getByText(/horarios\.modal\.permits\.reasonLabel/)).toBeInTheDocument()
      })
    })
  })
})
