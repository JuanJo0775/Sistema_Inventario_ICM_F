import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

export const authHandlers = [
  http.post(`${API_BASE}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as {
      username?: string
      email?: string
      password: string
    }

    if (body.password === 'wrongpass') {
      return HttpResponse.json(
        { detail: 'Usuario o contraseña incorrectos' },
        { status: 401 },
      )
    }

    if (body.password === 'servererror') {
      return HttpResponse.json(
        { detail: 'Error interno del servidor' },
        { status: 500 },
      )
    }

    return HttpResponse.json(
      {
        access: 'fake-access-token',
        refresh: 'fake-refresh-token',
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@icm.com',
          first_name: 'Admin',
          last_name: 'ICM',
          role: 'administrador',
          is_active: true,
        },
      },
      { status: 200 },
    )
  }),

  http.post(`${API_BASE}/auth/forgot-password/`, async ({ request }) => {
    const body = (await request.json()) as { email: string }

    if (body.email === 'notfound@test.com') {
      return HttpResponse.json(
        { detail: 'No se encontró una cuenta con ese correo' },
        { status: 404 },
      )
    }

    return HttpResponse.json(null, { status: 200 })
  }),

  http.post(`${API_BASE}/auth/reset-password/`, async ({ request }) => {
    const body = (await request.json()) as {
      token: string
      new_password: string
      new_password_confirm: string
    }

    if (body.token === 'expired-token') {
      return HttpResponse.json(
        { detail: 'Token inválido o expirado' },
        { status: 400 },
      )
    }

    return HttpResponse.json(null, { status: 200 })
  }),
]
