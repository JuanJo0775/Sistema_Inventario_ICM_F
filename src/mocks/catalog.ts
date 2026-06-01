import type { CatalogCategory, CatalogBrand, CatalogProduct } from '../interfaces/catalog'

// Seed Categories
export let mockCatalogCategories: CatalogCategory[] = [
  {
    id: '1',
    name: 'Electroterapia',
    slug: 'electroterapia',
    requires_serial_number: true,
    is_returnable: true,
    description: 'Equipos e insumos para tratamientos de estimulación eléctrica y ultrasonido.',
    is_active: true,
    created_at: '2026-05-31T10:00:00Z',
    updated_at: '2026-05-31T10:00:00Z',
  },
  {
    id: '2',
    name: 'Consumibles',
    slug: 'consumibles',
    requires_serial_number: false,
    is_returnable: false,
    description: 'Materiales desechables, geles conductores y agujas de punción.',
    is_active: true,
    created_at: '2026-05-31T10:05:00Z',
    updated_at: '2026-05-31T10:05:00Z',
  },
  {
    id: '3',
    name: 'Rehabilitación',
    slug: 'rehabilitacion',
    requires_serial_number: false,
    is_returnable: false,
    description: 'Equipos de mecanoterapia, bandas elásticas, mancuernas y camillas.',
    is_active: true,
    created_at: '2026-05-31T10:10:00Z',
    updated_at: '2026-05-31T10:10:00Z',
  },
]

// Seed Brands (Subcategories)
export let mockCatalogBrands: CatalogBrand[] = [
  {
    id: '10',
    category: '1',
    name: 'Ultrasonido',
    slug: 'ultrasonido',
    is_active: true,
    created_at: '2026-05-31T10:01:00Z',
    updated_at: '2026-05-31T10:01:00Z',
  },
  {
    id: '11',
    category: '1',
    name: 'TENS',
    slug: 'tens',
    is_active: true,
    created_at: '2026-05-31T10:02:00Z',
    updated_at: '2026-05-31T10:02:00Z',
  },
  {
    id: '20',
    category: '2',
    name: 'Agujas',
    slug: 'agujas',
    is_active: true,
    created_at: '2026-05-31T10:06:00Z',
    updated_at: '2026-05-31T10:06:00Z',
  },
  {
    id: '21',
    category: '2',
    name: 'Gel Conductor',
    slug: 'gel-conductor',
    is_active: true,
    created_at: '2026-05-31T10:07:00Z',
    updated_at: '2026-05-31T10:07:00Z',
  },
  {
    id: '30',
    category: '3',
    name: 'Pelotas de Ejercicio',
    slug: 'pelotas-de-ejercicio',
    is_active: true,
    created_at: '2026-05-31T10:11:00Z',
    updated_at: '2026-05-31T10:11:00Z',
  },
]

// Seed Products
export let mockCatalogProducts: CatalogProduct[] = [
  {
    id: 'prod-001',
    sku: 'CAN-US-007',
    name: 'Ultrasonido 3MHz Clinical',
    category: '1',
    category_slug: 'electroterapia',
    subcategory: '10',
    barcode: '770000000001',
    barcode_type: 'Code128',
    brand: 'Ultrasonido',
    expiration_date: null,
    requires_expiration: false,
    weight_grams: 2300,
    requires_cold_chain: false,
    is_active: true,
    notes: 'Equipo de alta gama para terapia física profunda.',
    reorder_point: 2,
    stockTotal: 1,
    created_at: '2026-05-31T10:03:00Z',
    updated_at: '2026-05-31T10:03:00Z',
  },
  {
    id: 'prod-002',
    sku: 'CAN-TENS-003',
    name: 'Estimulador TENS Bifásico Pro',
    category: '1',
    category_slug: 'electroterapia',
    subcategory: '11',
    barcode: '770000000002',
    barcode_type: 'Code128',
    brand: 'TENS',
    expiration_date: null,
    requires_expiration: false,
    weight_grams: 350,
    requires_cold_chain: false,
    is_active: true,
    notes: '4 canales independientes, batería recargable.',
    reorder_point: 3,
    stockTotal: 3,
    created_at: '2026-05-31T10:04:00Z',
    updated_at: '2026-05-31T10:04:00Z',
  },
  {
    id: 'prod-003',
    sku: 'CAN-APS-001',
    name: 'Agujas Punción Seca APS 0.25x25mm',
    category: '2',
    category_slug: 'consumibles',
    subcategory: '20',
    barcode: '770000000003',
    barcode_type: 'Code128',
    brand: 'Agujas',
    expiration_date: '2028-12-31',
    requires_expiration: true,
    weight_grams: 80,
    requires_cold_chain: false,
    is_active: true,
    notes: 'Caja x 100 agujas con tubo guía, estériles.',
    reorder_point: 15,
    stockTotal: 50,
    created_at: '2026-05-31T10:08:00Z',
    updated_at: '2026-05-31T10:08:00Z',
  },
  {
    id: 'prod-004',
    sku: 'CAN-GEL-005',
    name: 'Gel Conductor UltraSound 1 Litro',
    category: '2',
    category_slug: 'consumibles',
    subcategory: '21',
    barcode: '770000000004',
    barcode_type: 'Code128',
    brand: 'Gel Conductor',
    expiration_date: '2027-06-30',
    requires_expiration: true,
    weight_grams: 1000,
    requires_cold_chain: false,
    is_active: true,
    notes: 'Fórmula hipoalergénica de alta conductividad.',
    reorder_point: 10,
    stockTotal: 20,
    created_at: '2026-05-31T10:09:00Z',
    updated_at: '2026-05-31T10:09:00Z',
  },
  {
    id: 'prod-005',
    sku: 'CAN-PGO-002',
    name: 'Pelota de Ejercicio Anti-Explosión 65cm',
    category: '3',
    category_slug: 'rehabilitacion',
    subcategory: '30',
    barcode: '770000000005',
    barcode_type: 'Code128',
    brand: 'Pelotas de Ejercicio',
    expiration_date: null,
    requires_expiration: false,
    weight_grams: 1200,
    requires_cold_chain: false,
    is_active: true,
    notes: 'Soporta hasta 300kg, incluye inflador.',
    reorder_point: 4,
    stockTotal: 2,
    created_at: '2026-05-31T10:12:00Z',
    updated_at: '2026-05-31T10:12:00Z',
  },
]

