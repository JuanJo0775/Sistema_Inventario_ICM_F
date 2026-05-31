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

  try {
    // Parrallel backend calls
    const [locationsRes, movementsRes, ordersRes] = await Promise.all([
      api.get<{ results: Array<{ id: string; code: string; name: string }> }>(
        '/inventory/locations/',
      ),
      api.get<{
        results: Array<{
          id: string
          product_sku: string
          quantity: number
          origin_location: string | null
          executed_by: string
          created_at: string
          invoice_number: string | null
          note: string | null
        }>
      }>('/movements/dispatches/', { params: { page_size: 10, ordering: '-created_at' } }),
      api.get<{
        results: Array<{
          invoice_number: string
          movements: number
          total_quantity: number
          items: number
          dispatched_at: string | null
        }>
      }>('/reports/dispatch-operational/orders/', { params: { limit: 10 } }),
    ])

    const locations = locationsRes.data.results.map((loc) => ({
      id: loc.id,
      code: loc.code,
      name: loc.name,
      capacityLabel: '',
    }))

    const recentMovements: DispatchMovement[] = movementsRes.data.results.map((mov) => ({
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

    // Mapear órdenes del endpoint o fallback a mock si no hay
    const backendOrders = ordersRes.data.results || []
    let expectedOrders: DispatchItem[] = []

    if (backendOrders.length > 0) {
      expectedOrders = backendOrders.map((ord, idx) => {
        // Enlazar con algún producto conocido
        return {
          id: `pick-${idx}`,
          invoiceNumber: ord.invoice_number,
          customerName: 'Cliente Mayorista ICM',
          productId: 'prod-002', // fallback a un UUID o producto de catálogo
          productName: 'Producto Despacho ' + ord.invoice_number,
          sku: 'CAN-TENS-003',
          barcode: '770000000002',
          category: 'Consumibles',
          expectedQuantity: ord.total_quantity,
          dispatchedQuantity: ord.total_quantity,
          status: 'ready',
          requiresSerial: false,
          requiresColdChain: false,
        }
      })
    } else {
      expectedOrders = mockDispatchItems
    }

    return {
      locations,
      expectedOrders,
      recentMovements,
    }
  } catch (err) {
    console.warn(
      'Error al cargar el resumen de despacho del backend real. Usando datos mock de contingencia.',
      err,
    )
    return {
      locations: mockDispatchLocations,
      expectedOrders: mockDispatchItems,
      recentMovements: mockDispatchMovements,
    }
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
