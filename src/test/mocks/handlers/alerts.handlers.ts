import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedAlerts = [
  {
    id: 1,
    product: 'prod-003',
    product_sku: 'CAN-APS-001',
    location: 'loc-bod-02',
    alert_type: 'LOW_STOCK',
    message: 'El stock de Agujas Punción Seca (CAN-APS-001) ha caído por debajo del nivel mínimo establecido (20 unidades).',
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: '2026-05-30T10:00:00Z',
  },
  {
    id: 2,
    product: 'prod-004',
    product_sku: 'CAN-GEL-005',
    location: 'loc-frio-01',
    alert_type: 'EXPIRATION_30',
    message: 'El lote GEL-2605-C de Gel Conductor vence en 18 días (2026-06-18).',
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: '2026-05-29T14:30:00Z',
    lot_code: 'GEL-2605-C',
  },
  {
    id: 3,
    product: 'prod-004',
    product_sku: 'CAN-GEL-005',
    location: 'loc-frio-01',
    alert_type: 'COLD_CHAIN_MISSING',
    message: 'Excursión de temperatura detectada en Cuarto frío (FRIO-01): 9.2°C registrado durante más de 30 minutos.',
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: '2026-05-30T08:15:00Z',
  },
  {
    id: 4,
    product: 'prod-002',
    product_sku: 'CAN-TENS-003',
    location: 'loc-bod-01',
    alert_type: 'STOCK_MISMATCH',
    message: 'Desincronización de stock detectada: físico reporta 4 unidades pero el ledger registra 3 en BOD-01.',
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: '2026-05-28T11:00:00Z',
  },
]

const seedHistory = [
  {
    id: 5,
    product: 'prod-001',
    product_sku: 'EQP-001',
    location: 'loc-bod-01',
    alert_type: 'LOW_STOCK',
    message: 'Stock bajo resuelto.',
    is_resolved: true,
    resolved_at: '2026-05-25T09:00:00Z',
    resolved_by: 'user-1',
    created_at: '2026-05-20T10:00:00Z',
  },
]

let alerts = [...seedAlerts]
let history = [...seedHistory]

export function resetAlertsData() {
  alerts = [...seedAlerts]
  history = [...seedHistory]
}

export const alertsHandlers = [
  http.get(`${API_BASE}/alerts/`, ({ request }) => {
    const url = new URL(request.url)
    const alertType = url.searchParams.get('alert_type')

    let result = [...alerts]
    if (alertType) {
      result = result.filter((a) => a.alert_type === alertType)
    }
    return HttpResponse.json(result)
  }),

  http.get(`${API_BASE}/alerts/history/`, ({ request }) => {
    const url = new URL(request.url)
    const alertType = url.searchParams.get('alert_type')

    let result = [...history]
    if (alertType) {
      result = result.filter((a) => a.alert_type === alertType)
    }
    return HttpResponse.json(result)
  }),

  http.post(`${API_BASE}/alerts/:id/resolve/`, ({ params }) => {
    const id = Number(params.id)
    const idx = alerts.findIndex((a) => a.id === id)
    if (idx === -1) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const resolved = {
      ...alerts[idx],
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: 'user-1',
    }
    alerts[idx] = resolved
    return HttpResponse.json(resolved)
  }),
]
