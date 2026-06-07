export type PurchaseOrderStatus =
  | 'borrador'
  | 'pendiente'
  | 'parcialmente_recibida'
  | 'completada'
  | 'cancelada'

export interface PurchaseOrderItem {
  id: string
  product: string // Product UUID
  product_name: string
  product_sku: string
  quantity_ordered: number
  quantity_received: number
  quantity_pending: number
  unit_cost: string | number
  notes?: string
}

export interface PurchaseOrder {
  id: string
  number: string
  supplier: string // Supplier UUID
  supplier_nombre: string
  supplier_nit?: string
  status: PurchaseOrderStatus
  expected_delivery?: string | null
  notes: string
  items: PurchaseOrderItem[]
  created_by?: string
  confirmed_by?: string
  confirmed_at?: string
  cancelled_by?: string
  cancelled_at?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrderCreateItemPayload {
  product_id: string
  quantity_ordered: number
  unit_cost: number
  notes?: string
}

export interface PurchaseOrderCreatePayload {
  supplier_id: string
  expected_delivery?: string | null
  notes?: string
  items: PurchaseOrderCreateItemPayload[]
}

export interface PurchaseOrderUpdatePayload {
  expected_delivery?: string | null
  notes?: string
}
