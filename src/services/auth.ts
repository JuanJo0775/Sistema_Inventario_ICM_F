import axios from 'axios'
import { api } from './api'
import type { LoginPayload, LoginResponse } from '../interfaces/auth'

const getFriendlyAuthError = (status?: number, data?: unknown) => {
  const payload = data as
    | { message?: string; detail?: string; error?: string }
    | undefined
  const apiMessage = payload?.message || payload?.detail

  if (apiMessage) {
    return apiMessage
  }

  if (!status) {
    return 'No se pudo conectar con el servidor'
  }

  if (status >= 300 && status < 400) {
    return 'Respuesta inesperada del servidor'
  }

  if (status === 401) {
    return 'Usuario o correo invalido'
  }

  if (status === 403) {
    return 'Acceso restringido por permisos u horario'
  }

  if (status >= 400 && status < 500) {
    return 'Datos invalidos o solicitud incorrecta'
  }

  if (status >= 500) {
    return 'Error interno del servidor'
  }

  return 'No se pudo iniciar sesion'
}

export const login = async (payload: LoginPayload) => {
  try {
    const response = await api.post<LoginResponse>('/auth/login/', payload)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        getFriendlyAuthError(error.response?.status, error.response?.data),
      )
    }

    throw new Error('No se pudo iniciar sesion')
  }
}
