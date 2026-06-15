import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarcodeScannerButton } from '../../components/ui/BarcodeScannerButton'
import type { BarcodeProductResult } from '../../services/barcodeScanner'
import { extractApiError } from '../../hooks/useApiError'

import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Search,
  ShieldCheck,
  Snowflake,
  Truck,
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
  DispatchItem,
  DispatchLocation,
  DispatchMovement,
  DispatchStatus,
} from '../../interfaces/dispatch'

import {
  downloadInvoicePdf,
  fetchDispatchOverview,
  submitDispatch,
} from '../../services/dispatch'

type DispatchForm = Readonly<{
  quantity: string
  locationId: string
  lotCode: string
  serialNumber: string
  customerName: string
  customerEmail: string      // nuevo
  customerPhone: string      // nuevo
  customerAddress: string    // nuevo
  note: string
  coldChainConfirmed: boolean
  electricalSafetyConfirmed: boolean
  privacyNoticeConfirmed: boolean  // requerido para venta mayor
}>

  type DispatchMode = 'wholesale' | 'retail' | 'damage' | 'expiry'

  type DispatchModeOption = Readonly<{
    value: DispatchMode
    title: string
    description: string
  }>

  type DispatchTypeSelectorProps = Readonly<{
    options: DispatchModeOption[]
    value: DispatchMode
    onChange: (value: DispatchMode) => void
  }>

  function DispatchTypeSelector({ options, value, onChange }: DispatchTypeSelectorProps) {
    return (
      <div className="dispatch-type-grid">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              className={['dispatch-type-card', active ? 'dispatch-type-card--active' : ''].filter(Boolean).join(' ')}
              onClick={() => onChange(option.value)}
            >
              <span className="dispatch-type-card__title">{option.title}</span>
              <span className="dispatch-type-card__body">{option.description}</span>
            </button>
          )
        })}
      </div>
    )
  }

  function matchesDispatchSearch(order: DispatchItem, normalizedSearch: string) {
    return [order.invoiceNumber, order.customerName ?? '', order.productName, order.sku, order.barcode, order.category]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  }

  function getFilteredDispatchOrders(orders: DispatchItem[], search: string) {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return orders
    return orders.filter((order) => matchesDispatchSearch(order, normalizedSearch))
  }

  function getSelectedDispatchOrder(orders: DispatchItem[], selectedOrderId: string | null, filteredOrders: DispatchItem[]) {
    return orders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0]
  }

  function getDispatchStats(orders: DispatchItem[], dispatchedIds: Set<string>) {
    return {
      pending: orders.filter((order) => !dispatchedIds.has(order.id)).length,
      serialRequired: orders.filter((order) => order.requiresSerial).length,
      coldChain: orders.filter((order) => order.requiresColdChain).length,
    }
  }

  function getDispatchValidationMessage({
    selectedOrder,
    dispatchedIds,
    quantity,
    form,
    customerDataRequired,
    t,
  }: Readonly<{
    selectedOrder: DispatchItem | undefined;
    dispatchedIds: Set<string>;
    quantity: number;
    form: DispatchForm;
    customerDataRequired: boolean;
    t: (key: string, options?: Record<string, unknown>) => string;
  }>) {
    if (!selectedOrder) return t("dispatch.errors.noOrder");
    if (dispatchedIds.has(selectedOrder.id))
      return t("dispatch.errors.alreadyDispatched");
    if (!Number.isFinite(quantity) || quantity <= 0)
      return t("dispatch.errors.quantity");
    if (!form.locationId) return t("dispatch.errors.location");
    if (!form.lotCode) return t("dispatch.errors.lot");
    if (selectedOrder.requiresSerial && !form.serialNumber.trim())
      return t("dispatch.errors.serials");
    if (selectedOrder.requiresColdChain && !form.coldChainConfirmed)
      return t("dispatch.errors.coldChain");
    if (selectedOrder.requiresSerial && !form.electricalSafetyConfirmed)
      return t("dispatch.errors.electricalSafety");
    // Venta mayor requiere todos los datos del cliente y aviso de privacidad
    if (customerDataRequired) {
      if (!form.customerName.trim()) return t("dispatch.errors.customerData");
      if (!form.customerEmail.trim()) return t("dispatch.errors.customerEmail");
      if (!form.customerPhone.trim()) return t("dispatch.errors.customerPhone");
      if (!form.customerAddress.trim())
        return t("dispatch.errors.customerAddress");
      if (!form.privacyNoticeConfirmed)
        return t("dispatch.errors.privacyNotice");
    }
    return null;
  }

