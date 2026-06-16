import { create } from 'zustand'
import {
  fetchCombos as fetchCombosService,
  createCombo as createComboService,
  updateCombo as updateComboService,
  deleteCombo as deleteComboService,
  restoreCombo as restoreComboService,
} from '../services/combos'
import type { Combo, ComboCreateInput, ComboUpdateInput } from '../interfaces/combos'
import { extractApiError } from '../hooks/useApiError'

interface ComboState {
  combos: Combo[]
  loading: boolean
  error: string | null

  fetchCombos: (includeArchived?: boolean) => Promise<void>
  createCombo: (data: ComboCreateInput) => Promise<void>
  updateCombo: (id: string, data: ComboUpdateInput) => Promise<void>
  deleteCombo: (id: string) => Promise<void>
  restoreCombo: (id: string) => Promise<void>
}

const useComboStore = create<ComboState>((set) => ({
  combos: [],
  loading: false,
  error: null,

  fetchCombos: async (includeArchived = true) => {
    set({ loading: true, error: null })
    try {
      const combos = await fetchCombosService(includeArchived)
      set({ combos: combos as any, loading: false })
    } catch (err: any) {
      set({ error: extractApiError(err), loading: false })
    }
  },

  createCombo: async (data) => {
    set({ loading: true, error: null })
    try {
      await createComboService(data)
      const combos = await fetchCombosService(true)
      set({ combos: combos as any, loading: false })
    } catch (err: any) {
      set({ error: extractApiError(err), loading: false })
      throw err
    }
  },

  updateCombo: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await updateComboService(id, data)
      const combos = await fetchCombosService(true)
      set({ combos: combos as any, loading: false })
    } catch (err: any) {
      set({ error: extractApiError(err), loading: false })
      throw err
    }
  },

  deleteCombo: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteComboService(id)
      const combos = await fetchCombosService(true)
      set({ combos: combos as any, loading: false })
    } catch (err: any) {
      set({ error: extractApiError(err), loading: false })
      throw err
    }
  },

  restoreCombo: async (id) => {
    set({ loading: true, error: null })
    try {
      await restoreComboService(id)
      const combos = await fetchCombosService(true)
      set({ combos: combos as any, loading: false })
    } catch (err: any) {
      set({ error: extractApiError(err), loading: false })
      throw err
    }
  },
}))

export default useComboStore
