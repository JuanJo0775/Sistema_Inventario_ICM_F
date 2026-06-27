import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedUsers: any[] = [
  {
    id: 'user-1',
    username: 'carlos.almacen',
    email: 'carlos@icm.com',
    first_name: 'Carlos',
    last_name: 'Almacén',
    phone: '3001112233',
    role: 'almacenista',
    is_active: true,
    created_by: null,
    created_by_username: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
    last_login: '2026-06-19T08:30:00Z',
  },
  {
    id: 'user-2',
    username: 'maria.auxiliar',
    email: 'maria@icm.com',
    first_name: 'María',
    last_name: 'Auxiliar',
    phone: '3001112234',
    role: 'auxiliar_despacho',
    is_active: true,
    created_by: 'user-1',
    created_by_username: 'carlos.almacen',
    created_at: '2025-02-10T10:00:00Z',
    updated_at: '2026-05-20T10:00:00Z',
    last_login: '2026-06-19T07:00:00Z',
  },
  {
    id: 'user-3',
    username: 'admin.jorge',
    email: 'jorge@icm.com',
    first_name: 'Jorge',
    last_name: 'Admin',
    phone: '',
    role: 'administrador',
    is_active: true,
    created_by: null,
    created_by_username: null,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    last_login: '2026-06-18T16:00:00Z',
  },
  {
    id: 'user-4',
    username: 'laura.inactiva',
    email: 'laura@icm.com',
    first_name: 'Laura',
    last_name: 'Inactiva',
    phone: '3001112235',
    role: 'auxiliar_despacho',
    is_active: false,
    created_by: 'user-1',
    created_by_username: 'carlos.almacen',
    created_at: '2025-03-01T10:00:00Z',
    updated_at: '2026-06-10T10:00:00Z',
    last_login: null,
  },
]

const seedMovements: any[] = [
  {
    id: 'mov-00000001-1111-1111-1111-111111111111',
    movement_type: 'ENTRADA',
    product: 'prod-eqp-001',
    product_sku: 'EQP-001',
    lot: null,
    lot_code: null,
    origin_location: null,
    destination_location: 'BOD-01',
    quantity: 10,
    stock_previo_origen: null,
    stock_resultante_origen: null,
    stock_previo_destino: 50,
    stock_resultante_destino: 60,
    serial_number: null,
    quantity_invoiced: null,
    discrepancy_note: null,
    justification: 'Compra directa proveedor',
    executed_by: 'user-1',
    created_at: '2026-06-15T10:30:00Z',
  },
  {
    id: 'mov-00000002-2222-2222-2222-222222222222',
    movement_type: 'SALIDA',
    product: 'prod-ins-001',
    product_sku: 'INS-001',
    lot: 'LOTE-001',
    lot_code: 'LOTE-001',
    origin_location: 'BOD-02',
    destination_location: null,
    quantity: 5,
    stock_previo_origen: 100,
    stock_resultante_origen: 95,
    stock_previo_destino: null,
    stock_resultante_destino: null,
    serial_number: null,
    quantity_invoiced: null,
    discrepancy_note: null,
    justification: 'Despacho orden OC-001',
    executed_by: 'user-2',
    created_at: '2026-06-16T09:00:00Z',
  },
  {
    id: 'mov-00000003-3333-3333-3333-333333333333',
    movement_type: 'TRASLADO',
    product: 'prod-eqp-001',
    product_sku: 'EQP-001',
    lot: null,
    lot_code: null,
    origin_location: 'BOD-01',
    destination_location: 'BOD-02',
    quantity: 3,
    stock_previo_origen: 60,
    stock_resultante_origen: 57,
    stock_previo_destino: 95,
    stock_resultante_destino: 98,
    serial_number: null,
    quantity_invoiced: null,
    discrepancy_note: null,
    justification: 'Reubicación interna',
    executed_by: 'user-1',
    created_at: '2026-06-17T14:00:00Z',
  },
  {
    id: 'mov-00000004-4444-4444-4444-444444444444',
    movement_type: 'AJUSTE',
    product: 'prod-ins-001',
    product_sku: 'INS-001',
    lot: null,
    lot_code: null,
    origin_location: 'BOD-02',
    destination_location: null,
    quantity: 2,
    stock_previo_origen: 95,
    stock_resultante_origen: 93,
    stock_previo_destino: null,
    stock_resultante_destino: null,
    serial_number: null,
    quantity_invoiced: null,
    discrepancy_note: null,
    justification: 'Diferencia de inventario',
    executed_by: 'user-3',
    created_at: '2026-06-18T11:00:00Z',
  },
  {
    id: 'mov-00000005-5555-5555-5555-555555555555',
    movement_type: 'DEVOLUCION',
    product: 'prod-eqp-001',
    product_sku: 'EQP-001',
    lot: null,
    lot_code: null,
    origin_location: null,
    destination_location: 'BOD-01',
    quantity: 1,
    stock_previo_origen: null,
    stock_resultante_origen: null,
    stock_previo_destino: 57,
    stock_resultante_destino: 58,
    serial_number: 'SER-999',
    quantity_invoiced: null,
    discrepancy_note: null,
    justification: 'Devolución paciente',
    executed_by: 'user-2',
    created_at: '2026-06-19T08:00:00Z',
  },
]

