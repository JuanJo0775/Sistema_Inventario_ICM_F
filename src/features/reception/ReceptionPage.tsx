import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  TrendingUp,
  X,
  RefreshCw,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useReceptionStore from '../../store/useReceptionStore'

type ReceptionForm = {
  receivedQuantity: string
  locationId: string
  lot: string           // solo visual, no se envía al backend
  expirationDate: string // solo visual, no se envía al backend
  serialNumbers: string  // se toma solo el primero para el backend
  discrepancyNote: string
  coldChainConfirmed: boolean
  electricalSafetyConfirmed: boolean
}

const statusColorMap: Record<string, { bg: string; color: string; border: string }> = {
  pendiente: { bg: '#e8f2ff', color: '#1971c2', border: '#a5d8ff' },
  parcialmente_recibida: { bg: '#fff9db', color: '#f59f00', border: '#ffe066' },
  completada: { bg: '#ebfbee', color: '#099268', border: '#b2f2bb' },
  cancelada: { bg: '#fff5f5', color: '#e03131', border: '#ffc9c9' },
  borrador: { bg: '#f1f3f5', color: '#495057', border: '#dee2e6' },
}

const toForm = (order?: ReceptionExpectedOrder): ReceptionForm => ({
  receivedQuantity: order?.receivedQuantity.toString() ?? "",
  locationId: order?.locationId ?? "",
  lot: order?.lot ?? "",
  expirationDate: order?.expirationDate ?? "",
  serialNumbers: "",
  discrepancyNote: "",
  coldChainConfirmed: false,
  electricalSafetyConfirmed: false,
});

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

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
    if (!selectedOrder) return t("reception.errors.noOrder");
    if (receivedIds.has(selectedOrder.id))
      return t("reception.errors.alreadyReceived");
    if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0)
      return t("reception.errors.quantity");
    if (!form.locationId) return t("reception.errors.location");
    if (selectedOrder.requiresSerial && serialNumbers.length === 0)
      return t("reception.errors.serials", { count: receivedQuantity });
    if (hasDiscrepancy && !form.discrepancyNote.trim())
      return t("reception.errors.discrepancyNote");
    if (selectedOrder.requiresColdChain && !form.coldChainConfirmed)
      return t("reception.errors.coldChain");
    if (selectedOrder.requiresSerial && !form.electricalSafetyConfirmed)
      return t("reception.errors.electricalSafety");
    return null;
  }, [
    form.discrepancyNote,
    form.locationId,
    form.coldChainConfirmed,
    form.electricalSafetyConfirmed,
    hasDiscrepancy,
    receivedIds,
    receivedQuantity,
    selectedOrder,
    serialNumbers.length,
    t,
  ]);

  // Refresh helper
  const handleRefresh = async () => {
    await Promise.all([fetchPendingOrders(), fetchCompletedOrders()])
  }

  // Filter logic
  const filteredOrders = useMemo(() => {
    const list = activeTab === 'pending' ? pendingOrders : completedOrders
    return list.filter((order) => {
      const matchSearch =
        order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = statusFilter === 'all' || order.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [activeTab, pendingOrders, completedOrders, searchTerm, statusFilter])

  const handleConfirm = async () => {
    if (!selectedOrder || validationMessage) return;

    setSaving(true);
    setError(null);
    try {
      const movement = await submitReception({
        productId: selectedOrder.productId,
        locationId: form.locationId,
        quantity: receivedQuantity,
        // Solo enviamos el primero, backend acepta uno por movimiento
        serialNumber: serialNumbers.length > 0 ? serialNumbers[0] : undefined,
        // Enviamos la cantidad facturada para que el backend detecte discrepancia
        qtyInvoiced: selectedOrder.expectedQuantity,
        discrepancyNote: form.discrepancyNote.trim() || undefined,
        coldChainAcknowledged: form.coldChainConfirmed,
        electricalSafetyAcknowledged: form.electricalSafetyConfirmed,
      });
      setLocalMovements((current) => [movement, ...current]);
      setReceivedIds((current) => new Set(current).add(selectedOrder.id));
      setSuccessMessage(
        t("reception.success.confirmed", { sku: selectedOrder.sku }),
      );
    } catch {
      setError(t("reception.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title={t("reception.title")}
      subtitle={t("reception.subtitle")}
      actions={
        <Button variant="ghost" size="sm" onClick={loadOverview}>
          {t("common.actions.refresh")}
        </Button>
      }
    >
      <div className="page-body reception-page">
        <section
          className="reception-stats"
          aria-label={t("reception.stats.ariaLabel")}
        >
          <Card className="reception-stat rounded-lg">
            <PackagePlus />
            <div>
              <span>{stats.pending}</span>
              <p>{t("reception.stats.pending")}</p>
            </div>
            <div>
              <span>{stats.discrepancies}</span>
              <p>{t("reception.stats.discrepancies")}</p>
            </div>
          </Card>
          <Card className="reception-stat rounded-lg">
            <ShieldCheck />
            <div>
              <span>{stats.serialRequired}</span>
              <p>{t("reception.stats.serialRequired")}</p>
            </div>
            <div>
              <span>{stats.coldChain}</span>
              <p>{t("reception.stats.coldChain")}</p>
            </div>
          </div>

        <div className="reception-scanbar">
          <div className="reception-scanbar__field">
            <label className="inventory-label" htmlFor="reception-scan">
              {t("reception.scan.label")}
            </label>
            <div className="reception-scanbar__input">
              <Barcode />
              <Input
                id="reception-scan"
                value={scanValue}
                placeholder={t("reception.scan.placeholder")}
                onChange={(event) => setScanValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleScan();
                  }
                }}
              />
              <Button type="button" onClick={handleScan}>
                {t("reception.scan.action")}
              </Button>
            </div>
          </div>
          <div className="reception-scanbar__field">
            <label className="inventory-label" htmlFor="reception-search">
              {t("reception.search.label")}
            </label>
            <div className="reception-search">
              <Search />
              <Input
                id="reception-search"
                type="search"
                value={search}
                placeholder={t("reception.search.placeholder")}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Error Alert */}
        {error && (
          <div
            className="alert-bar alert-bar--warn"
            role="alert"
            style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}
          >
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{error}</span>
            <button className="alert-bar__close" onClick={clearError}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Tabs and White Search/Filter Box */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            marginBottom: '1.5rem',
          }}
        >
          {/* Tab Selector */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: '1rem',
              marginBottom: '1rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending')
                setStatusFilter('all')
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'pending' ? '2px solid #1971c2' : '2px solid transparent',
                color: activeTab === 'pending' ? '#1971c2' : '#6b7280',
                padding: '0.5rem 1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Pendientes de recibir
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history')
                setStatusFilter('all')
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'history' ? '2px solid #1971c2' : '2px solid transparent',
                color: activeTab === 'history' ? '#1971c2' : '#6b7280',
                padding: '0.5rem 1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Historial completado
            </button>
          </div>

        <div className="reception-layout">
          <section aria-label={t("reception.orders.ariaLabel")}>
            <div className="s-head">
              <span className="s-head__label">
                {t("reception.orders.title")}
              </span>
              <div className="s-head__rule" />
            </div>
            <div className="table-surface">
              <div className="table-wrap">
                <Table className="data-table reception-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("reception.orders.columns.order")}
                      </TableHead>
                      <TableHead>
                        {t("reception.orders.columns.product")}
                      </TableHead>
                      <TableHead>
                        {t("reception.orders.columns.expected")}
                      </TableHead>
                      <TableHead>
                        {t("reception.orders.columns.status")}
                      </TableHead>
                      <TableHead>
                        <span className="sr-only">
                          {t("reception.orders.columns.action")}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="inventory-empty">
                          {t("common.loading")}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {!loading && filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="inventory-empty">
                          {t("common.empty")}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {filteredOrders.map((order) => {
                      const isReceived = receivedIds.has(order.id);
                      const status = isReceived ? "received" : order.status;
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
                            <p className="prod-name">{order.purchaseOrder}</p>
                            <p className="prod-sub">{order.invoice}</p>
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
                            {order.receivedQuantity}/{order.expectedQuantity}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[status]}>
                              {t(`reception.status.${status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectOrder(order)}
                            >
                              {t("reception.orders.select")}
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

          <aside aria-label={t("reception.form.ariaLabel")}>
            <Card className="reception-form-card rounded-lg">
              <CardHeader>
                <CardTitle className="reception-form-card__title">
                  {selectedOrder?.productName ?? t("reception.form.emptyTitle")}
                </CardTitle>
                <CardDescription>
                  {selectedOrder
                    ? t("reception.form.description", {
                        sku: selectedOrder.sku,
                        invoice: selectedOrder.invoice,
                      })
                    : t("reception.form.emptyDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="reception-form">
                <div className="reception-form__grid">
                  <div className="inventory-field">
                    <label
                      className="inventory-label"
                      htmlFor="received-quantity"
                    >
                      {t("reception.form.receivedQuantity")}
                    </label>
                    <Input
                      id="received-quantity"
                      type="number"
                      min="1"
                      value={form.receivedQuantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          receivedQuantity: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="inventory-field">
                    <label
                      className="inventory-label"
                      htmlFor="reception-location"
                    >
                      {t("reception.form.location")}
                    </label>
                    <Select
                      id="reception-location"
                      value={form.locationId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          locationId: event.target.value,
                        }))
                      }
                    >
                      <option value="">
                        {t("reception.form.locationPlaceholder")}
                      </option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.code} - {location.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="reception-lot">
                      {t("reception.form.lot")}
                    </label>
                    <Input
                      id="reception-lot"
                      value={form.lot}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lot: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="inventory-field">
                    <label
                      className="inventory-label"
                      htmlFor="reception-expiration"
                    >
                      {t("reception.form.expirationDate")}
                    </label>
                    <Input
                      id="reception-expiration"
                      type="date"
                      value={form.expirationDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          expirationDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {selectedOrder?.requiresSerial ? (
                  <div className="inventory-field">
                    <label
                      className="inventory-label"
                      htmlFor="reception-serials"
                    >
                      {t("reception.form.serialNumbers")}
                    </label>
                    <textarea
                      id="reception-serials"
                      className="f-textarea"
                      value={form.serialNumbers}
                      placeholder={t("reception.form.serialPlaceholder")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          serialNumbers: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                <div
                  className={`reception-discrepancy${hasDiscrepancy ? " is-active" : ""}`}
                >
                  <div>
                    <strong>
                      {hasDiscrepancy
                        ? t("reception.form.discrepancyDetected")
                        : t("reception.form.noDiscrepancy")}
                    </strong>
                    <span>
                      {selectedOrder
                        ? t("reception.form.expectedHelp", {
                            count: selectedOrder.expectedQuantity,
                          })
                        : t("reception.form.expectedEmpty")}
                    </span>
                  </div>
                </div>

                {hasDiscrepancy ? (
                  <div className="inventory-field">
                    <label className="inventory-label" htmlFor="reception-note">
                      {t("reception.form.discrepancyNote")}
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

                {/* Acknowledgement de cadena de frío */}
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
                      {t("reception.form.coldChainAck")}
                    </span>
                  </label>
                ) : null}

                {/* Acknowledgement de seguridad eléctrica */}
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
                    <span>{t("reception.form.electricalSafetyAck")}</span>
                  </label>
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
                  {saving
                    ? t("reception.form.saving")
                    : t("reception.form.confirm")}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        <section aria-label={t("reception.movements.ariaLabel")}>
          <div className="s-head">
            <span className="s-head__label">
              {t("reception.movements.title")}
            </span>
            <div className="s-head__rule" />
          </div>
          <div className="reception-movement-grid">
            {localMovements.map((movement) => (
              <Card key={movement.id} className="reception-movement rounded-lg">
                <CardContent>
                  <div>
                    <p className="prod-name">{movement.productName}</p>
                    <p className="prod-sub">
                      <span className="sku">{movement.sku}</span> ·{" "}
                      {movement.locationCode}
                    </p>
                  </div>
                  <strong className="text-mono">
                    {t("reception.movements.units", {
                      count: movement.quantity,
                    })}
                  </strong>
                  <span>{movement.operator}</span>
                  <time>{movement.confirmedAt}</time>
                  {movement.discrepancyNote ? (
                    <p className="reception-movement__note">
                      {movement.discrepancyNote}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className="table-surface"
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <table
              className="data-table"
              style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
            >
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    Orden de Compra
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    Proveedor
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                    Productos
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                    Estado
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    Fecha de Solicitud
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const styleProps = statusColorMap[order.status] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s',
                      }}
                      className="hover-row"
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: '#111827' }}>
                        {order.number}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>
                        {order.supplier_nombre}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#f3f0ff',
                            color: '#7048e8',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                          }}
                        >
                          {order.items.length} {order.items.length === 1 ? 'Producto' : 'Productos'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: styleProps.bg,
                            color: styleProps.color,
                            border: `1px solid ${styleProps.border}`,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                          }}
                        >
                          {statusTranslation[order.status] || order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(order.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className={activeTab === 'pending' ? 'btn btn--primary' : 'btn btn--secondary'}
                          style={{
                            fontSize: '0.825rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontWeight: 500,
                            height: '32px',
                          }}
                          onClick={() => navigate(`/app/reception/${order.id}`)}
                        >
                          {activeTab === 'pending' ? 'Recibir' : 'Ver Detalle'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        .hover-row:hover {
          background-color: #f9fafb;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  );
}

export default ReceptionPage
