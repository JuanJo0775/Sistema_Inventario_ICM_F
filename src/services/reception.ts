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
 * dedicado. Obtenemos las ubicaciones desde `/inventory/locations/`,
 * los movimientos recientes (tipo ENTRY) desde `/movements/entries/` y
 * construimos la lista de pedidos esperados a partir de los productos reales.
 */
export const fetchReceptionOverview = async (): Promise<ReceptionOverview> => {
  if (useMocks) {
    return mockReceptionOverview
  }

  // Llamadas paralelas al backend real
  const [locationsRes, movementsRes, productsRes, categoriesRes] = await Promise.all([
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
    api.get<any>('/catalog/products/'),
    api.get<any>('/catalog/categories/'),
  ])

  const getList = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data
    return data.results ?? []
  }

  const locations = getList<{ id: string; code: string; name: string }>(locationsRes.data).map((loc) => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    capacityLabel: '',
  }))

  const recentMovements: ReceptionMovement[] = getList<any>(movementsRes.data).map((mov) => ({
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

  const products = getList<any>(productsRes.data)
  const categories = getList<any>(categoriesRes.data)

  const expectedOrders = products.map((product, index) => {
    const category = categories.find((cat) => cat.id === product.category)
    const requiresSerial = category ? !!category.requires_serial_number : false

    return {
      id: product.id,
      purchaseOrder: `OC-2026-${product.sku.toUpperCase()}`,
      supplier: 'Proveedor ICM',
      invoice: `IMP-88${421 + index}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: category?.name || 'Medicamentos',
      expectedQuantity: 50,
      receivedQuantity: 0,
      locationId: locations[0]?.id || '',
      dueDate: '2026-06-30',
      status: 'pending' as const,
      requiresSerial,
      requiresColdChain: !!product.requires_cold_chain,
    }
  })

  return {
    locations,
    expectedOrders,
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
 *   lot_code          string?
 *   lot_expiration_date string?
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

  const productRes = await api.get<any>(`/catalog/products/${payload.orderId}/`)
  const product = productRes.data

  const requestBody = {
    product_id: product.id,
    location_id: payload.locationId,
    quantity: payload.receivedQuantity,
    // Solo enviamos el primer serial si hay varios (backend acepta uno por movimiento)
    serial_number: payload.serialNumbers?.length ? payload.serialNumbers[0] : null,
    qty_invoiced: 50,
    discrepancy_note: payload.discrepancyNote ?? null,
    cold_chain_acknowledged: !!product.requires_cold_chain,
    electrical_safety_acknowledged: false,
    lot_code: payload.lot ?? null,
    lot_expiration_date: payload.expirationDate ?? null,
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
    productName: product.name,
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
