import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Suspense } from 'react'
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

import { dashboardHandlers } from '../../test/mocks/handlers/dashboard.handlers'
import useAuthStore from '../../store/useAuthStore'
import DashboardPage from './DashboardPage'
// Preload module so React.lazy resolves immediately
import '../../features/dashboard/DashboardCharts'

const API_BASE = 'http://localhost:8000/api/v1'

const server = setupServer(...dashboardHandlers)

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/app']}>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        {children}
      </Suspense>
    </MemoryRouter>
  )
}

function renderPage() {
  return render(<DashboardPage />, { wrapper: Wrapper })
}

beforeAll(() => {
  server.listen({
    onUnhandledRequest: (req) => {
      if (req.url.includes('/api/v1/')) {
        console.warn(`Unhandled ${req.method} ${req.url}`)
      }
    },
  })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

const waitForTitle = () =>
  waitFor(() => {
    expect(screen.getByText('dashboard.topbar.title')).toBeInTheDocument()
  })

describe('DashboardPage — integración', () => {
  describe('con rol almacenista', () => {
    beforeAll(() => {
      useAuthStore.setState({
        user: { id: 'user-1', username: 'almacenista1', role: 'almacenista', email: 'a@icm.com' },
        token: 'fake-token',
        isAuthenticated: true,
      })
    })

    it('debería mostrar el estado de carga inicialmente', async () => {
      renderPage()

      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })

    it('debería mostrar el título y subtítulo después de cargar', async () => {
      renderPage()

      await waitForTitle()
      expect(screen.getByText('dashboard.topbar.dateLine')).toBeInTheDocument()
    })

    it('debería mostrar la barra de resumen de alertas', async () => {
      renderPage()
      await waitForTitle()

      const alertBar = screen.getByRole('alert')
      expect(alertBar.textContent).toContain('dashboard.alerts.activeCount')
      expect(alertBar.textContent).toContain('dashboard.alerts.reorder')
      expect(alertBar.textContent).toContain('dashboard.alerts.expiring')
      expect(alertBar.textContent).toContain('dashboard.alerts.returns')
    })

    it('debería mostrar las tarjetas de KPI', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getAllByText('dashboard.visualKpis.rotacion.shortTitle').length).toBeGreaterThanOrEqual(1)
      })

      expect(screen.getAllByText('dashboard.visualKpis.danados.shortTitle').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('dashboard.visualKpis.utilizacion.shortTitle').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('dashboard.visualKpis.otif.shortTitle').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('dashboard.visualKpis.descarte.shortTitle').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('dashboard.visualKpis.devoluciones.shortTitle').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('dashboard.visualKpis.cadena_frio.shortTitle').length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar los badges de estado de los KPI', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getAllByText('dashboard.visualKpis.rotacion.statusLabel').length).toBeGreaterThanOrEqual(1)
      })

      expect(screen.getAllByText('dashboard.visualKpis.utilizacion.statusLabel').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('dashboard.visualKpis.devoluciones.statusLabel').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('dashboard.visualKpis.cadena_frio.statusLabel').length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar el KPI de enfoque con gráfico', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('dashboard.visualKpis.rotacion.title')).toBeInTheDocument()
      })

      const noData = screen.getAllByText('dashboard.chartLabels.noData')
      expect(noData.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar movimientos recientes', async () => {
      renderPage()
      await waitForTitle()

      expect(screen.getAllByText('dashboard.sections.recentMovements').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Entrada - Agujas Punción Seca 0.25mm')).toBeInTheDocument()
    })

    it('debería tener el botón de alertas en las acciones', async () => {
      renderPage()
      await waitForTitle()

      expect(screen.getByText('dashboard.topbar.alertsButton')).toBeInTheDocument()
    })

    it('debería tener el botón de personalizar KPI', async () => {
      renderPage()
      await waitForTitle()

      expect(screen.getByText('dashboard.topbar.customizeKpis')).toBeInTheDocument()
    })
  })

  describe('con rol administrador (solo lectura)', () => {
    beforeAll(() => {
      useAuthStore.setState({
        user: { id: 'user-2', username: 'admin1', role: 'administrador', email: 'admin@icm.com' },
        token: 'fake-token',
        isAuthenticated: true,
      })
    })

    it('debería mostrar el banner de solo lectura', async () => {
      renderPage()
      await waitForTitle()

      expect(screen.getByText('dashboard.readOnlyMessage')).toBeInTheDocument()
    })
  })

  describe('con error en la carga', () => {
    beforeAll(() => {
      useAuthStore.setState({
        user: { id: 'user-1', username: 'almacenista1', role: 'almacenista', email: 'a@icm.com' },
        token: 'fake-token',
        isAuthenticated: true,
      })
    })

    it('debería mostrar mensaje de error cuando falla la API', async () => {
      server.use(
        http.get(`${API_BASE}/dashboard/overview/`, () =>
          HttpResponse.json({}, { status: 500 }),
        ),
      )
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('dashboard.errors.load')).toBeInTheDocument()
      })
    })
  })

  describe('movimientos en la lista', () => {
    beforeAll(() => {
      useAuthStore.setState({
        user: { id: 'user-1', username: 'almacenista1', role: 'almacenista', email: 'a@icm.com' },
        token: 'fake-token',
        isAuthenticated: true,
      })
    })

    it('debería mostrar múltiples movimientos en la lista', async () => {
      renderPage()
      await waitForTitle()

      expect(screen.getByText('Entrada - Agujas Punción Seca 0.25mm')).toBeInTheDocument()
      expect(screen.getByText('Salida Mayor - TENS Bifásico Pro')).toBeInTheDocument()
      expect(screen.getByText('Traslado - Gel Conductor 250ml')).toBeInTheDocument()
      expect(screen.getByText('Salida Menor - Pelota Gel Ovalada')).toBeInTheDocument()
    })
  })
})
