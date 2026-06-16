import { api } from './api'
import type {
  Combo,
  ComboCreateInput,
  ComboUpdateInput,
} from '../interfaces/combos'
import { useMocks } from '../mocks/config'
import {
  mockGetCombos,
  mockGetComboDetail,
  mockCreateCombo,
  mockUpdateCombo,
  mockDeleteCombo,
  mockRestoreCombo,
} from '../mocks/combos'

type BackendListResponse<T> = T[] | { results?: T[]; count?: number }

const normalizeList = <T>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

export const fetchCombos = async (
  includeArchived = false,
): Promise<Combo[]> => {
  if (useMocks) return mockGetCombos(includeArchived)

  const response = await api.get<BackendListResponse<Combo>>(
    '/catalog/combos/',
    {
      params: includeArchived ? { include_archived: 'true' } : undefined,
    },
  )
  return normalizeList(response.data)
}

export const fetchComboDetail = async (id: string): Promise<Combo> => {
  if (useMocks) return mockGetComboDetail(id)

  const response = await api.get<Combo>(`/catalog/combos/${id}/`)
  return response.data
}

export const createCombo = async (data: ComboCreateInput): Promise<Combo> => {
  if (useMocks) return mockCreateCombo(data)

  const payload = {
    name: data.name,
    sku: data.sku,
    items: data.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
    price_strategy: data.price_strategy || 'fixed',
    ...(data.fixed_price_retail !== undefined
      ? { fixed_price_retail: data.fixed_price_retail }
      : {}),
    ...(data.fixed_price_wholesale !== undefined
      ? { fixed_price_wholesale: data.fixed_price_wholesale }
      : {}),
  }

  const response = await api.post<Combo>('/catalog/combos/', payload)
  return response.data
}

export const updateCombo = async (
  id: string,
  data: ComboUpdateInput,
): Promise<Combo> => {
  if (useMocks) return mockUpdateCombo(id, data)

  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.sku !== undefined) payload.sku = data.sku
  if (data.items !== undefined) {
    payload.items = data.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }))
  }
  if (data.price_strategy !== undefined) payload.price_strategy = data.price_strategy
  if (data.fixed_price_retail !== undefined) payload.fixed_price_retail = data.fixed_price_retail
  if (data.fixed_price_wholesale !== undefined) payload.fixed_price_wholesale = data.fixed_price_wholesale

  const response = await api.patch<Combo>(`/catalog/combos/${id}/`, payload)
  return response.data
}

export const deleteCombo = async (id: string): Promise<void> => {
  if (useMocks) return mockDeleteCombo(id)

  await api.delete(`/catalog/combos/${id}/`)
}

export const restoreCombo = async (id: string): Promise<Combo> => {
  if (useMocks) return mockRestoreCombo(id)

  const response = await api.post<Combo>(`/catalog/combos/${id}/restore/`)
  return response.data
}
