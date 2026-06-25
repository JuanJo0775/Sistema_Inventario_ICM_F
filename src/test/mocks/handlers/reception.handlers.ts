import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedLocations = [
  {
    id: 'loc-bod-01',
    code: 'BOD-01',
    name: 'Bodega principal',
    description: 'Bodega central',
    is_retail: false,
    max_capacity: 1000,
    storage_type_id: null,
    storage_type_code: null,
    storage_type_name: null,
    storage_template_id: null,
    storage_template_code: null,
    storage_template_name: null,
    operational_status: 'active' as const,
    capacity_mode: 'none' as const,
    capacity_level: null,
    capacity_score: null,
    occupancy_estimate_pct: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'loc-bod-02',
    code: 'BOD-02',
    name: 'Bodega consumibles',
    description: 'Consumibles médicos',
    is_retail: false,
    max_capacity: 500,
    storage_type_id: null,
    storage_type_code: null,
    storage_type_name: null,
    storage_template_id: null,
    storage_template_code: null,
    storage_template_name: null,
    operational_status: 'active' as const,
    capacity_mode: 'none' as const,
    capacity_level: null,
    capacity_score: null,
    occupancy_estimate_pct: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'loc-frio-01',
    code: 'FRIO-01',
    name: 'Cuarto frío',
    description: 'Almacenamiento refrigerado',
    is_retail: false,
    max_capacity: 200,
    storage_type_id: null,
    storage_type_code: null,
    storage_type_name: null,
    storage_template_id: null,
    storage_template_code: null,
    storage_template_name: null,
    operational_status: 'restricted' as const,
    capacity_mode: 'none' as const,
    capacity_level: null,
    capacity_score: null,
    occupancy_estimate_pct: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

const seedOrders = [
  {
    id: 'oc-1',
    number: 'OC-2026-0001',
    supplier: 'sup-1',
    supplier_nombre: 'Medical SAS',
    supplier_nit: '900.123.456-1',
    status: 'pendiente',
    expected_delivery: '2026-07-15',
    notes: '',
    items: [
      {
        id: 'item-1',
        product: 'prod-1',
        product_name: 'Monitor Cardiaco',
        product_sku: 'EQP-001',
        quantity_ordered: 5,
        quantity_received: 0,
        quantity_pending: 5,
        unit_cost: 12000,
      },
      {
        id: 'item-2',
        product: 'prod-2',
        product_name: 'Guantes Quirúrgicos',
        product_sku: 'INS-001',
        quantity_ordered: 100,
        quantity_received: 0,
        quantity_pending: 100,
        unit_cost: 500,
      },
    ],
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'oc-2',
    number: 'OC-2026-0002',
    supplier: 'sup-1',
    supplier_nombre: 'Medical SAS',
    supplier_nit: '900.123.456-1',
    status: 'parcialmente_recibida',
    expected_delivery: '2026-07-20',
    notes: 'Recepción parcial previa',
    items: [
      {
        id: 'item-3',
        product: 'prod-1',
        product_name: 'Monitor Cardiaco',
        product_sku: 'EQP-001',
        quantity_ordered: 10,
        quantity_received: 3,
        quantity_pending: 7,
        unit_cost: 12000,
      },
    ],
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-10T00:00:00Z',
  },
  {
    id: 'oc-3',
    number: 'OC-2026-0003',
    supplier: 'sup-2',
    supplier_nombre: 'Distribuidora Local',
    supplier_nit: '800.456.789-0',
    status: 'completada',
    expected_delivery: '2026-07-10',
    notes: '',
    items: [
      {
        id: 'item-4',
        product: 'prod-3',
        product_name: 'Silla de Ruedas',
        product_sku: 'MVL-001',
        quantity_ordered: 2,
        quantity_received: 2,
        quantity_pending: 0,
        unit_cost: 250000,
      },
    ],
    created_at: '2026-05-15T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
  },
]

const seedProducts = [
  {
    id: 'prod-1',
    sku: 'EQP-001',
    name: 'Monitor Cardiaco',
    category: 'cat-1',
    category_slug: 'electroterapia',
    requires_serial_number: true,
    requires_expiration: false,
    requires_lot: false,
    is_active: true,
  },
  {
    id: 'prod-2',
    sku: 'INS-001',
    name: 'Guantes Quirúrgicos',
    category: 'cat-3',
    category_slug: 'insumos',
    requires_serial_number: false,
    requires_expiration: true,
    requires_lot: true,
    is_active: true,
  },
  {
    id: 'prod-3',
    sku: 'MVL-001',
    name: 'Silla de Ruedas',
    category: 'cat-2',
    category_slug: 'movilidad',
    requires_serial_number: false,
    requires_expiration: false,
    requires_lot: false,
    is_active: true,
  },
]

const seedCategories = [
  { id: 'cat-1', name: 'Electroterapia', slug: 'electroterapia', requires_serial_number: true, is_returnable: false, description: 'Equipos de electroterapia', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-2', name: 'Movilidad', slug: 'movilidad', requires_serial_number: false, is_returnable: true, description: 'Ayudas para movilidad', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-3', name: 'Insumos', slug: 'insumos', requires_serial_number: false, is_returnable: false, description: 'Insumos médicos', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

let orders = [...seedOrders]
let locations = [...seedLocations]

export const receptionHandlers = [
  http.get(`${API_BASE}/inventory/locations/`, () =>
    HttpResponse.json(locations),
  ),

  http.get(`${API_BASE}/purchasing/purchase-orders/`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let result = orders
    if (status) {
      result = result.filter(o => o.status === status)
    }
    return HttpResponse.json(result)
  }),

  http.get(`${API_BASE}/purchasing/purchase-orders/:id/`, ({ params }) => {
    const order = orders.find(o => o.id === params.id)
    if (!order) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(order)
  }),

  http.post(`${API_BASE}/purchasing/receptions/`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ id: `rec-${Date.now()}`, ...body }, { status: 201 })
  }),

  http.post(`${API_BASE}/purchasing/receptions/:id/confirm/`, () =>
    HttpResponse.json({ status: 'confirmed' }),
  ),

  http.get(`${API_BASE}/catalog/categories/`, ({ request }) => {
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    let result = seedCategories
    if (!includeInactive) {
      result = result.filter(c => c.is_active)
    }
    return HttpResponse.json(result)
  }),

  http.get(`${API_BASE}/catalog/products/`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    const pageSize = parseInt(url.searchParams.get('page_size') || '25', 10)
    let result = [...seedProducts]
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search),
      )
    }
    return HttpResponse.json({ count: result.length, results: result.slice(0, pageSize) })
  }),

  http.get(`${API_BASE}/catalog/products/:id/`, ({ params }) => {
    const product = seedProducts.find(p => p.id === params.id)
    if (!product) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(product)
  }),
]

export function resetReceptionData() {
  orders = [...seedOrders]
  locations = [...seedLocations]
}
