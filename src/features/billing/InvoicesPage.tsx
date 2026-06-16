import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Ban,
  Printer,
  Search,
  X,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Button } from '../../components/ui/button'
import { ModalPortal } from '../../components/ui/ModalPortal'
import ThermalReceipt from './ThermalReceipt'
import {
  fetchInvoices,
  fetchInvoiceDetail,
  fetchInvoiceStats,
  voidInvoice,
  fetchCompanyInfo,
} from '../../services/billing'
import type {
  BillingInvoice,
  BillingInvoiceListItem,
  BillingInvoiceStats,
  CompanyInfo,
} from '../../interfaces/billing'
import type React from 'react'

const PAGE_SIZE = 20

type Filters = {
  start_date: string
  end_date: string
  invoice_type: string
  search: string
}

function defaultFilters(): Filters {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    start_date: firstDay.toISOString().slice(0, 10),
    end_date: now.toISOString().slice(0, 10),
    invoice_type: '',
    search: '',
  }
}

function formatCOP(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function InvoicesPage() {
  const { t: _t } = useTranslation()

  const [invoices, setInvoices] = useState<BillingInvoiceListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<BillingInvoiceStats | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const [detailInvoice, setDetailInvoice] = useState<BillingInvoice | null>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [voidTarget, setVoidTarget] = useState<BillingInvoiceListItem | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voiding, setVoiding] = useState(false)
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: PAGE_SIZE,
      }
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.invoice_type) params.invoice_type = filters.invoice_type
      if (filters.search) params.search = filters.search

      const data = await fetchInvoices(params)
      setInvoices(data.results)
      setTotalCount(data.count)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchInvoiceStats()
      setStats(data)
    } catch {
      // Stats are optional
    }
  }, [])

  useEffect(() => {
    loadInvoices()
    loadStats()
  }, [loadInvoices, loadStats])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadInvoices()
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters())
    setPage(1)
  }

  useEffect(() => {
    if (detailInvoice) {
      let el = document.getElementById('print-root')
      if (!el) {
        el = document.createElement('div')
        el.id = 'print-root'
        document.body.appendChild(el)
      }
      setPrintRoot(el)
    } else {
      setPrintRoot(null)
    }
  }, [detailInvoice])

  const handleViewDetail = async (inv: BillingInvoiceListItem) => {
    try {
      const detail = await fetchInvoiceDetail(inv.id)
      setDetailInvoice(detail)
      const cmp = await fetchCompanyInfo()
      setCompany(cmp)
    } catch {
      toast.error('Error al cargar detalle de factura')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleVoidConfirm = async () => {
    if (!voidTarget || !voidReason.trim()) return
    setVoiding(true)
    try {
      await voidInvoice(voidTarget.id, voidReason.trim())
      toast.success(`Factura ${voidTarget.number} anulada`)
      setVoidTarget(null)
      setVoidReason('')
      loadInvoices()
      loadStats()
    } catch {
      toast.error('Error al anular factura')
    } finally {
      setVoiding(false)
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <>
      <AppShell title="Facturas" subtitle="Historial de facturación">
        <div className="page-body">

          {/* Stats cards */}
          {stats && (
            <div className="metric-strip mb-4" style={{ maxWidth: 700 }}>
              <div className="metric-cell">
                <p className="metric-cell__eyebrow">Vendido hoy</p>
                <p className="metric-cell__val">{formatCOP(stats.total_sales_today)}</p>
              </div>
              <div className="metric-cell">
                <p className="metric-cell__eyebrow">Vendido este mes</p>
                <p className="metric-cell__val">{formatCOP(stats.total_sales_month)}</p>
              </div>
              <div className="metric-cell metric-cell--light">
                <p className="metric-cell__eyebrow">Facturas hoy</p>
                <p className="metric-cell__val">{stats.invoice_count_today}</p>
              </div>
              <div className="metric-cell metric-cell--light">
                <p className="metric-cell__eyebrow">Facturas este mes</p>
                <p className="metric-cell__val">{stats.invoice_count_month}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <form onSubmit={handleSearch} style={{ marginBottom: 18 }}>
            <div className="f-row f-row-4" style={{ alignItems: 'flex-end' }}>
              <div className="f-group">
                <label className="f-label">Desde</label>
                <input
                  className="f-input"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="f-group">
                <label className="f-label">Hasta</label>
                <input
                  className="f-input"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
              <div className="f-group">
                <label className="f-label">Tipo</label>
                <select
                  className="f-input"
                  value={filters.invoice_type}
                  onChange={(e) => setFilters((f) => ({ ...f, invoice_type: e.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="retail">Minorista</option>
                  <option value="wholesale">Mayorista</option>
                </select>
              </div>
              <div className="f-group" style={{ flex: 1 }}>
                <label className="f-label">Buscar</label>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} />
                  <input
                    className="f-input"
                    style={{ paddingLeft: 32 }}
                    placeholder="N° factura, cliente o NIT..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button type="submit" size="sm" disabled={loading}>
                <Search size={14} /> Buscar
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                <X size={14} /> Limpiar
              </Button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 16 }}>
              <AlertTriangle />
              <span>{error}</span>
            </div>
          )}

          {/* Table */}
          <div className="table-surface">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">N° Factura</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Doc.</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Items</th>
                  <th scope="col">Total</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                      Cargando facturas...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                      No se encontraron facturas
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} style={{ opacity: inv.is_voided ? 0.6 : 1 }}>
                      <td className="text-mono" style={{ fontWeight: 600 }}>{inv.number}</td>
                      <td style={{ fontSize: 12 }}>
                        {formatDate(inv.issued_at)}<br />
                        <span style={{ color: '#9ca3af' }}>{formatTime(inv.issued_at)}</span>
                      </td>
                      <td style={{ fontSize: 12 }}>{inv.customer_name}</td>
                      <td className="text-mono" style={{ fontSize: 11 }}>{inv.customer_id_number}</td>
                      <td style={{ fontSize: 11 }}>
                        <span className={`pill ${inv.invoice_type === 'wholesale' ? 'pill--ok' : 'pill--info'}`}>
                          {inv.invoice_type === 'wholesale' ? 'Mayor' : 'Menor'}
                        </span>
                      </td>
                      <td className="text-mono">{inv.item_count}</td>
                      <td className="text-mono" style={{ fontWeight: 600 }}>{formatCOP(inv.total_amount)}</td>
                      <td>
                        {inv.is_voided ? (
                          <span className="pill pill--err">ANULADA</span>
                        ) : (
                          <span className="pill pill--ok">Activa</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            title="Ver detalle"
                            onClick={() => handleViewDetail(inv)}
                          >
                            <Search size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            title="Reimprimir"
                            onClick={() => handleViewDetail(inv)}
                          >
                            <Printer size={12} />
                          </button>
                          {!inv.is_voided && (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              style={{ color: '#dc2626' }}
                              title="Anular"
                              onClick={() => setVoidTarget(inv)}
                            >
                              <Ban size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, fontSize: 13 }}>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span style={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </AppShell>

      {/* Detail Modal */}
      {detailInvoice && (
        <ModalPortal onClose={() => setDetailInvoice(null)}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {detailInvoice.number}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                  {detailInvoice.invoice_type === 'retail' ? 'Venta minorista' : 'Venta mayorista'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailInvoice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {detailInvoice.is_voided && (
              <div className="alert-bar alert-bar--warn" style={{ marginBottom: 16 }}>
                <AlertTriangle />
                <span>Factura anulada: {detailInvoice.void_reason}</span>
              </div>
            )}

            <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'center' }}>
              <ThermalReceipt invoice={detailInvoice} company={company} />
            </div>

            {/* Portal receipt to print-root for window.print() */}
            {printRoot && createPortal(
              <div style={{ display: 'none' }} aria-hidden="true">
                <ThermalReceipt invoice={detailInvoice} company={company} />
              </div>,
              printRoot,
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="outline" onClick={() => setDetailInvoice(null)}>
                <X size={14} /> Cerrar
              </Button>
              <Button onClick={handlePrint}>
                <Printer size={14} /> Reimprimir
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Void confirmation modal */}
      {voidTarget && (
        <ModalPortal onClose={() => { setVoidTarget(null); setVoidReason('') }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
              Anular factura {voidTarget.number}
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Esta acción revertirá el stock. Escribe el motivo de anulación.
            </p>
            <div className="f-group">
              <label className="f-label">Motivo de anulación *</label>
              <textarea
                className="f-input"
                style={{ minHeight: 80, resize: 'vertical' }}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Describe por qué se anula esta factura..."
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="outline" onClick={() => { setVoidTarget(null); setVoidReason('') }}>
                Cancelar
              </Button>
              <Button
                onClick={handleVoidConfirm}
                disabled={voidReason.trim().length < 5 || voiding}
                style={{ background: '#dc2626', color: '#fff' }}
              >
                {voiding ? 'Anulando...' : 'Sí, anular factura'}
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; visibility: hidden !important; }
          #print-root,
          #print-root > * { display: block !important; visibility: visible !important; }
          .thermal-receipt {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 72mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            color: #000 !important;
            background: #fff !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
          .thermal-receipt * {
            color: #000 !important;
            background: transparent !important;
            border-color: #000 !important;
          }
        }
        @page { margin: 2mm; size: 80mm auto; }
      `}</style>
    </>
  )
}
