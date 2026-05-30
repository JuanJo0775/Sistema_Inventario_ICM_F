export type ReceptionStatus = 'pending' | 'partial' | 'ready' | 'received' | 'blocked'

export interface ReceptionLocation {
  id: string
  code: string
  name: string
  capacityLabel: string
}

export interface ReceptionExpectedOrder {
  id: string
  purchaseOrder: string
  supplier: string
  invoice: string
  productId: string
  productName: string
  sku: string
  barcode: string
  category: string
  expectedQuantity: number
  receivedQuantity: number
  locationId: string
  dueDate: string
  status: ReceptionStatus
  requiresSerial: boolean
  requiresColdChain: boolean
  lot?: string
  expirationDate?: string
}

export interface ReceptionMovement {
  id: string
  productName: string
  sku: string
  quantity: number
  locationCode: string
  operator: string
  confirmedAt: string
  discrepancyNote?: string
}

export interface ReceptionOverview {
  locations: ReceptionLocation[]
  expectedOrders: ReceptionExpectedOrder[]
  recentMovements: ReceptionMovement[]
}

export interface ReceptionSubmitPayload {
  orderId: string
  receivedQuantity: number
  locationId: string
  lot?: string
  expirationDate?: string
  serialNumbers?: string[]
  discrepancyNote?: string
}
