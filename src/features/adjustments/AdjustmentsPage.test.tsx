import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'es', language: 'es' },
  }),
}))

vi.mock('../../components/ui/BarcodeScannerButton', () => ({
  BarcodeScannerButton: ({ label, onProductFound }: any) => (
    <button onClick={() => onProductFound({ id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco' })}>
      {label}
    </button>
  ),
}))

vi.mock('../../components/layout/AppShell', () => ({
  default: ({ children, title }: any) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import { adjustmentsHandlers, resetAdjustmentsData } from '../../test/mocks/handlers/adjustments.handlers'
import useAuthStore from '../../store/useAuthStore'
import AdjustmentsPage from './AdjustmentsPage'

const server = setupServer(
  ...catalogHandlers,
  ...adjustmentsHandlers,
)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/adjustments']}>
      <AdjustmentsPage />
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
  resetCatalogData()
  resetAdjustmentsData()
})

afterAll(() => {
  server.close()
})

describe('AdjustmentsPage — integración', () => {
  it('debería mostrar el título después de cargar', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('adjustments.title')).toBeInTheDocument()
    })
  })

  it('debería mostrar el input de búsqueda de producto', async () => {
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Buscar producto por nombre o SKU...'),
      ).toBeInTheDocument()
    })
  })

  it('debería mostrar las ubicaciones en el selector', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Bodega Principal/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Bodega Consumibles/)).toBeInTheDocument()
    expect(screen.getByText(/Cuarto Frío/)).toBeInTheDocument()
  })

  it('debería mostrar el input de cantidad y justificación', async () => {
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByLabelText('adjustments.form.justificationLabel'),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Stock en sistema')).toBeInTheDocument()
  })

  it('debería mostrar los botones de enviar y cancelar', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('adjustments.form.submit')).toBeInTheDocument()
    })
    expect(screen.getByText('adjustments.form.cancel')).toBeInTheDocument()
  })

  it('debería permitir buscar y seleccionar un producto', async () => {
    renderPage()
    const searchInput = await screen.findByPlaceholderText(
      'Buscar producto por nombre o SKU...',
    )

    const user = userEvent.setup()
    await user.type(searchInput, 'Cardiaco')

    await waitFor(() => {
      expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
    })
  })

  it('debería mostrar la sección de historial', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Historial de ajustes')).toBeInTheDocument()
    })
  })

  it('debería mostrar el botón de exportar', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Exportar')).toBeInTheDocument()
    })
  })

  it('debería mostrar delta neutro inicialmente', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Delta: 0/)).toBeInTheDocument()
    })
  })

  it('debería enviar un ajuste sin errores', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('adjustments.title')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    const searchInput = screen.getByPlaceholderText(
      'Buscar producto por nombre o SKU...',
    )
    await user.type(searchInput, 'Cardiaco')
    const productButton = await screen.findByText('Monitor Cardiaco')
    await user.click(productButton)

    const locationSelect = screen.getByLabelText('Ubicación')
    await user.selectOptions(locationSelect, 'loc-bod-01')

    const quantityInput = screen.getByLabelText('Stock real (conteo físico)')
    await user.type(quantityInput, '50')

    const justificationInput = screen.getByLabelText(
      'adjustments.form.justificationLabel',
    )
    await user.type(justificationInput, 'Ajuste de prueba')

    const submitButton = screen.getByText('adjustments.form.submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Delta:\s*\+50/)).toBeInTheDocument()
    })
  }, 10000)
})
