import { api } from './api'
import { useMocks } from '../mocks/config'
import { mockReceptionOverview } from '../mocks/reception'
import type {
  ReceptionMovement,
  ReceptionOverview,
  ReceptionSubmitPayload,
} from '../interfaces/reception'

/**
 * Recepción — carga el overview (mock o API).
 *
 * En producción el backend no tiene un endpoint `/movements/reception/overview/`
 * dedicado. Obtenemos las ubicaciones desde `/inventory/locations/` y los
 * movimientos recientes (tipo ENTRY) desde `/movements/entries/`.
 * Los "expectedOrders" son datos del ERP/OC; en esta versión mantenemos el mock
 * hasta que el backend exponga el endpoint de purchase-orders.
 */
export const fetchReceptionOverview = async (): Promise<ReceptionOverview> => {
  if (useMocks) {
    return mockReceptionOverview
  }

  // Llamadas paralelas al backend real
  const [locationsRes, movementsRes] = await Promise.all([
    api.get<{ results: Array<{ id: string; code: string; name: string }> }>(
      '/inventory/locations/',
    ),
    api.get<{
      results: Array<{
        id: string
        product_sku: string
        quantity: number
        destination_location: string | null
        executed_by: string
        created_at: string
        discrepancy_note: string | null
      }>
    }>('/movements/entries/', { params: { page_size: 10, ordering: '-created_at' } }),
  ])

  const locations = locationsRes.data.results.map((loc) => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    capacityLabel: '',
  }))

  const recentMovements: ReceptionMovement[] = movementsRes.data.results.map((mov) => ({
    id: mov.id,
    productName: mov.product_sku,
    sku: mov.product_sku,
    quantity: mov.quantity,
    locationCode: mov.destination_location ?? '-',
    operator: mov.executed_by,
    confirmedAt: new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(mov.created_at)),
    discrepancyNote: mov.discrepancy_note ?? undefined,
  }))

  return {
    locations,
    // expectedOrders vacío hasta que el backend exponga purchase-orders
    expectedOrders: mockReceptionOverview.expectedOrders,
    recentMovements,
  }
}

/**
 * Registra una entrada de mercancía.
 *
 * Payload del backend (EntryCreateRequest):
 *   product_id        UUID      — requerido
 *   location_id       UUID      — requerido
 *   quantity          int ≥ 1   — requerido
 *   serial_number     string?   — nullable (se envía solo el primero de la lista)
 *   qty_invoiced      int?      — nullable (cantidad facturada esperada)
 *   discrepancy_note  string?   — nullable
 *   cold_chain_acknowledged       bool  — default false
 *   electrical_safety_acknowledged bool  — default false
 */
export const submitReception = async (
  payload: ReceptionSubmitPayload,
): Promise<ReceptionMovement> => {
  if (useMocks) {
    const order = mockReceptionOverview.expectedOrders.find((item) => item.id === payload.orderId)
    const location = mockReceptionOverview.locations.find((item) => item.id === payload.locationId)

    return {
      id: `mov-in-${Date.now()}`,
      productName: order?.productName ?? payload.orderId,
      sku: order?.sku ?? '-',
      quantity: payload.receivedQuantity,
      locationCode: location?.code ?? '-',
      operator: 'Usuario ICM',
      confirmedAt: new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
      discrepancyNote: payload.discrepancyNote,
    }
  }

  // Busca la orden en el mock para obtener el product_id real y qty_invoiced
  const order = mockReceptionOverview.expectedOrders.find((item) => item.id === payload.orderId)

  const requestBody = {
    product_id: order?.productId ?? payload.orderId,
    location_id: payload.locationId,
    quantity: payload.receivedQuantity,
    // Solo enviamos el primer serial si hay varios (backend acepta uno por movimiento)
    serial_number: payload.serialNumbers?.length ? payload.serialNumbers[0] : null,
    qty_invoiced: order?.expectedQuantity ?? null,
    discrepancy_note: payload.discrepancyNote ?? null,
    cold_chain_acknowledged: order?.requiresColdChain ?? false,
    electrical_safety_acknowledged: false,
  }

  const response = await api.post<{
    id: string
    product_sku: string
    quantity: number
    destination_location: string | null
    executed_by: string
    created_at: string
    discrepancy_note: string | null
  }>('/movements/entries/', requestBody)

  const mov = response.data
  return {
    id: mov.id,
    productName: order?.productName ?? mov.product_sku,
    sku: mov.product_sku,
    quantity: mov.quantity,
    locationCode: mov.destination_location ?? '-',
    operator: mov.executed_by,
    confirmedAt: new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(mov.created_at)),
    discrepancyNote: mov.discrepancy_note ?? undefined,
  }
}
