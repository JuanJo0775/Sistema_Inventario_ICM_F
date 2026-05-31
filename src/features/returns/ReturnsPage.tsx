import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Undo2,
  XCircle,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import type { ReturnEntry, ReturnProduct, ReturnsOverview, ReturnStatus } from '../../interfaces/returns'
import { useMocks } from '../../mocks/config'
import { fetchReturnsOverview, getSubmitReturnErrorMessage, submitReturn } from '../../services/returns'

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

const returnStatusVariant: Record<ReturnStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  recorded: 'secondary',
  reincorporated: 'success',
  rejected: 'destructive',
  blocked: 'destructive',
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
    <div className={product.canReturn ? 'returns-validation-strip returns-validation-strip--ok' : 'returns-validation-strip returns-validation-strip--warn'}>
      <Undo2 />
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

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchReturnsOverview()
      setOverview(data)
      setPendingReturns(data.pendingReturns)
      setHistoryEntries(data.history)
      const defaultProduct = data.products.find((item) => item.canReturn) ?? data.products[0]
      const defaultLocation = data.locations[0]?.id ?? ''
      setForm(toFormState(defaultProduct, defaultLocation))
    } catch {
      setError(t('returns.errors.load'))
    } finally {
      setLoading(false)
    }
  }, [t])

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
        const defaultProduct = data.products.find((item) => item.canReturn) ?? data.products[0]
        const defaultLocation = data.locations[0]?.id ?? ''
        setForm(toFormState(defaultProduct, defaultLocation))
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

    return () => {
      cancelled = true
    }
  }, [t])

  const products = useMemo(() => overview?.products ?? [], [overview])
  const locations = useMemo(() => overview?.locations ?? [], [overview])

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

  const summary = useMemo(() => {
    const serialRequired = products.filter((item) => item.requiresSerial).length
    const blocked = products.filter((item) => !item.canReturn).length
    return {
      pending: pendingReturns.length,
      history: historyEntries.length,
      serialRequired,
      blocked,
    }
  }, [historyEntries.length, pendingReturns.length, products])

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
        <Button variant="ghost" size="sm" onClick={loadOverview}>
          {t('common.actions.refresh')}
        </Button>
      }
    >
      <div className="page-body returns-page">
        <section className="reception-stats" aria-label={t('returns.stats.ariaLabel')}>
          <Card className="reception-stat rounded-lg">
            <PackageCheck />
            <div>
              <span>{summary.pending}</span>
              <p>{t('returns.stats.pending')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <AlertTriangle />
            <div>
              <span>{summary.blocked}</span>
              <p>{t('returns.stats.blocked')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <Clock3 />
            <div>
              <span>{summary.history}</span>
              <p>{t('returns.stats.history')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <Barcode />
            <div>
              <span>{summary.serialRequired}</span>
              <p>{t('returns.stats.serialRequired')}</p>
            </div>
          </Card>
        </section>

        <div className="alert-bar alert-bar--warn" role="alert">
          <AlertTriangle />
          <span>
            <strong>{t('returns.alerts.policyPrefix')}</strong> {t('returns.alerts.policy')}
          </span>
        </div>

        {useMocks ? null : (
          <output className="alert-bar alert-bar--info" aria-live="polite">
            <Clock3 />
            <span>{t('returns.alerts.backendMode')}</span>
          </output>
        )}

        <ReturnsBanner error={error} successMessage={successMessage} />

        <div className="reception-layout returns-layout">
          <section aria-label={t('returns.form.ariaLabel')}>
            <div className="s-head">
              <span className="s-head__label">{t('returns.form.title')}</span>
              <div className="s-head__rule" />
            </div>

            <ReturnsValidationStrip product={selectedProduct} t={t} />

            <Card className="reception-form-card rounded-lg">
              <CardHeader>
                <CardTitle className="reception-form-card__title">
                  {selectedProduct?.productName ?? t('returns.form.emptyTitle')}
                </CardTitle>
                <CardDescription>
                  {selectedProduct
                    ? t('returns.form.description', {
                        sku: selectedProduct.sku,
                        category: selectedProduct.category,
                      })
                    : t('returns.form.emptyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="reception-form">
                <div className="reception-form__grid">
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="return-product">
                      {t('returns.form.product')}
                    </label>
                    <Select
                      id="return-product"
                      value={form.productId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          productId: event.target.value,
                        }))
                      }
                    >
                      <option value="">{t('returns.form.productPlaceholder')}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.productId}>
                          {product.productName} - {product.sku}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="return-location">
                      {t('returns.form.location')}
                    </label>
                    <Select
                      id="return-location"
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
                          {location.code} - {location.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="return-quantity">
                      {t('returns.form.quantity')}
                    </label>
                    <Input
                      id="return-quantity"
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

                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="return-serial">
                      {t('returns.form.serialNumber')}
                    </label>
                    <Input
                      id="return-serial"
                      className="text-mono"
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

                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="return-state">
                      {t('returns.form.state')}
                    </label>
                    <Select
                      id="return-state"
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
                    </Select>
                  </div>

                  <div className="inventory-field returns-span-2">
                    <label className="inventory-label" htmlFor="return-reason">
                      {t('returns.form.reason')}
                    </label>
                    <Input
                      id="return-reason"
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

                  <div className="inventory-field returns-span-2">
                    <label className="inventory-label" htmlFor="return-note">
                      {t('returns.form.note')}
                    </label>
                    <Input
                      id="return-note"
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

                  <div className="inventory-field returns-span-2">
                    <label className="inventory-label" htmlFor="return-related">
                      {t('returns.form.relatedMovement')}
                    </label>
                    <Input
                      id="return-related"
                      placeholder={t('returns.form.relatedMovementPlaceholder')}
                      value={form.relatedMovementId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          relatedMovementId: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="returns-block-example">
                  <p className="returns-block-example__eyebrow">{t('returns.blockExample.eyebrow')}</p>
                  <div className="returns-validation-strip returns-validation-strip--warn">
                    <XCircle />
                    <span>{t('returns.blockExample.message')}</span>
                  </div>
                </div>

                <div className="form-footer returns-form-footer">
                  <Button type="button" variant="outline" onClick={() => setForm(toFormState(selectedProduct, selectedLocation?.id ?? ''))}>
                    {t('returns.form.reset')}
                  </Button>
                  <Button type="button" onClick={handleSubmit} disabled={saving || Boolean(validationMessage)}>
                    {saving ? t('returns.form.saving') : t('returns.form.submit')}
                  </Button>
                </div>

                {validationMessage ? <p className="prod-sub prod-sub--warn">{validationMessage}</p> : null}
              </CardContent>
            </Card>
          </section>

          <aside className="returns-panel" aria-label={t('returns.pending.ariaLabel')}>
            <section>
              <div className="s-head">
                <span className="s-head__label">{t('returns.pending.title')}</span>
                <div className="s-head__rule" />
                <span className="pill pill--warn s-head__action">{pendingReturns.length}</span>
              </div>

              <div className="returns-panel-stack">
                {loading ? (
                  <Card className="returns-panel-card rounded-lg">
                    <CardContent className="returns-panel-card__content">
                      <p className="inventory-empty">{t('common.loading')}</p>
                    </CardContent>
                  </Card>
                ) : null}

                {!loading && pendingReturns.length === 0 ? (
                  <Card className="returns-panel-card rounded-lg">
                    <CardContent className="returns-panel-card__content">
                      <p className="inventory-empty">{t('returns.pending.empty')}</p>
                    </CardContent>
                  </Card>
                ) : null}

                {pendingReturns.map((entry) => (
                  <Card key={entry.id} className="returns-panel-card rounded-lg">
                    <CardContent className="returns-panel-card__content">
                      <div className="inventory-detail__head">
                        <div>
                          <p className="prod-name">{entry.productName}</p>
                          <p className="sku">
                            {entry.sku} · {entry.serialNumber}
                          </p>
                        </div>
                        <Badge variant={returnStatusVariant[entry.status]}>{t(`returns.status.${entry.status}`)}</Badge>
                      </div>
                      <dl className="returns-meta">
                        <div>
                          <dt>{t('returns.pending.details.reason')}</dt>
                          <dd>{entry.reason}</dd>
                        </div>
                        <div>
                          <dt>{t('returns.pending.details.state')}</dt>
                          <dd>{entry.productState}</dd>
                        </div>
                        <div>
                          <dt>{t('returns.pending.details.operator')}</dt>
                          <dd>{entry.registeredBy}</dd>
                        </div>
                        <div>
                          <dt>{t('returns.pending.details.location')}</dt>
                          <dd>{entry.locationCode}</dd>
                        </div>
                      </dl>
                      {useMocks ? (
                        <div className="returns-pending-card__actions">
                          <Button type="button" size="sm" onClick={() => handleResolvePending(entry, 'reincorporated')}>
                            {t('returns.pending.approve')}
                          </Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => handleResolvePending(entry, 'rejected')}>
                            {t('returns.pending.reject')}
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <div className="s-head returns-history-head">
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
