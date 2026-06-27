import axios from 'axios'
import { api } from './api'
import type { UserItem } from '../interfaces/users'

export interface ProfileUpdatePayload {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_confirm: string
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    const message =
      (typeof data?.message === 'string' ? data.message : null) ??
      (typeof data?.detail === 'string' ? data.detail : null) ??
      (typeof data?.error === 'string' ? data.error : null)
    if (message) return message
  }
  return fallback
}

export const fetchMyProfile = async (): Promise<UserItem> => {
  try {
    const response = await api.get<UserItem>('/auth/me/')
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo cargar el perfil'))
  }
}

export const updateMyProfile = async (id: string, payload: ProfileUpdatePayload): Promise<UserItem> => {
  try {
    const response = await api.patch<UserItem>(`/auth/users/${id}/`, payload)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo actualizar el perfil'))
  }
}

export const changeMyPassword = async (payload: ChangePasswordPayload): Promise<void> => {
  try {
    await api.post('/auth/change-password/', payload)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo cambiar la contraseña'))
  }
}
