export type ReturnStatus = 'pending' | 'recorded' | 'reincorporated' | 'rejected' | 'blocked'

export interface ReturnLocation {
  id: string
  code: string
  name: string
  capacityLabel: string
}

export interface ReturnProduct {
  id: string
  productId: string
  productName: string
  sku: string
  barcode: string
  category: string
  canReturn: boolean
  blockReason?: string
  requiresSerial: boolean
  stockTotal?: number
  byLocation?: Array<{ location_code: string; location_name?: string; quantity: number }>
}

export interface ReturnEntry {
  id: string
  productId: string
  productName: string
  sku: string
  serialNumber: string
  quantity: number
  locationCode: string
  reason: string
  productState: string
  registeredBy: string
  registeredAt: string
  status: ReturnStatus
  note?: string
  relatedMovementId?: string
  blockReason?: string
}

export interface ReturnsOverview {
  locations: ReturnLocation[]
  products: ReturnProduct[]
  pendingReturns: ReturnEntry[]
  history: ReturnEntry[]
}

export interface ReturnSubmitPayload {
  productId: string
  locationId: string
  quantity: number
  serialNumber?: string
  relatedMovementId?: string
  reason: string
  productState: string
  note?: string
}

/** Movimiento de salida (despacho) que puede ser el origen de una devolución */
export interface OutgoingMovement {
  id: string
  movementType: string
  movementTypeLabel: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  customerName: string
  customerDoc: string
  createdAt: string
}
