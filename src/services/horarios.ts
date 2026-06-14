import { api } from './api'
import type { UserScheduleItem, SchedulePayload, TemporaryPermitItem, PermitPayload } from '../interfaces/horarios'

export const fetchUserSchedule = async (userId: string): Promise<UserScheduleItem> => {
  const response = await api.get<UserScheduleItem>(`/auth/users/${userId}/schedule/`)
  return response.data
}

export const saveUserSchedule = async (userId: string, payload: SchedulePayload): Promise<UserScheduleItem> => {
  const response = await api.post<UserScheduleItem>(`/auth/users/${userId}/schedule/`, payload)
  return response.data
}

export const fetchTemporaryPermits = async (userId: string): Promise<TemporaryPermitItem[]> => {
  const response = await api.get<TemporaryPermitItem[]>(`/auth/users/${userId}/temporary-permits/`)
  return response.data
}

export const grantTemporaryPermit = async (userId: string, payload: PermitPayload): Promise<TemporaryPermitItem> => {
  const response = await api.post<TemporaryPermitItem>(`/auth/users/${userId}/temporary-permits/`, payload)
  return response.data
}

export const revokeTemporaryPermit = async (permitId: string): Promise<TemporaryPermitItem> => {
  const response = await api.post<TemporaryPermitItem>(`/auth/temporary-permits/${permitId}/revoke/`)
  return response.data
}
