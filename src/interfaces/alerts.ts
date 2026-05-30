export type AlertType =
  | 'LOW_STOCK'
  | 'EXPIRATION_30'
  | 'EXPIRATION_60'
  | 'COLD_CHAIN_MISSING'
  | 'STOCK_MISMATCH'

export interface AlertItem {
  id: string
  product: string
  product_sku: string
  lot: string | null
  lot_code: string | null
  lot_expiration_date: string | null
  location: string | null
  alert_type: AlertType
  message: string
  is_resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}
