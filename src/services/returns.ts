import axios from 'axios'

import { api } from './api'
import { fetchCategories, fetchProducts, fetchProductStock } from './inventory'
import { useMocks } from '../mocks/config'
import type {
  ReturnEntry,
  ReturnLocation,
  ReturnProduct,
  ReturnsOverview,
  ReturnSubmitPayload,
  OutgoingMovement,
} from '../interfaces/returns'
import type { InventoryCategory, InventoryProduct } from '../interfaces/inventory'

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const BR05_BLOCK_REASON =
  'Solo Electroterapia y Electrónicos admiten devolución.'

type BackendReturnMovement = {
  id: string
  product: string
  product_sku: string
  quantity: number
  serial_number: string | null
  executed_by: string
  created_at: string
  related_movement: string | null
  destination_location: string | null
}

export const mapProductsForReturns = (
  products: InventoryProduct[],
  categories: InventoryCategory[],
  stockMap?: Record<string, number>,
  stockLocationsMap?: Record<string, Array<{ location_code: string; location_name?: string; quantity: number }>>,
): ReturnProduct[] => {
  const categoryById = new Map(categories.map((category) => [String(category.id), category]))

  return products.map((product) => {
    const category = categoryById.get(String(product.category))
    const canReturn = category?.is_returnable ?? false
    const requiresSerial = category?.requires_serial_number ?? false
    const pid = String(product.id)

    return {
      id: `ret-${product.id}`,
      productId: pid,
      productName: product.name,
      sku: product.sku ?? '-',
      barcode: product.barcode ?? '',
      category: category?.name ?? '-',
      canReturn,
      blockReason: canReturn ? undefined : BR05_BLOCK_REASON,
      requiresSerial,
      stockTotal: stockMap?.[pid] ?? product.stockTotal ?? undefined,
      byLocation: stockLocationsMap?.[pid] ?? undefined,
    }
  })
}

const mapMovementToReturnEntry = (
  movement: BackendReturnMovement,
  products: ReturnProduct[],
  locationById: Map<string, ReturnLocation>,
  fallbackReason: string,
  status: ReturnEntry['status'] = 'recorded',
): ReturnEntry => {
  const product = products.find((item) => item.productId === movement.product)
  const location = movement.destination_location
    ? locationById.get(movement.destination_location)
    : undefined

  return {
    id: movement.id,
    productId: movement.product,
    productName: product?.productName ?? movement.product_sku,
    sku: product?.sku ?? movement.product_sku,
    serialNumber: movement.serial_number ?? '-',
    quantity: movement.quantity,
    locationCode: location?.code ?? '-',
    reason: fallbackReason,
    productState: 'Registrado',
    registeredBy: movement.executed_by,
    registeredAt: formatTimestamp(movement.created_at),
    status,
    relatedMovementId: movement.related_movement ?? undefined,
  }
}

export const getSubmitReturnErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const payload = error.response?.data as { error?: string; message?: string } | undefined
  if (payload?.error === 'PRODUCT_NOT_RETURNABLE') {
    return payload.message ?? fallback
  }

  return payload?.message ?? fallback
}

export const fetchReturnsOverview = async (): Promise<ReturnsOverview> => {
  if (useMocks) {
    const { mockReturnsOverview } = await import('../mocks/returns')
    return mockReturnsOverview
  }

  try {
    const [locationsRes, returnsRes, categories, rawProducts] = await Promise.all([
      api.get<Array<{ id: string; code: string; name: string }> | { results: Array<{ id: string; code: string; name: string }> }>('/inventory/locations/'),
      api.get<{ results: BackendReturnMovement[] }>('/movements/returns/', {
        params: { page_size: 20, ordering: '-created_at' },
      }),
      fetchCategories(),
      fetchProducts({ limit: 100 }),
    ])

    const locData = Array.isArray(locationsRes.data) ? locationsRes.data : locationsRes.data.results
    const locations: ReturnLocation[] = locData.map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
      capacityLabel: '',
    }))

    const locationById = new Map(locations.map((location) => [location.id, location]))

    const stockResults = await Promise.allSettled(
      rawProducts.map(p => fetchProductStock(String(p.id)))
    )
    const stockMap: Record<string, number> = {}
    const stockLocationsMap: Record<string, Array<{ location_code: string; location_name?: string; quantity: number }>> = {}
    stockResults.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        const pid = String(rawProducts[i].id)
        stockMap[pid] = r.value.total
        stockLocationsMap[pid] = r.value.by_location ?? r.value.per_location ?? []
      }
    })

    const products = mapProductsForReturns(rawProducts, categories, stockMap, stockLocationsMap)

    const history: ReturnEntry[] = returnsRes.data.results.map((movement) =>
      mapMovementToReturnEntry(
        movement,
        products,
        locationById,
        'Movimiento registrado en backend',
      ),
    )

    return {
      locations,
      products,
      pendingReturns: [],
      history,
    }
  } catch (err) {
    console.error('Error al cargar el resumen de devoluciones del backend.', err)
    throw err
  }
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  SALIDA_VENTA_MAYOR: 'Venta al por mayor',
  SALIDA_VENTA_MENOR: 'Venta al por menor',
  SALIDA_DANO: 'Salida por daño',
  SALIDA_VENCIMIENTO: 'Salida por vencimiento',
}

