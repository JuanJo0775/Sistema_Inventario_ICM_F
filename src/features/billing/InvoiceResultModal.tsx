import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileDown, Printer, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import ThermalReceipt from './ThermalReceipt'
import type { BillingInvoice } from '../../interfaces/billing'
import type { CompanyInfo } from '../../interfaces/billing'
import { fetchCompanyInfo } from '../../services/billing'

type Props = {
  invoice: BillingInvoice
  onClose: () => void
  onNewSale: () => void
}

export default function InvoiceResultModal({ invoice, onClose, onNewSale }: Props) {
  const [company, setCompany] = useState<CompanyInfo | null>(null)

  useEffect(() => {
    fetchCompanyInfo().then(setCompany).catch(() => {})
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleNewSale = useCallback(() => {
    onNewSale()
  }, [onNewSale])

  const invoiceTypeLabel = invoice.invoice_type === 'retail' ? 'Venta minorista' : 'Venta mayorista'

  return (
    <>
      {/* Modal overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15,30,32,.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
        onClick={handleClose}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(15,30,32,.25)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Factura generada — {invoice.number}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                {invoiceTypeLabel} · {new Date(invoice.issued_at).toLocaleString('es-CO')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Receipt preview */}
          <div style={{ padding: 20, background: '#f9fafb', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.1)', borderRadius: 4, overflow: 'hidden' }}>
              <ThermalReceipt invoice={invoice} company={company} />
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              padding: '14px 20px',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <Button variant="outline" onClick={handleClose}>
              <X size={14} /> Cerrar
            </Button>
            <Button variant="outline" onClick={handleNewSale}>
              <FileDown size={14} /> Nueva venta
            </Button>
            <Button onClick={handlePrint}>
              <Printer size={14} /> Imprimir factura
            </Button>
          </div>
        </div>
      </div>

      {/* Portal receipt for window.print() — hidden on screen via global CSS @media print */}
      {createPortal(
        <div id="thermal-receipt-root">
          <ThermalReceipt invoice={invoice} company={company} />
        </div>,
        document.body,
      )}
    </>
  )
}
