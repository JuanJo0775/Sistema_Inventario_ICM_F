import { api } from './api'
import type { UserItem, UserCreatePayload, UserUpdatePayload, RoleChoice } from '../interfaces/users'

type BackendListResponse<T> = T[] | { results?: T[]; count?: number }

const normalizeList = <T,>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

/** Obtiene la lista de usuarios con filtros de búsqueda, rol e inclusión de inactivos. */
export const fetchUsersList = async (filters?: {
  search?: string
  role?: string
  include_inactive?: boolean
}): Promise<UserItem[]> => {
  const params: Record<string, any> = {
    page_size: 100, // Carga una buena cantidad
  }

  if (filters?.search) {
    params.search = filters.search
  }
  if (filters?.role) {
    params.role = filters.role
  }
  if (filters?.include_inactive) {
    params.include_inactive = 'true'
  }

  const response = await api.get<BackendListResponse<UserItem>>('/auth/users/', { params })
  return normalizeList(response.data)
}

/** Crea un nuevo usuario en el backend. */
export const createUser = async (payload: UserCreatePayload): Promise<UserItem> => {
  const response = await api.post<UserItem>('/auth/users/', payload)
  return response.data
}

/** Actualiza un usuario existente (PUT parcial o completo). */
export const updateUser = async (id: string, payload: UserUpdatePayload): Promise<UserItem> => {
  const response = await api.put<UserItem>(`/auth/users/${id}/`, payload)
  return response.data
}

/** Desactiva un usuario (Soft Delete / is_active=false). */
export const disableUser = async (id: string): Promise<void> => {
  await api.post(`/auth/users/${id}/disable/`)
}

/** Reactiva un usuario (is_active=true). */
export const enableUser = async (id: string): Promise<UserItem> => {
  const response = await api.post<UserItem>(`/auth/users/${id}/enable/`)
  return response.data
}

/** Obtiene los roles dinámicamente desde el backend mediante una petición OPTIONS. */
export const fetchRoleChoices = async (): Promise<RoleChoice[]> => {
  try {
    const response = await api.options('/auth/users/')
    const choices = response.data?.actions?.POST?.role?.choices
    if (Array.isArray(choices)) {
      return choices
    }
  } catch (error) {
    console.error('Error fetching role choices from OPTIONS:', error)
  }
  // Fallback si la petición OPTIONS no funciona
  return [
    { value: 'administrador', display_name: 'Administrador' },
    { value: 'almacenista', display_name: 'Almacenista' },
    { value: 'auxiliar_despacho', display_name: 'Auxiliar de despacho' },
  ]
}
