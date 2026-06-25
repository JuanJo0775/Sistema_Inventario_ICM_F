import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

export const seedAdjustments = [
  {
    id: 'adj-1',
    product_id: 'prod-1',
    location_id: 'loc-bod-01',
    new_quantity: 38,
    justification: '7 unidades faltantes en conteo mensual',
    created_at: '2026-05-07T09:12:00Z',
    executed_by: 'Carlos A.',
  },
  {
    id: 'adj-2',
    product_id: 'prod-2',
    location_id: 'loc-bod-02',
    new_quantity: 15,
    justification: 'Corrección por entrada no registrada',
    created_at: '2026-04-30T14:22:00Z',
    executed_by: 'Carlos A.',
  },
]

let adjustments = [...seedAdjustments]

export function resetAdjustmentsData() {
  adjustments = [...seedAdjustments]
}

export const adjustmentsHandlers = [
  http.get(`${API_BASE}/inventory/locations/`, () =>
    HttpResponse.json([
      { id: 'loc-bod-01', code: 'BOD-01', name: 'Bodega Principal' },
      { id: 'loc-bod-02', code: 'BOD-02', name: 'Bodega Consumibles' },
      { id: 'loc-frio-01', code: 'FRIO-01', name: 'Cuarto Frío' },
    ]),
  ),

  http.post(`${API_BASE}/movements/adjustments/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newAdjustment = {
      id: `adj-${Date.now()}`,
      product_id: body.product_id as string,
      location_id: body.location_id as string,
      new_quantity: body.new_quantity as number,
      justification: body.justification as string,
      created_at: new Date().toISOString(),
      executed_by: 'Usuario Test',
    }
    adjustments = [newAdjustment, ...adjustments]
    return HttpResponse.json(newAdjustment, { status: 201 })
  }),
]
