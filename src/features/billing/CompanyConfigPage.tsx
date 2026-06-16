import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertTriangle, Save } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Button } from '../../components/ui/button'
import { fetchCompanyInfo, updateCompanyInfo } from '../../services/billing'
import type { CompanyInfo, CompanyInfoUpdatePayload } from '../../interfaces/billing'

export default function CompanyConfigPage() {
  const { t: _t } = useTranslation()

  const [_company, setCompany] = useState<CompanyInfo | null>(null)
  const [form, setForm] = useState<CompanyInfoUpdatePayload>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCompanyInfo()
      setCompany(data);
      setForm({
        company_name: data.company_name,
        nit: data.nit,
        address: data.address,
        phone: data.phone,
        email: data.email,
        dian_resolution: data.dian_resolution,
        dian_range_from: data.dian_range_from,
        dian_range_to: data.dian_range_to,
        invoice_series: data.invoice_series,
        invoice_footer: data.invoice_footer,
      })
    } catch {
      setError('Error al cargar datos de la empresa')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateCompanyInfo(form)
      setCompany(updated)
      toast.success('Datos de empresa actualizados')
    } catch {
      setError('Error al guardar datos de la empresa')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Datos de empresa" subtitle="Configuración">
        <div className="page-body" style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          Cargando...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Datos de empresa"
      subtitle="Configuración del emisor en facturas"
      actions={
        <Button onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      }
    >
      <div className="page-body" style={{ maxWidth: 700 }}>
        {error && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 18 }}>
            <AlertTriangle />
            <span>{error}</span>
          </div>
        )}

        <div className="form-surface">
          <fieldset>
            <legend>Información de la empresa</legend>
            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label">Razón social</label>
                <input className="f-input" value={form.company_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div className="f-group">
                <label className="f-label">NIT</label>
                <input className="f-input" value={form.nit ?? ''} onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))} />
              </div>
            </div>
            <div className="f-group">
              <label className="f-label">Dirección</label>
              <textarea className="f-input" style={{ minHeight: 50, resize: 'vertical' }} value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label">Teléfono</label>
                <input className="f-input" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="f-group">
                <label className="f-label">Email</label>
                <input className="f-input" type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
          </fieldset>
        </div>

        <div className="c-divider" />

        <div className="form-surface">
          <fieldset>
            <legend>Facturación</legend>
            <div className="f-group">
              <label className="f-label">Serie de facturación</label>
              <input className="f-input" value={form.invoice_series ?? ''} onChange={(e) => setForm((f) => ({ ...f, invoice_series: e.target.value }))} />
            </div>
            <div className="f-group">
              <label className="f-label">Resolución DIAN</label>
              <textarea className="f-input" style={{ minHeight: 50, resize: 'vertical' }} value={form.dian_resolution ?? ''} onChange={(e) => setForm((f) => ({ ...f, dian_resolution: e.target.value }))} />
            </div>
            <div className="f-row f-row-2">
              <div className="f-group">
                <label className="f-label">Rango desde</label>
                <input className="f-input" type="number" value={form.dian_range_from ?? ''} onChange={(e) => setForm((f) => ({ ...f, dian_range_from: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="f-group">
                <label className="f-label">Rango hasta</label>
                <input className="f-input" type="number" value={form.dian_range_to ?? ''} onChange={(e) => setForm((f) => ({ ...f, dian_range_to: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>
            <div className="f-group">
              <label className="f-label">Pie de factura</label>
              <textarea className="f-input" style={{ minHeight: 60, resize: 'vertical' }} rows={3} value={form.invoice_footer ?? ''} onChange={(e) => setForm((f) => ({ ...f, invoice_footer: e.target.value }))} />
            </div>
          </fieldset>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
