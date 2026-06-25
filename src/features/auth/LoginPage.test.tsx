import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { Toaster } from 'sonner'

import useAuthStore from '../../store/useAuthStore'
import { authHandlers } from '../../test/mocks/handlers/auth.handlers'

let currentLocation = '/login'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => (to: string) => {
      currentLocation = to
    },
  }
})

import LoginPage from './LoginPage'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  currentLocation = '/login'
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  localStorage.clear()
})
afterAll(() => server.close())

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Toaster />
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage — integración', () => {
  // ── 1. Renderizado inicial ───────────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el título, el subtítulo y los campos del formulario', () => {
      renderPage()

      expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument()
      expect(
        screen.getByText(/Accede con tu usuario o correo y contraseña para continuar/),
      ).toBeInTheDocument()

      expect(screen.getByLabelText('Usuario o correo')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('usuario o nombre@empresa.com'),
      ).toBeInTheDocument()

      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Ingresa tu contraseña'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de iniciar sesión y el enlace de olvidé mi contraseña', () => {
      renderPage()

      expect(
        screen.getByRole('button', { name: 'Iniciar sesión' }),
      ).toBeInTheDocument()

      expect(
        screen.getByRole('link', { name: 'Olvidé mi contraseña' }),
      ).toHaveAttribute('href', '/forgot-password')
    })

    it('debería mostrar el enlace de inicio (home)', () => {
      renderPage()

      expect(screen.getByRole('link', { name: 'Ir a inicio' })).toHaveAttribute('href', '/')
    })
  })

  // ── 2. Toggle visibilidad contraseña ─────────────────────────
  describe('Toggle visibilidad de contraseña', () => {
    it('debería mostrar y ocultar la contraseña al hacer clic en el toggle', async () => {
      renderPage()
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText('Contraseña')
      expect(passwordInput).toHaveAttribute('type', 'password')

      const toggleButton = screen.getByRole('button', { name: 'Mostrar contraseña' })
      await user.click(toggleButton)

      // Re-query porque PhysioInput usa key={resolvedType}, lo que recrea el <input>
      const textInput = screen.getByLabelText('Contraseña')
      expect(textInput).toHaveAttribute('type', 'text')

      await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))

      const passwordInputAgain = screen.getByLabelText('Contraseña')
      expect(passwordInputAgain).toHaveAttribute('type', 'password')
    })
  })

  // ── 3. Validaciones del formulario ───────────────────────────
  describe('Validaciones del formulario', () => {
    it('debería mostrar error si el identifier es muy corto', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Usuario o correo'), 'ab')
      await user.type(screen.getByLabelText('Contraseña'), 'password123')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      expect(await screen.findByText('Ingresa tu usuario o correo')).toBeInTheDocument()
    })

    it('debería mostrar error si la contraseña es muy corta', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Usuario o correo'), 'admin@icm.com')
      await user.type(screen.getByLabelText('Contraseña'), 'short')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      expect(await screen.findByText('Mínimo 8 caracteres')).toBeInTheDocument()
    })
  })

  // ── 4. Login exitoso ─────────────────────────────────────────
  describe('Login exitoso', () => {
    it('debería redirigir a /app al iniciar sesión con username', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Usuario o correo'), 'admin')
      await user.type(screen.getByLabelText('Contraseña'), 'correctpass')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      await waitFor(() => {
        expect(currentLocation).toBe('/app')
      })

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('debería redirigir a /app al iniciar sesión con email', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(
        screen.getByLabelText('Usuario o correo'),
        'admin@icm.com',
      )
      await user.type(screen.getByLabelText('Contraseña'), 'correctpass')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      await waitFor(() => {
        expect(currentLocation).toBe('/app')
      })
    })

    it('debería almacenar el token y los datos del usuario en el store', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Usuario o correo'), 'admin')
      await user.type(screen.getByLabelText('Contraseña'), 'correctpass')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(true)
      })

      const state = useAuthStore.getState()
      expect(state.token).toBe('fake-access-token')
      expect(state.user?.email).toBe('admin@icm.com')
      expect(state.user?.role).toBe('administrador')
    })
  })

  // ── 5. Login fallido ─────────────────────────────────────────
  describe('Login fallido', () => {
    it('debería mostrar mensaje de error cuando las credenciales son incorrectas', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Usuario o correo'), 'admin')
      await user.type(screen.getByLabelText('Contraseña'), 'wrongpass')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      expect(
        await screen.findByText('Usuario o contraseña incorrectos'),
      ).toBeInTheDocument()
    })

    it('debería mostrar mensaje de error cuando el servidor responde con 500', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Usuario o correo'), 'admin')
      await user.type(screen.getByLabelText('Contraseña'), 'servererror')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      expect(
        await screen.findByText('Error interno del servidor'),
      ).toBeInTheDocument()
    })

    it('NO debería redirigir si el login falla', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Usuario o correo'), 'admin')
      await user.type(screen.getByLabelText('Contraseña'), 'wrongpass')

      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

      await screen.findByText('Usuario o contraseña incorrectos')

      expect(currentLocation).toBe('/login')
    })
  })
})
