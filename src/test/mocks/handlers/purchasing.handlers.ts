import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedSuppliers = [
  {
    id: 'sup-1',
    nombre_comercial: 'Medical SAS',
    razon_social: 'Medical Colombia SAS',
    nit: '900.123.456-1',
    pais: 'Colombia',
    correo: 'contacto@medicalsas.co',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    direccion: 'Calle 100 # 15-20',
    is_active: true,
    observaciones: 'Proveedor principal de insumos médicos descartables.',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sup-2',
    nombre_comercial: 'China Medical Ltd',
    razon_social: 'China Medical Devices Co.',
    nit: 'CN-987654321',
    pais: 'China',
    correo: 'sales@chinamedical.com',
    telefono: '+86 21 6123 4567',
    ciudad: 'Shanghai',
    direccion: 'Pudong New Area, Bldg 12',
    is_active: false,
    observaciones: 'Proveedor internacional. Tiempos de entrega de 45 días.',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sup-3',
    nombre_comercial: 'Distribuidora Local',
    razon_social: 'Distribuidora Local Ltda',
    nit: '800.456.789-0',
    pais: 'Colombia',
    correo: 'info@distribuidoralocal.com',
    telefono: '3109876543',
    ciudad: 'Medellín',
    direccion: 'Carrera 43 # 30-10',
    is_active: true,
    observaciones: 'Proveedor local de confianza.',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

const seedProducts = [
  {
    id: 'prod-1',
    sku: 'EQP-001',
    name: 'Monitor Cardiaco',
    sale_price_retail: 15000,
    is_active: true,
  },
  {
    id: 'prod-2',
    sku: 'INS-001',
    name: 'Guantes Quirúrgicos',
    sale_price_retail: 1200,
    is_active: true,
  },
]

let suppliers = [...seedSuppliers]
let orders: any[] = []

const seedOrders = [
  {
    id: 'oc-1',
    number: 'OC-2026-0001',
    supplier: 'sup-1',
    supplier_nombre: 'Medical SAS',
    supplier_nit: '900.123.456-1',
    status: 'borrador',
    expected_delivery: '2026-07-15',
    notes: 'Urgente',
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
    status: 'pendiente',
    expected_delivery: '2026-07-20',
    notes: '',
    items: [
      {
        id: 'item-2',
        product: 'prod-2',
        product_name: 'Guantes Quirúrgicos',
        product_sku: 'INS-001',
        quantity_ordered: 100,
        quantity_received: 30,
        quantity_pending: 70,
        unit_cost: 800,
      },
    ],
    confirmed_at: '2026-06-05T00:00:00Z',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
  },
]

export const purchasingHandlers = [
  // ── Suppliers ─────────────────────────────────────────────
  http.get(`${API_BASE}/purchasing/suppliers/`, ({ request }) => {
    const url = new URL(request.url)
    const isActive = url.searchParams.get('is_active')
    let result = suppliers
    if (isActive === 'true') result = result.filter(s => s.is_active)
    if (isActive === 'false') result = result.filter(s => !s.is_active)
    return HttpResponse.json(result)
  }),

  http.get(`${API_BASE}/purchasing/suppliers/:id/`, ({ params }) => {
    const supplier = suppliers.find(s => s.id === params.id)
    if (!supplier) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(supplier)
  }),

  http.post(`${API_BASE}/purchasing/suppliers/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newSupplier = {
      id: `sup-${Date.now()}`,
      ...body,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    suppliers.push(newSupplier)
    return HttpResponse.json(newSupplier, { status: 201 })
  }),

  http.patch(`${API_BASE}/purchasing/suppliers/:id/`, async ({ params, request }) => {
    const idx = suppliers.findIndex(s => s.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const body = (await request.json()) as any
    suppliers[idx] = { ...suppliers[idx], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json(suppliers[idx])
  }),

  http.post(`${API_BASE}/purchasing/suppliers/:id/deactivate/`, ({ params }) => {
    const idx = suppliers.findIndex(s => s.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    suppliers[idx] = { ...suppliers[idx], is_active: false, updated_at: new Date().toISOString() }
    return HttpResponse.json(suppliers[idx])
  }),

  http.post(`${API_BASE}/purchasing/suppliers/:id/activate/`, ({ params }) => {
    const idx = suppliers.findIndex(s => s.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    suppliers[idx] = { ...suppliers[idx], is_active: true, updated_at: new Date().toISOString() }
    return HttpResponse.json(suppliers[idx])
  }),

  // ── Purchase Orders ───────────────────────────────────────
  http.get(`${API_BASE}/purchasing/purchase-orders/`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const supplierId = url.searchParams.get('supplier_id')
    let result = [...orders, ...seedOrders]
    if (status) result = result.filter(o => o.status === status)
    if (supplierId) result = result.filter(o => o.supplier === supplierId)
    return HttpResponse.json(result)
  }),

  http.get(`${API_BASE}/purchasing/purchase-orders/:id/`, ({ params }) => {
    const allOrders = [...orders, ...seedOrders]
    const order = allOrders.find(o => o.id === params.id)
    if (!order) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(order)
  }),

  http.post(`${API_BASE}/purchasing/purchase-orders/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newOrder = {
      id: `oc-${Date.now()}`,
      number: `OC-2026-${String((orders.length + seedOrders.length + 1)).padStart(4, '0')}`,
      supplier: body.supplier_id,
      supplier_nombre: suppliers.find(s => s.id === body.supplier_id)?.nombre_comercial || 'Proveedor',
      status: 'borrador',
      expected_delivery: body.expected_delivery || null,
      notes: body.notes || '',
      items: (body.items || []).map((item: any, i: number) => ({
        id: `item-${Date.now()}-${i}`,
        product: item.product_id,
        product_name: `Producto ${i + 1}`,
        product_sku: `SKU-${i + 1}`,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        quantity_pending: item.quantity_ordered,
        unit_cost: item.unit_cost,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    orders.push(newOrder)
    return HttpResponse.json(newOrder, { status: 201 })
  }),

  http.patch(`${API_BASE}/purchasing/purchase-orders/:id/`, async ({ params, request }) => {
    const allOrders = [...orders, ...seedOrders]
    const idx = allOrders.findIndex(o => o.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const body = (await request.json()) as any
    const updated = { ...allOrders[idx], ...body, updated_at: new Date().toISOString() }
    if (idx < orders.length) orders[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.post(`${API_BASE}/purchasing/purchase-orders/:id/confirm/`, ({ params }) => {
    const allOrders = [...orders, ...seedOrders]
    const idx = allOrders.findIndex(o => o.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = {
      ...allOrders[idx],
      status: 'pendiente',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (idx < orders.length) orders[idx] = updated
    return HttpResponse.json(updated)
  }),

  http.post(`${API_BASE}/purchasing/purchase-orders/:id/cancel/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const allOrders = [...orders, ...seedOrders]
    const idx = allOrders.findIndex(o => o.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = {
      ...allOrders[idx],
      status: 'cancelada',
      cancellation_reason: body.reason || '',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (idx < orders.length) orders[idx] = updated
    return HttpResponse.json(updated)
  }),

  // ── Products (for purchase order creation) ────────────────
  http.get(`${API_BASE}/catalog/products/`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    let result = seedProducts
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search),
      )
    }
    return HttpResponse.json({ count: result.length, results: result })
  }),
]

export function resetPurchasingData() {
  suppliers = [...seedSuppliers]
  orders = []
}
