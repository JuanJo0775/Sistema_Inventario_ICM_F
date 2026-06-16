import type { CartItem } from '../../interfaces/dispatch'

export interface ThermalReceiptData {
  invoiceNumber: string | null
  customerName: string
  customerDoc: string
  items: Array<Pick<CartItem, 'productName' | 'sku' | 'quantity' | 'unitPrice' | 'taxRate' | 'discount' | 'subtotal' | 'taxAmount' | 'total'>>
  subtotal: number
  tax: number
  discount: number
  total: number
  mode: 'wholesale' | 'retail'
  operator: string
}

export function buildReceiptData(opts: {
  invoiceNumber: string | null
  customerName: string
  customerDoc: string
  items: ThermalReceiptData['items']
  subtotal: number
  tax: number
  discount: number
  total: number
  mode: 'wholesale' | 'retail'
  operator: string
}): ThermalReceiptData {
  return { ...opts }
}

const fmt = (n: number) =>
  '$' + Math.round(n).toLocaleString('es-CO')

export function ThermalReceipt({ data }: { data: ThermalReceiptData }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div id="thermal-receipt" className="thermal-receipt">
      {/* Header — company */}
      <div className="tr-header">
        <div className="tr-title">IMPORT CORPORAL<br />MEDICAL S.A.S</div>
        <div className="tr-divider-double">════════════════════════</div>
      </div>

      {/* Invoice number */}
      <div className="tr-invoice-num">
        <div className="tr-line">FACTURA DE VENTA</div>
        <div className="tr-line">
          Serie: ICM&emsp;&emsp;No: {data.invoiceNumber?.replace('ICM-', '')?.padStart(6, '0') ?? '------'}
        </div>
      </div>
      <div className="tr-divider">────────────────────────</div>

      {/* Date */}
      <div className="tr-line">Fecha: {dateStr}</div>
      <div className="tr-line">Hora:&emsp;{timeStr}</div>
      <div className="tr-divider">────────────────────────</div>

      {/* Customer */}
      <div className="tr-section-label">CLIENTE</div>
      <div className="tr-line">Nombre: {data.customerName || '---'}</div>
      <div className="tr-line">Doc:&emsp;&emsp;{data.customerDoc || '---'}</div>
      <div className="tr-divider">────────────────────────</div>

      {/* Items */}
      <div className="tr-section-label">DETALLE</div>
      {data.items.map((item, i) => (
        <div key={i} className="tr-item-block">
          <div className="tr-line">{item.productName}</div>
          <div className="tr-line" style={{ fontSize: 10 }}>SKU: {item.sku}</div>
          <div className="tr-line tr-row-space">
            <span>{item.quantity} x {fmt(item.unitPrice)}</span>
            <span>{fmt(item.subtotal)}</span>
          </div>
          {item.taxRate > 0 && (
            <div className="tr-line tr-row-space">
              <span>IVA {item.taxRate}%:</span>
              <span>{fmt(item.taxAmount)}</span>
            </div>
          )}
        </div>
      ))}
      <div className="tr-divider">────────────────────────</div>

      {/* Totals */}
      <div className="tr-line tr-row-space"><span>Subtotal:</span><span>{fmt(data.subtotal)}</span></div>
      <div className="tr-line tr-row-space"><span>IVA Total:</span><span>{fmt(data.tax)}</span></div>
      <div className="tr-line tr-row-space"><span>Descuento:</span><span>{fmt(data.discount)}</span></div>
      <div className="tr-divider-double">════════════════════════</div>
      <div className="tr-total tr-row-space"><span>TOTAL:</span><span>{fmt(data.total)}</span></div>
      <div className="tr-divider-double">════════════════════════</div>

      {/* Footer */}
      <div className="tr-line">Tipo: {data.mode === 'wholesale' ? 'Venta mayorista' : 'Venta minorista'}</div>
      <div className="tr-line">Atendió: {data.operator}</div>
      <div className="tr-divider">────────────────────────</div>
      <div className="tr-footer-text">
        ¡Gracias por su compra!<br />
        Conserve esta factura como<br />
        soporte de garantía.
      </div>
      <div className="tr-divider-double">════════════════════════</div>
    </div>
  )
}
