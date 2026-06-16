export interface AdjustmentLocation {
  id: string
  code: string
  name: string
}

export interface AdjustmentProduct {
  id: string
  productId: string
  productName: string
  sku: string
  barcode?: string
  category?: string
}

export interface AdjustmentEntry {
  id: string
  productId: string
  productName: string
  sku: string
  locationId: string
  locationName: string
  previousQuantity: number
  newQuantity: number
  delta: number
  justification: string
  registeredBy: string
  registeredAt: string
}

export interface AdjustmentsOverview {
  locations: AdjustmentLocation[]
  products: AdjustmentProduct[]
  history: AdjustmentEntry[]
}

export interface AdjustmentSubmitPayload {
  product_id: string
  location_id: string
  new_quantity: number
  justification: string
}

export default {} as never
