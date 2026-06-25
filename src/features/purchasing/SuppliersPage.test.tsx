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
import useSupplierStore from '../../store/useSupplierStore'
import { purchasingHandlers, resetPurchasingData } from '../../test/mocks/handlers/purchasing.handlers'
import { SuppliersPage } from './SuppliersPage'

const server = setupServer(...purchasingHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetPurchasingData()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  useSupplierStore.setState({ suppliers: [], selectedSupplier: null, loading: false, error: null })
})
afterAll(() => server.close())

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/purchasing/suppliers']}>
      <Toaster />
      <SuppliersPage />
    </MemoryRouter>,
  )
}

describe('SuppliersPage — integración', () => {
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
    it('debería mostrar el título, subtítulo y métricas', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Proveedores')).toBeInTheDocument()
      })
      expect(screen.getByText('Administra los proveedores del sistema')).toBeInTheDocument()
      expect(screen.getByText('Total proveedores')).toBeInTheDocument()
      const activos = screen.getAllByText('Activos')
      expect(activos.length).toBeGreaterThanOrEqual(1)
      const inactivos = screen.getAllByText('Inactivos')
      expect(inactivos.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar el botón de nuevo proveedor', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+ Nuevo Proveedor' })).toBeInTheDocument()
      })
    })

    it('debería cargar y mostrar los proveedores en la tabla', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })
      expect(screen.getByText('China Medical Ltd')).toBeInTheDocument()
      expect(screen.getByText('Distribuidora Local')).toBeInTheDocument()
    })

    it('debería mostrar los indicadores de estado activo/inactivo', async () => {
      renderPage()

      await waitFor(() => {
        const pills = screen.getAllByText('Activo')
        expect(pills.length).toBe(2)
      })
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  // ── 2. Búsqueda y filtro ─────────────────────────────────
  describe('Búsqueda y filtro', () => {
    it('debería filtrar proveedores por nombre al enviar búsqueda', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      const searchInput = screen.getByLabelText('Buscar proveedor')
      await user.type(searchInput, 'Distribuidora')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.queryByText('Medical SAS')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Distribuidora Local')).toBeInTheDocument()
    })

    it('debería filtrar proveedores por país', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar proveedor'), 'China')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.queryByText('Medical SAS')).not.toBeInTheDocument()
      })
      expect(screen.getByText('China Medical Ltd')).toBeInTheDocument()
    })

    it('debería filtrar por estado activo', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'active')

      expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      expect(screen.getByText('Distribuidora Local')).toBeInTheDocument()
      expect(screen.queryByText('China Medical Ltd')).not.toBeInTheDocument()
    })

    it('debería filtrar por estado inactivo', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('China Medical Ltd')).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'inactive')

      expect(screen.getByText('China Medical Ltd')).toBeInTheDocument()
      expect(screen.queryByText('Medical SAS')).not.toBeInTheDocument()
    })

    it('debería mostrar mensaje de vacío si no hay resultados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar proveedor'), 'ZZZZ')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.getByText(/No se encontraron proveedores/)).toBeInTheDocument()
      })
    })

    it('debería limpiar el filtro al hacer clic en Limpiar filtro', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Buscar proveedor'), 'China')
      await user.click(screen.getByRole('button', { name: 'Buscar' }))

      await waitFor(() => {
        expect(screen.queryByText('Medical SAS')).not.toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Limpiar filtro' }))

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })
    })
  })

  // ── 3. Crear proveedor ───────────────────────────────────
  describe('Crear proveedor', () => {
    it('debería abrir el modal de creación', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nuevo Proveedor' }))

      await waitFor(() => {
        expect(screen.getByText('Crear Proveedor')).toBeInTheDocument()
      })
    })

    it('debería validar nombre obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nuevo Proveedor' }))

      await waitFor(() => {
        expect(screen.getByText('Crear Proveedor')).toBeInTheDocument()
      })

      const form = document.getElementById('supplier-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('El nombre del proveedor es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería validar teléfono obligatorio', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nuevo Proveedor' }))

      await waitFor(() => {
        expect(screen.getByText('Crear Proveedor')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Nombre del proveedor *'), 'Test Proveedor')

      const form = document.getElementById('supplier-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('El teléfono es obligatorio.')).toBeInTheDocument()
      })
    })

    it('debería validar correo electrónico obligatorio y formato válido', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nuevo Proveedor' }))

      await waitFor(() => {
        expect(screen.getByText('Crear Proveedor')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Nombre del proveedor *'), 'Test Proveedor')
      await user.type(screen.getByLabelText('Teléfono *'), '3001234567')

      const form = document.getElementById('supplier-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('El correo electrónico es obligatorio.')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Correo electrónico *'), 'correo-invalido')

      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Por favor ingrese un correo electrónico válido.')).toBeInTheDocument()
      })
    })

    it('debería validar país y ciudad obligatorios', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nuevo Proveedor' }))

      await waitFor(() => {
        expect(screen.getByText('Crear Proveedor')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Nombre del proveedor *'), 'Test Proveedor')
      await user.type(screen.getByLabelText('Teléfono *'), '3001234567')
      await user.type(screen.getByLabelText('Correo electrónico *'), 'test@proveedor.com')

      const form = document.getElementById('supplier-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('El país es obligatorio.')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('País *'), 'Colombia')

      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('La ciudad es obligatoria.')).toBeInTheDocument()
      })
    })

    it('debería crear un proveedor exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nuevo Proveedor' }))

      await waitFor(() => {
        expect(screen.getByText('Crear Proveedor')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Nombre del proveedor *'), 'Nuevo Proveedor Test')
      await user.type(screen.getByLabelText('Teléfono *'), '3207654321')
      await user.type(screen.getByLabelText('Correo electrónico *'), 'nuevo@test.com')
      await user.type(screen.getByLabelText('País *'), 'Colombia')
      await user.type(screen.getByLabelText('Ciudad *'), 'Cali')

      const form = document.getElementById('supplier-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Proveedor creado correctamente.')).toBeInTheDocument()
      })
      expect(screen.getByText('Nuevo Proveedor Test')).toBeInTheDocument()
    })
  })

  // ── 4. Editar proveedor ──────────────────────────────────
  describe('Editar proveedor', () => {
    it('debería abrir el modal de edición con datos pre-cargados', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Editar Proveedor')).toBeInTheDocument()
      })
      expect(screen.getByLabelText('Nombre del proveedor *')).toHaveValue('Medical SAS')
      expect(screen.getByLabelText('Teléfono *')).toHaveValue('3001234567')
      expect(screen.getByLabelText('Correo electrónico *')).toHaveValue('contacto@medicalsas.co')
      expect(screen.getByLabelText('País *')).toHaveValue('Colombia')
      expect(screen.getByLabelText('Ciudad *')).toHaveValue('Bogotá')
    })

    it('debería actualizar un proveedor exitosamente', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: 'Editar' })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Editar Proveedor')).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText('Nombre del proveedor *')
      await user.clear(nameInput)
      await user.type(nameInput, 'Medical SAS Actualizada')

      const form = document.getElementById('supplier-form') as HTMLFormElement
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Proveedor actualizado correctamente.')).toBeInTheDocument()
      })
      expect(screen.getByText('Medical SAS Actualizada')).toBeInTheDocument()
    })
  })

  // ── 5. Desactivar / Activar proveedor ────────────────────
  describe('Desactivar y activar proveedor', () => {
    it('debería abrir el modal de confirmación al desactivar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Desactivar proveedor')).toBeInTheDocument()
      })
      expect(screen.getByText(/¿Estás seguro de que deseas desactivar/)).toBeInTheDocument()
    })

    it('debería desactivar el proveedor al confirmar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Desactivar proveedor')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Sí, desactivar' }))

      await waitFor(() => {
        const matches = screen.getAllByText(/desactivado correctamente/)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería activar un proveedor inactivo', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('China Medical Ltd')).toBeInTheDocument()
      })

      const activateButtons = screen.getAllByRole('button', { name: 'Activar' })
      const rowButton = activateButtons.find(b => b.closest('tr'))
      await user.click(rowButton!)

      await waitFor(() => {
        const matches = screen.getAllByText(/activado correctamente/)
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
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '+ Nuevo Proveedor' }))

      await waitFor(() => {
        expect(screen.getByText('Crear Proveedor')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => {
        expect(screen.queryByText('Crear Proveedor')).not.toBeInTheDocument()
      })
    })

    it('debería cerrar el modal de desactivación al hacer clic en Cancelar', async () => {
      renderPage()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Medical SAS')).toBeInTheDocument()
      })

      const deactivateButtons = screen.getAllByRole('button', { name: 'Desactivar' })
      await user.click(deactivateButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Desactivar proveedor')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => {
        expect(screen.queryByText('Desactivar proveedor')).not.toBeInTheDocument()
      })
    })
  })
})
