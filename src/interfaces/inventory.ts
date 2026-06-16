export interface InventoryCategory {
  id: string;
  name: string;
  slug: string;
  requires_serial_number?: boolean;
  is_returnable?: boolean;
  description?: string;
}

export interface InventorySubcategory {
  id: string;
  name: string;
  slug?: string;
  category?: string | null;
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  category_slug?: string | null;
  subcategory?: string | null;
  barcode?: string | null;
  brand?: string | null;
  expiration_date?: string | null;
  weight_grams?: number | null;
  requires_cold_chain?: boolean;
  notes?: string;
  reorder_point?: number | null;
  is_active?: boolean;
  // campos calculados que agrega el frontend
  stockTotal?: number | null;
  byLocation?: InventoryStockLocation[];
}

export interface InventoryStockLocation {
  location_id?: string;
  location_code: string;
  location_name?: string;
  quantity: number;
}

export interface InventoryStockByProduct {
  product_id: string;
  product_name?: string;
  sku?: string;
  by_location?: InventoryStockLocation[];
  per_location?: InventoryStockLocation[];
  total: number;
}
