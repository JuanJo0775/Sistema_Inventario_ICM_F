import { api } from './api'
import type { TransferItem, CreateTransferPayload } from '../interfaces/transfers'

type BackendListResponse<T> = T[] | { results?: T[]; count?: number }

const normalizeList = <T,>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

export const fetchTransfers = async (params?: {
  page?: number
  page_size?: number
}): Promise<{ results: TransferItem[]; count: number }> => {
  const response = await api.get<BackendListResponse<TransferItem>>('/movements/transfers/', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 10,
    },
  })

  const count = typeof response.data === 'object' && response.data !== null && 'count' in response.data
    ? (response.data.count ?? 0)
    : 0

  return {
    results: normalizeList(response.data),
    count,
  }
}

export const submitTransfer = async (payload: CreateTransferPayload): Promise<TransferItem> => {
  const response = await api.post<TransferItem>('/movements/transfers/', payload)
  return response.data
}

export const fetchProductMovements = async (productId: string): Promise<any[]> => {
  const response = await api.get<BackendListResponse<any>>('/movements/', {
    params: {
      product_id: productId,
      page_size: 100, // retrieve a good chunk of history to extract all lots
    },
  })
  return normalizeList(response.data)
}

export interface UserItem {
  id: string
  username: string
  first_name: string
  last_name: string
}

export const fetchUsers = async (): Promise<UserItem[]> => {
  try {
    const response = await api.get<BackendListResponse<UserItem>>('/auth/users/', {
      params: {
        page_size: 100,
      },
    })
    return normalizeList(response.data)
  } catch (error) {
    console.warn('No se pudieron obtener los usuarios de la API (es probable que falten permisos).', error)
    return []
  }
}
