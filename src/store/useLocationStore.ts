import { create } from 'zustand'

/** Safely extract a human-readable string from Axios error responses.
 * Backend shape: { error, message, detail }  (HTTP 4xx from ICM)
 */
const extractErrorMsg = (err: any): string => {
  const data = err?.response?.data
  if (!data) return err?.message || 'Error desconocido'
  // Prefer the top-level "message" field (always a string)
  if (typeof data.message === 'string' && data.message) return data.message
  // "detail" can be a string or an object — only use it when it's a string
  if (typeof data.detail === 'string' && data.detail) return data.detail
  // Generic fallback
  return err?.message || 'Error desconocido'
}

import {
  fetchLocations as getLocations,
  createLocation as addLocation,
  updateLocation as editLocation,
  deactivateLocation as removeLocation,
  fetchStorageTypes as getStorageTypes,
} from '../services/locations'
import type { LocationItem, StorageType } from '../interfaces/locations'

interface LocationState {
  locations: LocationItem[]
  storageTypes: StorageType[]
  loading: boolean
  error: string | null

  fetchLocations: (includeInactive?: boolean) => Promise<void>
  fetchStorageTypes: () => Promise<void>
  createLocation: (data: {
    name: string
    description?: string
    storage_type_id: string
    capacity_score: number
  }) => Promise<void>
  updateLocation: (
    id: string,
    data: { name?: string; description?: string; capacity_score?: number; is_active?: boolean }
  ) => Promise<void>
  deactivateLocation: (id: string) => Promise<void>
}

const useLocationStore = create<LocationState>((set, get) => ({
  locations: [],
  storageTypes: [],
  loading: false,
  error: null,

  fetchLocations: async (includeInactive = true) => {
    set({ loading: true, error: null })
    try {
      const data = await getLocations(includeInactive)
      set({ locations: data, loading: false })
    } catch (err: any) {
      set({ error: extractErrorMsg(err), loading: false })
    }
  },

  fetchStorageTypes: async () => {
    try {
      const data = await getStorageTypes()
      set({ storageTypes: data })
    } catch (err: any) {
      set({ error: extractErrorMsg(err) })
    }
  },

  createLocation: async (data) => {
    set({ loading: true, error: null })
    try {
      await addLocation(data)
      const list = await getLocations(true)
      set({ locations: list, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err)
      set({ error: msg, loading: false })
      throw err
    }
  },

  updateLocation: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await editLocation(id, data)
      const list = await getLocations(true)
      set({ locations: list, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err)
      set({ error: msg, loading: false })
      throw err
    }
  },

  deactivateLocation: async (id) => {
    set({ loading: true, error: null })
    try {
      await removeLocation(id)
      const list = await getLocations(true)
      set({ locations: list, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err)
      set({ error: msg, loading: false })
      throw err
    }
  },
}))

export default useLocationStore
