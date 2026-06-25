import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

export const dispatchHandlers = [
  http.get(`${API_BASE}/inventory/locations/`, () =>
    HttpResponse.json([
      { id: 'loc-bod-01', code: 'BOD-01', name: 'Bodega principal' },
      { id: 'loc-frio-01', code: 'FRIO-01', name: 'Cuarto frío' },
    ]),
  ),

  http.get(`${API_BASE}/movements/dispatches/`, () =>
    HttpResponse.json({ results: [], count: 0 }),
  ),

  http.get(`${API_BASE}/catalog/combos/`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${API_BASE}/catalog/products/`, () =>
    HttpResponse.json({
      count: 1,
      results: [
        {
          id: 'prod-1',
          sku: 'EQP-001',
          name: 'Monitor Cardiaco',
          category: 'cat-1',
          category_slug: 'electroterapia',
          subcategory: null,
          barcode: '7701234567890',
          brand: 'MarcaX',
          requires_cold_chain: false,
          requires_expiration: false,
          requires_lot: false,
          requires_serial_number: false,
          special_conditions: false,
          is_active: true,
          weight_grams: null,
          notes: '',
          reorder_point: 0,
          expiration_date: null,
          sale_price_retail: 15000,
          sale_price_wholesale: 12000,
          tax_rate_pct: 19,
          stockTotal: 50,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    }),
  ),

  http.get(`${API_BASE}/inventory/products/:id/stock/`, ({ params }) =>
    HttpResponse.json({
      product_id: params.id,
      total: 50,
      by_location: [{ location_code: 'BOD-01', quantity: 50 }],
      per_location: [{ location_code: 'BOD-01', quantity: 50 }],
    }),
  ),

  http.post(`${API_BASE}/movements/dispatches/`, () =>
    HttpResponse.json(
      {
        id: 'mov-out-new',
        movement_type: 'SALIDA_VENTA_MAYOR',
        product: 'prod-1',
        product_sku: 'EQP-001',
        origin_location: 'loc-bod-01',
        destination_location: null,
        quantity: 2,
        serial_number: null,
        invoice_number: 'ICM-1234',
        invoice_pdf: null,
        executed_by: 'aux1',
        created_at: new Date(Date.now() - 60000).toISOString(),
        note: null,
        unit_price: 12000,
        subtotal: 24000,
        tax_amount: 4560,
        total_amount: 28560,
        currency: 'COP',
      },
      { status: 201 },
    ),
  ),
]
