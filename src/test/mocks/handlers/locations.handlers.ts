import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedLocations = [
  {
    id: 'loc-1',
    code: 'BOD-01',
    name: 'Bodega Principal',
    description: 'Bodega central de almacenamiento',
    is_retail: false,
    max_capacity: 1000,
    storage_type_id: 'st-1',
    storage_type_code: 'GEN',
    storage_type_name: 'General',
    storage_template_id: null,
    storage_template_code: null,
    storage_template_name: null,
    operational_status: 'active' as const,
    capacity_mode: 'relative_scale' as const,
    capacity_level: null,
    capacity_score: 100,
    occupancy_estimate_pct: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'loc-2',
    code: 'BOD-02',
    name: 'Bodega Consumibles',
    description: 'Almacenamiento de insumos médicos',
    is_retail: false,
    max_capacity: 500,
    storage_type_id: 'st-2',
    storage_type_code: 'FRI',
    storage_type_name: 'Refrigerado',
    storage_template_id: null,
    storage_template_code: null,
    storage_template_name: null,
    operational_status: 'active' as const,
    capacity_mode: 'relative_scale' as const,
    capacity_level: null,
    capacity_score: 80,
    occupancy_estimate_pct: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'loc-3',
    code: 'BOD-03',
    name: 'Bodega Repuestos',
    description: 'Repuestos y accesorios',
    is_retail: false,
    max_capacity: 300,
    storage_type_id: 'st-1',
    storage_type_code: 'GEN',
    storage_type_name: 'General',
    storage_template_id: null,
    storage_template_code: null,
    storage_template_name: null,
    operational_status: 'active' as const,
    capacity_mode: 'relative_scale' as const,
    capacity_level: null,
    capacity_score: 50,
    occupancy_estimate_pct: null,
    is_active: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'loc-4',
    code: 'BOD-04',
    name: 'Cuarto Frío',
    description: 'Almacenamiento refrigerado para productos sensibles',
    is_retail: false,
    max_capacity: 200,
    storage_type_id: 'st-2',
    storage_type_code: 'FRI',
    storage_type_name: 'Refrigerado',
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

const seedStorageTypes = [
  { id: 'st-1', code: 'GEN', name: 'General', is_active: true },
  { id: 'st-2', code: 'FRI', name: 'Refrigerado', is_active: true },
  { id: 'st-3', code: 'CON', name: 'Controlado', is_active: true },
]

const seedUsers = [
  { id: 'user-1', username: 'admin', first_name: 'Admin', last_name: 'ICM' },
  { id: 'user-2', username: 'almacenista1', first_name: 'Carlos', last_name: 'Mora' },
]

const seedProducts = [
  {
    id: 'prod-1',
    sku: 'EQP-001',
    name: 'Monitor Cardiaco',
    category: 'cat-1',
    category_slug: 'electroterapia',
    brand: 'MarcaX',
    requires_expiration: false,
    requires_lot: false,
    requires_cold_chain: false,
    requires_serial_number: true,
    is_active: true,
    sale_price_retail: 15000,
  },
  {
    id: 'prod-2',
    sku: 'INS-001',
    name: 'Guantes Quirúrgicos',
    category: 'cat-3',
    category_slug: 'insumos',
    brand: 'MedTech',
    requires_expiration: true,
    requires_lot: true,
    requires_cold_chain: false,
    requires_serial_number: false,
    is_active: true,
    sale_price_retail: 1200,
  },
  {
    id: 'prod-3',
    sku: 'MVL-001',
    name: 'Silla de Ruedas',
    category: 'cat-2',
    category_slug: 'movilidad',
    brand: 'WellnessPro',
    requires_expiration: false,
    requires_lot: false,
    requires_cold_chain: true,
    requires_serial_number: false,
    is_active: true,
    sale_price_retail: 450000,
  },
]

const seedTransfers = [
  {
    id: 'trf-1',
    movement_type: 'transfer',
    product: 'prod-1',
    product_sku: 'EQP-001',
    lot: null,
    lot_code: null,
    lot_expiration_date: null,
    origin_location: 'loc-1',
    destination_location: 'loc-2',
    quantity: 5,
    stock_previo_origen: 20,
    stock_resultante_origen: 15,
    stock_previo_destino: 10,
    stock_resultante_destino: 15,
    serial_number: null,
    justification: 'Traslado interno de inventario (Reposición de vitrina)',
    executed_by: 'user-1',
    created_at: '2026-06-10T10:00:00Z',
  },
  {
    id: 'trf-2',
    movement_type: 'transfer',
    product: 'prod-2',
    product_sku: 'INS-001',
    lot: 'lot-1',
    lot_code: 'LOTE-001',
    lot_expiration_date: '2026-12-31',
    origin_location: 'loc-2',
    destination_location: 'loc-1',
    quantity: 20,
    stock_previo_origen: 100,
    stock_resultante_origen: 80,
    stock_previo_destino: 5,
    stock_resultante_destino: 25,
    serial_number: null,
    justification: 'Traslado interno de inventario (Devolución a bodega)',
    executed_by: 'user-2',
    created_at: '2026-06-09T14:30:00Z',
  },
]

let locations = [...seedLocations]
let storageTypes = [...seedStorageTypes]
let transfers = [...seedTransfers]
let newTransfers: any[] = []

export const locationsHandlers = [
  // ── Locations ────────────────────────────────────────────
  http.get(`${API_BASE}/inventory/locations/`, ({ request }) => {
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    let result = locations
    if (!includeInactive) {
      result = result.filter(l => l.is_active)
    }
    return HttpResponse.json(result)
  }),

  http.post(`${API_BASE}/inventory/locations/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newLoc = {
      id: `loc-${Date.now()}`,
      code: `BOD-${String(locations.length + 1).padStart(2, '0')}`,
      name: body.name,
      description: body.description || '',
      is_retail: false,
      max_capacity: null,
      storage_type_id: body.storage_type_id || null,
      storage_type_code: storageTypes.find(s => s.id === body.storage_type_id)?.code || null,
      storage_type_name: storageTypes.find(s => s.id === body.storage_type_id)?.name || null,
      storage_template_id: null,
      storage_template_code: null,
      storage_template_name: null,
      operational_status: body.operational_status || 'active',
      capacity_mode: body.capacity_mode || 'relative_scale',
      capacity_level: null,
      capacity_score: body.capacity_score ?? 100,
      occupancy_estimate_pct: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    locations.push(newLoc)
    return HttpResponse.json(newLoc, { status: 201 })
  }),

  http.patch(`${API_BASE}/inventory/locations/:id/`, async ({ params, request }) => {
    const idx = locations.findIndex(l => l.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const body = (await request.json()) as any
    const updated = { ...locations[idx], ...body, updated_at: new Date().toISOString() }
    if (body.storage_type_id !== undefined) {
      updated.storage_type_code = storageTypes.find(s => s.id === body.storage_type_id)?.code || null
      updated.storage_type_name = storageTypes.find(s => s.id === body.storage_type_id)?.name || null
    }
    locations[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.delete(`${API_BASE}/inventory/locations/:id/`, ({ params }) => {
    const idx = locations.findIndex(l => l.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    locations[idx] = { ...locations[idx], is_active: false, updated_at: new Date().toISOString() }
    return HttpResponse.json(null, { status: 204 })
  }),

  // ── Storage Types ────────────────────────────────────────
  http.get(`${API_BASE}/inventory/storage-types/`, () =>
    HttpResponse.json(storageTypes),
  ),

  // ── Transfers ────────────────────────────────────────────
  http.get(`${API_BASE}/movements/transfers/`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('page_size') || '10', 10)
    const all = [...transfers, ...newTransfers]
    const start = (page - 1) * pageSize
    const paged = all.slice(start, start + pageSize)
    return HttpResponse.json({ count: all.length, results: paged })
  }),

  http.post(`${API_BASE}/movements/transfers/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newTransfer = {
      id: `trf-${Date.now()}`,
      movement_type: 'transfer',
      product: body.product_id,
      product_sku: seedProducts.find(p => p.id === body.product_id)?.sku || '',
      lot: body.lot_id || null,
      lot_code: null,
      lot_expiration_date: null,
      origin_location: body.origin_id,
      destination_location: body.destination_id,
      quantity: body.quantity,
      stock_previo_origen: null,
      stock_resultante_origen: null,
      stock_previo_destino: null,
      stock_resultante_destino: null,
      serial_number: null,
      justification: body.justification || 'Traslado interno de inventario',
      executed_by: 'user-1',
      created_at: new Date().toISOString(),
    }
    newTransfers.push(newTransfer)
    return HttpResponse.json(newTransfer, { status: 201 })
  }),

  // ── Movements (for lot calculation) ──────────────────────
  http.get(`${API_BASE}/movements/`, ({ request }) => {
    const url = new URL(request.url)
    const productId = url.searchParams.get('product_id')
    if (productId === 'prod-2') {
      return HttpResponse.json([
        {
          id: 'mov-1',
          movement_type: 'purchase_reception',
          product: 'prod-2',
          lot: 'lot-1',
          lot_code: 'LOTE-001',
          lot_expiration_date: '2026-12-31',
          destination_location: 'loc-2',
          quantity: 100,
        },
        {
          id: 'mov-2',
          movement_type: 'transfer',
          product: 'prod-2',
          lot: 'lot-1',
          lot_code: 'LOTE-001',
          lot_expiration_date: '2026-12-31',
          origin_location: 'loc-2',
          destination_location: 'loc-1',
          quantity: 20,
        },
      ])
    }
    return HttpResponse.json([])
  }),

  // ── Users ────────────────────────────────────────────────
  http.get(`${API_BASE}/auth/users/`, () =>
    HttpResponse.json(seedUsers),
  ),

  // ── Products (for transfer creation) ─────────────────────
  http.get(`${API_BASE}/catalog/products/`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    const pageSize = parseInt(url.searchParams.get('page_size') || '25', 10)

    let result = [...seedProducts]
    if (!includeInactive) {
      result = result.filter(p => p.is_active)
    }
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search),
      )
    }
    return HttpResponse.json({ count: result.length, results: result.slice(0, pageSize) })
  }),

  // ── Product Stock ────────────────────────────────────────
  http.get(`${API_BASE}/inventory/products/:id/stock/`, ({ params }) => {
    const product = seedProducts.find(p => p.id === params.id)
    if (!product) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json({
      product_id: params.id,
      product_name: product.name,
      sku: product.sku,
      total: 100,
      by_location: [
        { location_id: 'loc-1', location_code: 'BOD-01', location_name: 'Bodega Principal', quantity: 60 },
        { location_id: 'loc-2', location_code: 'BOD-02', location_name: 'Bodega Consumibles', quantity: 40 },
      ],
      per_location: [
        { location_id: 'loc-1', location_code: 'BOD-01', location_name: 'Bodega Principal', quantity: 60 },
        { location_id: 'loc-2', location_code: 'BOD-02', location_name: 'Bodega Consumibles', quantity: 40 },
      ],
    })
  }),
]

export function resetLocationsData() {
  locations = [...seedLocations]
  storageTypes = [...seedStorageTypes]
  transfers = [...seedTransfers]
  newTransfers = []
}
