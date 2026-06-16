export interface UserScheduleItem {
  id: string
  user: string
  morning_start: string | null
  morning_end: string | null
  afternoon_start: string | null
  afternoon_end: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SchedulePayload {
  morning_start?: string
  morning_end?: string
  afternoon_start?: string
  afternoon_end?: string
  is_active?: boolean
}

export interface TemporaryPermitItem {
  id: string
  user: string
  user_username: string
  start_datetime: string
  end_datetime: string
  allow_24_7: boolean
  custom_morning_start: string | null
  custom_morning_end: string | null
  custom_afternoon_start: string | null
  custom_afternoon_end: string | null
  reason: string
  granted_by: string
  granted_by_username: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PermitPayload {
  start_datetime: string
  end_datetime: string
  allow_24_7?: boolean
  custom_morning_start?: string
  custom_morning_end?: string
  custom_afternoon_start?: string
  custom_afternoon_end?: string
  reason: string
}
