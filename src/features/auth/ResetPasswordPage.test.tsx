import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'

import { authHandlers } from '../../test/mocks/handlers/auth.handlers'
import ResetPasswordPage from './ResetPasswordPage'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

function renderPage(token = 'valid-token') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  )
}

function renderPageWithoutToken() {
  return render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <ResetPasswordPage />
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage — integración', () => {
  // ── 1. Sin token ─────────────────────────────────────────────
  describe('Sin token en la URL', () => {
    it('debería mostrar mensaje de error y enlace para solicitar nuevo enlace', () => {
      renderPageWithoutToken()

      expect(
        screen.getByText(
          'El enlace de recuperación no es válido o ya expiró.',
        ),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'Volver al login' }),
      ).toHaveAttribute('href', '/forgot-password')
    })

    it('no debería mostrar los campos de contraseña si no hay token', () => {
      renderPageWithoutToken()

      expect(
        screen.queryByLabelText('Nueva contraseña'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByLabelText('Confirmar contraseña'),
      ).not.toBeInTheDocument()
    })
  })

  // ── 2. Renderizado con token ─────────────────────────────────
  describe('Renderizado con token válido', () => {
    it('debería mostrar el título y los campos del formulario', () => {
      renderPage()

      expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument()

      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Mínimo 8 caracteres'),
      ).toBeInTheDocument()

      expect(
        screen.getByLabelText('Confirmar contraseña'),
      ).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Repite la contraseña'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de restablecer', () => {
      renderPage()

      expect(
        screen.getByRole('button', { name: 'Restablecer' }),
      ).toBeInTheDocument()
    })

    it('debería mostrar la barra de fortaleza al escribir una contraseña', async () => {
      renderPage()
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'Admin123!')

      expect(await screen.findByText('Segura')).toBeInTheDocument()
    })
  })

  // ── 3. Validaciones client-side ──────────────────────────────
  describe('Validaciones client-side', () => {
    it('debería mostrar error si la contraseña es menor a 8 caracteres', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'Ab1!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Ab1!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Mínimo 8 caracteres'),
      ).toBeInTheDocument()
    })

    it('debería mostrar error si la contraseña no tiene mayúscula', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'admin123!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'admin123!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Debe contener al menos una mayúscula'),
      ).toBeInTheDocument()
    })

    it('debería mostrar error si la contraseña no tiene minúscula', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'ADMIN123!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'ADMIN123!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Debe contener al menos una minúscula'),
      ).toBeInTheDocument()
    })

    it('debería mostrar error si la contraseña no tiene número', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'AdminPWD!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'AdminPWD!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Debe contener al menos un número'),
      ).toBeInTheDocument()
    })

    it('debería mostrar error si la contraseña no tiene carácter especial', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'Admin1234')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Admin1234')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Debe contener al menos un carácter especial'),
      ).toBeInTheDocument()
    })

    it('debería mostrar error si las contraseñas no coinciden', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'Admin123!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Admin456!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Las contraseñas no coinciden.'),
      ).toBeInTheDocument()
    })
  })

  // ── 4. Submit exitoso ────────────────────────────────────────
  describe('Submit exitoso', () => {
    it('debería ocultar el formulario y mostrar mensaje de éxito', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'Admin123!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Admin123!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Contraseña restablecida correctamente.'),
      ).toBeInTheDocument()

      expect(
        screen.queryByLabelText('Nueva contraseña'),
      ).not.toBeInTheDocument()
    })

    it('debería mostrar el enlace para iniciar sesión después del éxito', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'Admin123!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Admin123!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByRole('link', { name: 'Iniciar sesión' }),
      ).toHaveAttribute('href', '/login')
    })
  })

  // ── 5. Error de API ──────────────────────────────────────────
  describe('Error de API', () => {
    it('debería mostrar mensaje de error si el token es inválido', async () => {
      renderPage('expired-token')
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'Admin123!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Admin123!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      expect(
        await screen.findByText('Token inválido o expirado'),
      ).toBeInTheDocument()
    })

    it('debería mantener el formulario visible si la API falla', async () => {
      renderPage('expired-token')
      const user = userEvent.setup()

      await user.type(screen.getByLabelText('Nueva contraseña'), 'Admin123!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Admin123!')

      await user.click(screen.getByRole('button', { name: 'Restablecer' }))

      await screen.findByText('Token inválido o expirado')

      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
    })
  })

  // ── 6. Toggle visibilidad ────────────────────────────────────
  describe('Toggle visibilidad de contraseña', () => {
    it('debería alternar visibilidad en ambos campos de contraseña', async () => {
      renderPage()
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      const confirmInput = screen.getByLabelText('Confirmar contraseña')

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmInput).toHaveAttribute('type', 'password')

      const toggles = screen.getAllByRole('button', { name: 'Mostrar contraseña' })
      expect(toggles).toHaveLength(2)

      await user.click(toggles[0])

      // Re-query porque PhysioInput usa key={resolvedType}, recreando el <input>
      const textInput = screen.getByLabelText('Nueva contraseña')
      expect(textInput).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText('Confirmar contraseña')).toHaveAttribute('type', 'password')

      const hideToggle = screen.getByRole('button', { name: 'Ocultar contraseña' })
      await user.click(hideToggle)

      const passwordAgain = screen.getByLabelText('Nueva contraseña')
      expect(passwordAgain).toHaveAttribute('type', 'password')
    })
  })
})