type BackendDispatchMovement = {
  id: string
  movement_type: string
  product: string
  product_sku: string
  quantity: number
  created_at: string
  invoice_number: string | null
  customer_snapshot: Record<string, unknown> | null
}

export const fetchOutgoingMovements = async (): Promise<OutgoingMovement[]> => {
  if (useMocks) {
    const { mockReturnsOverview } = await import('../mocks/returns')
    return mockReturnsOverview.products
      .filter((p) => p.canReturn)
      .map((p, i) => ({
        id: `mov-out-${i}-${p.productId}`,
        movementType: 'SALIDA_VENTA_MAYOR',
        movementTypeLabel: 'Venta al por mayor',
        productId: p.productId,
        productName: p.productName,
        productSku: p.sku,
        quantity: 2,
        customerName: 'Cliente Ejemplo S.A.S.',
        customerDoc: '900123456-7',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }))
  }

  try {
    const response = await api.get<{ results: BackendDispatchMovement[] }>(
      '/movements/dispatches/',
      { params: { page_size: 100, ordering: '-created_at' } },
    )

    return response.data.results.map((mov) => {
      const customerSnapshot = mov.customer_snapshot ?? {}
      return {
        id: mov.id,
        movementType: mov.movement_type,
        movementTypeLabel: MOVEMENT_TYPE_LABELS[mov.movement_type] ?? mov.movement_type,
        productId: mov.product,
        productName: mov.product_sku,
        productSku: mov.product_sku,
        quantity: mov.quantity,
        customerName: String(customerSnapshot.customer_name ?? ''),
        customerDoc: String(customerSnapshot.customer_doc ?? ''),
        createdAt: mov.created_at,
      }
    })
  } catch (err) {
    console.error('Error al cargar movimientos de salida.', err)
    return []
  }
}

export const submitReturn = async (
  payload: ReturnSubmitPayload,
): Promise<ReturnEntry> => {
  if (useMocks) {
    const { mockReturnsOverview } = await import('../mocks/returns')
    const product = mockReturnsOverview.products.find((item) => item.productId === payload.productId)
    const location = mockReturnsOverview.locations.find((item) => item.id === payload.locationId)

    return {
      id: `ret-${Date.now()}`,
      productId: payload.productId,
      productName: product?.productName ?? 'Producto',
      sku: product?.sku ?? 'SKU',
      serialNumber: payload.serialNumber ?? '-',
      quantity: payload.quantity,
      locationCode: location?.code ?? '-',
      reason: payload.reason,
      productState: payload.productState,
      registeredBy: 'Usuario ICM',
      registeredAt: formatTimestamp(new Date().toISOString()),
      status: 'pending',
      note: payload.note,
      relatedMovementId: payload.relatedMovementId,
    }
  }

  const response = await api.post<BackendReturnMovement>('/movements/returns/', {
    product_id: payload.productId,
    location_id: payload.locationId,
    quantity: payload.quantity,
    serial_number: payload.serialNumber ?? null,
    related_movement_id: payload.relatedMovementId ?? null,
  })

  const movement = response.data

  return {
    id: movement.id,
    productId: movement.product,
    productName: movement.product_sku,
    sku: movement.product_sku,
    serialNumber: movement.serial_number ?? '-',
    quantity: movement.quantity,
    locationCode: '-',
    reason: payload.reason,
    productState: payload.productState,
    registeredBy: movement.executed_by,
    registeredAt: formatTimestamp(movement.created_at),
    status: 'recorded',
    note: payload.note,
    relatedMovementId: movement.related_movement ?? undefined,
  }
}
