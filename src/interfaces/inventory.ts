export interface InventoryCategory {
  id: number | string
  name: string
  slug?: string
  requires_serial_number?: boolean
}

export interface InventorySubcategory {
  id: number | string
  name: string
  category?: number | string | null
}

export interface InventoryProduct {
  id: number | string
  name: string
  sku?: string | null
  category?: number | string | null
  category_slug?: string | null
  subcategory?: number | string | null
  barcode?: string | null
  brand?: string | null
  expiration_date?: string | null
  requires_expiration?: boolean
  requires_cold_chain?: boolean
  reorder_point?: number | null
  is_active?: boolean
  stockTotal?: number | null
  byLocation?: InventoryStockLocation[]
}

export interface InventoryStockLocation {
  location_id?: string
  location_code: string
  location_name?: string
  quantity: number
}

export interface InventoryStockByProduct {
  product_id: string
  product_name?: string
  sku?: string
  by_location?: InventoryStockLocation[]
  per_location?: InventoryStockLocation[]
  total: number
}
