import axios from 'axios'

import { api } from './api'
import { fetchCategories, fetchProducts } from './inventory'
import { useMocks } from '../mocks/config'
import type {
  ReturnEntry,
  ReturnLocation,
  ReturnProduct,
  ReturnsOverview,
  ReturnSubmitPayload,
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
): ReturnProduct[] => {
  const categoryById = new Map(categories.map((category) => [String(category.id), category]))

  return products.map((product) => {
    const category = categoryById.get(String(product.category))
    const canReturn = category?.is_returnable ?? false
    const requiresSerial = category?.requires_serial_number ?? false

    return {
      id: `ret-${product.id}`,
      productId: String(product.id),
      productName: product.name,
      sku: product.sku ?? '-',
      barcode: product.barcode ?? '',
      category: category?.name ?? '-',
      canReturn,
      blockReason: canReturn ? undefined : BR05_BLOCK_REASON,
      requiresSerial,
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
      api.get<{ results: Array<{ id: string; code: string; name: string }> }>('/inventory/locations/'),
      api.get<{ results: BackendReturnMovement[] }>('/movements/returns/', {
        params: { page_size: 20, ordering: '-created_at' },
      }),
      fetchCategories(),
      fetchProducts({ limit: 100 }),
    ])

    const locations: ReturnLocation[] = locationsRes.data.results.map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
      capacityLabel: '',
    }))

    const locationById = new Map(locations.map((location) => [location.id, location]))
    const products = mapProductsForReturns(rawProducts, categories)

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
    console.warn(
      'Error al cargar el resumen de devoluciones del backend real. Usando datos mock de contingencia.',
      err,
    )
    const { mockReturnsOverview } = await import('../mocks/returns')
    return mockReturnsOverview
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
