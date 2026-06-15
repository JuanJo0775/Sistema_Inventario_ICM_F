import type { DispatchItem, DispatchLocation, DispatchMovement } from '../interfaces/dispatch'

export const mockDispatchLocations: DispatchLocation[] = [
  {
    id: 'loc-bod-01',
    code: 'BOD-01',
    name: 'Bodega principal',
    capacityLabel: '72% ocupación',
  },
  {
    id: 'loc-bod-02',
    code: 'BOD-02',
    name: 'Bodega consumibles',
    capacityLabel: '64% ocupación',
  },
  {
    id: 'loc-frio-01',
    code: 'FRIO-01',
    name: 'Cuarto frío',
    capacityLabel: '18 posiciones libres',
  },
]

export const mockDispatchItems: DispatchItem[] = [
  {
    id: 'pick-001',
    invoiceNumber: 'ICM-0051',
    customerName: 'Fisioterapia Integral SAS',
    productId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    productName: 'TENS Bifásico Pro',
    sku: 'CAN-TENS-003',
    barcode: '770000000002',
    category: 'Electroterapia',
    expectedQuantity: 2,
    dispatchedQuantity: 0,
    status: 'pending',
    requiresSerial: true,
    requiresColdChain: false,
  },
  {
    id: 'pick-002',
    invoiceNumber: 'ICM-0052',
    customerName: 'Clínica Rehabilitar Sur',
    productId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    productName: 'Agujas Punción Seca 0.25mm',
    sku: 'CAN-APS-001',
    barcode: '770000000003',
    category: 'Consumibles',
    expectedQuantity: 15,
    dispatchedQuantity: 0,
    status: 'pending',
    requiresSerial: false,
    requiresColdChain: false,
  },
  {
    id: 'pick-003',
    invoiceNumber: 'ICM-0053',
    customerName: 'Hospiclínica Ltda',
    productId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    productName: 'Gel Conductor 250ml',
    sku: 'CAN-GEL-005',
    barcode: '770000000004',
    category: 'Consumibles',
    expectedQuantity: 12,
    dispatchedQuantity: 0,
    status: 'pending',
    requiresSerial: false,
    requiresColdChain: true,
  },
]

export const mockDispatchMovements: DispatchMovement[] = [
  {
    id: 'mov-out-001',
    productName: 'Pelota Gel Ovalada',
    sku: 'CAN-PGO-002',
    quantity: 5,
    locationCode: 'BOD-02',
    operator: 'Auxiliar Despacho',
    confirmedAt: '12:40',
    invoiceNumber: 'ICM-0049',
    customerName: 'Salud Total EPS',
  },
]
