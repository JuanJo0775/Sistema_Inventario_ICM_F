export interface BillingInvoiceItem {
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  discount_pct: number
  discount_amount: number
  subtotal: number
  tax_rate_pct: number
  tax_amount: number
  total_amount: number
}

export interface BillingMovementDetail {
  id: string
  movement_type: string
  product: string
  product_sku: string
  product_name: string
  quantity: number
  unit_price: number
  discount_pct: number
  discount_amount: number
  subtotal: number
  tax_rate_pct: number
  tax_amount: number
  total_amount: number
  origin_location: string | null
  created_at: string
}

export interface BillingInvoice {
  id: string
  number: string
  invoice_type: 'retail' | 'wholesale'
  customer_name: string
  customer_id_number: string
  customer_email: string
  customer_phone: string
  customer_address: string
  subtotal: number
  discount_total: number
  tax_total: number
  total_amount: number
  currency: string
  pdf: string | null
  issued_by: string
  issued_by_username: string
  issued_at: string
  is_voided: boolean
  void_reason: string
  voided_at: string | null
  voided_by: string | null
  voided_by_username: string | null
  movements_detail: BillingMovementDetail[]
}

export interface BillingInvoiceListItem {
  id: string
  number: string
  invoice_type: 'retail' | 'wholesale'
  customer_name: string
  customer_id_number: string
  total_amount: number
  currency: string
  issued_by_username: string
  issued_at: string
  is_voided: boolean
  item_count: number
}

export interface BillingInvoiceCreatePayload {
  invoice_type: 'retail' | 'wholesale'
  location_id: string
  customer: {
    name: string
    id_number?: string
    email?: string
    phone?: string
    address?: string
  }
  items: Array<{
    product_id: string
    quantity: number
    discount_pct?: number
    lot_code?: string
  }>
  note?: string
  privacy_notice_acknowledged?: boolean
  cold_chain_acknowledged?: boolean
  electrical_safety_acknowledged?: boolean
}

export interface BillingInvoiceStats {
  total_sales_today: number
  total_sales_month: number
  invoice_count_today: number
  invoice_count_month: number
}

export interface CompanyInfo {
  id: number
  company_name: string
  nit: string
  address: string
  phone: string
  email: string
  dian_resolution: string
  dian_range_from: number | null
  dian_range_to: number | null
  invoice_series: string
  invoice_footer: string
  updated_at: string
}

export interface CompanyInfoUpdatePayload {
  company_name?: string
  nit?: string
  address?: string
  phone?: string
  email?: string
  dian_resolution?: string
  dian_range_from?: number | null
  dian_range_to?: number | null
  invoice_series?: string
  invoice_footer?: string
}
