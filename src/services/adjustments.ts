import { api } from './api'
import { mockAdjustmentsOverview } from '../mocks/adjustments'
import type { AdjustmentsOverview, AdjustmentSubmitPayload } from '../interfaces/adjustments'

const BASE = '/api/v1/movements/adjustments/'

export async function fetchAdjustmentsOverview(useMocks = false): Promise<AdjustmentsOverview> {
  if (useMocks) {
    return mockAdjustmentsOverview
  }

  try {
    const [locationsRes, productsRes] = await Promise.all([
      api.get<{ results?: Array<{ id: string; code: string; name: string }> } | Array<{ id: string; code: string; name: string }>>('/inventory/locations/'),
      api.get<{ results?: Array<{ id: string; sku: string; name: string; barcode?: string; category?: string | number | null; subcategory?: string | number | null }> } | Array<{ id: string; sku: string; name: string; barcode?: string }>>('/catalog/products/?page_size=500'),
    ])

    // Normalizar respuestas paginadas o arrays directos
    const locationsRaw = Array.isArray(locationsRes.data)
      ? locationsRes.data
      : (locationsRes.data?.results ?? [])

    const productsRaw = Array.isArray(productsRes.data)
      ? productsRes.data
      : (productsRes.data?.results ?? [])

    return {
      locations: locationsRaw.map((l) => ({ id: l.id, code: l.code, name: l.name })),
      products: productsRaw.map((p, i) => ({
        id: String(i),          // índice local — solo para key de React
        productId: p.id,        // UUID real del backend
        productName: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category ?? undefined,
      })),
      history: [],
    }
  } catch (error) {
    console.warn(
      'Error al cargar ajustes del backend real. Usando datos mock de contingencia.',
      error,
    )
    return mockAdjustmentsOverview
  }
}

export async function submitAdjustment(payload: AdjustmentSubmitPayload) {
  return api.post(BASE, payload)
}

export default {} as never
