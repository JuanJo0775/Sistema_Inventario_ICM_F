/**
 * Interfaces del módulo de Auditoría (Trazabilidad de Movimientos Físicos).
 * Solo lectura — los movimientos son inmutables en el ledger.
 */

export interface AuditLogEntry {
  id: string
  movement_type: string
  product: string // Product UUID
  product_sku: string // Product SKU string
  lot: string | null
  lot_code: string | null
  origin_location: string | null
  destination_location: string | null
  quantity: number
  stock_previo_origen: number | null
  stock_resultante_origen: number | null
  stock_previo_destino: number | null
  stock_resultante_destino: number | null
  serial_number?: string | null
  quantity_invoiced?: number | null
  discrepancy_note?: string | null
  justification?: string | null
  executed_by: number | string // User ID
  created_at: string
}

/** Respuesta paginada del endpoint GET /movements/. */
export interface AuditLogListResponse {
  count: number
  next: string | null
  previous: string | null
  results: AuditLogEntry[]
}

/** Parámetros de filtro para la trazabilidad. */
export interface AuditLogFilters {
  product_id?: string
  movement_type?: string
  user_id?: string | number
  start?: string
  end?: string
  page?: number
  page_size?: number
}

/** Configuración visual de un tipo de evento (badge). */
export interface EventTypeBadgeConfig {
  label: string
  bg: string
  color: string
}
