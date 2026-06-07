import { create } from 'zustand'
import {
  fetchPendingPurchaseOrders,
  fetchCompletedPurchaseOrders,
  fetchPendingOrderDetail,
  createAndConfirmReception,
} from '../services/reception'
import type { PurchaseOrder } from '../interfaces/purchaseOrders'
import type { ReceptionCreatePayload } from '../interfaces/reception'

const extractErrorMsg = (err: any): string => {
  const data = err?.response?.data
  if (!data) return err?.message || 'Error desconocido'
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.detail === 'string' && data.detail) return data.detail
  if (typeof data === 'object') {
    const values = Object.values(data)
    if (values.length > 0) {
      const firstVal = values[0]
      if (Array.isArray(firstVal) && typeof firstVal[0] === 'string') return firstVal[0]
      if (typeof firstVal === 'string') return firstVal
    }
  }
  return err?.message || 'Error desconocido'
}

interface ReceptionState {
  pendingOrders: PurchaseOrder[]
  completedOrders: PurchaseOrder[]
  selectedOrder: PurchaseOrder | null
  loading: boolean
  error: string | null

  fetchPendingOrders: () => Promise<void>
  fetchCompletedOrders: () => Promise<void>
  fetchOrderDetail: (id: string) => Promise<void>
  receiveItem: (payload: ReceptionCreatePayload) => Promise<void>
  clearError: () => void
  setSelectedOrder: (order: PurchaseOrder | null) => void
}

const useReceptionStore = create<ReceptionState>((set, get) => ({
  pendingOrders: [],
  completedOrders: [],
  selectedOrder: null,
  loading: false,
  error: null,

  fetchPendingOrders: async () => {
    set({ loading: true, error: null })
    try {
      const orders = await fetchPendingPurchaseOrders()
      set({ pendingOrders: orders, loading: false })
    } catch (err: any) {
      set({ error: extractErrorMsg(err), loading: false })
    }
  },

  fetchCompletedOrders: async () => {
    set({ loading: true, error: null })
    try {
      const orders = await fetchCompletedPurchaseOrders()
      set({ completedOrders: orders, loading: false })
    } catch (err: any) {
      set({ error: extractErrorMsg(err), loading: false })
    }
  },

  fetchOrderDetail: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const order = await fetchPendingOrderDetail(id)
      set({ selectedOrder: order, loading: false })
    } catch (err: any) {
      set({ error: extractErrorMsg(err), selectedOrder: null, loading: false })
    }
  },

  receiveItem: async (payload: ReceptionCreatePayload) => {
    set({ loading: true, error: null })
    try {
      await createAndConfirmReception(payload)
      // Refrescar la orden actual y la lista de pendientes
      const currentOrderId = get().selectedOrder?.id
      if (currentOrderId) {
        const updatedOrder = await fetchPendingOrderDetail(currentOrderId)
        set({ selectedOrder: updatedOrder })
      }
      const pending = await fetchPendingPurchaseOrders()
      set({ pendingOrders: pending, loading: false })
    } catch (err: any) {
      const msg = extractErrorMsg(err)
      set({ error: msg, loading: false })
      throw err
    }
  },

  clearError: () => set({ error: null }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
}))

export default useReceptionStore
