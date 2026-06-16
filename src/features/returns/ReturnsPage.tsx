import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { BarcodeScannerButton } from '../../components/ui/BarcodeScannerButton'
import type { ReturnEntry, ReturnProduct, ReturnsOverview, ReturnStatus, OutgoingMovement } from '../../interfaces/returns'
import type { BarcodeProductResult } from '../../services/barcodeScanner'
import { useMocks } from '../../mocks/config'
import { fetchReturnsOverview, fetchOutgoingMovements, getSubmitReturnErrorMessage, submitReturn } from '../../services/returns'

type ReturnFormState = {
  productId: string
  locationId: string
  quantity: string
  serialNumber: string
  productState: string
  reason: string
  note: string
  relatedMovementId: string
}


const returnStateOptions = [
  'Bueno',
  'Con dano visible',
  'No funciona',
  'Empaque abierto',
  'Falta accesorio',
]

const toFormState = (product?: ReturnProduct, locationId = ''): ReturnFormState => ({
  productId: product?.productId ?? '',
  locationId,
  quantity: '1',
  serialNumber: '',
  productState: 'Bueno',
  reason: '',
  note: '',
  relatedMovementId: '',
})

const formatHistoryPip = (status: ReturnStatus) => {
  if (status === 'reincorporated') return 'mov-pip--in'
  if (status === 'rejected') return 'mov-pip--out'
  return 'mov-pip--ret'
}

function resolvePendingReturn(
  entry: ReturnEntry,
  status: 'reincorporated' | 'rejected',
  setPendingReturns: React.Dispatch<React.SetStateAction<ReturnEntry[]>>,
  setHistoryEntries: React.Dispatch<React.SetStateAction<ReturnEntry[]>>,
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  setPendingReturns((current) => current.filter((item) => item.id !== entry.id))
  setHistoryEntries((current) => [
    {
      ...entry,
      status,
      registeredAt: new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
    },
    ...current,
  ])
  setSuccessMessage(
    status === 'reincorporated'
      ? t('returns.success.approved', { sku: entry.sku })
      : t('returns.success.rejected', { sku: entry.sku }),
  )
}

type ReturnsBannerProps = Readonly<{
  error: string | null
  successMessage: string | null
}>

function ReturnsBanner({ error, successMessage }: ReturnsBannerProps) {
  return (
    <>
      {error ? (
        <div className="alert-bar alert-bar--warn" role="alert">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      ) : null}

      {successMessage ? (
        <output className="alert-bar alert-bar--ok" aria-live="polite">
          <CheckCircle2 />
          <span>{successMessage}</span>
        </output>
      ) : null}
    </>
  )
}

type ReturnsValidationStripProps = Readonly<{
  product: ReturnProduct | undefined
  t: (key: string, options?: Record<string, unknown>) => string
}>

