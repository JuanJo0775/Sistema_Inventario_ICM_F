import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
import { purchasingHandlers, resetPurchasingData } from '../../test/mocks/handlers/purchasing.handlers'
import SupplierDetailPage from './SupplierDetailPage'

const server = setupServer(...purchasingHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetPurchasingData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
})
afterAll(() => server.close())

function renderPage(supplierId: string = 'sup-1') {
  return render(
    <MemoryRouter initialEntries={[`/app/purchasing/suppliers/${supplierId}`]}>
      <Toaster />
      <Routes>
        <Route path="/app/purchasing/suppliers/:id" element={<SupplierDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SupplierDetailPage — integración', () => {
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
    it('debería mostrar el nombre del proveedor en el título', async () => {
      renderPage()

      await waitFor(() => {
        const matches = screen.getAllByText('Medical SAS')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería mostrar la información de contacto del proveedor', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('contacto@medicalsas.co')).toBeInTheDocument()
      })
      expect(screen.getByText('3001234567')).toBeInTheDocument()
      expect(screen.getByText('Colombia / Bogotá')).toBeInTheDocument()
    })

    it('debería mostrar el estado activo', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Activo')).toBeInTheDocument()
      })
    })

    it('debería mostrar el NIT y razón social', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('NIT: 900.123.456-1')).toBeInTheDocument()
      })
      expect(screen.getByText('Medical Colombia SAS')).toBeInTheDocument()
    })

    it('debería mostrar la dirección y observaciones', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Calle 100 # 15-20')).toBeInTheDocument()
      })
      expect(screen.getByText('Proveedor principal de insumos médicos descartables.')).toBeInTheDocument()
    })

    it('debería mostrar el botón de volver a proveedores', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Volver a proveedores/ })).toBeInTheDocument()
      })
    })
  })

  // ── 2. Estados de carga y error ──────────────────────────
  describe('Estados de carga y error', () => {
    it('debería mostrar Cargando... mientras se obtienen los datos', async () => {
      renderPage()

      expect(screen.getByText('Cargando...')).toBeInTheDocument()

      await waitFor(() => {
        const matches = screen.getAllByText('Medical SAS')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería mostrar error cuando el proveedor no existe', async () => {
      renderPage('nonexistent-id')

      await waitFor(() => {
        expect(screen.getByText('El recurso solicitado no existe.')).toBeInTheDocument()
      })
    })
  })
})
