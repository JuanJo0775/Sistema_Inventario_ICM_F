export interface User {
  id: string
  email: string
  role?: 'almacenista' | 'auxiliar_despacho' | 'administrador'
}

export interface LoginPayload {
  username?: string
  email?: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
}
