/**
 * Servicio de Auditoría (Trazabilidad de Movimientos Físicos).
 * Consume el ledger de movimientos del backend.
 */

import { api } from './api'
import type { AuditLogEntry, AuditLogFilters, AuditLogListResponse } from '../interfaces/audit'

/** Lista paginada de movimientos físicos desde /movements/. */
export async function fetchAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogListResponse> {
  const params: Record<string, string | number> = {
    page_size: 100, // Carga 100 registros para permitir buen filtrado del lado del cliente
  }

  if (filters.product_id) {
    params.product_id = filters.product_id
  }
  if (filters.page) {
    params.page = filters.page
  }
  if (filters.page_size) {
    params.page_size = filters.page_size
  }

  // Si se selecciona un tipo nativo directo, se envía
  if (filters.movement_type && ['ENTRADA', 'TRASLADO', 'AJUSTE', 'DEVOLUCION'].includes(filters.movement_type)) {
    params.movement_type = filters.movement_type
  }

  const { data } = await api.get<AuditLogListResponse>('/movements/', { params })
  return data
}

/** Detalle de un movimiento por UUID. */
export async function fetchAuditLogDetail(id: string): Promise<AuditLogEntry> {
  const { data } = await api.get<AuditLogEntry>(`/movements/${id}/`)
  return data
}

/** Genera y descarga un archivo CSV con los registros de movimientos filtrados. */
export function exportAuditToCSV(entries: AuditLogEntry[], filename = 'auditoria.csv'): void {
  const headers = [
    'ID',
    'Fecha',
    'Operario ID',
    'Tipo de Movimiento',
    'Producto SKU',
    'Cantidad',
    'Stock Anterior',
    'Stock Nuevo',
    'Nota',
  ]

  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const rows = entries.map((e) => {
    // Resolver tipo de operación
    let typeLabel = e.movement_type
    if (e.movement_type === 'ENTRADA') {
      typeLabel = 'Entrada'
    } else if (e.movement_type === 'TRASLADO') {
      typeLabel = 'Transferencia'
    } else if (e.movement_type === 'DEVOLUCION') {
      typeLabel = 'Recepción'
    } else if (e.movement_type === 'AJUSTE') {
      typeLabel = e.destination_location ? 'Ajuste +' : 'Ajuste -'
    } else if (e.movement_type.startsWith('SALIDA') || e.movement_type === 'SALIDA_COMBO') {
      typeLabel = 'Salida'
    }

    // Resolver stocks
    let beforeStock = ''
    let afterStock = ''
    if (e.movement_type === 'ENTRADA' || (e.movement_type === 'AJUSTE' && e.destination_location)) {
      beforeStock = e.stock_previo_destino != null ? String(e.stock_previo_destino) : ''
      afterStock = e.stock_resultante_destino != null ? String(e.stock_resultante_destino) : ''
    } else if (e.movement_type.startsWith('SALIDA') || e.movement_type === 'SALIDA_COMBO' || (e.movement_type === 'AJUSTE' && e.origin_location)) {
      beforeStock = e.stock_previo_origen != null ? String(e.stock_previo_origen) : ''
      afterStock = e.stock_resultante_origen != null ? String(e.stock_resultante_origen) : ''
    } else if (e.movement_type === 'TRASLADO') {
      beforeStock = `Ori: ${e.stock_previo_origen ?? ''}`
      afterStock = `Des: ${e.stock_resultante_destino ?? ''}`
    }

    const note = e.justification || e.discrepancy_note || ''

    return [
      e.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
      e.created_at,
      e.executed_by,
      typeLabel,
      e.product_sku,
      e.quantity,
      beforeStock,
      afterStock,
      note,
    ]
  })

  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
