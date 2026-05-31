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
