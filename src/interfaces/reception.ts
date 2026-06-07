export type ReceptionStatus = 'borrador' | 'confirmada' | 'cancelada'

export interface ReceptionItem {
  id: string
  purchase_order_item: string // PurchaseOrderItem UUID
  product_name: string
  product_sku: string
  quantity_expected: number
  quantity_received: number
  lot_code: string
  lot_expiration_date: string | null
  discrepancy_note: string
  movement_id: string | null
}

export interface Reception {
  id: string
  purchase_order: string // PurchaseOrder UUID
  po_number: string
  supplier_nombre: string
  status: ReceptionStatus
  destination_location: string // Location UUID
  location_name: string
  received_by: string // Username or User UUID
  confirmed_at: string | null
  notes: string
  items: ReceptionItem[]
  created_at: string
  updated_at: string
}

export interface ReceptionItemCreatePayload {
  purchase_order_item_id: string
  quantity_received: number
  lot_code?: string
  lot_expiration_date?: string | null
  discrepancy_note?: string
}

export interface ReceptionCreatePayload {
  po_id: string
  destination_location_id: string
  notes?: string
  items: ReceptionItemCreatePayload[]
}

export interface ReceptionOverview {
  locations: any[]
  expectedOrders: any[]
  recentMovements: any[]
}

