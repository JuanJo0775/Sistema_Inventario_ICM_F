import { create } from 'zustand'
import {
  fetchSuppliers as getSuppliers,
  fetchSupplierDetail as getSupplierDetail,
  createSupplier as addSupplier,
  updateSupplier as editSupplier,
  deactivateSupplier as removeSupplier,
  activateSupplier as restoreSupplier,
} from '../services/suppliers'
import type { Supplier } from '../interfaces/suppliers'

const extractErrorMsg = (err: any, fallback: string): string => {
  const data = err?.response?.data
  if (!data) return err?.message || fallback

  // Check custom error codes/messages from backend
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.detail === 'string' && data.detail) return data.detail

  // Handle Django REST Framework field validation errors
  if (typeof data === 'object') {
    const entries = Object.entries(data)
    if (entries.length > 0) {
      const [key, val] = entries[0]
      const label = key === 'nit' ? 'NIT' : key === 'nombre_comercial' ? 'Nombre' : key === 'pais' ? 'País' : key === 'telefono' ? 'Teléfono' : key
      if (Array.isArray(val) && val.length > 0) {
        return `${label}: ${val[0]}`
      }
      if (typeof val === 'string') {
        return `${label}: ${val}`
      }
    }
  }
  return err?.message || fallback
}

interface SupplierState {
  suppliers: Supplier[]
  selectedSupplier: Supplier | null
  loading: boolean
  error: string | null

  fetchSuppliers: (isActive?: boolean) => Promise<void>
  fetchSupplierDetail: (id: string) => Promise<void>
  createSupplier: (data: Omit<Supplier, 'id' | 'is_active' | 'created_at' | 'updated_at'>) => Promise<void>
  updateSupplier: (id: string, data: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>
  deactivateSupplier: (id: string) => Promise<void>
  activateSupplier: (id: string) => Promise<void>
  clearError: () => void
  setSelectedSupplier: (supplier: Supplier | null) => void
}

const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  selectedSupplier: null,
  loading: false,
  error: null,

  fetchSuppliers: async (isActive) => {
    set({ loading: true, error: null })
    try {
      const data = await getSuppliers(isActive)
      set({ suppliers: data, loading: false })
    } catch (err: any) {
      set({ error: extractErrorMsg(err, 'No fue posible cargar los proveedores.'), loading: false })
    }
  },

  fetchSupplierDetail: async (id) => {
    set({ loading: true, error: null })
    try {
      const data = await getSupplierDetail(id)
      set({ selectedSupplier: data, loading: false })
    } catch (err: any) {
      set({ error: extractErrorMsg(err, 'No fue posible cargar el detalle del proveedor.'), loading: false })
    }
  },

  createSupplier: async (data) => {
    set({ loading: true, error: null })
    try {
      await addSupplier(data)
      // Refresh list
      const list = await getSuppliers()
      set({ suppliers: list, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err, 'No fue posible guardar el proveedor.')
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  updateSupplier: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await editSupplier(id, data)
      // Refresh list & detail if active
      const list = await getSuppliers()
      const currentSelected = get().selectedSupplier
      let updatedSelected = currentSelected
      if (currentSelected && currentSelected.id === id) {
        updatedSelected = await getSupplierDetail(id)
      }
      set({ suppliers: list, selectedSupplier: updatedSelected, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err, 'No fue posible actualizar el proveedor.')
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  deactivateSupplier: async (id) => {
    set({ loading: true, error: null })
    try {
      await removeSupplier(id)
      const list = await getSuppliers()
      const currentSelected = get().selectedSupplier
      let updatedSelected = currentSelected
      if (currentSelected && currentSelected.id === id) {
        updatedSelected = { ...currentSelected, is_active: false }
      }
      set({ suppliers: list, selectedSupplier: updatedSelected, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err, 'No fue posible desactivar el proveedor.')
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  activateSupplier: async (id) => {
    set({ loading: true, error: null })
    try {
      await restoreSupplier(id)
      const list = await getSuppliers()
      const currentSelected = get().selectedSupplier
      let updatedSelected = currentSelected
      if (currentSelected && currentSelected.id === id) {
        updatedSelected = { ...currentSelected, is_active: true }
      }
      set({ suppliers: list, selectedSupplier: updatedSelected, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err, 'No fue posible activar el proveedor.')
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  clearError: () => set({ error: null }),
  setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),
}))

export default useSupplierStore
