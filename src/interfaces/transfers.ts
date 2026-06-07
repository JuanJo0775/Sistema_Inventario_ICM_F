export interface TransferItem {
  id: string
  movement_type: string
  product: string // Product UUID
  product_sku: string
  lot: string | null // Lot UUID
  lot_code: string | null
  lot_expiration_date: string | null
  origin_location: string | null
  destination_location: string | null
  quantity: number
  stock_previo_origen: number | null
  stock_resultante_origen: number | null
  stock_previo_destino: number | null
  stock_resultante_destino: number | null
  serial_number: string | null
  justification: string | null
  executed_by: string // User UUID
  created_at: string
}

export interface CreateTransferPayload {
  product_id: string
  origin_id: string
  destination_id: string
  quantity: number
  lot_id?: string | null
  cold_chain_acknowledged?: boolean
  electrical_safety_acknowledged?: boolean
}

export interface LotOption {
  id: string
  code: string
  expiration_date: string
  available: number
}
