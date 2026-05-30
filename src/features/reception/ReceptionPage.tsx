import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  PackagePlus,
  Search,
  ShieldCheck,
  Snowflake,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import type {
  ReceptionExpectedOrder,
  ReceptionMovement,
  ReceptionOverview,
  ReceptionStatus,
} from '../../interfaces/reception'
import { fetchReceptionOverview, submitReception } from '../../services/reception'

type ReceptionForm = {
  receivedQuantity: string
  locationId: string
  lot: string
  expirationDate: string
  serialNumbers: string
  discrepancyNote: string
}

const statusVariant: Record<ReceptionStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'secondary',
  partial: 'warning',
  ready: 'success',
  received: 'success',
  blocked: 'destructive',
}

const toForm = (order?: ReceptionExpectedOrder): ReceptionForm => ({
  receivedQuantity: order?.receivedQuantity.toString() ?? '',
  locationId: order?.locationId ?? '',
  lot: order?.lot ?? '',
  expirationDate: order?.expirationDate ?? '',
  serialNumbers: '',
  discrepancyNote: '',
})

function ReceptionPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<ReceptionOverview | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [scanValue, setScanValue] = useState('')
  const [form, setForm] = useState<ReceptionForm>(toForm())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localMovements, setLocalMovements] = useState<ReceptionMovement[]>([])
  const [receivedIds, setReceivedIds] = useState<Set<string>>(() => new Set())

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchReceptionOverview()
      setOverview(data)
      setLocalMovements(data.recentMovements)
      const firstReceivable = data.expectedOrders.find((order) => order.status !== 'received')
      setSelectedOrderId((current) => current ?? firstReceivable?.id ?? data.expectedOrders[0]?.id ?? null)
    } catch {
      setError(t('reception.errors.load'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOverview()
  }, [loadOverview])

  const orders = overview?.expectedOrders ?? []
  const locations = overview?.locations ?? []

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) {
      return orders
    }

    return orders.filter((order) =>
      [
        order.purchaseOrder,
        order.invoice,
        order.productName,
        order.sku,
        order.barcode,
        order.supplier,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [orders, search])

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0]
  }, [filteredOrders, orders, selectedOrderId])

  useEffect(() => {
    setForm(toForm(selectedOrder))
    setSuccessMessage(null)
  }, [selectedOrder])

  const stats = useMemo(() => {
    const pending = orders.filter((order) => !receivedIds.has(order.id)).length
    const discrepancies = orders.filter(
      (order) => order.receivedQuantity !== order.expectedQuantity,
    ).length
    const serialRequired = orders.filter((order) => order.requiresSerial).length
    const coldChain = orders.filter((order) => order.requiresColdChain).length
    return { pending, discrepancies, serialRequired, coldChain }
  }, [orders, receivedIds])

  const receivedQuantity = Number(form.receivedQuantity)
  const hasDiscrepancy =
    selectedOrder && Number.isFinite(receivedQuantity)
      ? receivedQuantity !== selectedOrder.expectedQuantity
      : false
  const serialNumbers = form.serialNumbers
    .split('\n')
    .map((serial) => serial.trim())
    .filter(Boolean)

  const validationMessage = useMemo(() => {
    if (!selectedOrder) {
      return t('reception.errors.noOrder')
    }
    if (receivedIds.has(selectedOrder.id)) {
      return t('reception.errors.alreadyReceived')
    }
    if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0) {
      return t('reception.errors.quantity')
    }
    if (!form.locationId) {
      return t('reception.errors.location')
    }
    if (selectedOrder.requiresSerial && serialNumbers.length !== receivedQuantity) {
      return t('reception.errors.serials', { count: receivedQuantity })
    }
    if (hasDiscrepancy && !form.discrepancyNote.trim()) {
      return t('reception.errors.discrepancyNote')
    }
    return null
  }, [
    form.discrepancyNote,
    form.locationId,
    hasDiscrepancy,
    receivedIds,
    receivedQuantity,
    selectedOrder,
    serialNumbers.length,
    t,
  ])

  const handleSelectOrder = (order: ReceptionExpectedOrder) => {
    setSelectedOrderId(order.id)
    setScanValue(order.barcode)
  }

  const handleScan = () => {
    const normalizedScan = scanValue.trim().toLowerCase()
    const order = orders.find(
      (item) =>
        item.barcode.toLowerCase() === normalizedScan ||
        item.sku.toLowerCase() === normalizedScan ||
        item.purchaseOrder.toLowerCase() === normalizedScan,
    )
    if (order) {
      handleSelectOrder(order)
      setError(null)
      return
    }
    setError(t('reception.errors.scanNotFound'))
  }

  const handleConfirm = async () => {
    if (!selectedOrder || validationMessage) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const movement = await submitReception({
        orderId: selectedOrder.id,
        receivedQuantity,
        locationId: form.locationId,
        lot: form.lot.trim() || undefined,
        expirationDate: form.expirationDate || undefined,
        serialNumbers,
        discrepancyNote: form.discrepancyNote.trim() || undefined,
      })
      setLocalMovements((current) => [movement, ...current])
      setReceivedIds((current) => new Set(current).add(selectedOrder.id))
      setSuccessMessage(t('reception.success.confirmed', { sku: selectedOrder.sku }))
    } catch {
      setError(t('reception.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell
      title={t('reception.title')}
      subtitle={t('reception.subtitle')}
      actions={
        <Button variant="ghost" size="sm" onClick={loadOverview}>
          {t('common.actions.refresh')}
        </Button>
      }
    >
      <div className="page-body reception-page">
        <section className="reception-stats" aria-label={t('reception.stats.ariaLabel')}>
          <Card className="reception-stat rounded-lg">
            <PackagePlus />
            <div>
              <span>{stats.pending}</span>
              <p>{t('reception.stats.pending')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <AlertTriangle />
            <div>
              <span>{stats.discrepancies}</span>
              <p>{t('reception.stats.discrepancies')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <ShieldCheck />
            <div>
              <span>{stats.serialRequired}</span>
              <p>{t('reception.stats.serialRequired')}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <Snowflake />
            <div>
              <span>{stats.coldChain}</span>
              <p>{t('reception.stats.coldChain')}</p>
            </div>
          </Card>
        </section>

        <div className="reception-scanbar">
          <div className="reception-scanbar__field">
            <label className="inventory-label" htmlFor="reception-scan">
              {t('reception.scan.label')}
            </label>
            <div className="reception-scanbar__input">
              <Barcode />
              <Input
                id="reception-scan"
                value={scanValue}
                placeholder={t('reception.scan.placeholder')}
                onChange={(event) => setScanValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleScan()
                  }
                }}
              />
              <Button type="button" onClick={handleScan}>
                {t('reception.scan.action')}
              </Button>
            </div>
          </div>
          <div className="reception-scanbar__field">
            <label className="inventory-label" htmlFor="reception-search">
              {t('reception.search.label')}
            </label>
            <div className="reception-search">
              <Search />
              <Input
                id="reception-search"
                type="search"
                value={search}
                placeholder={t('reception.search.placeholder')}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="alert-bar alert-bar--warn" role="alert">
            <AlertTriangle />
            <span>{error}</span>
          </div>
        ) : null}
        {successMessage ? (
          <div className="alert-bar alert-bar--ok" role="status">
            <CheckCircle2 />
            <span>{successMessage}</span>
          </div>
        ) : null}

        <div className="reception-layout">
          <section aria-label={t('reception.orders.ariaLabel')}>
            <div className="s-head">
              <span className="s-head__label">{t('reception.orders.title')}</span>
              <div className="s-head__rule" />
            </div>
            <div className="table-surface">
              <div className="table-wrap">
                <Table className="data-table reception-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reception.orders.columns.order')}</TableHead>
                      <TableHead>{t('reception.orders.columns.product')}</TableHead>
                      <TableHead>{t('reception.orders.columns.expected')}</TableHead>
                      <TableHead>{t('reception.orders.columns.status')}</TableHead>
                      <TableHead>
                        <span className="sr-only">{t('reception.orders.columns.action')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="inventory-empty">
                          {t('common.loading')}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {!loading && filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="inventory-empty">
                          {t('common.empty')}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {filteredOrders.map((order) => {
                      const isReceived = receivedIds.has(order.id)
                      const status = isReceived ? 'received' : order.status
                      return (
                        <TableRow
                          key={order.id}
                          className={order.id === selectedOrder?.id ? 'is-selected' : undefined}
                        >
                          <TableCell>
                            <p className="prod-name">{order.purchaseOrder}</p>
                            <p className="prod-sub">{order.invoice}</p>
                          </TableCell>
                          <TableCell>
                            <p className="prod-name">{order.productName}</p>
                            <div className="mov-meta">
                              <span className="sku">{order.sku}</span>
                              {order.requiresSerial ? (
                                <Badge variant="warning">{t('reception.flags.serial')}</Badge>
                              ) : null}
                              {order.requiresColdChain ? (
                                <Badge variant="secondary">{t('reception.flags.coldChain')}</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-mono">
                            {order.receivedQuantity}/{order.expectedQuantity}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[status]}>
                              {t(`reception.status.${status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleSelectOrder(order)}>
                              {t('reception.orders.select')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          <aside aria-label={t('reception.form.ariaLabel')}>
            <Card className="reception-form-card rounded-lg">
              <CardHeader>
                <CardTitle className="reception-form-card__title">
                  {selectedOrder?.productName ?? t('reception.form.emptyTitle')}
                </CardTitle>
                <CardDescription>
                  {selectedOrder
                    ? t('reception.form.description', {
                        sku: selectedOrder.sku,
                        invoice: selectedOrder.invoice,
                      })
                    : t('reception.form.emptyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="reception-form">
                <div className="reception-form__grid">
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="received-quantity">
                      {t('reception.form.receivedQuantity')}
                    </label>
                    <Input
                      id="received-quantity"
                      type="number"
                      min="1"
                      value={form.receivedQuantity}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, receivedQuantity: event.target.value }))
                      }
                    />
                  </div>
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="reception-location">
                      {t('reception.form.location')}
                    </label>
                    <Select
                      id="reception-location"
                      value={form.locationId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, locationId: event.target.value }))
                      }
                    >
                      <option value="">{t('reception.form.locationPlaceholder')}</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.code} - {location.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="reception-lot">
                      {t('reception.form.lot')}
                    </label>
                    <Input
                      id="reception-lot"
                      value={form.lot}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, lot: event.target.value }))
                      }
                    />
                  </div>
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="reception-expiration">
                      {t('reception.form.expirationDate')}
                    </label>
                    <Input
                      id="reception-expiration"
                      type="date"
                      value={form.expirationDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, expirationDate: event.target.value }))
                      }
                    />
                  </div>
                </div>

                {selectedOrder?.requiresSerial ? (
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="reception-serials">
                      {t('reception.form.serialNumbers')}
                    </label>
                    <textarea
                      id="reception-serials"
                      className="f-textarea"
                      value={form.serialNumbers}
                      placeholder={t('reception.form.serialPlaceholder')}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, serialNumbers: event.target.value }))
                      }
                    />
                  </div>
                ) : null}

                <div className={`reception-discrepancy${hasDiscrepancy ? ' is-active' : ''}`}>
                  <div>
                    <strong>
                      {hasDiscrepancy
                        ? t('reception.form.discrepancyDetected')
                        : t('reception.form.noDiscrepancy')}
                    </strong>
                    <span>
                      {selectedOrder
                        ? t('reception.form.expectedHelp', {
                            count: selectedOrder.expectedQuantity,
                          })
                        : t('reception.form.expectedEmpty')}
                    </span>
                  </div>
                </div>

                {hasDiscrepancy ? (
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="reception-note">
                      {t('reception.form.discrepancyNote')}
                    </label>
                    <textarea
                      id="reception-note"
                      className="f-textarea"
                      value={form.discrepancyNote}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          discrepancyNote: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {validationMessage ? (
                  <div className="notice notice--warn">
                    <AlertTriangle />
                    <div className="notice__body">{validationMessage}</div>
                  </div>
                ) : null}

                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={Boolean(validationMessage) || saving}
                >
                  <ClipboardCheck />
                  {saving ? t('reception.form.saving') : t('reception.form.confirm')}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        <section aria-label={t('reception.movements.ariaLabel')}>
          <div className="s-head">
            <span className="s-head__label">{t('reception.movements.title')}</span>
            <div className="s-head__rule" />
          </div>
          <div className="reception-movement-grid">
            {localMovements.map((movement) => (
              <Card key={movement.id} className="reception-movement rounded-lg">
                <CardContent>
                  <div>
                    <p className="prod-name">{movement.productName}</p>
                    <p className="prod-sub">
                      <span className="sku">{movement.sku}</span> · {movement.locationCode}
                    </p>
                  </div>
                  <strong className="text-mono">
                    {t('reception.movements.units', { count: movement.quantity })}
                  </strong>
                  <span>{movement.operator}</span>
                  <time>{movement.confirmedAt}</time>
                  {movement.discrepancyNote ? (
                    <p className="reception-movement__note">{movement.discrepancyNote}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default ReceptionPage
