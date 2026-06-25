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
import CompanyConfigPage from './CompanyConfigPage'

const API_BASE = 'http://localhost:8000/api/v1'

const server = setupServer(...billingHandlers)

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/app/admin/company']}>
      {children}
      <Toaster />
    </MemoryRouter>
  )
}

function renderPage() {
  return render(<CompanyConfigPage />, { wrapper: Wrapper })
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
      username: 'admin1',
      role: 'administrador',
      email: 'admin@icm.com',
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
    expect(screen.getByDisplayValue('Import Corporal Medical S.A.S')).toBeInTheDocument()
  })

describe('CompanyConfigPage — integración', () => {
  it('debería mostrar el estado de carga inicialmente', async () => {
    renderPage()

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('debería mostrar el título y subtítulo después de cargar', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('Datos de empresa')).toBeInTheDocument()
    expect(screen.getByText('Configuración del emisor en facturas')).toBeInTheDocument()
  })

  it('debería cargar los datos de la empresa en el formulario', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByDisplayValue('Import Corporal Medical S.A.S')).toBeInTheDocument()
    expect(screen.getByDisplayValue('900.123.456-7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('300 123 4567')).toBeInTheDocument()
    expect(screen.getByDisplayValue('info@importcorporal.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ICM')).toBeInTheDocument()
    expect(screen.getByDisplayValue('¡Gracias por su compra!')).toBeInTheDocument()
  })

  it('debería mostrar las secciones del formulario', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('Información de la empresa')).toBeInTheDocument()
    expect(screen.getByText('Facturación')).toBeInTheDocument()
  })

  it('debería tener el botón Guardar en las acciones y en el pie', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('Guardar')).toBeInTheDocument()
    expect(screen.getByText('Guardar cambios')).toBeInTheDocument()
  })

  it('debería mostrar los labels del formulario', async () => {
    renderPage()
    await waitForLoad()

    expect(screen.getByText('Razón social')).toBeInTheDocument()
    expect(screen.getByText('NIT')).toBeInTheDocument()
    expect(screen.getByText('Dirección')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Serie de facturación')).toBeInTheDocument()
    expect(screen.getByText('Resolución DIAN')).toBeInTheDocument()
    expect(screen.getByText('Rango desde')).toBeInTheDocument()
    expect(screen.getByText('Rango hasta')).toBeInTheDocument()
    expect(screen.getByText('Pie de factura')).toBeInTheDocument()
  })

  it('debería guardar los cambios exitosamente', async () => {
    renderPage()
    await waitForLoad()

    const user = userEvent.setup()
    const saveButton = screen.getByText('Guardar cambios')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Datos de empresa actualizados')).toBeInTheDocument()
    })
  })

  it('debería mostrar error al fallar la carga', async () => {
    server.use(
      http.get(`${API_BASE}/billing/config/company/`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('debería mostrar error al fallar el guardado', async () => {
    server.use(
      http.put(`${API_BASE}/billing/config/company/`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    renderPage()
    await waitForLoad()

    const user = userEvent.setup()
    const saveButton = screen.getByText('Guardar cambios')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('debería permitir editar un campo antes de guardar', async () => {
    renderPage()
    await waitForLoad()

    const user = userEvent.setup()
    const razonSocial = screen.getByDisplayValue('Import Corporal Medical S.A.S')
    await user.clear(razonSocial)
    await user.type(razonSocial, 'Nueva Razón Social')

    expect(screen.getByDisplayValue('Nueva Razón Social')).toBeInTheDocument()
  })

  it('debería tener campo de tipo email', async () => {
    renderPage()
    await waitForLoad()

    const emailInput = screen.getByDisplayValue('info@importcorporal.com')
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('debería permitir editar todos los campos del formulario', async () => {
    renderPage()
    await waitForLoad()

    const user = userEvent.setup()

    const nitInput = screen.getByDisplayValue('900.123.456-7')
    await user.clear(nitInput)
    await user.type(nitInput, '900.999.888-7')

    const addressInput = screen.getByDisplayValue('Calle 15 # 20-30, Armenia, Quindío')
    await user.clear(addressInput)
    await user.type(addressInput, 'Carrera 20 # 10-5')

    const phoneInput = screen.getByDisplayValue('300 123 4567')
    await user.clear(phoneInput)
    await user.type(phoneInput, '310 987 6543')

    const emailInput = screen.getByDisplayValue('info@importcorporal.com')
    await user.clear(emailInput)
    await user.type(emailInput, 'nuevo@importcorporal.com')

    const serieInput = screen.getByDisplayValue('ICM')
    await user.clear(serieInput)
    await user.type(serieInput, 'NUE')

    const dianInput = screen.getByDisplayValue(/Resolución DIAN/)
    await user.clear(dianInput)
    await user.type(dianInput, 'Resolución Nueva')

    const footerInput = screen.getByDisplayValue('¡Gracias por su compra!')
    await user.clear(footerInput)
    await user.type(footerInput, 'Gracias!')

    expect(screen.getByDisplayValue('900.999.888-7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('310 987 6543')).toBeInTheDocument()
    expect(screen.getByDisplayValue('nuevo@importcorporal.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('NUE')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Gracias!')).toBeInTheDocument()
  })
})
