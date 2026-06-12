import { api } from './api'
import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderUpdatePayload,
} from '../interfaces/purchaseOrders'
import { useMocks } from '../mocks/config'

type BackendListResponse<T> = T[] | { results?: T[]; count?: number }
const normalizeList = <T,>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

// Simple in-memory mock fallback to keep compile/test clean, although we primarily use VITE_USE_MOCKS=false
let mockOrders: PurchaseOrder[] = []

export const fetchPurchaseOrders = async (
  status?: string,
  supplierId?: string,
): Promise<PurchaseOrder[]> => {
  if (useMocks) {
    let list = [...mockOrders]
    if (status) {
      list = list.filter((o) => o.status === status)
    }
    if (supplierId) {
      list = list.filter((o) => o.supplier === supplierId)
    }
    return list
  }
  const response = await api.get<BackendListResponse<PurchaseOrder>>('/purchasing/purchase-orders/', {
    params: {
      status: status || undefined,
      supplier_id: supplierId || undefined,
    },
  })
  return normalizeList(response.data)
}

export const fetchPurchaseOrderDetail = async (id: string): Promise<PurchaseOrder> => {
  if (useMocks) {
    const order = mockOrders.find((o) => o.id === id)
    if (!order) throw new Error('Orden de compra no encontrada')
    return order
  }
  const response = await api.get<PurchaseOrder>(`/purchasing/purchase-orders/${id}/`)
  return response.data
}

export const createPurchaseOrder = async (data: PurchaseOrderCreatePayload): Promise<PurchaseOrder> => {
  if (useMocks) {
    const newOrder: PurchaseOrder = {
      id: crypto.randomUUID(),
      number: `OC-${2026}-${String(mockOrders.length + 1).padStart(4, '0')}`,
      supplier: data.supplier_id,
      supplier_nombre: 'Proveedor Mock',
      status: 'borrador',
      expected_delivery: data.expected_delivery,
      notes: data.notes || '',
      items: data.items.map((item, index) => ({
        id: crypto.randomUUID(),
        product: item.product_id,
        product_name: 'Producto Mock ' + (index + 1),
        product_sku: 'SKU-' + (index + 1),
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        quantity_pending: item.quantity_ordered,
        unit_cost: item.unit_cost,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockOrders.push(newOrder)
    return newOrder
  }
  const response = await api.post<PurchaseOrder>('/purchasing/purchase-orders/', data)
  return response.data
}

export const updatePurchaseOrder = async (
  id: string,
  data: PurchaseOrderUpdatePayload,
): Promise<PurchaseOrder> => {
  if (useMocks) {
    const index = mockOrders.findIndex((o) => o.id === id)
    if (index === -1) throw new Error('Orden de compra no encontrada')
    if (mockOrders[index].status !== 'borrador') {
      throw new Error('Solo se pueden editar órdenes en borrador')
    }
    const updated: PurchaseOrder = {
      ...mockOrders[index],
      ...data,
      items: data.items
        ? data.items.map((it, idx) => ({
            id: `item-${idx}`,
            product: it.product_id,
            product_name: 'Mock Product',
            product_sku: 'MOCK-SKU',
            quantity_ordered: it.quantity_ordered,
            quantity_received: 0,
            quantity_pending: it.quantity_ordered,
            unit_cost: it.unit_cost,
            notes: it.notes,
          }))
        : mockOrders[index].items,
      updated_at: new Date().toISOString(),
    }
    mockOrders[index] = updated
    return updated
  }
  const response = await api.patch<PurchaseOrder>(`/purchasing/purchase-orders/${id}/`, data)
  return response.data
}

export const confirmPurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  if (useMocks) {
    const index = mockOrders.findIndex((o) => o.id === id)
    if (index === -1) throw new Error('Orden de compra no encontrada')
    mockOrders[index].status = 'pendiente'
    mockOrders[index].confirmed_at = new Date().toISOString()
    mockOrders[index].updated_at = new Date().toISOString()
    return mockOrders[index]
  }
  const response = await api.post<PurchaseOrder>(`/purchasing/purchase-orders/${id}/confirm/`)
  return response.data
}

export const cancelPurchaseOrder = async (id: string, reason: string): Promise<PurchaseOrder> => {
  if (useMocks) {
    const index = mockOrders.findIndex((o) => o.id === id)
    if (index === -1) throw new Error('Orden de compra no encontrada')
    mockOrders[index].status = 'cancelada'
    mockOrders[index].cancellation_reason = reason
    mockOrders[index].cancelled_at = new Date().toISOString()
    mockOrders[index].updated_at = new Date().toISOString()
    return mockOrders[index]
  }
  const response = await api.post<PurchaseOrder>(`/purchasing/purchase-orders/${id}/cancel/`, {
    reason,
  })
  return response.data
}