const seedProducts: any[] = [
  {
    id: 'prod-eqp-001',
    sku: 'EQP-001',
    name: 'Monitor Cardiaco',
    category: 'cat-eqp',
    category_slug: 'equipos',
    requires_serial_number: true,
    requires_expiration: false,
    requires_lot: false,
    is_active: true,
  },
  {
    id: 'prod-ins-001',
    sku: 'INS-001',
    name: 'Guantes Quirúrgicos',
    category: 'cat-ins',
    category_slug: 'insumos',
    requires_serial_number: false,
    requires_expiration: true,
    requires_lot: true,
    is_active: true,
  },
]

const seedSchedule: Record<string, any> = {
  'user-2': {
    id: 'sched-2',
    user: 'user-2',
    morning_start: '07:00:00',
    morning_end: '12:00:00',
    afternoon_start: '14:00:00',
    afternoon_end: '17:00:00',
    is_active: true,
    created_at: '2025-02-10T10:00:00Z',
    updated_at: '2025-02-10T10:00:00Z',
  },
}

const seedPermits: Record<string, any[]> = {
  'user-2': [
    {
      id: 'perm-1',
      user: 'user-2',
      user_username: 'maria.auxiliar',
      start_datetime: '2026-06-20T00:00:00Z',
      end_datetime: '2026-06-22T23:59:00Z',
      allow_24_7: true,
      custom_morning_start: null,
      custom_morning_end: null,
      custom_afternoon_start: null,
      custom_afternoon_end: null,
      reason: 'Cubrir turno especial',
      granted_by: 'user-1',
      granted_by_username: 'carlos.almacen',
      is_active: true,
      created_at: '2026-06-19T10:00:00Z',
      updated_at: '2026-06-19T10:00:00Z',
    },
  ],
}

let users = [...seedUsers]
let movements = [...seedMovements]
let products = [...seedProducts]
let schedules = new Map(Object.entries(seedSchedule))
let permitsMap = new Map(Object.entries(seedPermits))

