export interface UserItem {
  id: string
  username: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: 'almacenista' | 'auxiliar_despacho' | 'administrador'
  is_active: boolean
  created_by?: string | null
  created_by_username?: string | null
  created_at: string
  updated_at: string
  last_login?: string | null
}

export interface UserCreatePayload {
  username: string
  password?: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
}

export interface UserUpdatePayload {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
}

export interface RoleChoice {
  value: string
  display_name: string
}
