import type { Combo, ComboCreateInput, ComboUpdateInput } from '../interfaces/combos'

const now = new Date().toISOString()

let mockCombos: Combo[] = [
  {
    id: 'combo-001',
    name: 'Kit Electroestimulación Básico',
    sku: 'COMBO-001',
    deleted_at: null,
    components: [
      { id: 'ci-001', product: '1', quantity: 2 },
      { id: 'ci-002', product: '2', quantity: 1 },
      { id: 'ci-003', product: '4', quantity: 1 },
    ],
    available_quantity: 5,
    price_strategy: 'fixed',
    fixed_price_retail: 45000,
    fixed_price_wholesale: 40000,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'combo-002',
    name: 'Kit Avanzado TENS',
    sku: 'COMBO-002',
    deleted_at: null,
    components: [
      { id: 'ci-004', product: '2', quantity: 1 },
      { id: 'ci-005', product: '4', quantity: 1 },
    ],
    available_quantity: 0,
    price_strategy: 'fixed',
    fixed_price_retail: 89000,
    fixed_price_wholesale: 80000,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'combo-003',
    name: 'Pack Rehabilitación Completo',
    sku: 'COMBO-003',
    deleted_at: now,
    components: [
      { id: 'ci-006', product: '6', quantity: 1 },
      { id: 'ci-007', product: '7', quantity: 2 },
    ],
    available_quantity: 3,
    price_strategy: 'fixed',
    fixed_price_retail: 185000,
    fixed_price_wholesale: 170000,
    created_at: now,
    updated_at: now,
  },
]

export const mockGetCombos = (includeArchived = false): Combo[] => {
  if (includeArchived) return [...mockCombos]
  return mockCombos.filter((c) => !c.deleted_at)
}

export const mockGetComboDetail = (id: string): Combo => {
  const combo = mockCombos.find((c) => c.id === id)
  if (!combo) throw new Error('Combo no encontrado.')
  return { ...combo }
}

export const mockCreateCombo = (data: ComboCreateInput): Combo => {
  const id = `combo-${Date.now()}`
  const now = new Date().toISOString()
  const newCombo: Combo = {
    id,
    name: data.name,
    sku: data.sku,
    deleted_at: null,
    components: data.items.map((item, i) => ({
      id: `ci-${id}-${i}`,
      product: item.product_id,
      quantity: item.quantity,
    })),
    available_quantity: 0,
    price_strategy: data.price_strategy || 'fixed',
    fixed_price_retail: data.fixed_price_retail ?? null,
    fixed_price_wholesale: data.fixed_price_wholesale ?? null,
    created_at: now,
    updated_at: now,
  }
  mockCombos.push(newCombo)
  return { ...newCombo }
}

export const mockUpdateCombo = (id: string, data: ComboUpdateInput): Combo => {
  const idx = mockCombos.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Combo no encontrado.')
  const existing = mockCombos[idx]
  const updated: Combo = {
    ...existing,
    name: data.name ?? existing.name,
    sku: data.sku ?? existing.sku,
    price_strategy: data.price_strategy ?? existing.price_strategy,
    fixed_price_retail: data.fixed_price_retail !== undefined ? data.fixed_price_retail : existing.fixed_price_retail,
    fixed_price_wholesale: data.fixed_price_wholesale !== undefined ? data.fixed_price_wholesale : existing.fixed_price_wholesale,
    components: data.items
      ? data.items.map((item, i) => ({
          id: `ci-${id}-${i}`,
          product: item.product_id,
          quantity: item.quantity,
        }))
      : existing.components,
    updated_at: new Date().toISOString(),
  }
  mockCombos[idx] = updated
  return { ...updated }
}

export const mockDeleteCombo = (id: string): void => {
  const idx = mockCombos.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Combo no encontrado.')
  mockCombos[idx].deleted_at = new Date().toISOString()
  mockCombos[idx].updated_at = new Date().toISOString()
}

export const mockRestoreCombo = (id: string): Combo => {
  const idx = mockCombos.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Combo no encontrado.')
  mockCombos[idx].deleted_at = null
  mockCombos[idx].updated_at = new Date().toISOString()
  return { ...mockCombos[idx] }
}
