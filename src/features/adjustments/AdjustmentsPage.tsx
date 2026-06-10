import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import { BarcodeScannerButton } from '../../components/ui/BarcodeScannerButton'
import { fetchAdjustmentsOverview, submitAdjustment } from '../../services/adjustments'
import type { AdjustmentsOverview } from '../../interfaces/adjustments'
import type { BarcodeProductResult } from '../../services/barcodeScanner'

function AdjustmentsPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<AdjustmentsOverview | null>(null)
  const [productId, setProductId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [newQuantity, setNewQuantity] = useState<number | ''>('')
  const [justification, setJustification] = useState('')

  const useMocks = import.meta.env.VITE_USE_MOCKS === 'true'

  useEffect(() => {
    let cancelled = false
    async function load() {
      const data = await fetchAdjustmentsOverview(useMocks)
      if (!cancelled) setOverview(data)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [useMocks])

  const products = useMemo(() => overview?.products ?? [], [overview])
  const locations = useMemo(() => overview?.locations ?? [], [overview])

  const systemStock = useMemo(() => {
    if (!overview || !productId) return 0
    const entry = overview.history.find((h) => h.productId === productId && (!locationId || h.locationId === locationId))
    return entry?.previousQuantity ?? 0
  }, [overview, productId, locationId])

  const delta = typeof newQuantity === 'number' ? newQuantity - systemStock : 0

  async function handleSubmit() {
    if (!productId || !locationId || newQuantity === '' || !justification) return
    const payload = {
      product_id: productId,
      location_id: locationId,
      new_quantity: Number(newQuantity),
      justification,
    }
    await submitAdjustment(payload)
  }

  /**
   * Callback del lector HID: busca el producto escaneado en la lista
   * cargada y lo selecciona automáticamente en el dropdown.
   */
  function handleProductScanned(product: BarcodeProductResult) {
    const match = products.find(
      (p) =>
        p.productId === String(product.id) ||
        p.sku?.toLowerCase() === product.sku?.toLowerCase(),
    )
    if (match) {
      setProductId(match.productId)
    }
  }

  

  return (
    <AppShell title={t('adjustments.title')}>
      <div className="page-body">
            <div className="alert-bar alert-bar--err mb-24">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span><strong>Módulo exclusivo del Almacenista.</strong> Los ajustes son adiciones al historial; los registros originales son inmutables.</span>
            </div>

            <div className="split split--2-1">
              <div>
                <div className="s-head"><span className="s-head__label">Nuevo ajuste</span><div className="s-head__rule"></div></div>
                <form noValidate>
                  <div className="form-surface">
                    <fieldset>
                      <legend>Producto</legend>
                      <div className="f-row f-row-2">
                        <div className="f-group f-group--full">
                          <label className="f-label" htmlFor="adj-prod">Producto</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select
                              id="adj-prod"
                              className="f-input"
                              value={productId}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => setProductId(e.target.value)}
                              style={{ flex: 1 }}
                            >
                              <option value="">{t('adjustments.form.productPlaceholder')}</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.productId}>{p.productName} — {p.sku}</option>
                              ))}
                            </select>
                            <BarcodeScannerButton
                              label="Escanear"
                              onProductFound={handleProductScanned}
                            />
                          </div>
                          {productId && (
                            <p className="f-note" style={{ marginTop: 4 }}>
                              Producto seleccionado: <strong>{products.find(p => p.productId === productId)?.productName}</strong>
                            </p>
                          )}
                        </div>
                        <div className="f-group f-group--full">
                          <label className="f-label" htmlFor="adj-loc">Ubicación</label>
                          <select id="adj-loc" className="f-input" value={locationId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocationId(e.target.value)}>
                            <option value="">{t('adjustments.form.locationPlaceholder')}</option>
                            {locations.map((l) => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="f-group">
                          <p className="f-label">Stock en sistema</p>
                          <div className="adjustments-stock-box">{systemStock}</div>
                        </div>
                        <div className="f-group">
                          <label className="f-label" htmlFor="adj-nuevo">Stock real (conteo físico)</label>
                          <input id="adj-nuevo" className="f-input text-mono adjustments-new-qty" type="number" value={newQuantity === '' ? '' : String(newQuantity)} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewQuantity(Number(e.target.value) || '')} />
                        </div>
                      </div>
                      <div className={`adjustments-delta-strip adjustments-delta-strip--${delta < 0 ? 'negative' : delta > 0 ? 'positive' : 'neutral'}`}>
                        Delta: {delta > 0 ? `+${delta}` : delta}
                      </div>
                    </fieldset>
                    <fieldset className="adjustments-fieldset--spaced">
                      <legend>Justificación</legend>
                      <div className="f-group">
                        <label className="f-label adjustments-just-label" htmlFor="adj-just">{t('adjustments.form.justificationLabel')}</label>
                        <textarea id="adj-just" className="f-input" rows={3} placeholder={t('adjustments.form.justificationPlaceholder')} value={justification} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJustification(e.target.value)} />
                      </div>
                    </fieldset>
                    <div className="form-footer"><button type="button" className="btn btn--outline">{t('adjustments.form.cancel')}</button><button type="button" className="btn btn--primary" onClick={handleSubmit}>{t('adjustments.form.submit')}</button></div>
                  </div>
                </form>
              </div>
              <aside>
                <div className="s-head"><span className="s-head__label">Historial de ajustes</span><div className="s-head__rule"></div><button className="btn btn--ghost btn--sm s-head__action">Exportar</button></div>
                <ol className="mov-list">
                  {overview?.history.map((h) => (
                    <li key={h.id} className="mov-item">
                      <span className={`mov-pip mov-pip--adj`}></span>
                      <div>
                        <p className="mov-title">{h.productName}</p>
                        <p className="mov-delta" data-positive={h.newQuantity > h.previousQuantity}>{h.previousQuantity} → {h.newQuantity} ({h.delta >= 0 ? `+${h.delta}` : h.delta})</p>
                        <p className="mov-quote">{`"${h.justification}"`}</p>
                        <div className="mov-meta"><span>{h.registeredBy}</span></div>
                      </div>
                      <time className="mov-time">{new Date(h.registeredAt).toLocaleDateString()}</time>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
        </div>
    </AppShell>
  )
}

export default AdjustmentsPage
