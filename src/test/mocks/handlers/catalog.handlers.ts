import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedCategories = [
  { id: 'cat-1', name: 'Electroterapia', slug: 'electroterapia', requires_serial_number: true, is_returnable: false, description: 'Equipos de electroterapia', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-2', name: 'Movilidad', slug: 'movilidad', requires_serial_number: false, is_returnable: true, description: 'Ayudas para movilidad', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'cat-3', name: 'Insumos', slug: 'insumos', requires_serial_number: false, is_returnable: false, description: 'Insumos médicos', is_active: false, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

const seedBrands = [
  { id: 'brand-1', name: 'MarcaX', slug: 'marcax', description: 'Marca líder', category: 'cat-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'brand-2', name: 'MedTech', slug: 'medtech', description: 'Tecnología médica', category: 'cat-1', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'brand-3', name: 'WellnessPro', slug: 'wellnesspro', description: 'Bienestar y salud', category: 'cat-2', is_active: false, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

const seedProducts = [
  { id: 'prod-1', sku: 'EQP-001', name: 'Monitor Cardiaco', category: 'cat-1', category_slug: 'electroterapia', subcategory: 'brand-1', barcode: '7701234567890', brand: 'MarcaX', requires_cold_chain: false, requires_expiration: false, requires_lot: false, requires_serial_number: true, special_conditions: false, is_active: true, weight_grams: null, notes: '', reorder_point: 5, expiration_date: null, unit_cost: 8000, sale_price_retail: 15000, sale_price_wholesale: 12000, tax_rate_pct: 19, currency: 'COP', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'prod-2', sku: 'MVL-001', name: 'Silla de Ruedas', category: 'cat-2', category_slug: 'movilidad', subcategory: 'brand-2', barcode: '7709876543210', brand: 'MedTech', requires_cold_chain: false, requires_expiration: false, requires_lot: false, requires_serial_number: false, special_conditions: false, is_active: true, weight_grams: null, notes: '', reorder_point: 3, expiration_date: null, unit_cost: 250000, sale_price_retail: 450000, sale_price_wholesale: 380000, tax_rate_pct: 19, currency: 'COP', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'prod-3', sku: 'INS-001', name: 'Guantes Quirúrgicos', category: 'cat-3', category_slug: 'insumos', subcategory: 'brand-3', barcode: '7701111111111', brand: 'WellnessPro', requires_cold_chain: false, requires_expiration: true, requires_lot: true, requires_serial_number: false, special_conditions: false, is_active: false, weight_grams: null, notes: '', reorder_point: 100, expiration_date: '2026-12-31', unit_cost: 500, sale_price_retail: 1200, sale_price_wholesale: 900, tax_rate_pct: 19, currency: 'COP', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

let categories = [...seedCategories]
let brands = [...seedBrands]
let products = [...seedProducts]

const seedCombos = [
  { id: 'combo-1', name: 'Kit Electroterapia Básico', sku: 'KIT-ELEC-001', deleted_at: null, components: [{ id: 'ci-1', product: 'prod-1', quantity: 2 }], available_quantity: 50, price_strategy: 'derived' as const, fixed_price_retail: null, fixed_price_wholesale: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'combo-2', name: 'Pack Movilidad Premium', sku: 'PKG-MVL-001', deleted_at: null, components: [{ id: 'ci-2', product: 'prod-2', quantity: 1 }], available_quantity: 10, price_strategy: 'fixed' as const, fixed_price_retail: 500000, fixed_price_wholesale: 420000, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

let combos = [...seedCombos]

export const catalogHandlers = [
  // ==============================
  // CATEGORIES
  // ==============================
  http.get(`${API_BASE}/catalog/categories/`, ({ request }) => {
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    let result = categories
    if (!includeInactive) {
      result = result.filter(c => c.is_active)
    }
    return HttpResponse.json(result)
  }),

  http.post(`${API_BASE}/catalog/categories/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newCat = {
      id: `cat-${Date.now()}`,
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      requires_serial_number: body.requires_serial_number || false,
      is_returnable: body.is_returnable || false,
      description: body.description || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    categories.push(newCat)
    return HttpResponse.json(newCat, { status: 201 })
  }),

  http.patch(`${API_BASE}/catalog/categories/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const idx = categories.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    categories[idx] = { ...categories[idx], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json(categories[idx])
  }),

  http.post(`${API_BASE}/catalog/categories/:id/disable/`, async ({ params }) => {
    const idx = categories.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    categories[idx] = { ...categories[idx], is_active: false, updated_at: new Date().toISOString() }
    return HttpResponse.json(null, { status: 200 })
  }),

  http.post(`${API_BASE}/catalog/categories/:id/enable/`, async ({ params }) => {
    const idx = categories.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    categories[idx] = { ...categories[idx], is_active: true, updated_at: new Date().toISOString() }
    return HttpResponse.json(categories[idx])
  }),

  // ==============================
  // BRANDS
  // ==============================
  http.get(`${API_BASE}/catalog/brands/`, ({ request }) => {
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    let result = brands
    if (!includeInactive) {
      result = result.filter(b => b.is_active)
    }
    return HttpResponse.json(result)
  }),

  http.post(`${API_BASE}/catalog/brands/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newBrand = {
      id: `brand-${Date.now()}`,
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      category: body.category_id || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    brands.push(newBrand)
    return HttpResponse.json(newBrand, { status: 201 })
  }),

  http.patch(`${API_BASE}/catalog/brands/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const idx = brands.findIndex(b => b.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    brands[idx] = { ...brands[idx], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json(brands[idx])
  }),

  http.post(`${API_BASE}/catalog/brands/:id/disable/`, async ({ params }) => {
    const idx = brands.findIndex(b => b.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    brands[idx] = { ...brands[idx], is_active: false, updated_at: new Date().toISOString() }
    return HttpResponse.json(null, { status: 200 })
  }),

  http.post(`${API_BASE}/catalog/brands/:id/enable/`, async ({ params }) => {
    const idx = brands.findIndex(b => b.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    brands[idx] = { ...brands[idx], is_active: true, updated_at: new Date().toISOString() }
    return HttpResponse.json(brands[idx])
  }),

  // ==============================
  // PRODUCTS
  // ==============================
  http.get(`${API_BASE}/catalog/products/`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    const category = url.searchParams.get('category') || ''
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('page_size') || '25', 10)

    let result = [...products]
    if (!includeInactive) {
      result = result.filter(p => p.is_active)
    }
    if (category) {
      result = result.filter(p => p.category === category)
    }
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.barcode && p.barcode.includes(search))
      )
    }

    const total = result.length
    const start = (page - 1) * pageSize
    const paged = result.slice(start, start + pageSize)

    return HttpResponse.json({ count: total, results: paged })
  }),

  http.get(`${API_BASE}/catalog/products/:id/`, ({ params }) => {
    const product = products.find(p => p.id === params.id)
    if (!product) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json(product)
  }),

  http.post(`${API_BASE}/catalog/products/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newProduct = {
      id: `prod-${Date.now()}`,
      sku: body.sku || `SKU-${Date.now()}`,
      name: body.name || '',
      category: body.category_id || body.category || '',
      category_slug: '',
      subcategory: body.subcategory_id || body.subcategory || null,
      barcode: body.barcode || null,
      brand: body.brand || '',
      requires_cold_chain: body.requires_cold_chain || false,
      requires_expiration: body.requires_expiration || false,
      requires_lot: body.requires_lot || false,
      requires_serial_number: body.requires_serial_number || false,
      special_conditions: body.special_conditions || false,
      is_active: body.is_active !== undefined ? body.is_active : true,
      weight_grams: body.weight_grams || null,
      notes: body.notes || '',
      reorder_point: body.reorder_point || 0,
      expiration_date: body.expiration_date || null,
      unit_cost: null,
      sale_price_retail: null,
      sale_price_wholesale: null,
      tax_rate_pct: null,
      currency: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    products.push(newProduct as any)
    return HttpResponse.json(newProduct, { status: 201 })
  }),

  http.patch(`${API_BASE}/catalog/products/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const idx = products.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })

    const patched: any = {}
    for (const key of Object.keys(body)) {
      if (body[key] !== undefined) {
        if (key === 'category_id') patched.category = body.category_id
        else if (key === 'subcategory_id') patched.subcategory = body.subcategory_id
        else patched[key] = body[key]
      }
    }
    if (body.is_active !== undefined) {
      patched.is_active = body.is_active
    }

    products[idx] = { ...products[idx], ...patched, updated_at: new Date().toISOString() }
    return HttpResponse.json(products[idx])
  }),

  http.post(`${API_BASE}/catalog/products/:id/restore/`, ({ params }) => {
    const idx = products.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    products[idx] = { ...products[idx], is_active: true, updated_at: new Date().toISOString() }
    return HttpResponse.json(products[idx])
  }),

  http.patch(`${API_BASE}/catalog/products/:id/prices/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const idx = products.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    products[idx] = { ...products[idx], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json(products[idx])
  }),

  // ==============================
  // STOCK (needed by CatalogProductsPage and CatalogCombosPage)
  // ==============================
  http.get(`${API_BASE}/inventory/products/:id/stock/`, ({ params }) => {
    const product = products.find(p => p.id === params.id)
    if (!product) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json({
      product_id: params.id,
      total: 50,
      by_location: [{ location_code: 'BOD-01', quantity: 50 }],
      per_location: [{ location_code: 'BOD-01', quantity: 50 }],
    })
  }),

  // ==============================
  // COMBOS
  // ==============================
  http.get(`${API_BASE}/catalog/combos/`, ({ request }) => {
    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('include_archived') === 'true'
    let result = combos
    if (!includeArchived) {
      result = result.filter(c => c.deleted_at === null)
    }
    return HttpResponse.json(result)
  }),

  http.post(`${API_BASE}/catalog/combos/`, async ({ request }) => {
    const body = (await request.json()) as any
    const newCombo = {
      id: `combo-${Date.now()}`,
      name: body.name || '',
      sku: body.sku || `KIT-${Date.now()}`,
      deleted_at: null,
      components: (body.items || []).map((item: any, i: number) => ({
        id: `ci-${Date.now()}-${i}`,
        product: item.product_id,
        quantity: item.quantity,
      })),
      available_quantity: 0,
      price_strategy: body.price_strategy || 'derived',
      fixed_price_retail: body.fixed_price_retail || null,
      fixed_price_wholesale: body.fixed_price_wholesale || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    combos.push(newCombo)
    return HttpResponse.json(newCombo, { status: 201 })
  }),

  http.patch(`${API_BASE}/catalog/combos/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as any
    const idx = combos.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })

    const patched: any = {}
    if (body.name !== undefined) patched.name = body.name
    if (body.sku !== undefined) patched.sku = body.sku
    if (body.items !== undefined) {
      patched.components = body.items.map((item: any, i: number) => ({
        id: `ci-${Date.now()}-${i}`,
        product: item.product_id,
        quantity: item.quantity,
      }))
    }
    if (body.price_strategy !== undefined) patched.price_strategy = body.price_strategy
    if (body.fixed_price_retail !== undefined) patched.fixed_price_retail = body.fixed_price_retail
    if (body.fixed_price_wholesale !== undefined) patched.fixed_price_wholesale = body.fixed_price_wholesale

    combos[idx] = { ...combos[idx], ...patched, updated_at: new Date().toISOString() }
    return HttpResponse.json(combos[idx])
  }),

  http.delete(`${API_BASE}/catalog/combos/:id/`, ({ params }) => {
    const idx = combos.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    combos[idx] = { ...combos[idx], deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any
    return HttpResponse.json(null, { status: 204 })
  }),

  http.post(`${API_BASE}/catalog/combos/:id/restore/`, ({ params }) => {
    const idx = combos.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    combos[idx] = { ...combos[idx], deleted_at: null, updated_at: new Date().toISOString() }
    return HttpResponse.json(combos[idx])
  }),
]

export function resetCatalogData() {
  categories = [...seedCategories]
  brands = [...seedBrands]
  products = [...seedProducts]
  combos = [...seedCombos]
}
