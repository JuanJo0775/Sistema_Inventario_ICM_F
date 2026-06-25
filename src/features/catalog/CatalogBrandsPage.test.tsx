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

import useAuthStore from '../../store/useAuthStore'
import useCatalogStore from '../../store/useCatalogStore'
import { catalogHandlers, resetCatalogData } from '../../test/mocks/handlers/catalog.handlers'
import CatalogBrandsPage from './CatalogBrandsPage'

const server = setupServer(...catalogHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetCatalogData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
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
    <MemoryRouter initialEntries={['/app/catalog/brands']}>
      <Toaster />
      <CatalogBrandsPage />
    </MemoryRouter>,
  )
}

describe('CatalogBrandsPage — integración', () => {
  // ── 1. Renderizado inicial ───────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el título y las marcas cargadas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Marcas')).toBeInTheDocument()
      })
      expect(screen.getByText('Gestiona las marcas del catálogo')).toBeInTheDocument()
      expect(screen.getByText('MarcaX')).toBeInTheDocument()
      expect(screen.getByText('MedTech')).toBeInTheDocument()
      expect(screen.getByText('WellnessPro')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nueva marca', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+ Nueva Marca' })).toBeInTheDocument()
      })
    })

    it('debería mostrar las métricas de marcas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Total marcas')).toBeInTheDocument()
      })
    })
  })

  // ── 2. Búsqueda ─────────────────────────────────────────
  describe('Búsqueda', () => {
    it('debería filtrar marcas por nombre', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar marca'), 'Med')

      await waitFor(() => {
        expect(screen.queryByText('MarcaX')).not.toBeInTheDocument()
      })
      expect(screen.getByText('MedTech')).toBeInTheDocument()
    })

    it('debería mostrar mensaje de vacío si no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar marca'), 'ZZZZ')

      await waitFor(() => {
        expect(screen.getByText(/No se encontraron marcas/)).toBeInTheDocument()
      })
    })
  })

  // ── 3. Crear marca ──────────────────────────────────────
  describe('Crear marca', () => {
    it('debería abrir el modal de creación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Marca' }))

      expect(screen.getByText('Crear Marca')).toBeInTheDocument()
    })

    it('debería validar nombre obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Marca' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
      })
      const form = document.getElementById('brand-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('El nombre de la marca es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería crear una marca exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Marca' }))
      await user.type(screen.getByLabelText('Nombre *'), 'Nueva Marca Test')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => {
        expect(screen.getByText('Marca creada correctamente.')).toBeInTheDocument()
      })
      expect(screen.getByText('Nueva Marca Test')).toBeInTheDocument()
    })

    it('debería mostrar error por nombre duplicado', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Marca' }))
      await user.type(screen.getByLabelText('Nombre *'), 'MarcaX')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(screen.getByText('Ya existe una marca con este nombre.')).toBeInTheDocument()
    })
  })

  // ── 4. Editar marca ─────────────────────────────────────
  describe('Editar marca', () => {
    it('debería abrir el modal de edición con datos pre-cargados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      expect(screen.getByText('Editar Marca')).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre *')).toHaveValue('MarcaX')
    })

    it('debería actualizar una marca exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      const nameInput = screen.getByLabelText('Nombre *')
      await user.clear(nameInput)
      await user.type(nameInput, 'MarcaX Pro')

      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => {
        expect(screen.getByText('Marca actualizada correctamente.')).toBeInTheDocument()
      })
      expect(screen.getByText('MarcaX Pro')).toBeInTheDocument()
    })
  })

  // ── 5. Desactivar / Activar marca ───────────────────────
  describe('Desactivar y activar marca', () => {
    it('debería abrir el modal de confirmación al desactivar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      expect(screen.getByText(/¿Está seguro de desactivar esta marca/)).toBeInTheDocument()
    })

    it('debería desactivar la marca al confirmar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('MarcaX')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await user.click(screen.getByRole('button', { name: 'Confirmar Desactivación' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/desactivada correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería activar una marca inactiva', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('WellnessPro')).toBeInTheDocument()
      })

      const activateButtons = screen.getAllByRole('button', { name: 'Activar' })
      const rowButton = activateButtons.find(b => b.closest('tr'))
      await user.click(rowButton!)

      await waitFor(() => {
        const matches = screen.getAllByText(/activada correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