function ReturnsValidationStrip({ product, t }: ReturnsValidationStripProps) {
  if (!product) return null

  return (
    <div className={product.canReturn ? 'val-strip val-strip--ok mb-16' : 'val-strip val-strip--fail mb-16'}>
      {product.canReturn ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      <span>
        {product.canReturn
          ? t('returns.validation.allowed', {
              sku: product.sku,
              product: product.productName,
            })
          : t('returns.validation.blocked', {
              product: product.productName,
              reason: product.blockReason ?? t('returns.errors.blocked'),
            })}
      </span>
    </div>
  )
}

function getValidationMessage({
  selectedProduct,
  quantity,
  form,
  t,
}: Readonly<{
  selectedProduct: ReturnProduct | undefined
  quantity: number
  form: ReturnFormState
  t: (key: string, options?: Record<string, unknown>) => string
}>) {
  if (!selectedProduct) return t('returns.errors.noProduct')
  if (!selectedProduct.canReturn) return t('returns.errors.blocked')
  if (!Number.isFinite(quantity) || quantity <= 0) return t('returns.errors.quantity')
  if (!form.locationId) return t('returns.errors.location')
  if (selectedProduct.requiresSerial && !form.serialNumber.trim()) return t('returns.errors.serial')
  if (!form.reason.trim()) return t('returns.errors.reason')
  return null
}

function ReturnsPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<ReturnsOverview | null>(null)
  const [form, setForm] = useState<ReturnFormState>(toFormState())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingReturns, setPendingReturns] = useState<ReturnEntry[]>([])
  const [historyEntries, setHistoryEntries] = useState<ReturnEntry[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [outgoingMovements, setOutgoingMovements] = useState<OutgoingMovement[]>([])
  const [movementSearch, setMovementSearch] = useState("")
  const [loadingOutgoing, setLoadingOutgoing] = useState(false)

  function handleProductScanned(product: BarcodeProductResult) {
    const match = products.find(
      (p) =>
        p.productId === String(product.id) ||
        (product.sku && p.sku?.toLowerCase() === product.sku.toLowerCase()) ||
        (product.barcode && p.barcode && p.barcode === product.barcode),
    )
    if (match) {
      setForm((c) => ({ ...c, productId: match.productId }))
      setProductSearch('')
    }
  }

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchReturnsOverview()
      setOverview(data)
      setPendingReturns(data.pendingReturns)
      setHistoryEntries(data.history)
      const defaultLocation = data.locations[0]?.id ?? ''
      setForm(toFormState(undefined, defaultLocation))
    } catch {
      setError(t('returns.errors.load'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadOutgoing = useCallback(async () => {
    setLoadingOutgoing(true)
    try {
      const data = await fetchOutgoingMovements()
      setOutgoingMovements(data)
    } catch {
      // silencioso — el selector simplemente no mostrará opciones
    } finally {
      setLoadingOutgoing(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchReturnsOverview()
        if (cancelled) return

        setOverview(data)
        setPendingReturns(data.pendingReturns)
        setHistoryEntries(data.history)
        const defaultLocation = data.locations[0]?.id ?? ''
        setForm(toFormState(undefined, defaultLocation))
      } catch {
        if (!cancelled) {
          setError(t('returns.errors.load'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void bootstrap()
    void loadOutgoing()

    return () => {
      cancelled = true
    }
  }, [t, loadOutgoing])

  const products = useMemo(() => overview?.products ?? [], [overview])
  const locations = useMemo(() => overview?.locations ?? [], [overview])

  const returnableProducts = useMemo(() => products.filter((p) => p.canReturn), [products])

  const filteredReturnableProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return returnableProducts
    return returnableProducts.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q),
    )
  }, [returnableProducts, productSearch])

  const filteredMovements = useMemo(() => {
    const q = movementSearch.trim().toLowerCase()
    if (!q) return outgoingMovements
    return outgoingMovements.filter(
      (m) =>
        m.productSku.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        m.movementTypeLabel.toLowerCase().includes(q),
    )
  }, [outgoingMovements, movementSearch])

  const selectedProduct = useMemo(
    () => products.find((item) => item.productId === form.productId),
    [form.productId, products],
  )

  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === form.locationId),
    [form.locationId, locations],
  )

  const quantity = Number(form.quantity)

  const validationMessage = useMemo(
    () =>
      getValidationMessage({
        selectedProduct,
        quantity,
        form,
        t,
      }),
    [form, quantity, selectedProduct, t],
  )


  const handleSubmit = async () => {
    if (!selectedProduct || validationMessage) return

    setSaving(true)
    setError(null)
    try {
      const createdReturn = await submitReturn({
        productId: selectedProduct.productId,
        locationId: form.locationId,
        quantity,
        serialNumber: form.serialNumber.trim() || undefined,
        relatedMovementId: form.relatedMovementId.trim() || undefined,
        reason: form.reason.trim(),
        productState: form.productState,
        note: form.note.trim() || undefined,
      })

      if (useMocks) {
        setPendingReturns((current) => [createdReturn, ...current])
      } else {
        setHistoryEntries((current) => [createdReturn, ...current])
      }
      setForm(toFormState(selectedProduct, form.locationId))
      setSuccessMessage(t('returns.success.saved', { sku: createdReturn.sku }))
    } catch (submitError) {
      setError(getSubmitReturnErrorMessage(submitError, t('returns.errors.save')))
    } finally {
      setSaving(false)
    }
  }

  const handleResolvePending = (entry: ReturnEntry, status: 'reincorporated' | 'rejected') => {
    resolvePendingReturn(entry, status, setPendingReturns, setHistoryEntries, setSuccessMessage, t)
  }

  return (
    <AppShell
      title={t('returns.title')}
      subtitle={t('returns.subtitle')}
      actions={
        <button className="btn btn--ghost btn--sm" style={{ margin: 0 }} onClick={loadOverview}>
          {t('common.actions.refresh')}
        </button>
      }
    >
      <div className="page-body returns-page">
        <div className="alert-bar alert-bar--warn mb-24" role="alert">
          <AlertTriangle />
          <span>
            <strong>{t('returns.alerts.policyPrefix')}</strong> {t('returns.alerts.policy')}
          </span>
        </div>

        {useMocks ? null : (
          <output className="alert-bar alert-bar--info mb-24" aria-live="polite">
            <Clock3 />
            <span>{t('returns.alerts.backendMode')}</span>
          </output>
        )}

        <ReturnsBanner error={error} successMessage={successMessage} />

        <div className="split split--2-1">
          <div>
            <div className="s-head">
              <span className="s-head__label">{t('returns.form.title')}</span>
              <div className="s-head__rule" />
            </div>

            <ReturnsValidationStrip product={selectedProduct} t={t} />

            <form noValidate>
              <div className="form-surface">
                <fieldset>
                  <legend>{selectedProduct?.productName ?? t('returns.form.emptyTitle')}</legend>
                  <div className="f-row f-row-2">
                    <div className="f-group f-group--full">
                      <label className="f-label">
                        {t('returns.form.product')}
                      </label>
                      {selectedProduct && !productSearch ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--ink-20)', borderRadius: 8, fontSize: 13, background: 'var(--white)' }}>
                            <strong>{selectedProduct.productName}</strong>
                            <span className="sku" style={{ marginLeft: 8 }}>{selectedProduct.sku}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => { setForm((c) => ({ ...c, productId: '' })); setProductSearch('') }}
                          >
                            Cambiar
                          </button>
                          <BarcodeScannerButton label="Escanear" onProductFound={handleProductScanned} />
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <svg
                                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, stroke: 'var(--teal-600)', strokeWidth: 1.8 }}
                                viewBox="0 0 24 24" fill="none"
                              >
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                              </svg>
                              <input
                                className="f-input"
                                style={{ paddingLeft: 34 }}
                                placeholder="Buscar producto por nombre, SKU o código..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value.replace(/'/g, '-'))}
                                autoFocus
                              />
                            </div>
                            <BarcodeScannerButton label="Escanear" onProductFound={handleProductScanned} />
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              maxHeight: 180,
                              overflowY: 'auto',
                              border: '1px solid var(--ink-12)',
                              borderRadius: 8,
                              background: 'var(--white)',
                            }}
                          >
                            {filteredReturnableProducts.length === 0 ? (
                              <p style={{ padding: '12px', fontSize: 12, color: 'var(--ink-40)', textAlign: 'center' }}>
                                No hay productos devolvibles.
                              </p>
                            ) : (
                              filteredReturnableProducts.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    border: 'none',
                                    borderBottom: '1px solid var(--ink-06)',
                                    background: product.productId === form.productId ? 'var(--teal-50)' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontFamily: 'var(--ff-body)',
                                    color: 'var(--ink)',
                                  }}
                                  onClick={() => {
                                    setForm((c) => ({ ...c, productId: product.productId }))
                                    setProductSearch('')
                                  }}
                                  onMouseEnter={(e) => { if (product.productId !== form.productId) e.currentTarget.style.background = 'var(--ink-06)' }}
                                  onMouseLeave={(e) => { if (product.productId !== form.productId) e.currentTarget.style.background = 'transparent' }}
                                >
                                  <strong>{product.productName}</strong>
                                  <span className="sku" style={{ marginLeft: 8 }}>{product.sku}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="f-group">
                      <label className="f-label" htmlFor="return-location">
                        {t('returns.form.location')}
                      </label>
                      <select
                        id="return-location"
                        className="f-input"
                        value={form.locationId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            locationId: event.target.value,
                          }))
                        }
                      >
                        <option value="">{t('returns.form.locationPlaceholder')}</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.code} — {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="f-group">
                      <label className="f-label" htmlFor="return-quantity">
                        {t('returns.form.quantity')}
                      </label>
                      <input
                        id="return-quantity"
                        className="f-input"
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            quantity: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="f-group">
                      <label className="f-label" htmlFor="return-serial">
                        {t('returns.form.serialNumber')}
                      </label>
                      <input
                        id="return-serial"
                        className="f-input text-mono"
                        placeholder={selectedProduct?.requiresSerial ? t('returns.form.serialPlaceholder') : t('returns.form.serialOptionalPlaceholder')}
                        value={form.serialNumber}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            serialNumber: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="f-group">
                      <label className="f-label" htmlFor="return-state">
                        {t('returns.form.state')}
                      </label>
                      <select
                        id="return-state"
                        className="f-input"
                        value={form.productState}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            productState: event.target.value,
                          }))
                        }
                      >
                        {returnStateOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="f-group f-group--full">
                      <label className="f-label" htmlFor="return-reason">
                        {t('returns.form.reason')}
                      </label>
                      <input
                        id="return-reason"
                        className="f-input"
                        placeholder={t('returns.form.reasonPlaceholder')}
                        value={form.reason}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            reason: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="f-group f-group--full">
                      <label className="f-label" htmlFor="return-note">
                        {t('returns.form.note')}
                      </label>
                      <input
                        id="return-note"
                        className="f-input"
                        placeholder={t('returns.form.notePlaceholder')}
                        value={form.note}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="f-group f-group--full">
                      <label className="f-label" htmlFor="return-related">
                        {t('returns.form.relatedMovement')}
                      </label>
                      {form.relatedMovementId && !movementSearch ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--ink-20)', borderRadius: 8, fontSize: 13, background: 'var(--white)' }}>
                            {(() => {
                              const sel = outgoingMovements.find((m) => m.id === form.relatedMovementId)
                              if (!sel) return <span style={{ color: 'var(--ink-40)' }}>{form.relatedMovementId}</span>
                              return (
                                <>
                                  <strong>{sel.productSku}</strong>
                                  <span style={{ marginLeft: 8, color: 'var(--ink-40)' }}>
                                    {sel.movementTypeLabel} · {sel.quantity} uds · {new Date(sel.createdAt).toLocaleDateString('es-CO')}
                                  </span>
                                  {sel.customerName ? <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--teal-600)' }}>{sel.customerName}</span> : null}
                                </>
                              )
                            })()}
                          </div>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => { setForm((c) => ({ ...c, relatedMovementId: '' })); setMovementSearch('') }}
                          >
                            Cambiar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ position: 'relative' }}>
                            <svg
                              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, stroke: 'var(--teal-600)', strokeWidth: 1.8 }}
                              viewBox="0 0 24 24" fill="none"
                            >
                              <circle cx="11" cy="11" r="8" />
                              <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                              className="f-input"
                              style={{ paddingLeft: 34 }}
                              placeholder="Buscar movimiento por SKU, cliente o factura..."
                              value={movementSearch}
                              onChange={(e) => setMovementSearch(e.target.value)}
                            />
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              maxHeight: 180,
                              overflowY: 'auto',
                              border: '1px solid var(--ink-12)',
                              borderRadius: 8,
                              background: 'var(--white)',
                            }}
                          >
                            {loadingOutgoing ? (
                              <p style={{ padding: '12px', fontSize: 12, color: 'var(--ink-40)', textAlign: 'center' }}>
                                Cargando movimientos…
                              </p>
                            ) : filteredMovements.length === 0 ? (
                              <p style={{ padding: '12px', fontSize: 12, color: 'var(--ink-40)', textAlign: 'center' }}>
                                No hay movimientos de salida disponibles.
                              </p>
                            ) : (
                              filteredMovements.map((mov) => (
                                <button
                                  key={mov.id}
                                  type="button"
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    border: 'none',
                                    borderBottom: '1px solid var(--ink-06)',
                                    background: mov.id === form.relatedMovementId ? 'var(--teal-50)' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontFamily: 'var(--ff-body)',
                                    color: 'var(--ink)',
                                  }}
                                  onClick={() => {
                                    setForm((c) => ({ ...c, relatedMovementId: mov.id }))
                                    setMovementSearch('')
                                  }}
                                  onMouseEnter={(e) => { if (mov.id !== form.relatedMovementId) e.currentTarget.style.background = 'var(--ink-06)' }}
                                  onMouseLeave={(e) => { if (mov.id !== form.relatedMovementId) e.currentTarget.style.background = 'transparent' }}
                                >
                                  <strong>{mov.productSku}</strong>
                                  <span style={{ marginLeft: 8, color: 'var(--ink-40)', fontSize: 12 }}>
                                    {mov.movementTypeLabel} · {mov.quantity} uds · {new Date(mov.createdAt).toLocaleDateString('es-CO')}
                                  </span>
                                  {mov.customerName ? (
                                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--teal-600)' }}>{mov.customerName}</span>
                                  ) : null}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </fieldset>

                <div className="form-footer">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setForm(toFormState(selectedProduct, selectedLocation?.id ?? ''))}
                  >
                    {t('returns.form.reset')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={handleSubmit}
                    disabled={saving || Boolean(validationMessage)}
                  >
                    {saving ? t('returns.form.saving') : t('returns.form.submit')}
                  </button>
                </div>

                {validationMessage ? <p className="prod-sub prod-sub--warn" style={{ marginTop: '8px' }}>{validationMessage}</p> : null}
              </div>
            </form>
          </div>

          <aside className="returns-panel" aria-label={t('returns.pending.ariaLabel')}>
            <section>
              <div className="s-head">
                <span className="s-head__label">{t('returns.pending.title')}</span>
                <div className="s-head__rule" />
                <span className="pill pill--warn s-head__action">{pendingReturns.length}</span>
              </div>

              <div className="returns-panel-stack">
                {loading ? (
                  <div style={{ border: '1px solid var(--ink-12)', borderRadius: 'var(--r-md)', padding: '14px', background: 'var(--white)' }}>
                    <p className="inventory-empty">{t('common.loading')}</p>
                  </div>
                ) : null}

                {!loading && pendingReturns.length === 0 ? (
                  <div style={{ border: '1px solid var(--ink-12)', borderRadius: 'var(--r-md)', padding: '14px', background: 'var(--white)' }}>
                    <p className="inventory-empty">{t('returns.pending.empty')}</p>
                  </div>
                ) : null}

                {pendingReturns.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: '1px solid var(--ink-12)',
                      borderRadius: 'var(--r-md)',
                      padding: '14px',
                      marginBottom: '20px',
                      background: 'var(--white)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>{entry.productName}</p>
                        <p className="sku" style={{ margin: 0, fontSize: '11px', color: 'var(--ink-40)' }}>
                          {entry.sku} {entry.serialNumber ? `· SN: ${entry.serialNumber}` : ''}
                        </p>
                      </div>
                      <span className="pill pill--warn">{t(`returns.status.${entry.status}`)}</span>
                    </div>
                    <dl style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px', margin: 0, padding: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <dt style={{ color: 'var(--ink-40)' }}>{t('returns.pending.details.reason')}</dt>
                        <dd style={{ fontWeight: 500, margin: 0 }}>{entry.reason}</dd>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <dt style={{ color: 'var(--ink-40)' }}>{t('returns.pending.details.state')}</dt>
                        <dd style={{ fontWeight: 500, margin: 0 }}>{entry.productState}</dd>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <dt style={{ color: 'var(--ink-40)' }}>{t('returns.pending.details.operator')}</dt>
                        <dd style={{ fontWeight: 500, margin: 0 }}>{entry.registeredBy}</dd>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <dt style={{ color: 'var(--ink-40)' }}>{t('returns.pending.details.location')}</dt>
                        <dd style={{ fontWeight: 500, margin: 0 }}>{entry.locationCode}</dd>
                      </div>
                    </dl>
                    {useMocks ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          style={{ justifyContent: 'center' }}
                          onClick={() => handleResolvePending(entry, 'reincorporated')}
                        >
                          {t('returns.pending.approve')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          style={{ justifyContent: 'center' }}
                          onClick={() => handleResolvePending(entry, 'rejected')}
                        >
                          {t('returns.pending.reject')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="s-head returns-history-head" style={{ marginBottom: '10px' }}>
                <span className="s-head__label">{t('returns.history.title')}</span>
                <div className="s-head__rule" />
              </div>

              <ol className="mov-list">
                {!loading && historyEntries.length === 0 ? (
                  <li className="mov-item">
                    <span className="mov-pip mov-pip--ret" />
                    <div>
                      <p className="mov-title">{t('returns.history.empty')}</p>
                    </div>
                    <time className="mov-time">ICM</time>
                  </li>
                ) : null}

                {historyEntries.map((entry) => (
                  <li key={entry.id} className="mov-item">
                    <span className={`mov-pip ${formatHistoryPip(entry.status)}`} />
                    <div>
                      <p className="mov-title">
                        {entry.productName} — {t(`returns.status.${entry.status}`)}
                      </p>
                      <div className="mov-meta">
                        <span className="sku">{entry.sku}</span>
                        <span>{entry.registeredBy}</span>
                        {entry.note ? <span>{entry.note}</span> : null}
                      </div>
                    </div>
                    <time className="mov-time">{entry.registeredAt}</time>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

export default ReturnsPage
