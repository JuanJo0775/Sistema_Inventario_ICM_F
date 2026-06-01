import { api } from './api'
import { useMocks } from '../mocks/config'
import {
  mockDispatchLocations,
  mockDispatchItems,
  mockDispatchMovements,
} from '../mocks/dispatch'
import type {
  DispatchItem,
  DispatchLocation,
  DispatchMovement,
  DispatchSubmitPayload,
} from '../interfaces/dispatch'

type BackendListResponse<T> = T[] | { results?: T[]; count?: number }
const normalizeList = <T,>(payload: BackendListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

export interface DispatchOverview {
  locations: DispatchLocation[]
  expectedOrders: DispatchItem[]
  recentMovements: DispatchMovement[]
}

export const fetchDispatchOverview = async (): Promise<DispatchOverview> => {
  if (useMocks) {
    return {
      locations: mockDispatchLocations,
      expectedOrders: mockDispatchItems,
      recentMovements: mockDispatchMovements,
    }
  }

  // Use allSettled so one failing endpoint doesn't block the whole page
  const [locationsResult, movementsResult, productsResult] = await Promise.allSettled([
    api.get<BackendListResponse<{ id: string; code: string; name: string }>>(
      '/inventory/locations/',
    ),
    api.get<BackendListResponse<{
      id: string
      product_sku: string
      quantity: number
      origin_location: string | null
      executed_by: string
      created_at: string
      invoice_number: string | null
      note: string | null
    }>>('/movements/dispatches/', { params: { page_size: 10, ordering: '-created_at' } }),
    api.get<BackendListResponse<{
      id: string
      name: string
      sku: string
      barcode: string | null
      category: string | null
      category_slug: string | null
      requires_cold_chain: boolean
      is_active: boolean
    }>>('/catalog/products/'),
  ])

  // Locations – critical, throw if failed
  if (locationsResult.status === 'rejected') {
    throw locationsResult.reason
  }
  const locations = normalizeList(locationsResult.value.data).map((loc) => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    capacityLabel: '',
  }))

  // Recent dispatch movements – optional, default to empty
  let recentMovements: DispatchMovement[] = []
  if (movementsResult.status === 'fulfilled') {
    recentMovements = normalizeList(movementsResult.value.data).map((mov) => ({
      id: mov.id,
      productName: mov.product_sku,
      sku: mov.product_sku,
      quantity: mov.quantity,
      locationCode: mov.origin_location ?? '-',
      operator: mov.executed_by,
      confirmedAt: new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(mov.created_at)),
      invoiceNumber: mov.invoice_number ?? undefined,
      note: mov.note ?? undefined,
    }))
  }

  // Products from catalog – build the dispatch item list from real products
  let expectedOrders: DispatchItem[] = []
  if (productsResult.status === 'fulfilled') {
    const products = normalizeList(productsResult.value.data)
    expectedOrders = products
      .filter((p) => p.is_active)
      .map((prod) => ({
        id: prod.id,
        invoiceNumber: '',
        customerName: '',
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        barcode: prod.barcode || '',
        category: prod.category_slug || '',
        expectedQuantity: 0,
        dispatchedQuantity: 0,
        status: 'pending' as const,
        requiresSerial: false,
        requiresColdChain: prod.requires_cold_chain ?? false,
      }))
  }

  return {
    locations,
    expectedOrders,
    recentMovements,
  }
}

export const submitDispatch = async (
  payload: DispatchSubmitPayload,
): Promise<DispatchMovement> => {
  if (useMocks) {
    const location = mockDispatchLocations.find((item) => item.id === payload.locationId)
    const order = mockDispatchItems.find((item) => item.productId === payload.productId)

    return {
      id: `mov-out-${Date.now()}`,
      productName: order?.productName ?? 'Producto',
      sku: order?.sku ?? 'SKU',
      quantity: payload.quantity,
      locationCode: location?.code ?? '-',
      operator: 'Auxiliar Despacho',
      confirmedAt: new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
      invoiceNumber: order?.invoiceNumber ?? 'ICM-0055',
      customerName: payload.customerData?.name ?? 'Cliente',
      note: payload.note,
    }
  }

  const requestBody = {
    product_id: payload.productId,
    location_id: payload.locationId,
    quantity: payload.quantity,
    movement_type: payload.movementType,
    lot_id: payload.lotId ?? null,
    scanned_code: payload.scannedCode ?? null,
    order_sku: payload.orderSku ?? null,
    serial_number: payload.serialNumber ?? null,
    customer_data: payload.customerData ?? null,
    note: payload.note ?? null,
    cold_chain_acknowledged: payload.coldChainAcknowledged ?? false,
    electrical_safety_acknowledged: payload.electricalSafetyAcknowledged ?? false,
    privacy_notice_acknowledged: payload.privacyNoticeAcknowledged ?? false,
  }

  const response = await api.post<{
    id: string
    product_sku: string
    quantity: number
    origin_location: string | null
    executed_by: string
    created_at: string
    invoice_number: string | null
    note: string | null
  }>('/movements/dispatches/', requestBody)

  const mov = response.data
  return {
    id: mov.id,
    productName: mov.product_sku,
    sku: mov.product_sku,
    quantity: mov.quantity,
    locationCode: mov.origin_location ?? '-',
    operator: mov.executed_by,
    confirmedAt: new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(mov.created_at)),
    invoiceNumber: mov.invoice_number ?? undefined,
    note: mov.note ?? undefined,
  }
}

export const downloadInvoicePdf = async (movementId: string, invoiceNumber: string) => {
  if (useMocks) {
    // Generar archivo dummy de texto para probar la descarga en modo mock
    const dummyContent = `%PDF-1.4\n% MOCK INVOICE ${invoiceNumber}\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`
    const blob = new Blob([dummyContent], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `factura_${invoiceNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  const response = await api.get(`/movements/dispatches/${movementId}/invoice/`, {
    responseType: 'blob',
  })
  
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `factura_${invoiceNumber}.pdf`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
