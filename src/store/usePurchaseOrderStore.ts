import { create } from 'zustand'
import {
  fetchPurchaseOrders,
  fetchPurchaseOrderDetail,
  createPurchaseOrder,
  updatePurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
} from '../services/purchaseOrders'
import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderUpdatePayload,
} from '../interfaces/purchaseOrders'

interface PurchaseOrderState {
  orders: PurchaseOrder[]
  currentOrder: PurchaseOrder | null
  loading: boolean
  error: string | null

  fetchOrders: (status?: string, supplierId?: string) => Promise<void>
  fetchOrderDetail: (id: string) => Promise<void>
  createOrder: (data: PurchaseOrderCreatePayload) => Promise<PurchaseOrder>
  updateOrder: (id: string, data: PurchaseOrderUpdatePayload) => Promise<PurchaseOrder>
  confirmOrder: (id: string) => Promise<PurchaseOrder>
  cancelOrder: (id: string, reason: string) => Promise<PurchaseOrder>
  clearError: () => void
}

const usePurchaseOrderStore = create<PurchaseOrderState>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  fetchOrders: async (status, supplierId) => {
    set({ loading: true, error: null })
    try {
      const orders = await fetchPurchaseOrders(status, supplierId)
      set({ orders, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'No se pudieron cargar las órdenes de compra', loading: false })
    }
  },

  fetchOrderDetail: async (id) => {
    set({ loading: true, error: null })
    try {
      const order = await fetchPurchaseOrderDetail(id)
      set({ currentOrder: order, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'No se pudo cargar el detalle de la orden', loading: false })
    }
  },

  createOrder: async (data) => {
    set({ loading: true, error: null })
    try {
      const newOrder = await createPurchaseOrder(data)
      // Refresh list
      const orders = await fetchPurchaseOrders()
      set({ orders, loading: false })
      return newOrder
    } catch (err: any) {
      set({ error: err.message || 'No se pudo crear la orden de compra', loading: false })
      throw err
    }
  },

  updateOrder: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updated = await updatePurchaseOrder(id, data)
      // Refresh list
      const orders = await fetchPurchaseOrders()
      set({ orders, loading: false })
      return updated
    } catch (err: any) {
      set({ error: err.message || 'No se pudo actualizar la orden de compra', loading: false })
      throw err
    }
  },

  confirmOrder: async (id) => {
    set({ loading: true, error: null })
    try {
      const updated = await confirmPurchaseOrder(id)
      // Refresh details and list
      const orders = await fetchPurchaseOrders()
      set({ orders, currentOrder: updated, loading: false })
      return updated
    } catch (err: any) {
      set({ error: err.message || 'No se pudo emitir la orden de compra', loading: false })
      throw err
    }
  },

  cancelOrder: async (id, reason) => {
    set({ loading: true, error: null })
    try {
      const updated = await cancelPurchaseOrder(id, reason)
      // Refresh details and list
      const orders = await fetchPurchaseOrders()
      set({ orders, currentOrder: updated, loading: false })
      return updated
    } catch (err: any) {
      set({ error: err.message || 'No se pudo cancelar la orden de compra', loading: false })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))

export default usePurchaseOrderStore
