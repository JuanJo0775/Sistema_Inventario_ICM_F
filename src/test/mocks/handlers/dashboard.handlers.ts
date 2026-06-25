import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedOverview = {
  metrics: {
    stock_total: 3072,
    dispatches_today: 14,
    reorder_count: 2,
    invoices_issued: 14,
    invoice_range: 'ICM-0041 - 0054',
  },
  alerts: {
    active: 4,
    reorder: 2,
    expiring: 1,
    expiring_days: 18,
    returns: 1,
  },
  kpis: {
    warehouse_utilization: { label: 'Utilización de almacén', value: 74, unit: '%', precision: 0, threshold: 85, source: 'stock' },
    damaged_rate: { label: 'Índice de productos dañados', value: 1.2, unit: '%', precision: 1, threshold: 1, source: 'quality' },
    return_rate: { label: 'Tasa de devoluciones', value: 1.6, unit: '%', precision: 1, threshold: 2, source: 'returns' },
    dispatch_invoice_ratio: { label: 'Cumplimiento OTIF', value: 92, unit: '%', precision: 0, threshold: 95, source: 'dispatch' },
    discard_rate: { label: 'Tasa de descarte', value: 0.7, unit: '%', precision: 1, threshold: 0.5, source: 'quality' },
    cold_chain_alerts: { label: 'Cadena de frío', value: 99.2, unit: '%', precision: 1, threshold: 99.5, source: 'monitoring' },
  },
  movements: [
    { id: 'mov-001', type: 'in', title: 'Entrada - Agujas Punción Seca 0.25mm', sku: 'CAN-APS-001', quantity: 50, user: 'Luis M.', time: '08:32' },
    { id: 'mov-002', type: 'out', title: 'Salida Mayor - TENS Bifásico Pro', sku: 'CAN-TENS-003', quantity: 3, user: 'Luis M. · ICM-0052', time: '09:14' },
    { id: 'mov-003', type: 'transfer', title: 'Traslado - Gel Conductor 250ml', sku: 'CAN-GEL-005', quantity: 20, user: 'Ana P.', time: '10:05' },
    { id: 'mov-004', type: 'out', title: 'Salida Menor - Pelota Gel Ovalada', sku: 'CAN-PGO-002', quantity: 2, user: 'ICM-0053', time: '11:47' },
    { id: 'mov-005', type: 'return', title: 'Devolución pendiente - Ultrasonido 3MHz', sku: 'CAN-US-007', quantity: 1, user: 'SN: US-2024-0091', status: 'pending' },
  ],
  generated_at: '2026-06-22T10:00:00Z',
}

export function resetDashboardData() {
}

export const dashboardHandlers = [
  http.get(`${API_BASE}/dashboard/overview/`, () =>
    HttpResponse.json(seedOverview),
  ),
]
