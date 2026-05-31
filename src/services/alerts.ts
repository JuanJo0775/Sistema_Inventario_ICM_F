import { api } from './api'
import { useMocks } from '../mocks/config'
import { mockAlerts } from '../mocks/alerts'
import type { AlertItem } from '../interfaces/alerts'

type AlertListResponse = AlertItem[] | { results?: AlertItem[] }

const normalizeList = <T,>(payload: T[] | { results?: T[] }): T[] =>
  Array.isArray(payload) ? payload : payload.results ?? []

export const fetchActiveAlerts = async (filters?: {
  alert_type?: string
  product_id?: string
}): Promise<AlertItem[]> => {
  const getMockAlerts = () => {
    return mockAlerts.filter((alert) => {
      if (filters?.alert_type && alert.alert_type !== filters.alert_type) {
        return false
      }
      if (filters?.product_id && alert.product !== filters.product_id) {
        return false
      }
      return true
    })
  }

  if (useMocks) {
    return getMockAlerts()
  }

  try {
    const response = await api.get<AlertListResponse>('/alerts/', {
      params: {
        alert_type: filters?.alert_type || undefined,
        product_id: filters?.product_id || undefined,
      },
    })

    return normalizeList(response.data)
  } catch (error) {
    console.warn(
      'Error al cargar alertas activas del backend real. Usando datos mock de contingencia.',
      error,
    )
    return getMockAlerts()
  }
}

export const resolveAlert = async (alertId: string): Promise<AlertItem> => {
  if (useMocks) {
    const alert = mockAlerts.find((item) => item.id === alertId)
    if (alert) {
      alert.is_resolved = true
      alert.resolved_at = new Date().toISOString()
      alert.resolved_by = '1' // Almacenista ID
      return alert
    }
    throw new Error('Alert not found')
  }

  const response = await api.post<AlertItem>(`/alerts/${alertId}/resolve/`)
  return response.data
}
