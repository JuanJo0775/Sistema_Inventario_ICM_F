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
import useLocationStore from '../../store/useLocationStore'
import { locationsHandlers, resetLocationsData } from '../../test/mocks/handlers/locations.handlers'
import LocationsPage from './LocationsPage'

const server = setupServer(...locationsHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetLocationsData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  useLocationStore.setState({ locations: [], storageTypes: [], loading: false, error: null })
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
    <MemoryRouter initialEntries={['/app/locations']}>
      <Toaster />
      <LocationsPage />
    </MemoryRouter>,
  )
}

describe('LocationsPage — integración', () => {
  // ── 1. Renderizado inicial ───────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el título y subtítulo', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Bodega')).toBeInTheDocument()
      })
      expect(screen.getByText('Gestiona las ubicaciones de almacenamiento')).toBeInTheDocument()
    })

    it('debería cargar y mostrar las ubicaciones', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })
      expect(screen.getByText('Bodega Consumibles')).toBeInTheDocument()
      expect(screen.getByText('Cuarto Frío')).toBeInTheDocument()
    })

    it('debería mostrar las tarjetas de estadísticas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Ubicaciones Totales')).toBeInTheDocument()
      })
      expect(screen.getByText('Ubicaciones Activas')).toBeInTheDocument()
      expect(screen.getByText('Inactivas / Archivadas')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nueva ubicación', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Nueva Ubicación' })).toBeInTheDocument()
      })
    })

    it('debería mostrar el tipo de almacenamiento en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        const matches = screen.getAllByText('General')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
      const refMatches = screen.getAllByText('Refrigerado')
      expect(refMatches.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── 2. Búsqueda ─────────────────────────────────────────
  describe('Búsqueda', () => {
    it('debería filtrar ubicaciones por nombre', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Buscar ubicaciones...')
      await user.type(searchInput, 'Consumibles')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.queryByText('Bodega Principal')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Bodega Consumibles')).toBeInTheDocument()
    })

    it('debería mostrar mensaje de vacío si no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Buscar ubicaciones...')
      await user.type(searchInput, 'ZZZZ')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.getByText('No se encontraron ubicaciones.')).toBeInTheDocument()
      })
    })

    it('debería limpiar el filtro de búsqueda', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Buscar ubicaciones...')
      await user.type(searchInput, 'Consumibles')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.queryByText('Bodega Principal')).not.toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Limpiar' }))

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Crear ubicación ──────────────────────────────────
  describe('Crear ubicación', () => {
    it('debería abrir el modal de creación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Nueva Ubicación' }))

      await waitFor(() => {
        const matches = screen.getAllByText('Nueva Ubicación')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    })

    it('debería validar nombre obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Nueva Ubicación' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
      })

      const formEl = document.querySelector('form[style*="flex-direction: column"]') as HTMLFormElement
      fireEvent.submit(formEl)

      await waitFor(() => {
        expect(screen.getByText('El nombre de la ubicación es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería crear una ubicación exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Nueva Ubicación' }))

      await waitFor(() => {
        const matches = screen.getAllByText('Nueva Ubicación')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })

      await user.type(screen.getByLabelText('Nombre *'), 'Bodega Nueva Test')
      await user.selectOptions(screen.getByLabelText('Tipo *'), 'st-1')
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/creada correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.getByText('Bodega Nueva Test')).toBeInTheDocument()
    })

    it('debería mostrar el formulario con campos requeridos', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Nueva Ubicación' }))

      await waitFor(() => {
        const matches = screen.getAllByText('Nueva Ubicación')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })

      expect(screen.getByLabelText('Nombre *')).toBeInTheDocument()
      expect(screen.getByLabelText('Tipo *')).toBeInTheDocument()
      expect(screen.getByLabelText(/Capacidad relativa/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument()
    })
  })

  // ── 4. Editar ubicación ─────────────────────────────────
  describe('Editar ubicación', () => {
    it('debería abrir el modal de edición con datos pre-cargados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar ubicación' })
      await user.click(editButtons[0])

      expect(screen.getByText('Editar Ubicación')).toBeInTheDocument()

      const nameInput = screen.getByLabelText('Nombre *') as HTMLInputElement
      expect(nameInput.value).toBe('Bodega Principal')
    })

    it('debería actualizar una ubicación exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar ubicación' })
      await user.click(editButtons[0])

      const nameInput = screen.getByLabelText('Nombre *')
      await user.clear(nameInput)
      await user.type(nameInput, 'Bodega Principal Editada')

      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/actualizada correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.getByText('Bodega Principal Editada')).toBeInTheDocument()
    })
  })

  // ── 5. Desactivar / Activar ubicación ───────────────────
  describe('Desactivar y activar ubicación', () => {
    it('debería abrir el modal de confirmación al desactivar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      expect(screen.getByText('¿Desactivar esta ubicación?')).toBeInTheDocument()
    })

    it('debería desactivar la ubicación al confirmar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await user.click(screen.getByRole('button', { name: 'Confirmar Desactivación' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/desactivada correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería activar una ubicación inactiva', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Bodega Repuestos')).toBeInTheDocument()
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
