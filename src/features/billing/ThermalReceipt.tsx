import type { BillingInvoice, BillingMovementDetail } from '../../interfaces/billing'

type Props = {
  invoice: BillingInvoice
  company?: {
    company_name: string
    nit: string
    address: string
    phone: string
    dian_resolution: string
    invoice_series: string
    invoice_footer: string
    dian_range_from?: number | null
    dian_range_to?: number | null
  } | null
}

function formatCOP(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO')
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function ThermalReceipt({ invoice, company }: Props) {
  const companyName = company?.company_name ?? 'Import Corporal Medical S.A.S'
  const companyNit = company?.nit ?? '900.123.456-7'
  const companyAddress = company?.address ?? 'Armenia, Quindío'
  const companyPhone = company?.phone ?? '300 123 4567'
  const dianResolution = company?.dian_resolution ?? ''
  const invoiceSeries = company?.invoice_series ?? 'ICM'
  const footer = company?.invoice_footer ?? '¡Gracias por su compra!'

  const items: BillingMovementDetail[] = invoice.movements_detail ?? []

  return (
    <div id="thermal-receipt" className="thermal-receipt">
      {/* Encabezado empresa */}
      <div className="tr-header">
        <div className="tr-title">{companyName}</div>
        <div className="tr-muted">NIT: {companyNit}</div>
        <div className="tr-muted">{companyAddress.split(',').map((l, i) => <div key={i}>{l.trim()}</div>)}</div>
        <div className="tr-muted">Tel: {companyPhone}</div>
      </div>

      <div className="tr-divider">════════════════════════════════════════</div>

      <div className="tr-doc-title">FACTURA DE VENTA</div>
      <div className="tr-doc-ref">
        Serie: {invoiceSeries} &nbsp;&nbsp; No: {invoice.number.replace('ICM-', '')}
      </div>

      <div className="tr-divider">─────────────────────────────────────────</div>

      <div className="tr-line">
        <span>Fecha:</span>
        <span>{formatDate(invoice.issued_at)}</span>
      </div>
      <div className="tr-line">
        <span>Hora:</span>
        <span>{formatTime(invoice.issued_at)}</span>
      </div>

      <div className="tr-divider">─────────────────────────────────────────</div>

      <div className="tr-section-label">CLIENTE</div>
      <div className="tr-line"><span>Nombre:</span><span>{invoice.customer_name}</span></div>
      {invoice.customer_id_number && (
        <div className="tr-line"><span>Doc:</span><span>{invoice.customer_id_number}</span></div>
      )}
      {invoice.customer_email && (
        <div className="tr-line"><span>Email:</span><span>{invoice.customer_email}</span></div>
      )}

      <div className="tr-divider">─────────────────────────────────────────</div>
      <div className="tr-section-label">DETALLE</div>
      <div className="tr-divider">─────────────────────────────────────────</div>

      {items.map((item, i) => (
        <div key={i} className="tr-item-block">
          <div className="tr-item-name">{item.product_name}</div>
          <div className="tr-item-sku">SKU: {item.product_sku}</div>
          <div className="tr-item-line">
            <span>{item.quantity} x {formatCOP(item.unit_price)}</span>
            <span className="tr-amount">{formatCOP(item.subtotal)}</span>
          </div>
          {item.tax_rate_pct > 0 && (
            <div className="tr-item-line tr-muted">
              <span>IVA {item.tax_rate_pct}%:</span>
              <span className="tr-amount">{formatCOP(item.tax_amount)}</span>
            </div>
          )}
          {i < items.length - 1 && <div className="tr-item-spacer" />}
        </div>
      ))}

      <div className="tr-divider">─────────────────────────────────────────</div>

      <div className="tr-total-line">
        <span>Subtotal:</span>
        <span className="tr-amount">{formatCOP(invoice.subtotal)}</span>
      </div>
      {invoice.discount_total > 0 && (
        <div className="tr-total-line">
          <span>Descuento:</span>
          <span className="tr-amount">-{formatCOP(invoice.discount_total)}</span>
        </div>
      )}
      <div className="tr-total-line">
        <span>IVA Total:</span>
        <span className="tr-amount">{formatCOP(invoice.tax_total)}</span>
      </div>

      <div className="tr-divider">════════════════════════════════════════</div>

      <div className="tr-grand-total">
        <span>TOTAL:</span>
        <span className="tr-amount">{formatCOP(invoice.total_amount)}</span>
      </div>

      <div className="tr-divider">════════════════════════════════════════</div>

      <div className="tr-footer-text">
        Tipo: {invoice.invoice_type === 'retail' ? 'Venta minorista' : 'Venta mayorista'}
      </div>
      <div className="tr-footer-text">Atendi&oacute;: {invoice.issued_by_username}</div>

      {dianResolution && (
        <>
          <div className="tr-divider">─────────────────────────────────────────</div>
          <div className="tr-footer-text">{dianResolution}</div>
          {company && company.dian_range_from != null && company.dian_range_to != null && (
            <div className="tr-footer-text">
              Rango autorizado: {company.dian_range_from}-{company.dian_range_to}
            </div>
          )}
        </>
      )}

      <div className="tr-divider">─────────────────────────────────────────</div>
      <div className="tr-footer-text tr-footer-thanks">
        {footer}
      </div>
    </div>
  )
}
