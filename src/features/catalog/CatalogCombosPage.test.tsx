import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

vi.mock('../../components/ui/BarcodeScannerButton', () => ({
  BarcodeScannerButton: ({ label }: { label?: string }) => (
    <button type="button" data-testid="barcode-scanner-btn">{label || 'Escanear'}</button>
  ),
}))

import useAuthStore from '../../store/useAuthStore'
import useCatalogStore from '../../store/useCatalogStore'
import useComboStore from '../../store/useComboStore'
import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import CatalogCombosPage from './CatalogCombosPage'

const server = setupServer(...catalogHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetCatalogData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  useComboStore.setState({ combos: [], loading: false, error: null })
  useCatalogStore.setState({
    products: [],
    categories: [],
    brands: [],
    loading: false,
    error: null,
    productCount: 0,
    productPage: 1,
    productPageSize: 25,
  })
})
afterAll(() => server.close())

beforeAll(() => {
  useAuthStore.setState({
    user: {
      id: '1',
      username: 'admin',
      email: 'admin@icm.com',
      first_name: 'Admin',
      last_name: 'ICM',
      role: 'administrador',
    },
    token: 'fake-token',
    isAuthenticated: true,
  })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/catalog/combos']}>
      <Toaster />
      <CatalogCombosPage />
    </MemoryRouter>,
  )
}

describe('CatalogCombosPage — integración', () => {
  // ── 1. Renderizado inicial ───────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar los combos cargados en tarjetas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })
      expect(screen.getByText('Pack Movilidad Premium')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nuevo combo', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /catalog\.combos\.new/ })).toBeInTheDocument()
      })
    })

    it('debería mostrar SKUs en las tarjetas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('KIT-ELEC-001')).toBeInTheDocument()
      })
      expect(screen.getByText('PKG-MVL-001')).toBeInTheDocument()
    })

    it('debería mostrar la métrica de total de combos', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('catalog.combos.stats.total')).toBeInTheDocument()
      })
    })
  })

  // ── 2. Búsqueda y filtro ─────────────────────────────────
  describe('Búsqueda y filtro', () => {
    it('debería filtrar combos por nombre', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar combo'), 'Pack')

      await waitFor(() => {
        expect(screen.queryByText('Kit Electroterapia Básico')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Pack Movilidad Premium')).toBeInTheDocument()
    })

    it('debería filtrar combos por SKU', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar combo'), 'KIT-ELEC')

      await waitFor(() => {
        expect(screen.queryByText('Pack Movilidad Premium')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
    })

    it('debería mostrar mensaje de vacío si no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar combo'), 'ZZZZ')

      await waitFor(() => {
        expect(screen.getByText('catalog.combos.empty')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Crear combo ───────────────────────────────────────
  describe('Crear combo', () => {
    it('debería abrir el modal de creación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /catalog\.combos\.new/ }))

      await waitFor(() => {
        expect(screen.getByText('catalog.combos.new')).toBeInTheDocument()
      })
    })

    it('debería validar nombre obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /catalog\.combos\.new/ }))

      await waitFor(() => {
        expect(screen.getByText('catalog.combos.new')).toBeInTheDocument()
      })

      const form = document.getElementById('combo-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('El nombre del combo es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería validar que se requieren al menos 2 productos', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /catalog\.combos\.new/ }))

      await waitFor(() => {
        expect(screen.getByText('catalog.combos.new')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('catalog.combos.form.nameLabel'), 'Test Combo')
      await user.type(screen.getByLabelText('catalog.combos.form.skuLabel'), 'TST-001')
      await user.click(screen.getByRole('button', { name: 'catalog.combos.form.save' }))

      expect(screen.getByText('catalog.combos.form.minProducts')).toBeInTheDocument()
    })

    it('debería crear un combo exitosamente con productos', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /catalog\.combos\.new/ }))

      await waitFor(() => {
        expect(screen.getByText('catalog.combos.new')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('catalog.combos.form.nameLabel'), 'Nuevo Combo Test')
      await user.type(screen.getByLabelText('catalog.combos.form.skuLabel'), 'NCT-001')

      // Add first product: Monitor Cardiaco
      const productSearchInput = screen.getByPlaceholderText('catalog.combos.form.searchPlaceholder')
      await user.click(productSearchInput)
      await user.type(productSearchInput, 'Monitor')

      await waitFor(() => {
        expect(screen.getByText('Monitor Cardiaco')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Monitor Cardiaco'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument()
      })

      // Add second product: Silla de Ruedas
      await user.click(productSearchInput)
      await user.clear(productSearchInput)
      await user.type(productSearchInput, 'Silla')

      await waitFor(() => {
        expect(screen.getByText('Silla de Ruedas')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Silla de Ruedas'))

      await waitFor(() => {
        const quantityInputs = screen.getAllByDisplayValue('1')
        expect(quantityInputs.length).toBeGreaterThanOrEqual(2)
      })

      const form = document.getElementById('combo-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        const matches = screen.getAllByText('catalog.combos.messages.created')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    }, 12000)
  })

  // ── 4. Editar combo ──────────────────────────────────────
  describe('Editar combo', () => {
    it('debería abrir el modal de edición al hacer clic en Editar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('catalog.combos.edit')).toBeInTheDocument()
      })
      expect(screen.getByLabelText('catalog.combos.form.nameLabel')).toHaveValue('Kit Electroterapia Básico')
    })
  })

  // ── 5. Duplicar combo ────────────────────────────────────
  describe('Duplicar combo', () => {
    it('debería duplicar un combo exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      const duplicateButtons = screen.getAllByRole('button', { name: 'Duplicar' })
      await user.click(duplicateButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Copia de Kit Electroterapia Básico')).toBeInTheDocument()
      })
    })
  })

  // ── 6. Desactivar / Activar combo ────────────────────────
  describe('Desactivar y activar combo', () => {
    it('debería abrir el modal de confirmación al desactivar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      expect(screen.getByText('catalog.combos.messages.deleteConfirmTitle')).toBeInTheDocument()
    })

    it('debería desactivar el combo al confirmar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Kit Electroterapia Básico')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await user.click(screen.getByRole('button', { name: 'catalog.combos.messages.deleteConfirmAction' }))

      await waitFor(() => {
        const matches = screen.getAllByText('catalog.combos.messages.deleted')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
