export interface StorageType {
  id: string
  code: string
  name: string
  is_active: boolean
}

export interface LocationItem {
  id: string
  code: string
  name: string
  description?: string
  is_retail: boolean
  max_capacity: number | null
  storage_type_id: string | null
  storage_type_code: string | null
  storage_type_name: string | null
  storage_template_id: string | null
  storage_template_code: string | null
  storage_template_name: string | null
  operational_status: 'active' | 'maintenance' | 'restricted' | 'blocked' | 'archived'
  capacity_mode: 'none' | 'relative_scale' | 'absolute_legacy'
  capacity_level: number | null
  capacity_score: number | null
  occupancy_estimate_pct: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}
