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
import CatalogCategoriesPage from './CatalogCategoriesPage'

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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/catalog/categories']}>
      <Toaster />
      <CatalogCategoriesPage />
    </MemoryRouter>,
  )
}

describe('CatalogCategoriesPage — integración', () => {
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

  // ── 1. Renderizado inicial ───────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el título, subtítulo y la métrica de total', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Categorías')).toBeInTheDocument()
      })
      expect(screen.getByText('Organiza los productos por familia')).toBeInTheDocument()
      expect(screen.getByText('Total categorías')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nueva categoría', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+ Nueva Categoría' })).toBeInTheDocument()
      })
    })

    it('debería cargar y mostrar las categorías en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })
      expect(screen.getByText('Movilidad')).toBeInTheDocument()
      expect(screen.getByText('Insumos')).toBeInTheDocument()
    })

    it('debería mostrar la métrica de categorías activas e inactivas', async () => {
      renderPage()

      await waitFor(() => {
        const activas = screen.getAllByText('2')
        expect(activas.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería mostrar enlace de ver detalle para cada categoría', async () => {
      renderPage()

      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: 'Ver detalle' })
        expect(links.length).toBe(3)
        expect(links[0]).toHaveAttribute('href', '/app/catalog/categories/cat-1')
      })
    })
  })

  // ── 2. Búsqueda y filtro ─────────────────────────────────
  describe('Búsqueda y filtro', () => {
    it('debería filtrar categorías por nombre', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar categoría'), 'Movilidad')

      await waitFor(() => {
        expect(screen.queryByText('Electroterapia')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Movilidad')).toBeInTheDocument()
    })

    it('debería mostrar mensaje de vacío si no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      const searchInput = screen.getByLabelText('Buscar categoría')
      await user.type(searchInput, 'Categoría que no existe')

      await waitFor(() => {
        expect(screen.getByText(/No se encontraron categorías/)).toBeInTheDocument()
      })
    })

    it('debería limpiar el filtro al hacer clic en Limpiar filtro', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar categoría'), 'Movilidad')

      await waitFor(() => {
        expect(screen.queryByText('Electroterapia')).not.toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Limpiar filtro' }))

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })
      expect(screen.getByText('Movilidad')).toBeInTheDocument()
    })
  })

  // ── 3. Crear categoría ───────────────────────────────────
  describe('Crear categoría', () => {
    it('debería abrir el modal de creación al hacer clic en Nueva Categoría', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Categoría' }))

      expect(screen.getByText('Crear Categoría')).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre *')).toHaveValue('')
    })

    it('debería validar que el nombre es obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Categoría' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
      })
      const form = document.getElementById('cat-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('El nombre de la categoría es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería crear una categoría exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Categoría' }))

      await user.type(screen.getByLabelText('Nombre *'), 'Nueva Categoría Test')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => {
        expect(screen.getByText('Categoría creada correctamente.')).toBeInTheDocument()
      })
      expect(screen.getByText('Nueva Categoría Test')).toBeInTheDocument()
    })

    it('debería mostrar error por nombre duplicado', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Categoría' }))

      await user.type(screen.getByLabelText('Nombre *'), 'Electroterapia')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(screen.getByText('Ya existe una categoría con este nombre.')).toBeInTheDocument()
    })
  })

  // ── 4. Editar categoría ──────────────────────────────────
  describe('Editar categoría', () => {
    it('debería abrir el modal de edición con datos pre-cargados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      expect(screen.getByText('Editar Categoría')).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre *')).toHaveValue('Electroterapia')
    })

    it('debería actualizar una categoría exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      const nameInput = screen.getByLabelText('Nombre *')
      await user.clear(nameInput)
      await user.type(nameInput, 'Electroterapia Avanzada')

      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => {
        expect(screen.getByText('Categoría actualizada correctamente.')).toBeInTheDocument()
      })
      expect(screen.getByText('Electroterapia Avanzada')).toBeInTheDocument()
    })
  })

  // ── 5. Desactivar / Activar categoría ────────────────────
  describe('Desactivar y activar categoría', () => {
    it('debería abrir el modal de confirmación al hacer clic en Desactivar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      expect(screen.getByText(/¿Está seguro de desactivar esta categoría/)).toBeInTheDocument()
    })

    it('debería desactivar la categoría al confirmar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await user.click(screen.getByRole('button', { name: 'Confirmar Desactivación' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/desactivada correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería activar una categoría inactiva', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Insumos')).toBeInTheDocument()
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

  // ── 6. Cerrar modales ────────────────────────────────────
  describe('Cerrar modales', () => {
    it('debería cerrar el modal de creación al hacer clic en Cancelar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nueva Categoría' }))
      expect(screen.getByText('Crear Categoría')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => {
        expect(screen.queryByText('Crear Categoría')).not.toBeInTheDocument()
      })
    })

    it('debería cerrar el modal de desactivación al hacer clic en Cancelar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Electroterapia')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])
      expect(screen.getByText(/¿Está seguro/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => {
        expect(screen.queryByText(/¿Está seguro/)).not.toBeInTheDocument()
      })
    })
  })
})
