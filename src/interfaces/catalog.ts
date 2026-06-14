export interface CatalogCategory {
  id: string
  name: string
  slug: string
  requires_serial_number: boolean
  is_returnable: boolean
  description: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  product_count?: number // Computed on frontend
}

export interface CatalogBrand {
  id: string
  name: string
  description?: string
  slug: string
  category?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  product_count?: number
}

export interface CatalogProduct {
  id: string
  sku: string
  name: string
  category: string // Category UUID
  category_slug?: string
  subcategory: string | null // Subcategory (Brand) UUID
  barcode: string | null
  barcode_type?: string | null
  barcode_svg?: string | null
  barcode_svg_data_uri?: string | null
  brand: string // CharField from backend
  expiration_date: string | null
  requires_expiration: boolean
  weight_grams: number | null
  requires_cold_chain: boolean
  is_active: boolean
  notes: string
  reorder_point: number
  created_at?: string
  updated_at?: string
  stockTotal?: number // Computed or fetched from stock API
  // Pricing fields — null por defecto si no se configuraron
  unit_cost?: number | null
  sale_price_retail?: number | null
  sale_price_wholesale?: number | null
  tax_rate_pct?: number | null
  currency?: string | null
}

export interface CatalogProductCreateInput {
  sku: string
  name: string
  category_id: string
  subcategory_id?: string | null
  barcode?: string | null
  brand?: string
  requires_cold_chain?: boolean
  requires_expiration?: boolean
  expiration_date?: string | null
  weight_grams?: number | null
  notes?: string
  reorder_point?: number
  is_active?: boolean
}

export interface CatalogProductUpdateInput {
  name?: string
  sku?: string
  category_id?: string
  subcategory_id?: string | null
  barcode?: string | null
  brand?: string
  requires_cold_chain?: boolean
  requires_expiration?: boolean
  expiration_date?: string | null
  weight_grams?: number | null
  notes?: string
  reorder_point?: number
  is_active?: boolean
}

/** Payload para PATCH /catalog/products/{id}/prices/ */
export interface CatalogProductPricesInput {
  unit_cost?: number | null
  sale_price_retail?: number | null
  sale_price_wholesale?: number | null
  tax_rate_pct?: number | null
  currency?: string | null
}
