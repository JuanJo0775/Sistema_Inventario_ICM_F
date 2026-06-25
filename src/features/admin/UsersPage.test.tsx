import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
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
import { adminHandlers, resetAdminData } from '../../test/mocks/handlers/admin.handlers'

const server = setupServer(...adminHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  resetAdminData()
  server.resetHandlers()
})
afterAll(() => server.close())

beforeAll(() => {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      username: 'carlos.almacen',
      email: 'carlos@icm.com',
      first_name: 'Carlos',
      last_name: 'Almacén',
      phone: '3001112233',
      role: 'almacenista',
      is_active: true,
    },
    token: 'fake-token',
    refreshToken: 'fake-refresh',
    isAuthenticated: true,
  })
})

afterEach(() => {
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  resetAdminData()
})

import { UsersPage } from './UsersPage'

function renderUsersPage() {
  return render(
    <MemoryRouter>
      <Toaster />
      <UsersPage />
    </MemoryRouter>,
  )
}

describe('UsersPage — integración', () => {
  describe('Renderizado inicial', () => {
    it('debería mostrar el título y subtítulo', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('users.title')).toBeInTheDocument()
      })
      expect(screen.getByText('users.subtitle')).toBeInTheDocument()
    })

    it('debería cargar y mostrar los usuarios en la tabla', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      expect(screen.getByText('@maria.auxiliar')).toBeInTheDocument()
      expect(screen.getByText('@admin.jorge')).toBeInTheDocument()
    })

    it('debería mostrar las tarjetas de métricas', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('users.stats.total')).toBeInTheDocument()
      })
      expect(screen.getByText('users.stats.active')).toBeInTheDocument()
      expect(screen.getByText('users.stats.inactive')).toBeInTheDocument()
    })

    it('debería mostrar el botón de nuevo usuario', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('users.createBtn')).toBeInTheDocument()
      })
    })

    it('debería mostrar los roles en los badges', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('ALMACENISTA')).toBeInTheDocument()
      })
      const auxRoles = screen.getAllByText('AUXILIAR DE DESPACHO')
      expect(auxRoles.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('ADMINISTRADOR')).toBeInTheDocument()
    })

    it('debería mostrar estado activo/inactivo', async () => {
      renderUsersPage()
      await waitFor(() => {
        const activePills = screen.getAllByText('users.status.active')
        expect(activePills.length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.getByText('users.status.inactive')).toBeInTheDocument()
    })
  })

  describe('Estado vacío', () => {
    it('debería mostrar mensaje de vacío cuando no hay usuarios', async () => {
      const { http, HttpResponse } = await import('msw')
      server.use(
        http.get('http://localhost:8000/api/v1/auth/users/', () => HttpResponse.json([])),
      )
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('users.empty')).toBeInTheDocument()
      })
    })
  })

  describe('Búsqueda y filtros', () => {
    it('debería filtrar por nombre', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText('users.filters.searchPlaceholder')
      await userEvent.type(searchInput, 'María')
      await userEvent.click(screen.getByText('users.filters.searchBtn'))
      await waitFor(() => {
        expect(screen.queryByText('Carlos Almacén')).not.toBeInTheDocument()
      })
      expect(screen.getByText('María Auxiliar')).toBeInTheDocument()
    })

    it('debería mostrar el botón de limpiar filtros', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByPlaceholderText('users.filters.searchPlaceholder')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText('users.filters.searchPlaceholder')
      await userEvent.type(searchInput, 'María')
      await userEvent.click(screen.getByText('users.filters.searchBtn'))
      await waitFor(() => {
        expect(screen.getByText('users.filters.clearBtn')).toBeInTheDocument()
      })
    })

    it('debería limpiar los filtros', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByPlaceholderText('users.filters.searchPlaceholder')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText('users.filters.searchPlaceholder')
      await userEvent.type(searchInput, 'María')
      await userEvent.click(screen.getByText('users.filters.searchBtn'))
      await waitFor(() => {
        expect(screen.getByText('users.filters.clearBtn')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('users.filters.clearBtn'))
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
    })
  })

  describe('Crear usuario', () => {
    it('debería abrir el modal de creación', async () => {
      renderUsersPage()
      await userEvent.click(await screen.findByText('users.createBtn'))
      await waitFor(() => {
        expect(screen.getByText('users.modal.createTitle')).toBeInTheDocument()
      })
    })

    it('debería validar nombre obligatorio', async () => {
      renderUsersPage()
      await userEvent.click(await screen.findByText('users.createBtn'))
      await waitFor(() => {
        expect(screen.getByText('users.modal.createTitle')).toBeInTheDocument()
      })
      const form = document.querySelector('form[id="user-form"]')
      expect(form).toBeInTheDocument()
      if (form) {
        fireEvent.submit(form)
      }
      await waitFor(() => {
        expect(screen.getByText('users.errors.nameRequired')).toBeInTheDocument()
      })
    })

    it('debería crear un usuario exitosamente', async () => {
      renderUsersPage()
      await userEvent.click(await screen.findByText('users.createBtn'))
      await waitFor(() => {
        expect(screen.getByText('users.modal.createTitle')).toBeInTheDocument()
      })
      const form = document.querySelector('form[id="user-form"]')
      expect(form).toBeInTheDocument()
      const nameInput = screen.getByPlaceholderText('users.modal.fullNamePlaceholder')
      const usernameInput = screen.getByPlaceholderText('carlos.a')
      const emailInput = screen.getByPlaceholderText('ejemplo@icm.com')
      const roleSelect = screen.getByDisplayValue('users.modal.roleSelectPlaceholder')
      const passwordInput = screen.getByPlaceholderText('users.modal.passwordPlaceholder')

      await userEvent.type(nameInput, 'Nuevo Usuario')
      await userEvent.type(usernameInput, 'nuevo.user')
      await userEvent.type(emailInput, 'nuevo@icm.com')
      await userEvent.selectOptions(roleSelect, 'almacenista')
      await userEvent.type(passwordInput, 'password123')

      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText('users.success.created')).toBeInTheDocument()
      })
    })
  })

  describe('Editar usuario', () => {
    it('debería abrir el modal de edición con datos pre-cargados', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      const editBtns = screen.getAllByText('users.actions.edit')
      await userEvent.click(editBtns[0])
      await waitFor(() => {
        expect(screen.getByText('users.modal.editTitle')).toBeInTheDocument()
      })
    })

    it('debería actualizar un usuario exitosamente', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      const editBtns = screen.getAllByText('users.actions.edit')
      await userEvent.click(editBtns[0])
      await waitFor(() => {
        expect(screen.getByText('users.modal.editTitle')).toBeInTheDocument()
      })
      const form = document.querySelector('form[id="user-form"]')
      expect(form).toBeInTheDocument()
      const phoneInput = screen.getByDisplayValue('3001112233')
      await userEvent.clear(phoneInput)
      await userEvent.type(phoneInput, '3009998877')
      if (form) {
        fireEvent.submit(form)
      }
      await waitFor(() => {
        expect(screen.getByText('users.success.updated')).toBeInTheDocument()
      })
    })

    it('debería mostrar el botón de desactivar al editar un usuario activo', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      const editBtns = screen.getAllByText('users.actions.edit')
      await userEvent.click(editBtns[0])
      await waitFor(() => {
        expect(screen.getByText('users.deactivateBtn')).toBeInTheDocument()
      })
    })
  })

  describe('Desactivar y activar usuario', () => {
    it('debería abrir el modal de confirmación al desactivar', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      const editBtns = screen.getAllByText('users.actions.edit')
      await userEvent.click(editBtns[0])
      await waitFor(() => {
        expect(screen.getByText('users.modal.editTitle')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('users.deactivateBtn'))
      await waitFor(() => {
        expect(screen.getByText('users.deactivateModal.title')).toBeInTheDocument()
      })
    })

    it('debería desactivar el usuario al confirmar', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Carlos Almacén')).toBeInTheDocument()
      })
      const editBtns = screen.getAllByText('users.actions.edit')
      await userEvent.click(editBtns[0])
      await waitFor(() => {
        expect(screen.getByText('users.modal.editTitle')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('users.deactivateBtn'))
      await waitFor(() => {
        expect(screen.getByText('users.deactivateModal.title')).toBeInTheDocument()
      })
      const confirmBtn = screen.getByText('users.deactivateModal.confirmBtn')
      await userEvent.click(confirmBtn)
      await waitFor(() => {
        const deactivatedMsgs = screen.getAllByText('users.success.deactivated')
        expect(deactivatedMsgs.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('debería activar un usuario inactivo', async () => {
      renderUsersPage()
      await waitFor(() => {
        expect(screen.getByText('Laura Inactiva')).toBeInTheDocument()
      })
      const reactivateBtns = screen.getAllByText('users.actions.reactivate')
      await userEvent.click(reactivateBtns[0])
      await waitFor(() => {
        const reactivatedMsgs = screen.getAllByText('users.success.reactivated')
        expect(reactivatedMsgs.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
