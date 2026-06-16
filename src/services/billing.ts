import { api } from './api'
import { useMocks } from '../mocks/config'
import { mockCompanyInfo, mockInvoiceDetail, mockInvoiceList, mockInvoiceStats } from '../mocks/billing'
import type {
  BillingInvoice,
  BillingInvoiceCreatePayload,
  BillingInvoiceListItem,
  BillingInvoiceStats,
  CompanyInfo,
  CompanyInfoUpdatePayload,
} from '../interfaces/billing'

export async function createInvoice(payload: BillingInvoiceCreatePayload): Promise<BillingInvoice> {
  if (useMocks) {
    return mockInvoiceDetail as unknown as BillingInvoice
  }
  const response = await api.post<BillingInvoice>('/billing/invoices/', payload)
  return response.data
}

export async function fetchInvoices(params?: {
  page?: number
  page_size?: number
  start_date?: string
  end_date?: string
  invoice_type?: string
  search?: string
  include_voided?: boolean
}): Promise<{ results: BillingInvoiceListItem[]; count: number }> {
  if (useMocks) {
    return { results: mockInvoiceList as unknown as BillingInvoiceListItem[], count: mockInvoiceList.length }
  }
  const response = await api.get<{ results: BillingInvoiceListItem[]; count: number }>('/billing/invoices/', { params })
  return response.data
}

export async function fetchInvoiceDetail(id: string): Promise<BillingInvoice> {
  if (useMocks) {
    return mockInvoiceDetail as unknown as BillingInvoice
  }
  const response = await api.get<BillingInvoice>(`/billing/invoices/${id}/`)
  return response.data
}

export async function voidInvoice(id: string, reason: string): Promise<BillingInvoice> {
  if (useMocks) {
    return { ...mockInvoiceDetail, is_voided: true, void_reason: reason } as unknown as BillingInvoice
  }
  const response = await api.post<BillingInvoice>(`/billing/invoices/${id}/void/`, { reason })
  return response.data
}

export async function fetchInvoiceStats(): Promise<BillingInvoiceStats> {
  if (useMocks) {
    return mockInvoiceStats as unknown as BillingInvoiceStats
  }
  const response = await api.get<BillingInvoiceStats>('/billing/invoices/stats/')
  return response.data
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  if (useMocks) {
    return mockCompanyInfo as unknown as CompanyInfo
  }
  const response = await api.get<CompanyInfo>('/billing/config/company/')
  return response.data
}

export async function updateCompanyInfo(data: CompanyInfoUpdatePayload): Promise<CompanyInfo> {
  if (useMocks) {
    return { ...mockCompanyInfo, ...data, updated_at: new Date().toISOString() } as unknown as CompanyInfo
  }
  const response = await api.put<CompanyInfo>('/billing/config/company/', data)
  return response.data
}
