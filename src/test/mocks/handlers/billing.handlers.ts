import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:8000/api/v1'

const seedInvoices = [
  {
    id: 'inv-001',
    number: 'ICM-000001',
    invoice_type: 'retail',
    customer_name: 'Juan Pérez',
    customer_id_number: '1234567890',
    total_amount: 186400.0,
    currency: 'COP',
    issued_by_username: 'almacenista1',
    issued_at: new Date().toISOString(),
    is_voided: false,
    item_count: 2,
  },
  {
    id: 'inv-002',
    number: 'ICM-000002',
    invoice_type: 'wholesale',
    customer_name: 'Salud Total EPS',
    customer_id_number: '900.987.654-3',
    total_amount: 1250000.0,
    currency: 'COP',
    issued_by_username: 'almacenista1',
    issued_at: new Date().toISOString(),
    is_voided: false,
    item_count: 3,
  },
  {
    id: 'inv-003',
    number: 'ICM-000003',
    invoice_type: 'retail',
    customer_name: 'María López',
    customer_id_number: '987654321',
    total_amount: 57500.0,
    currency: 'COP',
    issued_by_username: 'auxiliar1',
    issued_at: new Date(Date.now() - 86400000).toISOString(),
    is_voided: true,
    item_count: 1,
  },
]

const seedStats = {
  total_sales_today: 1436400.0,
  total_sales_month: 18500000.0,
  invoice_count_today: 2,
  invoice_count_month: 48,
}

const seedInvoiceDetail = {
  id: 'inv-001',
  number: 'ICM-000001',
  invoice_type: 'retail',
  customer_name: 'Juan Pérez',
  customer_id_number: '1234567890',
  customer_email: 'juan@mail.com',
  customer_phone: '300 111 2233',
  customer_address: 'Cra 25 # 10-20, Armenia',
  subtotal: 175000.0,
  discount_total: 0,
  tax_total: 11400.0,
  total_amount: 186400.0,
  currency: 'COP',
  pdf: null,
  issued_by: 'user-uuid-1',
  issued_by_username: 'almacenista1',
  issued_at: new Date().toISOString(),
  is_voided: false,
  void_reason: '',
  voided_at: null,
  voided_by: null,
  voided_by_username: null,
  movements_detail: [
    {
      id: 'mov-detail-1',
      movement_type: 'SALIDA_VENTA_MENOR',
      product: 'prod-1',
      product_sku: 'LS-001',
      product_name: 'Láser Terapéutico 800mW',
      quantity: 2,
      unit_price: 57500.0,
      discount_pct: 0,
      discount_amount: 0,
      subtotal: 115000.0,
      tax_rate_pct: 0,
      tax_amount: 0,
      total_amount: 115000.0,
      origin_location: 'loc-bod-01',
      created_at: new Date().toISOString(),
    },
  ],
}

const seedCompanyInfo = {
  id: 1,
  company_name: 'Import Corporal Medical S.A.S',
  nit: '900.123.456-7',
  address: 'Calle 15 # 20-30, Armenia, Quindío',
  phone: '300 123 4567',
  email: 'info@importcorporal.com',
  dian_resolution: 'Resolución DIAN No. 187600000000 del 15/01/2025',
  dian_range_from: 1,
  dian_range_to: 5000,
  invoice_series: 'ICM',
  invoice_footer: '¡Gracias por su compra!',
  updated_at: '2026-06-01T10:00:00-05:00',
}

let invoices = [...seedInvoices]
let invoiceDetail = { ...seedInvoiceDetail }
let stats = { ...seedStats }
let companyInfo = { ...seedCompanyInfo }

export function resetBillingData() {
  invoices = [...seedInvoices]
  invoiceDetail = { ...seedInvoiceDetail }
  stats = { ...seedStats }
  companyInfo = { ...seedCompanyInfo }
}

export const billingHandlers = [
  http.get(`${API_BASE}/billing/invoices/`, ({ request }) => {
    const url = new URL(request.url)
    const invType = url.searchParams.get('invoice_type')
    const search = url.searchParams.get('search')?.toLowerCase() || ''
    let result = [...invoices]
    if (invType) {
      result = result.filter((inv) => inv.invoice_type === invType)
    }
    if (search) {
      result = result.filter(
        (inv) =>
          inv.number.toLowerCase().includes(search) ||
          inv.customer_name.toLowerCase().includes(search) ||
          inv.customer_id_number.includes(search),
      )
    }
    return HttpResponse.json({
      results: result,
      count: result.length,
    })
  }),

  http.get(`${API_BASE}/billing/invoices/stats/`, () =>
    HttpResponse.json(stats),
  ),

  http.get(`${API_BASE}/billing/invoices/:id/`, () =>
    HttpResponse.json(invoiceDetail),
  ),

  http.post(`${API_BASE}/billing/invoices/:id/void/`, async ({ request }) => {
    const body = (await request.json()) as { reason: string }
    const result = {
      ...invoiceDetail,
      is_voided: true,
      void_reason: body.reason,
      voided_at: new Date().toISOString(),
      voided_by: 'user-1',
      voided_by_username: 'almacenista1',
    }
    return HttpResponse.json(result)
  }),

  http.get(`${API_BASE}/billing/config/company/`, () =>
    HttpResponse.json(companyInfo),
  ),

  http.put(`${API_BASE}/billing/config/company/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    companyInfo = { ...companyInfo, ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json(companyInfo)
  }),
]
