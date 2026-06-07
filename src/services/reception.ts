import { api } from './api'
import { useMocks } from '../mocks/config'
import type { Reception, ReceptionCreatePayload } from '../interfaces/reception'
import type { PurchaseOrder } from '../interfaces/purchaseOrders'
import { fetchPurchaseOrders, fetchPurchaseOrderDetail } from './purchaseOrders'

/**
 * Obtiene las órdenes de compra pendientes o parcialmente recibidas.
 */
export const fetchPendingPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (useMocks) {
    // Si estamos en modo mocks, obtenemos todas y filtramos por estado activo de recepción
    const orders = await fetchPurchaseOrders()
    return orders.filter(
      (o) => o.status === 'pendiente' || o.status === 'parcialmente_recibida'
    )
  }
  
  const [pending, partial] = await Promise.all([
    fetchPurchaseOrders('pendiente'),
    fetchPurchaseOrders('parcialmente_recibida'),
  ])
  
  return [...pending, ...partial]
}

/**
 * Obtiene las órdenes de compra ya completadas para el historial.
 */
export const fetchCompletedPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  return fetchPurchaseOrders('completada')
}

/**
 * Obtiene el detalle de una orden de compra por su ID.
 */
export const fetchPendingOrderDetail = async (id: string): Promise<PurchaseOrder> => {
  return fetchPurchaseOrderDetail(id)
}

/**
 * Crea una recepción en borrador y luego la confirma en un solo paso.
 * Esto simplifica la UX y garantiza la trazabilidad con los movimientos de entrada.
 */
export const createAndConfirmReception = async (
  payload: ReceptionCreatePayload
): Promise<Reception> => {
  if (useMocks) {
    // Simulación en modo mocks
    const order = await fetchPurchaseOrderDetail(payload.po_id)
    
    // Simular recepción parcial o total en memoria
    let allCompleted = true
    order.items = order.items.map((item) => {
      const receivedItem = payload.items.find(
        (ri) => ri.purchase_order_item_id === item.id
      )
      if (receivedItem) {
        const newQtyReceived = Number(item.quantity_received) + Number(receivedItem.quantity_received)
        const newQtyPending = Math.max(0, Number(item.quantity_ordered) - newQtyReceived)
        
        if (newQtyPending > 0) {
          allCompleted = false
        }
        
        return {
          ...item,
          quantity_received: newQtyReceived,
          quantity_pending: newQtyPending,
        }
      }
      if (item.quantity_pending > 0) {
        allCompleted = false
      }
      return item
    })
    
    order.status = allCompleted ? 'completada' : 'parcialmente_recibida'
    order.updated_at = new Date().toISOString()
    
    // Crear objeto de recepción mock para retornar
    const mockReception: Reception = {
      id: crypto.randomUUID(),
      purchase_order: payload.po_id,
      po_number: order.number,
      supplier_nombre: order.supplier_nombre,
      status: 'confirmada',
      destination_location: payload.destination_location_id,
      location_name: 'Ubicación Destino Mock',
      received_by: 'almacenista_mock',
      confirmed_at: new Date().toISOString(),
      notes: payload.notes || '',
      items: payload.items.map((ri, idx) => ({
        id: crypto.randomUUID(),
        purchase_order_item: ri.purchase_order_item_id,
        product_name: `Producto Recibido Mock ${idx + 1}`,
        product_sku: `SKU-${idx + 1}`,
        quantity_expected: 100, // Dummy
        quantity_received: ri.quantity_received,
        lot_code: ri.lot_code || '',
        lot_expiration_date: ri.lot_expiration_date || null,
        discrepancy_note: ri.discrepancy_note || '',
        movement_id: crypto.randomUUID(),
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    return mockReception
  }

  // 1. Crear recepción en borrador
  const responseCreate = await api.post<Reception>('/purchasing/receptions/', payload)
  const receptionDraft = responseCreate.data

  // 2. Confirmar recepción para disparar movimientos de entrada y actualizar OC
  const responseConfirm = await api.post<Reception>(
    `/purchasing/receptions/${receptionDraft.id}/confirm/`
  )
  return responseConfirm.data
}
