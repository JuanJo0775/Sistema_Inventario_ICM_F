import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedProducts = [
  { id: 'prod-10', sku: 'CAN-US-007', name: 'Ultrasonido 3MHz', category: 'cat-1', category_slug: 'electroterapia', subcategory: 'brand-1', barcode: '770000000101', brand: 'MarcaX', requires_cold_chain: false, requires_expiration: false, requires_lot: false, requires_serial_number: true, special_conditions: false, is_active: true, weight_grams: null, notes: '', reorder_point: 5, expiration_date: null, unit_cost: 150000, sale_price_retail: 280000, sale_price_wholesale: 220000, tax_rate_pct: 19, currency: 'COP', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'prod-11', sku: 'CAN-TENS-003', name: 'TENS Bifasico Pro', category: 'cat-2', category_slug: 'movilidad', subcategory: 'brand-2', barcode: '770000000102', brand: 'MedTech', requires_cold_chain: false, requires_expiration: false, requires_lot: false, requires_serial_number: true, special_conditions: false, is_active: true, weight_grams: null, notes: '', reorder_point: 3, expiration_date: null, unit_cost: 45000, sale_price_retail: 85000, sale_price_wholesale: 68000, tax_rate_pct: 19, currency: 'COP', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'prod-12', sku: 'MESA-HID-001', name: 'Mesa Hidraulica Basica', category: 'cat-2', category_slug: 'movilidad', subcategory: 'brand-2', barcode: '770000000103', brand: 'MedTech', requires_cold_chain: false, requires_expiration: false, requires_lot: false, requires_serial_number: false, special_conditions: false, is_active: true, weight_grams: null, notes: '', reorder_point: 2, expiration_date: null, unit_cost: 320000, sale_price_retail: 580000, sale_price_wholesale: 460000, tax_rate_pct: 19, currency: 'COP', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'prod-13', sku: 'CAN-APS-001', name: 'Agujas Puncion Seca 0.25mm', category: 'cat-1', category_slug: 'electroterapia', subcategory: 'brand-1', barcode: '770000000104', brand: 'MarcaX', requires_cold_chain: false, requires_expiration: true, requires_lot: true, requires_serial_number: false, special_conditions: false, is_active: true, weight_grams: null, notes: '', reorder_point: 100, expiration_date: '2026-12-31', unit_cost: 500, sale_price_retail: 1200, sale_price_wholesale: 900, tax_rate_pct: 19, currency: 'COP', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

const seedLocations = [
  { id: 'loc-bod-01', code: 'BOD-01', name: 'Bodega Principal' },
  { id: 'loc-bod-02', code: 'BOD-02', name: 'Bodega Consumibles' },
  { id: 'loc-frio-01', code: 'FRIO-01', name: 'Cuarto Frío' },
]

const seedReturnMovements = [
  {
    id: 'ret-hist-001',
    product: 'prod-11',
    product_sku: 'CAN-TENS-003',
    quantity: 1,
    serial_number: 'TENS-1120',
    executed_by: 'Carolina R.',
    created_at: '2025-06-01T10:00:00Z',
    related_movement: null,
    destination_location: 'loc-bod-02',
  },
  {
    id: 'ret-hist-002',
    product: 'prod-12',
    product_sku: 'MESA-HID-001',
    quantity: 2,
    serial_number: null,
    executed_by: 'Sistema',
    created_at: '2025-05-15T14:30:00Z',
    related_movement: 'mov-out-1',
    destination_location: 'loc-bod-01',
  },
]

const seedDispatchMovements = [
  {
    id: 'mov-out-1',
    movement_type: 'SALIDA_VENTA_MAYOR',
    product: 'prod-11',
    product_sku: 'CAN-TENS-003',
    quantity: 5,
    created_at: '2025-05-10T08:00:00Z',
    invoice_number: 'FAC-001',
    customer_snapshot: { customer_name: 'Clinica Del Norte', customer_doc: '900123456-7' },
  },
  {
    id: 'mov-out-2',
    movement_type: 'SALIDA_VENTA_MENOR',
    product: 'prod-10',
    product_sku: 'CAN-US-007',
    quantity: 2,
    created_at: '2025-05-20T09:00:00Z',
    invoice_number: 'FAC-002',
    customer_snapshot: { customer_name: 'Dr. Lopez', customer_doc: 'CC-123456' },
  },
]

let products = [...seedProducts]
let returnMovements = [...seedReturnMovements]
let dispatchMovements = [...seedDispatchMovements]

export function resetReturnsData() {
  products = [...seedProducts]
  returnMovements = [...seedReturnMovements]
  dispatchMovements = [...seedDispatchMovements]
}

export const returnsHandlers = [
  http.get(`${API_BASE}/inventory/locations/`, () =>
    HttpResponse.json(seedLocations),
  ),

  http.get(`${API_BASE}/inventory/search/`, ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() || ''
    const category = url.searchParams.get('category') || ''

    let result = [...products]
    if (category) result = result.filter((p) => p.category === category)
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)),
      )
    }
    return HttpResponse.json(result)
  }),

  http.get(`${API_BASE}/movements/returns/`, () =>
    HttpResponse.json({ results: returnMovements, count: returnMovements.length }),
  ),

  http.post(`${API_BASE}/movements/returns/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newMovement = {
      id: `ret-${Date.now()}`,
      product: body.product_id as string,
      product_sku: 'NEW-SKU',
      quantity: body.quantity as number,
      serial_number: (body.serial_number as string) || null,
      executed_by: 'Usuario Test',
      created_at: new Date().toISOString(),
      related_movement: (body.related_movement_id as string) || null,
      destination_location: (body.location_id as string) || null,
    }
    returnMovements = [newMovement as any, ...returnMovements]
    return HttpResponse.json(newMovement, { status: 201 })
  }),

  http.get(`${API_BASE}/movements/dispatches/`, () =>
    HttpResponse.json({ results: dispatchMovements, count: dispatchMovements.length }),
  ),
]
