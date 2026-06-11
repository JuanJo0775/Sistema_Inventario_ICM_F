import { api } from './api'
import type { LocationItem, StorageType } from '../interfaces/locations'

export const fetchLocations = async (includeInactive = false): Promise<LocationItem[]> => {
  const params = includeInactive ? { include_inactive: 'true' } : undefined
  const response = await api.get<LocationItem[]>('/inventory/locations/', { params })
  return response.data
}

export const createLocation = async (data: {
  name: string
  description?: string
  storage_type_id: string
  capacity_score: number
  operational_status?: string
}): Promise<LocationItem> => {
  const payload = {
    name: data.name,
    description: data.description || '',
    storage_type_id: data.storage_type_id,
    capacity_score: Number(data.capacity_score),
    capacity_mode: 'relative_scale',
    operational_status: data.operational_status || 'active',
  }
  const response = await api.post<LocationItem>('/inventory/locations/', payload)
  return response.data
}

export const updateLocation = async (
  id: string,
  data: {
    name?: string
    description?: string
    capacity_score?: number
    is_active?: boolean
  }
): Promise<LocationItem> => {
  const payload: any = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.description !== undefined) payload.description = data.description
  if (data.capacity_score !== undefined) payload.capacity_score = Number(data.capacity_score)
  if (data.is_active !== undefined) payload.is_active = data.is_active

  const response = await api.patch<LocationItem>(`/inventory/locations/${id}/`, payload)
  return response.data
}

export const deactivateLocation = async (id: string): Promise<void> => {
  await api.delete(`/inventory/locations/${id}/`)
}

export const fetchStorageTypes = async (): Promise<StorageType[]> => {
  const response = await api.get<StorageType[]>('/inventory/storage-types/')
  return response.data
}
