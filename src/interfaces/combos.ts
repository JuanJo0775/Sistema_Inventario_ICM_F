export interface ComboItem {
  id: string
  product: string
  quantity: number
}

export interface ComboItemExtended {
  id: string
  product: string
  quantity: number
  product_name?: string
  product_sku?: string
  sale_price_retail?: number | null
  stock_available?: number
}

export interface Combo {
  id: string
  name: string
  sku: string
  deleted_at: string | null
  components: ComboItem[]
  available_quantity: number
  price_strategy: 'derived' | 'fixed'
  fixed_price_retail: number | null
  fixed_price_wholesale: number | null
  created_at: string
  updated_at: string
}

export interface ComboCreateItemInput {
  product_id: string
  quantity: number
}

export interface ComboCreateInput {
  name: string
  sku: string
  items: ComboCreateItemInput[]
  price_strategy?: 'derived' | 'fixed'
  fixed_price_retail?: number | null
  fixed_price_wholesale?: number | null
}

export type ComboUpdateInput = Partial<ComboCreateInput>
