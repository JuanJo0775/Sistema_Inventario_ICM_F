import { api } from './api'
import type { Supplier } from '../interfaces/suppliers'
import { useMocks } from '../mocks/config'

type BackendListResponse<T> = T[] | { results?: T[]; count?: number }
const normalizeList = <T,>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

// Simple in-memory mocks if VITE_USE_MOCKS is true (just to keep the system compilable/runnable in mock-only mode)
let mockSuppliers: Supplier[] = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nombre_comercial: 'Medical SAS',
    razon_social: 'Medical Colombia SAS',
    nit: '900.123.456-1',
    pais: 'Colombia',
    correo: 'contacto@medicalsas.co',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    direccion: 'Calle 100 # 15-20',
    is_active: true,
    observaciones: 'Proveedor principal de insumos médicos descartables.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c',
    nombre_comercial: 'China Medical Ltd',
    razon_social: 'China Medical Devices Co.',
    nit: 'CN-987654321',
    pais: 'China',
    correo: 'sales@chinamedical.com',
    telefono: '+86 21 6123 4567',
    ciudad: 'Shanghai',
    direccion: 'Pudong New Area, Bldg 12',
    is_active: false,
    observaciones: 'Proveedor internacional. Tiempos de entrega de 45 días.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

export const fetchSuppliers = async (isActive?: boolean): Promise<Supplier[]> => {
  if (useMocks) {
    let list = [...mockSuppliers]
    if (isActive !== undefined) {
      list = list.filter((s) => s.is_active === isActive)
    }
    return list
  }
  const response = await api.get<BackendListResponse<Supplier>>('/purchasing/suppliers/', {
    params: { is_active: isActive !== undefined ? String(isActive) : undefined },
  })
  return normalizeList(response.data)
}

export const fetchSupplierDetail = async (id: string): Promise<Supplier> => {
  if (useMocks) {
    const item = mockSuppliers.find((s) => s.id === id)
    if (!item) throw new Error('Proveedor no encontrado')
    return item
  }
  const response = await api.get<Supplier>(`/purchasing/suppliers/${id}/`)
  return response.data
}

export const createSupplier = async (
  data: Omit<Supplier, 'id' | 'is_active' | 'created_at' | 'updated_at'>
): Promise<Supplier> => {
  if (useMocks) {
    const newItem: Supplier = {
      ...data,
      id: crypto.randomUUID(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockSuppliers.push(newItem)
    return newItem
  }
  const response = await api.post<Supplier>('/purchasing/suppliers/', data)
  return response.data
}

export const updateSupplier = async (
  id: string,
  data: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>
): Promise<Supplier> => {
  if (useMocks) {
    const index = mockSuppliers.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('Proveedor no encontrado')
    const updated = { ...mockSuppliers[index], ...data, updated_at: new Date().toISOString() }
    mockSuppliers[index] = updated
    return updated
  }
  const response = await api.patch<Supplier>(`/purchasing/suppliers/${id}/`, data)
  return response.data
}

export const deactivateSupplier = async (id: string): Promise<Supplier> => {
  if (useMocks) {
    const index = mockSuppliers.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('Proveedor no encontrado')
    mockSuppliers[index].is_active = false
    mockSuppliers[index].updated_at = new Date().toISOString()
    return mockSuppliers[index]
  }
  const response = await api.post<Supplier>(`/purchasing/suppliers/${id}/deactivate/`)
  return response.data
}

export const activateSupplier = async (id: string): Promise<Supplier> => {
  if (useMocks) {
    const index = mockSuppliers.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('Proveedor no encontrado')
    mockSuppliers[index].is_active = true
    mockSuppliers[index].updated_at = new Date().toISOString()
    return mockSuppliers[index]
  }
  const response = await api.post<Supplier>(`/purchasing/suppliers/${id}/activate/`)
  return response.data
}
