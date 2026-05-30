export type DispatchStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'blocked'

export interface DispatchLocation {
  id: string
  code: string
  name: string
  capacityLabel: string
}

export interface DispatchItem {
  id: string
  invoiceNumber: string
  customerName?: string
  productId: string
  productName: string
  sku: string
  barcode: string
  category: string
  expectedQuantity: number
  dispatchedQuantity: number
  status: DispatchStatus
  requiresSerial: boolean
  requiresColdChain: boolean
  lotId?: string
  serialNumber?: string
}

export interface DispatchMovement {
  id: string
  productName: string
  sku: string
  quantity: number
  locationCode: string
  operator: string
  confirmedAt: string
  invoiceNumber?: string
  customerName?: string
  note?: string
}

export interface DispatchSubmitPayload {
  productId: string
  locationId: string
  quantity: number
  movementType: string
  lotId?: string | null
  scannedCode?: string | null
  orderSku?: string | null
  serialNumber?: string | null
  customerData?: Record<string, any> | null
  note?: string
  coldChainAcknowledged?: boolean
  electricalSafetyAcknowledged?: boolean
  privacyNoticeAcknowledged?: boolean
}
