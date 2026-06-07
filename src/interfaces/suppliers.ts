export interface Supplier {
  id: string
  nombre_comercial: string
  razon_social?: string
  nit?: string
  pais: string
  correo?: string
  telefono: string
  ciudad?: string
  direccion?: string
  is_active: boolean
  observaciones?: string
  created_at?: string
  updated_at?: string
}
