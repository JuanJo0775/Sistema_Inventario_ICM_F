import { api } from './api'
import { mockAdjustmentsOverview } from '../mocks/adjustments'
import type { AdjustmentsOverview, AdjustmentSubmitPayload } from '../interfaces/adjustments'

const BASE = '/api/v1/movements/adjustments/'

export async function fetchAdjustmentsOverview(useMocks = false): Promise<AdjustmentsOverview> {
  if (useMocks) {
    return mockAdjustmentsOverview
  }

  try {
    const locationsRes = await api.get('/inventory/locations/')
    const locations = (locationsRes.data || []) as Array<{ id: string; code: string; name: string }>

    // For now map locations only and return empty products/history when using backend responses.
    return {
      locations: locations.map((l) => ({ id: l.id, code: l.code, name: l.name })),
      products: [],
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