export const adminHandlers = [
  http.get(`${API_BASE}/movements/`, ({ request }) => {
    const url = new URL(request.url)
    const productId = url.searchParams.get('product_id')
    const movementType = url.searchParams.get('movement_type')
    const pageSize = parseInt(url.searchParams.get('page_size') || '100', 10)
    let result = [...movements]
    if (productId) {
      result = result.filter((m) => m.product === productId)
    }
    if (movementType) {
      result = result.filter((m) => m.movement_type === movementType)
    }
    return HttpResponse.json({
      count: result.length,
      next: null,
      previous: null,
      results: result.slice(0, pageSize),
    })
  }),

  http.get(`${API_BASE}/auth/users/`, ({ request }) => {
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    const role = url.searchParams.get('role') || ''
    let result = [...users]
    if (!includeInactive) {
      result = result.filter((u) => u.is_active)
    }
    if (search) {
      result = result.filter(
        (u) =>
          `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search),
      )
    }
    if (role) {
      result = result.filter((u) => u.role === role)
    }
    return HttpResponse.json(result)
  }),

  http.options(`${API_BASE}/auth/users/`, () =>
    HttpResponse.json({
      actions: {
        POST: {
          role: {
            choices: [
              { value: 'administrador', display_name: 'Administrador' },
              { value: 'almacenista', display_name: 'Almacenista' },
              { value: 'auxiliar_despacho', display_name: 'Auxiliar de despacho' },
            ],
          },
        },
      },
    }),
  ),

  http.post(`${API_BASE}/auth/users/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newUser = {
      id: `user-${Date.now()}`,
      username: body.username,
      email: body.email,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      phone: body.phone || '',
      role: body.role,
      is_active: true,
      created_by: 'user-1',
      created_by_username: 'carlos.almacen',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null,
    }
    users.push(newUser)
    return HttpResponse.json(newUser, { status: 201 })
  }),

  http.put(`${API_BASE}/auth/users/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const idx = users.findIndex((u) => u.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    users[idx] = { ...users[idx], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json(users[idx])
  }),

  http.post(`${API_BASE}/auth/users/:id/disable/`, ({ params }) => {
    const idx = users.findIndex((u) => u.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    users[idx].is_active = false
    return HttpResponse.json({ status: 'ok' })
  }),

  http.post(`${API_BASE}/auth/users/:id/enable/`, ({ params }) => {
    const idx = users.findIndex((u) => u.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    users[idx].is_active = true
    return HttpResponse.json(users[idx])
  }),

  http.get(`${API_BASE}/auth/users/:userId/schedule/`, ({ params }) => {
    const sched = schedules.get(params.userId as string)
    if (!sched) {
      return HttpResponse.json({
        id: `sched-${params.userId}`,
        user: params.userId,
        morning_start: null,
        morning_end: null,
        afternoon_start: null,
        afternoon_end: null,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    return HttpResponse.json(sched)
  }),

  http.post(`${API_BASE}/auth/users/:userId/schedule/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const sched = {
      id: `sched-${params.userId}`,
      user: params.userId,
      morning_start: body.morning_start || null,
      morning_end: body.morning_end || null,
      afternoon_start: body.afternoon_start || null,
      afternoon_end: body.afternoon_end || null,
      is_active: body.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    schedules.set(params.userId as string, sched)
    return HttpResponse.json(sched)
  }),

  http.get(`${API_BASE}/auth/users/:userId/temporary-permits/`, ({ params }) => {
    const permits = permitsMap.get(params.userId as string) || []
    return HttpResponse.json(permits)
  }),

  http.post(`${API_BASE}/auth/users/:userId/temporary-permits/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const user = users.find((u) => u.id === params.userId)
    const permit: any = {
      id: `perm-${Date.now()}`,
      user: params.userId,
      user_username: user?.username || 'unknown',
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime,
      allow_24_7: body.allow_24_7 || false,
      custom_morning_start: body.custom_morning_start || null,
      custom_morning_end: body.custom_morning_end || null,
      custom_afternoon_start: body.custom_afternoon_start || null,
      custom_afternoon_end: body.custom_afternoon_end || null,
      reason: body.reason,
      granted_by: 'user-1',
      granted_by_username: 'carlos.almacen',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const existing = permitsMap.get(params.userId as string) || []
    permitsMap.set(params.userId as string, [permit, ...existing])
    return HttpResponse.json(permit, { status: 201 })
  }),

  http.post(`${API_BASE}/auth/temporary-permits/:permitId/revoke/`, ({ params }) => {
    for (const [, permits] of permitsMap.entries()) {
      const idx = permits.findIndex((p: any) => p.id === params.permitId)
      if (idx !== -1) {
        permits[idx].is_active = false
        return HttpResponse.json(permits[idx])
      }
    }
    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  http.get(`${API_BASE}/catalog/products/`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    let result = [...products]
    if (search) {
      result = result.filter((p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search))
    }
    return HttpResponse.json({ count: result.length, results: result })
  }),

  http.get(`${API_BASE}/inventory/products/:productId/stock/`, ({ params }) => {
    const stockData: Record<string, any> = {
      'prod-eqp-001': { product_id: 'prod-eqp-001', total: 60, by_location: [{ location_id: 'BOD-01', quantity: 60 }], per_location: [{ location_id: 'BOD-01', quantity: 60 }] },
      'prod-ins-001': { product_id: 'prod-ins-001', total: 100, by_location: [{ location_id: 'BOD-02', quantity: 100 }], per_location: [{ location_id: 'BOD-02', quantity: 100 }] },
    }
    return HttpResponse.json(stockData[params.productId as string] ?? { product_id: params.productId, total: 0, by_location: [], per_location: [] })
  }),
]

export function resetAdminData() {
  users = [...seedUsers]
  movements = [...seedMovements]
  products = [...seedProducts]
  schedules = new Map(Object.entries(seedSchedule))
  permitsMap = new Map(Object.entries(seedPermits))
}