function toForm(order?: DispatchItem): DispatchForm {
  return {
    quantity: order?.expectedQuantity.toString() ?? "",
    locationId: "",
    lotCode: "",
    serialNumber: "",
    customerName: order?.customerName ?? "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    note: "",
    coldChainConfirmed: false,
    electricalSafetyConfirmed: false,
    privacyNoticeConfirmed: false,
  };
}

  const statusVariant: Record<DispatchStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
    pending: 'secondary',
    preparing: 'warning',
    ready: 'success',
    dispatched: 'success',
    blocked: 'destructive',
  }

  function DispatchPage() {
    const { t } = useTranslation()
    const [overview, setOverview] = useState<{
      locations: DispatchLocation[]
      expectedOrders: DispatchItem[]
      recentMovements: DispatchMovement[]
    } | null>(null)
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [scanValue, setScanValue] = useState('')
    const [dispatchMode, setDispatchMode] = useState<DispatchMode>('wholesale')
    const [form, setForm] = useState<DispatchForm>(toForm())
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [validationSuccess, setValidationSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [recentMovements, setRecentMovements] = useState<DispatchMovement[]>([])
    const [dispatchedIds, setDispatchedIds] = useState<Set<string>>(() => new Set())
    const [lastSavedMovement, setLastSavedMovement] = useState<DispatchMovement | null>(null)
    const lastScanRef = useRef<{ value: string; time: number } | null>(null)

    const dispatchModes = useMemo<DispatchModeOption[]>(
      () => [
        { value: 'wholesale', title: t('dispatch.types.wholesale.title'), description: t('dispatch.types.wholesale.description') },
        { value: 'retail', title: t('dispatch.types.retail.title'), description: t('dispatch.types.retail.description') },
        { value: 'damage', title: t('dispatch.types.damage.title'), description: t('dispatch.types.damage.description') },
        { value: 'expiry', title: t('dispatch.types.expiry.title'), description: t('dispatch.types.expiry.description') },
      ],
      [t],
    )

    const customerDataRequired = dispatchMode === 'wholesale'

    const loadOverview = useCallback(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchDispatchOverview()
        setOverview(data)
        setRecentMovements(data.recentMovements)
        const firstPending = data.expectedOrders.find((order) => order.status !== 'dispatched')
        setSelectedOrderId((current) => current ?? firstPending?.id ?? data.expectedOrders[0]?.id ?? null)
      } catch (err) {
        setError(extractApiError(err))
      } finally {
        setLoading(false)
      }
    }, [t])

    useEffect(() => {
      loadOverview()
    }, [loadOverview])

    const orders = overview?.expectedOrders ?? []
    const locations = overview?.locations ?? []

    const filteredOrders = useMemo(() => getFilteredDispatchOrders(orders, search), [orders, search])
    const selectedOrder = useMemo(() => getSelectedDispatchOrder(orders, selectedOrderId, filteredOrders), [orders, selectedOrderId, filteredOrders])

    useEffect(() => {
      setForm(toForm(selectedOrder))
      setValidationError(null)
      setValidationSuccess(null)
      setSuccessMessage(null)
      setLastSavedMovement(null)
      setScanValue('')
    }, [selectedOrder])

    const stats = useMemo(() => getDispatchStats(orders, dispatchedIds), [orders, dispatchedIds])
    const quantity = Number(form.quantity)
    const validationMessage = useMemo(
      () =>
        getDispatchValidationMessage({
          selectedOrder,
          dispatchedIds,
          quantity,
          form,
          customerDataRequired,
          t,
        }),
      [customerDataRequired, dispatchedIds, form, quantity, selectedOrder, t],
    )

    useEffect(() => {
      const val = scanValue.trim()
      if (!val || !selectedOrder) return

      const timer = setTimeout(() => {
        const now = Date.now()
        if (lastScanRef.current && lastScanRef.current.value === val && now - lastScanRef.current.time < 2000) {
          return
        }
        lastScanRef.current = { value: val, time: now }
        handleVerifyScan(val)
      }, 250)

      return () => clearTimeout(timer)
    }, [scanValue, selectedOrder])

    const handleVerifyScan = (codeOrValue?: string) => {
      if (!selectedOrder) return

      const raw = (codeOrValue ?? scanValue).trim().toLowerCase()
      const matches = raw === selectedOrder.sku.toLowerCase() || raw === selectedOrder.barcode.toLowerCase()

      if (matches) {
        setValidationError(null)
        setValidationSuccess(t('dispatch.errors.scanSuccess'))
        return
      }

      setValidationSuccess(null)
      setValidationError(
        t('dispatch.errors.scanMismatch', {
          scanned: codeOrValue ?? scanValue,
          expected: selectedOrder.sku,
        }),
      )
    }

    /**
     * Callback del lector HID:
     * 1. Si el producto escaneado coincide con la orden activa → verificar.
     * 2. Si corresponde a otra orden en la lista → autoseleccionar.
     * 3. Rellena el campo manual para referencia.
     */
    const handleProductScanned = useCallback(
      (product: BarcodeProductResult) => {
        setScanValue(product.barcode || product.sku)
        // Buscar la orden que corresponde al producto escaneado
        const matchingOrder = orders.find(
          (o) =>
            o.productId === String(product.id) ||
            o.sku.toLowerCase() === product.sku.toLowerCase() ||
            o.barcode.toLowerCase() === (product.barcode ?? '').toLowerCase(),
        )
        if (matchingOrder) {
          setSelectedOrderId(matchingOrder.id)
          // Dar un tick para que el estado se actualice antes de verificar
          setTimeout(() => {
            const code = product.barcode || product.sku
            const raw = code.toLowerCase()
            const matches =
              raw === matchingOrder.sku.toLowerCase() ||
              raw === matchingOrder.barcode.toLowerCase()
            if (matches) {
              setValidationError(null)
              setValidationSuccess(t('dispatch.errors.scanSuccess'))
            } else {
              setValidationSuccess(null)
              setValidationError(
                t('dispatch.errors.scanMismatch', { scanned: code, expected: matchingOrder.sku }),
              )
            }
          }, 50)
        } else {
          // El producto existe pero no hay orden pendiente para él
          setValidationSuccess(null)
          setValidationError(
            `Producto "${product.name}" (${product.sku}) no tiene una orden de despacho pendiente.`,
          )
        }
      },
      [orders, t],
    )

    const handleSelectOrder = (order: DispatchItem) => {
      setSelectedOrderId(order.id)
      setScanValue('')
    }

    const handleConfirm = async () => {
      if (!selectedOrder || validationMessage) return;

      setSaving(true);
      setError(null);
      try {
        const movement = await submitDispatch({
          productId: selectedOrder.productId,
          locationId: form.locationId,
          quantity,
          movementType: "SALIDA_VENTA_MAYOR",
          // BR-08: solo enviamos ambos si el scan fue validado
          scannedCode: scanValue.trim() || null,
          orderSku: scanValue.trim() ? selectedOrder.sku : null,
          serialNumber: selectedOrder.requiresSerial ? form.serialNumber : null,
          // customer_data con campos exactos del backend
          customerData: customerDataRequired
            ? {
                customer_name: form.customerName.trim(),
                customer_email: form.customerEmail.trim(),
                customer_phone: form.customerPhone.trim(),
                customer_address: form.customerAddress.trim(),
                privacy_notice_acknowledged: form.privacyNoticeConfirmed,
              }
            : null,
          note: form.note.trim() || undefined,
          coldChainAcknowledged: selectedOrder.requiresColdChain
            ? form.coldChainConfirmed
            : false,
          electricalSafetyAcknowledged: selectedOrder.requiresSerial
            ? form.electricalSafetyConfirmed
            : false,
          privacyNoticeAcknowledged: form.privacyNoticeConfirmed,
        });

        setRecentMovements((current) => [movement, ...current]);
        setDispatchedIds((current) => new Set(current).add(selectedOrder.id));
        setSuccessMessage(
          t("dispatch.success.confirmed", { sku: selectedOrder.sku }),
        );
        setLastSavedMovement(movement);
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setSaving(false);
      }
    };

    const handleDownloadPdf = async () => {
      if (!lastSavedMovement) return
      try {
        await downloadInvoicePdf(lastSavedMovement.id, lastSavedMovement.invoiceNumber ?? 'ICM-PDF')
      } catch (err) {
        setError(extractApiError(err))
      }
    }

    return (
      <AppShell
        title={t("dispatch.title")}
        subtitle={t("dispatch.subtitle")}
        actions={
          <Button variant="ghost" size="sm" onClick={loadOverview}>
            {t("common.actions.refresh")}
          </Button>
        }
      >
        <div className="page-body reception-page">
          <div className="s-head">
            <span className="s-head__label">{t("dispatch.flow.title")}</span>
            <div className="s-head__rule" />
          </div>

          <DispatchTypeSelector
            options={dispatchModes}
            value={dispatchMode}
            onChange={setDispatchMode}
          />

          <section
            className="reception-stats"
            aria-label={t("dispatch.stats.ariaLabel")}
          >
            <Card className="reception-stat rounded-lg">
              <Truck />
              <div>
                <span>{stats.pending}</span>
                <p>{t("dispatch.stats.pending")}</p>
              </div>
            </Card>
            <Card className="reception-stat rounded-lg">
              <ShieldCheck />
              <div>
                <span>{stats.serialRequired}</span>
                <p>{t("dispatch.stats.serialRequired")}</p>
              </div>
            </Card>
            <Card className="reception-stat rounded-lg">
              <Snowflake />
              <div>
                <span>{stats.coldChain}</span>
                <p>{t("dispatch.stats.coldChain")}</p>
              </div>
            </Card>
          </section>

          <div className="reception-scanbar">
            <div className="reception-scanbar__field reception-scanbar__field--grow">
              <label className="inventory-label" htmlFor="dispatch-scan">
                {t("dispatch.scan.label")}
              </label>
              <div className="reception-scanbar__input">
                <Barcode />
                <Input
                  id="dispatch-scan"
                  value={scanValue}
                  placeholder={t("dispatch.scan.placeholder")}
                  onChange={(event) => setScanValue(event.target.value.replace(/'/g, '-'))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleVerifyScan();
                  }}
                />
                {/* Lector HID — escanea y verifica/autoselecciona automáticamente */}
                <BarcodeScannerButton
                  label="Escanear"
                  onProductFound={handleProductScanned}
                />
                <Button
                  type="button"
                  onClick={() => handleVerifyScan()}
                  variant="default"
                  className={'text-white' + (validationSuccess ? ' bg-green-600 hover:bg-green-700' : '')}
                >
                  {t('dispatch.scan.action')}
                </Button>
              </div>
              <p className="dispatch-scan-hint">{t("dispatch.scan.helper")}</p>
            </div>

            <div className="reception-scanbar__field">
              <label className="inventory-label" htmlFor="dispatch-search">
                {t("dispatch.search.label")}
              </label>
              <div className="reception-search">
                <Search />
                <Input
                  id="dispatch-search"
                  type="search"
                  value={search}
                  placeholder={t("dispatch.search.placeholder")}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
          </div>

          {validationError ? (
            <div className="alert-bar alert-bar--warn" role="alert">
              <AlertTriangle />
              <span>{validationError}</span>
            </div>
          ) : null}

          {validationSuccess ? (
            <div className="alert-bar alert-bar--ok" role="alert">
              <CheckCircle2 />
              <span>{validationSuccess}</span>
            </div>
          ) : null}

          {error ? (
            <div className="alert-bar alert-bar--warn" role="alert">
              <AlertTriangle />
              <span>{error}</span>
            </div>
          ) : null}

          {successMessage ? (
            <output className="alert-bar alert-bar--ok" aria-live="polite">
              <CheckCircle2 />
              <div>
                <span>{successMessage}</span>
                {lastSavedMovement ? (
                  <div className="reception-success__download">
                    <Button
                      size="sm"
                      onClick={handleDownloadPdf}
                      variant="outline"
                      className="text-white border-white hover:bg-teal-700"
                    >
                      <FileDown className="reception-success__icon" />
                      {t("dispatch.form.downloadInvoice")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </output>
          ) : null}

          <div className="reception-layout dispatch-layout">
            <section aria-label={t("dispatch.orders.ariaLabel")}>
              <div className="s-head">
                <span className="s-head__label">
                  {t("dispatch.orders.title")}
                </span>
                <div className="s-head__rule" />
              </div>
              <div className="table-surface">
                <div className="table-wrap">
                  <Table className="data-table reception-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t("dispatch.orders.columns.invoice")}
                        </TableHead>
                        <TableHead>
                          {t("dispatch.orders.columns.customer")}
                        </TableHead>
                        <TableHead>
                          {t("dispatch.orders.columns.product")}
                        </TableHead>
                        <TableHead>
                          {t("dispatch.orders.columns.expected")}
                        </TableHead>
                        <TableHead>
                          {t("dispatch.orders.columns.status")}
                        </TableHead>
                        <TableHead>
                          <span className="sr-only">
                            {t("dispatch.orders.columns.action")}
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="inventory-empty">
                            {t("common.loading")}
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {!loading && filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="inventory-empty">
                            {t("common.empty")}
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {filteredOrders.map((order) => {
                        const isDispatched = dispatchedIds.has(order.id);
                        const status = isDispatched
                          ? "dispatched"
                          : order.status;
                        return (
                          <TableRow
                            key={order.id}
                            className={
                              order.id === selectedOrder?.id
                                ? "is-selected"
                                : undefined
                            }
                          >
                            <TableCell>
                              <p className="prod-name">{order.invoiceNumber}</p>
                            </TableCell>
                            <TableCell>
                              <p className="prod-name">
                                {order.customerName || "-"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="prod-name">{order.productName}</p>
                              <div className="mov-meta">
                                <span className="sku">{order.sku}</span>
                                {order.requiresSerial ? (
                                  <Badge variant="warning">
                                    {t("reception.flags.serial")}
                                  </Badge>
                                ) : null}
                                {order.requiresColdChain ? (
                                  <Badge variant="secondary">
                                    {t("reception.flags.coldChain")}
                                  </Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-mono">
                              {order.expectedQuantity}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant[status]}>
                                {t(`dispatch.status.${status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectOrder(order)}
                              >
                                {t("dispatch.orders.select")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </section>

            <aside aria-label={t("dispatch.form.ariaLabel")}>
              <Card className="reception-form-card rounded-lg">
                <CardHeader>
                  <CardTitle className="reception-form-card__title">
                    {selectedOrder?.productName ??
                      t("dispatch.form.emptyTitle")}
                  </CardTitle>
                  <CardDescription>
                    {selectedOrder
                      ? t("dispatch.form.description", {
                          sku: selectedOrder.sku,
                          invoice: selectedOrder.invoiceNumber,
                        })
                      : t("dispatch.form.emptyDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="reception-form">
                  <div className="reception-form__grid">
                    <div className="inventory-field">
                      <label
                        className="inventory-label"
                        htmlFor="dispatch-quantity"
                      >
                        {t("dispatch.form.quantity")}
                      </label>
                      <Input
                        id="dispatch-quantity"
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
                      <label
                        className="inventory-label"
                        htmlFor="dispatch-location"
                      >
                        {t("dispatch.form.location")}
                      </label>
                      <Select
                        id="dispatch-location"
                        value={form.locationId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            locationId: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          {t("dispatch.form.locationPlaceholder")}
                        </option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.code} - {location.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="inventory-field">
                      <label className="inventory-label" htmlFor="dispatch-lot">
                        {t("dispatch.form.lot")}
                      </label>
                      <Select
                        id="dispatch-lot"
                        value={form.lotCode}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            lotCode: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          {t("dispatch.form.lotPlaceholder")}
                        </option>
                        <option value="LOT-2026-A">
                          LOT-2026-A (Exp: 2028-05-30)
                        </option>
                        <option value="LOT-2026-B">
                          LOT-2026-B (Exp: 2027-11-15)
                        </option>
                      </Select>
                    </div>
                    {selectedOrder?.requiresSerial ? (
                      <div className="inventory-field">
                        <label
                          className="inventory-label"
                          htmlFor="dispatch-serial"
                        >
                          {t("dispatch.form.serialNumber")}
                        </label>
                        <Input
                          id="dispatch-serial"
                          value={form.serialNumber}
                          placeholder={t("dispatch.form.serialPlaceholder")}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              serialNumber: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="s-head reception-section--spaced">
                    <span className="s-head__label">
                      {t("dispatch.form.customerData")}
                    </span>
                  </div>

                  <div className="reception-form__grid reception-form__grid--spaced">
                    <div className="inventory-field">
                      <label
                        className="inventory-label"
                        htmlFor="dispatch-cust-name"
                      >
                        {t("dispatch.form.customerName")}
                      </label>
                      <Input
                        id="dispatch-cust-name"
                        value={form.customerName}
                        placeholder={
                          customerDataRequired
                            ? ""
                            : t("dispatch.form.customerOptionalPlaceholder")
                        }
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            customerName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="inventory-field">
                      <label
                        className="inventory-label"
                        htmlFor="dispatch-cust-email"
                      >
                        {t("dispatch.form.customerEmail")}
                      </label>
                      <Input
                        id="dispatch-cust-email"
                        type="email"
                        value={form.customerEmail}
                        placeholder={
                          customerDataRequired
                            ? "cliente@empresa.com"
                            : t("dispatch.form.customerOptionalPlaceholder")
                        }
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            customerEmail: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="inventory-field">
                      <label
                        className="inventory-label"
                        htmlFor="dispatch-cust-phone"
                      >
                        {t("dispatch.form.customerPhone")}
                      </label>
                      <Input
                        id="dispatch-cust-phone"
                        value={form.customerPhone}
                        placeholder={
                          customerDataRequired
                            ? "300 123 4567"
                            : t("dispatch.form.customerOptionalPlaceholder")
                        }
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            customerPhone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="inventory-field">
                      <label
                        className="inventory-label"
                        htmlFor="dispatch-cust-address"
                      >
                        {t("dispatch.form.customerAddress")}
                      </label>
                      <Input
                        id="dispatch-cust-address"
                        value={form.customerAddress}
                        placeholder={
                          customerDataRequired
                            ? "Calle 123 #45-67, Ciudad"
                            : t("dispatch.form.customerOptionalPlaceholder")
                        }
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            customerAddress: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="notice notice--info reception-notice--spaced">
                    <AlertTriangle />
                    <div>
                      <div className="notice__title">
                        {t("dispatch.form.customerData")}
                      </div>
                      <div className="notice__body">
                        {customerDataRequired
                          ? t("dispatch.form.customerRequiredHelp")
                          : t("dispatch.form.customerOptionalHelp")}
                      </div>
                    </div>
                  </div>

                  <div className="reception-actions">
                    {selectedOrder?.requiresColdChain ? (
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={form.coldChainConfirmed}
                          onChange={(e) =>
                            setForm((current) => ({
                              ...current,
                              coldChainConfirmed: e.target.checked,
                            }))
                          }
                        />
                        <span className="toggle-switch__track">
                          <span className="toggle-switch__thumb" />
                        </span>
                        <span className="toggle-switch__label">
                          {t("dispatch.form.coldChain")}
                        </span>
                      </label>
                    ) : null}

                    {selectedOrder?.requiresSerial ? (
                      <label className="reception-actions__label">
                        <input
                          type="checkbox"
                          checked={form.electricalSafetyConfirmed}
                          onChange={(e) =>
                            setForm((current) => ({
                              ...current,
                              electricalSafetyConfirmed: e.target.checked,
                            }))
                          }
                        />
                        <span>{t("dispatch.form.electricalSafety")}</span>
                      </label>
                    ) : null}
                  </div>

                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="dispatch-note">
                      {t("dispatch.form.note")}
                    </label>
                    <textarea
                      id="dispatch-note"
                      className="f-textarea"
                      value={form.note}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          note: event.target.value,
                        }))
                      }
                    />
                  </div>

                  {validationMessage ? (
                    <div className="notice notice--warn">
                      <AlertTriangle />
                      <div className="notice__body">{validationMessage}</div>
                    </div>
                  ) : null}

                  {customerDataRequired ? (
                    <label className="reception-actions__label">
                      <input
                        type="checkbox"
                        checked={form.privacyNoticeConfirmed}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            privacyNoticeConfirmed: e.target.checked,
                          }))
                        }
                      />
                      <span>{t("dispatch.form.privacyNotice")}</span>
                    </label>
                  ) : null}

                  <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={Boolean(validationMessage) || saving}
                  >
                    <ClipboardCheck />
                    {saving
                      ? t("dispatch.form.saving")
                      : t("dispatch.form.confirmAndGenerate")}
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>

          <section aria-label={t("dispatch.movements.ariaLabel")}>
            <div className="s-head">
              <span className="s-head__label">
                {t("dispatch.movements.title")}
              </span>
              <div className="s-head__rule" />
            </div>
            <div className="reception-movement-grid">
              {recentMovements.map((movement) => (
                <Card
                  key={movement.id}
                  className="reception-movement rounded-lg"
                >
                  <CardContent>
                    <div>
                      <p className="prod-name">{movement.productName}</p>
                      <p className="prod-sub">
                        <span className="sku">{movement.sku}</span> ·{" "}
                        {movement.locationCode}
                      </p>
                    </div>
                    <strong className="text-mono">
                      {t("dispatch.movements.units", {
                        count: movement.quantity,
                      })}
                    </strong>
                    <time>{movement.confirmedAt}</time>
                    {movement.invoiceNumber ? (
                      <p className="reception-movement__note reception-movement__note--invoice">
                        Factura: {movement.invoiceNumber}{" "}
                        {movement.customerName
                          ? `· ${movement.customerName}`
                          : ""}
                      </p>
                    ) : null}
                    {movement.note ? (
                      <p className="reception-movement__note">
                        {movement.note}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    );
  }


export default DispatchPage;