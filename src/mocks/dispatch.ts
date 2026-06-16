import type { DispatchLocation, DispatchMovement } from '../interfaces/dispatch'

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
