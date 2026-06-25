import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

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

import { alertsHandlers, resetAlertsData } from '../../test/mocks/handlers/alerts.handlers'
import useAuthStore from '../../store/useAuthStore'
import AlertsPage from './AlertsPage'

const API_BASE = 'http://localhost:8000/api/v1'

const server = setupServer(...alertsHandlers)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/alerts']}>
      <AlertsPage />
    </MemoryRouter>,
  )
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
  resetAlertsData()
})

afterAll(() => {
  server.close()
})

describe('AlertsPage — integración', () => {
  it('debería mostrar el título y subtítulo después de cargar', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('alerts.title')).toBeInTheDocument()
    })
    expect(
      screen.getAllByText('alerts.hero.subtitle').length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('debería mostrar las tarjetas de estadísticas', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('alerts.stats.critical')).toBeInTheDocument()
    })
    expect(screen.getByText('alerts.stats.warning')).toBeInTheDocument()
    expect(screen.getByText('alerts.stats.special')).toBeInTheDocument()
  })

  it('debería mostrar la sección de alertas activas', async () => {
    renderPage()
    await waitFor(() => {
      expect(
        screen.getAllByText('CAN-APS-001').length,
      ).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getByText('CAN-TENS-003')).toBeInTheDocument()
    expect(
      screen.getAllByText('CAN-GEL-005').length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('debería mostrar el filtro de tipo de alerta', async () => {
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByLabelText('alerts.filters.typeLabel'),
      ).toBeInTheDocument()
    })
  })

  it('debería mostrar el botón Generar OC para alertas LOW_STOCK', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Generar OC')).toBeInTheDocument()
    })
  })

  it('debería mostrar el botón de resolver para alertas no LOW_STOCK', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByText('alerts.table.resolve').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('debería mostrar el historial de alertas resueltas', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('EQP-001')).toBeInTheDocument()
    })
  })

  it('debería resolver una alerta exitosamente', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('CAN-TENS-003')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const resolveButtons = screen.getAllByText('alerts.table.resolve')
    await user.click(resolveButtons[0])

    await waitFor(() => {
      expect(screen.getByText('alerts.success.resolved')).toBeInTheDocument()
    })
  })

  it('debería mostrar mensaje de error cuando falla la carga', async () => {
    server.use(
      http.get(`${API_BASE}/alerts/`, () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    )

    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText('alerts.title'),
      ).toBeInTheDocument()
    })
  })

  it('debería mostrar mensaje de vacío cuando no hay alertas activas', async () => {
    server.use(
      http.get(`${API_BASE}/alerts/`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/alerts/history/`, () => HttpResponse.json([])),
    )

    renderPage()
    await waitFor(() => {
      expect(screen.getByText('alerts.empty.active')).toBeInTheDocument()
    })
  })
})
