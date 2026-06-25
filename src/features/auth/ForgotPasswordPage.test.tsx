import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'

import { authHandlers } from '../../test/mocks/handlers/auth.handlers'
import ForgotPasswordPage from './ForgotPasswordPage'

const server = setupServer(...authHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  )
}

describe('ForgotPasswordPage — integración', () => {
  // ── 1. Renderizado inicial ───────────────────────────────────
  describe('Renderizado inicial', () => {
    it('debería mostrar el título, subtítulo y los campos del formulario', () => {
      renderPage()

      expect(screen.getByText('Recuperar acceso')).toBeInTheDocument()
      expect(
        screen.getByText(/Ingresa tu correo electrónico para recibir un enlace/),
      ).toBeInTheDocument()

      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('tu@correo.com'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de enviar enlace y el link para volver al login', () => {
      renderPage()

      expect(
        screen.getByRole('button', { name: 'Enviar enlace' }),
      ).toBeInTheDocument()

      expect(
        screen.getByRole('link', { name: 'Volver al login' }),
      ).toHaveAttribute('href', '/login')
    })
  })

  // ── 2. Envío exitoso ─────────────────────────────────────────
  describe('Envío exitoso', () => {
    it('debería ocultar el formulario y mostrar mensaje de éxito', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(
        screen.getByLabelText('Correo electrónico'),
        'admin@icm.com',
      )

      await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

      expect(
        await screen.findByText(
          /recibirás un enlace de recuperación en los próximos minutos/,
        ),
      ).toBeInTheDocument()

      expect(
        screen.queryByLabelText('Correo electrónico'),
      ).not.toBeInTheDocument()
    })

    it('debería mostrar el botón para volver al login después del éxito', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(
        screen.getByLabelText('Correo electrónico'),
        'admin@icm.com',
      )
      await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

      expect(
        await screen.findByText('Volver al login'),
      ).toBeInTheDocument()
    })
  })

  // ── 3. Envío fallido ─────────────────────────────────────────
  describe('Envío fallido', () => {
    it('debería mostrar mensaje de error si la API responde con 404', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(
        screen.getByLabelText('Correo electrónico'),
        'notfound@test.com',
      )
      await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

      expect(
        await screen.findByText('No se encontró una cuenta con ese correo'),
      ).toBeInTheDocument()
    })

    it('debería mantener visible el formulario cuando hay error', async () => {
      renderPage()
      const user = userEvent.setup()

      await user.type(
        screen.getByLabelText('Correo electrónico'),
        'notfound@test.com',
      )
      await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

      await screen.findByText('No se encontró una cuenta con ese correo')

      expect(
        screen.getByLabelText('Correo electrónico'),
      ).toBeInTheDocument()
    })
  })
})
