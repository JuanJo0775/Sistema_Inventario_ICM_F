export interface User {
  id: string
  username: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: 'almacenista' | 'auxiliar_despacho' | 'administrador'  
  is_active?: boolean
}

export interface LoginPayload {
  username?: string
  email?: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string 
  user: User
}