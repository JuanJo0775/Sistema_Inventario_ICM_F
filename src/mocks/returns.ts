import { mockDispatchLocations } from './dispatch'
import type { ReturnEntry, ReturnLocation, ReturnProduct, ReturnsOverview } from '../interfaces/returns'

export const mockReturnLocations: ReturnLocation[] = mockDispatchLocations

export const mockReturnProducts: ReturnProduct[] = [
  {
    id: 'ret-prod-001',
    productId: 'prod-010',
    productName: 'Ultrasonido 3MHz',
    sku: 'CAN-US-007',
    barcode: '770000000101',
    category: 'Electroterapia',
    canReturn: true,
    requiresSerial: true,
  },
  {
    id: 'ret-prod-002',
    productId: 'prod-011',
    productName: 'TENS Bifasico Pro',
    sku: 'CAN-TENS-003',
    barcode: '770000000102',
    category: 'Electroterapia',
    canReturn: true,
    requiresSerial: true,
  },
  {
    id: 'ret-prod-003',
    productId: 'prod-012',
    productName: 'Mesa Hidraulica Basica',
    sku: 'MESA-HID-001',
    barcode: '770000000103',
    category: 'Manoterapia',
    canReturn: false,
    blockReason: 'BR-05: solo Electroterapia y Electronicos admiten devolucion.',
    requiresSerial: false,
  },
  {
    id: 'ret-prod-004',
    productId: 'prod-013',
    productName: 'Agujas Puncion Seca 0.25mm',
    sku: 'CAN-APS-001',
    barcode: '770000000104',
    category: 'Consumibles',
    canReturn: false,
    blockReason: 'BR-05: los consumibles no tienen flujo de devolucion.',
    requiresSerial: false,
  },
]

const nowStamp = () =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

export const mockReturnPending: ReturnEntry[] = [
  {
    id: 'ret-pending-001',
    productId: 'prod-010',
    productName: 'Ultrasonido 3MHz',
    sku: 'CAN-US-007',
    serialNumber: 'US-2024-0091',
    quantity: 1,
    locationCode: 'BOD-01',
    reason: 'Falla al encender',
    productState: 'Con dano visible',
    registeredBy: 'Luis M.',
    registeredAt: nowStamp(),
    status: 'pending',
    note: 'Se adjunto inspeccion visual inicial.',
    relatedMovementId: 'mov-ret-0001',
  },
]

export const mockReturnHistory: ReturnEntry[] = [
  {
    id: 'ret-hist-001',
    productId: 'prod-011',
    productName: 'TENS Bifasico Pro',
    sku: 'CAN-TENS-003',
    serialNumber: 'TENS-1120',
    quantity: 1,
    locationCode: 'BOD-02',
    reason: 'Cliente reporto accesorio faltante',
    productState: 'Empaque abierto',
    registeredBy: 'Carolina R.',
    registeredAt: nowStamp(),
    status: 'reincorporated',
  },
  {
    id: 'ret-hist-002',
    productId: 'prod-014',
    productName: 'Combo Electroterapia Compacto',
    sku: 'COMBO-ELE-004',
    serialNumber: 'COMBO-2041',
    quantity: 2,
    locationCode: 'FRIO-01',
    reason: 'Error de referencia en pedido',
    productState: 'Bueno',
    registeredBy: 'Sistema',
    registeredAt: nowStamp(),
    status: 'recorded',
    note: 'Consulta historica del backend.',
  },
]

export const mockReturnsOverview: ReturnsOverview = {
  locations: mockReturnLocations,
  products: mockReturnProducts,
  pendingReturns: mockReturnPending,
  history: mockReturnHistory,
}