// HELPER API FOR MOCK OPERATIONS

// Categories CRUD
export const mockGetCategories = (includeInactive = false) => {
  return mockCatalogCategories.filter(c => includeInactive || c.is_active)
}

export const mockCreateCategory = (data: Partial<CatalogCategory>) => {
  const name = data.name?.trim() || ''
  if (!name) throw new Error('El nombre de la categoría es obligatorio.')
  if (mockCatalogCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Ya existe una categoría con este nombre.')
  }
  const id = `cat-${Date.now()}`
  const newCat: CatalogCategory = {
    id,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    requires_serial_number: !!data.requires_serial_number,
    is_returnable: !!data.is_returnable,
    description: data.description || '',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockCatalogCategories.push(newCat)
  return newCat
}

export const mockUpdateCategory = (id: string, data: Partial<CatalogCategory>) => {
  const catIndex = mockCatalogCategories.findIndex(c => c.id === id)
  if (catIndex === -1) throw new Error('Categoría no encontrada.')
  const name = data.name?.trim()
  if (name) {
    if (mockCatalogCategories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Ya existe otra categoría con este nombre.')
    }
    mockCatalogCategories[catIndex].name = name
    mockCatalogCategories[catIndex].slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
  if (data.description !== undefined) mockCatalogCategories[catIndex].description = data.description
  if (data.requires_serial_number !== undefined) mockCatalogCategories[catIndex].requires_serial_number = !!data.requires_serial_number
  if (data.is_returnable !== undefined) mockCatalogCategories[catIndex].is_returnable = !!data.is_returnable
  mockCatalogCategories[catIndex].updated_at = new Date().toISOString()
  return mockCatalogCategories[catIndex]
}

export const mockDeactivateCategory = (id: string) => {
  const catIndex = mockCatalogCategories.findIndex(c => c.id === id)
  if (catIndex === -1) throw new Error('Categoría no encontrada.')
  
  // Check if has active products
  const hasActiveProducts = mockCatalogProducts.some(p => p.category === id && p.is_active)
  if (hasActiveProducts) {
    throw new Error('No se puede desactivar la categoría porque tiene productos activos asociados.')
  }
  
  mockCatalogCategories[catIndex].is_active = false
  mockCatalogCategories[catIndex].updated_at = new Date().toISOString()
}

export const mockRestoreCategory = (id: string) => {
  const catIndex = mockCatalogCategories.findIndex(c => c.id === id)
  if (catIndex === -1) throw new Error('Categoría no encontrada.')
  mockCatalogCategories[catIndex].is_active = true
  mockCatalogCategories[catIndex].updated_at = new Date().toISOString()
  return mockCatalogCategories[catIndex]
}

// Brands CRUD (Subcategories)
export const mockGetBrands = (includeInactive = false) => {
  return mockCatalogBrands.filter(b => includeInactive || b.is_active)
}

export const mockCreateBrand = (data: { category_id?: string; name: string; description?: string }) => {
  const name = data.name?.trim() || ''
  if (!name) throw new Error('El nombre de la marca es obligatorio.')
  const catId = data.category_id || '1'
  if (mockCatalogBrands.some(b => b.category === catId && b.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Ya existe una marca con este nombre.')
  }
  const id = `brand-${Date.now()}`
  const newBrand: CatalogBrand = {
    id,
    category: catId,
    name,
    description: data.description,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockCatalogBrands.push(newBrand)
  return newBrand
}

export const mockUpdateBrand = (id: string, data: { category_id?: string; name?: string; description?: string; is_active?: boolean }) => {
  const brandIndex = mockCatalogBrands.findIndex(b => b.id === id)
  if (brandIndex === -1) throw new Error('Marca no encontrada.')
  const name = data.name?.trim()
  const catId = data.category_id ?? mockCatalogBrands[brandIndex].category
  if (name) {
    if (mockCatalogBrands.some(b => b.id !== id && b.category === catId && b.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Ya existe otra marca con este nombre.')
    }
    mockCatalogBrands[brandIndex].name = name
    mockCatalogBrands[brandIndex].slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
  if (data.category_id) mockCatalogBrands[brandIndex].category = data.category_id
  if (data.description !== undefined) mockCatalogBrands[brandIndex].description = data.description
  if (data.is_active !== undefined) mockCatalogBrands[brandIndex].is_active = data.is_active
  mockCatalogBrands[brandIndex].updated_at = new Date().toISOString()
  return mockCatalogBrands[brandIndex]
}

export const mockDeactivateBrand = (id: string) => {
  const brandIndex = mockCatalogBrands.findIndex(b => b.id === id)
  if (brandIndex === -1) throw new Error('Marca no encontrada.')
  
  // Check active products
  const hasActiveProducts = mockCatalogProducts.some(p => p.subcategory === id && p.is_active)
  if (hasActiveProducts) {
    throw new Error('No se puede desactivar la marca porque tiene productos activos asociados.')
  }
  
  mockCatalogBrands[brandIndex].is_active = false
  mockCatalogBrands[brandIndex].updated_at = new Date().toISOString()
}

export const mockRestoreBrand = (id: string) => {
  const brandIndex = mockCatalogBrands.findIndex(b => b.id === id)
  if (brandIndex === -1) throw new Error('Marca no encontrada.')
  mockCatalogBrands[brandIndex].is_active = true
  mockCatalogBrands[brandIndex].updated_at = new Date().toISOString()
  return mockCatalogBrands[brandIndex]
}

// Products CRUD
export const mockGetProducts = (filters?: { search?: string; category?: string; subcategory?: string; include_inactive?: boolean }) => {
  let list = [...mockCatalogProducts]
  if (!filters?.include_inactive) {
    list = list.filter(p => p.is_active)
  }
  if (filters?.category) {
    list = list.filter(p => p.category === filters.category)
  }
  if (filters?.subcategory) {
    list = list.filter(p => p.subcategory === filters.subcategory)
  }
  if (filters?.search) {
    const q = filters.search.trim().toLowerCase()
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    )
  }
  return list
}

export const mockGetProductDetail = (id: string) => {
  const prod = mockCatalogProducts.find(p => p.id === id)
  if (!prod) throw new Error('Producto no encontrado.')
  
  // Populate barcode SVG mockup fields if needed
  return {
    ...prod,
    barcode_svg: `<svg viewBox="0 0 100 30" width="100%"><rect width="100" height="30" fill="#f3f4f6"/><text x="10" y="20" font-family="monospace" font-size="6">${prod.barcode ?? 'NO BARCODE'}</text></svg>`,
    barcode_svg_data_uri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><rect width="100" height="30" fill="gray"/></svg>`,
    barcode_payload: prod.barcode ? { type: 'Code128', value: prod.barcode } : null
  }
}

export const mockCreateProduct = (data: Partial<CatalogProduct> & { category_id?: string; subcategory_id?: string | null }) => {
  const name = data.name?.trim() || ''
  const sku = data.sku?.trim() || ''
  if (!name) throw new Error('El nombre del producto es obligatorio.')
  if (!sku) throw new Error('El SKU del producto es obligatorio.')
  if (mockCatalogProducts.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
    throw new Error('Ya existe un producto con este SKU.')
  }
  if (data.barcode && mockCatalogProducts.some(p => p.barcode?.toLowerCase() === data.barcode?.toLowerCase())) {
    throw new Error('Ya existe un producto con este código de barras.')
  }
  
  // Resolve category and subcategory from either direct or _id alias fields
  const resolvedCategory = data.category || data.category_id || ''
  const resolvedSubcategory = data.subcategory !== undefined ? data.subcategory : (data.subcategory_id ?? null)
  
  const id = `prod-${Date.now()}`
  const cat = mockCatalogCategories.find(c => c.id === resolvedCategory)
  const brandObj = mockCatalogBrands.find(b => b.id === resolvedSubcategory)
  
  const newProd: CatalogProduct = {
    id,
    sku,
    name,
    category: resolvedCategory || '1',
    category_slug: cat?.slug || 'electroterapia',
    subcategory: resolvedSubcategory,
    barcode: data.barcode || `770${Math.floor(100000000 + Math.random() * 900000000)}`,
    brand: brandObj?.name || data.brand || 'Can',
    expiration_date: data.expiration_date || null,
    requires_expiration: !!data.requires_expiration,
    weight_grams: data.weight_grams ? Number(data.weight_grams) : null,
    requires_cold_chain: !!data.requires_cold_chain,
    is_active: data.is_active !== undefined ? !!data.is_active : true,
    notes: data.notes || '',
    reorder_point: data.reorder_point !== undefined ? Number(data.reorder_point) : 0,
    stockTotal: 0, // Product always created with 0 stock (NO STOCK)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockCatalogProducts.push(newProd)
  return newProd
}

export const mockUpdateProduct = (id: string, data: Partial<CatalogProduct> & { category_id?: string; subcategory_id?: string | null }) => {
  const idx = mockCatalogProducts.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Producto no encontrado.')
  
  const sku = data.sku?.trim()
  if (sku) {
    if (mockCatalogProducts.some(p => p.id !== id && p.sku.toLowerCase() === sku.toLowerCase())) {
      throw new Error('Ya existe otro producto con este SKU.')
    }
    mockCatalogProducts[idx].sku = sku
  }
  
  if (data.barcode) {
    if (mockCatalogProducts.some(p => p.id !== id && p.barcode?.toLowerCase() === data.barcode?.toLowerCase())) {
      throw new Error('Ya existe otro producto con este código de barras.')
    }
    mockCatalogProducts[idx].barcode = data.barcode
  }
  
  if (data.name) mockCatalogProducts[idx].name = data.name
  
  // Handle both category and category_id fields
  const categoryId = data.category || data.category_id
  if (categoryId) {
    mockCatalogProducts[idx].category = categoryId
    const cat = mockCatalogCategories.find(c => c.id === categoryId)
    mockCatalogProducts[idx].category_slug = cat?.slug || ''
  }
  
  // Handle both subcategory and subcategory_id fields
  const subcategoryId = data.subcategory !== undefined ? data.subcategory : data.subcategory_id
  if (subcategoryId !== undefined) {
    mockCatalogProducts[idx].subcategory = subcategoryId
    const brandObj = mockCatalogBrands.find(b => b.id === subcategoryId)
    if (brandObj) mockCatalogProducts[idx].brand = brandObj.name
  }
  
  if (data.brand) mockCatalogProducts[idx].brand = data.brand
  if (data.expiration_date !== undefined) mockCatalogProducts[idx].expiration_date = data.expiration_date
  if (data.requires_expiration !== undefined) mockCatalogProducts[idx].requires_expiration = !!data.requires_expiration
  if (data.weight_grams !== undefined) mockCatalogProducts[idx].weight_grams = data.weight_grams ? Number(data.weight_grams) : null
  if (data.requires_cold_chain !== undefined) mockCatalogProducts[idx].requires_cold_chain = !!data.requires_cold_chain
  if (data.notes !== undefined) mockCatalogProducts[idx].notes = data.notes
  if (data.reorder_point !== undefined) mockCatalogProducts[idx].reorder_point = Number(data.reorder_point)
  if (data.is_active !== undefined) mockCatalogProducts[idx].is_active = !!data.is_active
  
  mockCatalogProducts[idx].updated_at = new Date().toISOString()
  return mockCatalogProducts[idx]
}

export const mockDeactivateProduct = (id: string) => {
  const idx = mockCatalogProducts.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Producto no encontrado.')
  
  // Product deactivation
  mockCatalogProducts[idx].is_active = false
  mockCatalogProducts[idx].updated_at = new Date().toISOString()
}

export const mockRestoreProduct = (id: string) => {
  const idx = mockCatalogProducts.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Producto no encontrado.')
  mockCatalogProducts[idx].is_active = true
  mockCatalogProducts[idx].updated_at = new Date().toISOString()
  return mockCatalogProducts[idx]
}
