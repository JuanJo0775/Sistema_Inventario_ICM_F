import type { AdjustmentsOverview } from '../interfaces/adjustments'

export const mockAdjustmentsOverview: AdjustmentsOverview = {
  locations: [
    { id: 'loc-1', code: 'B1-A1', name: 'Bodega Principal - Anaquel 1' },
    { id: 'loc-2', code: 'B1-A2', name: 'Bodega Principal - Anaquel 2' },
  ],
  products: [
    { id: 'p-1', productId: 'prod-1', productName: 'Pelota Gel Redonda', sku: 'CAN-PGR-003' },
    { id: 'p-2', productId: 'prod-2', productName: 'TENS Bifasico Pro', sku: 'TENS-001' },
  ],
  history: [
    {
      id: 'adj-1',
      productId: 'prod-1',
      productName: 'Pelota Gel Redonda',
      sku: 'CAN-PGR-003',
      locationId: 'loc-1',
      locationName: 'Bodega Principal - Anaquel 1',
      previousQuantity: 45,
      newQuantity: 38,
      delta: -7,
      justification: '7 unidades faltantes en conteo mensual',
      registeredBy: 'Carlos A.',
      registeredAt: '2026-05-07T09:12:00Z',
    },
    {
      id: 'adj-2',
      productId: 'prod-2',
      productName: 'TENS Bifasico Pro',
      sku: 'TENS-001',
      locationId: 'loc-2',
      locationName: 'Bodega Principal - Anaquel 2',
      previousQuantity: 12,
      newQuantity: 15,
      delta: 3,
      justification: 'Corrección por entrada no registrada',
      registeredBy: 'Carlos A.',
      registeredAt: '2026-04-30T14:22:00Z',
    },
  ],
}

export default {} as never
