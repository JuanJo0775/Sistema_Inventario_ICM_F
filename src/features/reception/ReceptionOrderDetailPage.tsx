import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  X,
  Warehouse,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import AppShell from '../../components/layout/AppShell'
import { ModalPortal } from '../../components/ui/ModalPortal'
import useReceptionStore from '../../store/useReceptionStore'
import useLocationStore from '../../store/useLocationStore'
import useCatalogStore from '../../store/useCatalogStore'
import type { PurchaseOrderItem } from '../../interfaces/purchaseOrders'
import type { CatalogProduct } from '../../interfaces/catalog'
import { extractApiError } from '../../hooks/useApiError'
import { fetchCatalogProductDetail } from '../../services/catalog'

interface LocationSplit {
  id: string
  locationId: string
  quantity: string
}

const newSplit = (): LocationSplit => ({
  id: crypto.randomUUID(),
  locationId: '',
  quantity: '',
})

const itemStatusBadge = (received: number, ordered: number) => {
  if (received >= ordered) {
    return <span className="pill pill--ok">Completo</span>
  }
  if (received > 0) {
    return <span className="pill pill--amber">Parcial</span>
  }
  return <span className="pill pill--muted">Sin recibir</span>
}

export default function ReceptionOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const {
    selectedOrder,
    loading,
    error,
    fetchOrderDetail,
    receiveItem,
    clearError,
  } = useReceptionStore()

  const { locations, fetchLocations } = useLocationStore()
  const { products: catalogProducts, categories, fetchProducts, fetchCategories } = useCatalogStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(null)
  const [quantityReceived, setQuantityReceived] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [lotCode, setLotCode] = useState<string>('')
  const [expirationDate, setExpirationDate] = useState<string>('')
  const [serialNumber, setSerialNumber] = useState<string>('')
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('')
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [splits, setSplits] = useState<LocationSplit[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [productDetail, setProductDetail] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId)
    }
    fetchLocations(true)
    fetchProducts({ page_size: 9999 })
    fetchCategories(true)
  }, [orderId, fetchOrderDetail, fetchLocations, fetchProducts, fetchCategories])

  const filteredLocations = useMemo(() => {
    return locations.filter(
      (loc) => loc.operational_status === 'active' || loc.operational_status === 'restricted',
    )
  }, [locations])

  const productConfig = useMemo(() => {
    if (!selectedItem) return null
    let found: CatalogProduct | undefined = productDetail ?? catalogProducts.find((p) => p.id === selectedItem.product)
    if (!found && selectedItem.product_sku) {
      found = catalogProducts.find((p) => p.sku === selectedItem.product_sku)
    }
    return found ?? null
  }, [selectedItem, catalogProducts, productDetail])

  const requiresExpiration = productConfig?.requires_expiration ?? false
  const lotRequired = requiresExpiration

  const requiresSerial = useMemo(() => {
    if (!productConfig) return false
    const catId = typeof productConfig.category === 'object' && productConfig.category !== null
      ? (productConfig.category as any).id
      : productConfig.category
    
    const matchedCategory = categories.find((c) => String(c.id) === String(catId))
    return matchedCategory ? matchedCategory.requires_serial_number : false
  }, [productConfig, categories])

  const pendingQty = selectedItem
    ? Number(selectedItem.quantity_ordered) - Number(selectedItem.quantity_received)
    : 0

  const enteredQty = Number(quantityReceived) || 0

  const hasDiscrepancy = useMemo(() => {
    if (!quantityReceived) return false
    return enteredQty !== pendingQty
  }, [quantityReceived, enteredQty, pendingQty])

  const handleOpenModal = (item: PurchaseOrderItem) => {
    setSelectedItem(item)
    const pQty = Number(item.quantity_ordered) - Number(item.quantity_received)
    setQuantityReceived(pQty.toString())
    setLocationId('')
    setLotCode('')
    setExpirationDate('')
    setSerialNumber('')
    setDiscrepancyNote('')
    setSplitEnabled(false)
    setSplits([])
    setActionError(null)
    setActionSuccess(null)
    setIsModalOpen(true)
    setProductDetail(null)
    fetchCatalogProductDetail(item.product).then(setProductDetail).catch(() => setProductDetail(null))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const handleAddSplit = () => {
    setSplits((prev) => [...prev, newSplit()])
  }

  const handleRemoveSplit = (id: string) => {
    setSplits((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSplitChange = (id: string, field: 'locationId' | 'quantity', value: string) => {
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const totalSplitQty = splits.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0)

  const handleToggleSplit = (checked: boolean) => {
    setSplitEnabled(checked)
    if (checked && splits.length === 0) {
      setSplits([newSplit(), newSplit()])
    }
    if (!checked) {
      setSplits([])
    }
  }

  const handleSaveReception = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !orderId) return

    setActionError(null)
    setActionSuccess(null)

    if (isNaN(enteredQty) || enteredQty <= 0) {
      setActionError('La cantidad recibida debe ser un número entero mayor que 0.')
      return
    }

    if (enteredQty > pendingQty) {
      setActionError(
        `No puede recibir más de la cantidad esperada restante (${pendingQty} unidades).`,
      )
      return
    }

    if (lotRequired && !lotCode.trim()) {
      setActionError(
        'Este producto requiere fecha de vencimiento, por lo tanto el lote es obligatorio.',
      )
      return
    }

    if (requiresExpiration && !expirationDate) {
      setActionError('Este producto requiere fecha de vencimiento.')
      return
    }

    if (hasDiscrepancy && !discrepancyNote.trim()) {
      setActionError(
        'Se ha detectado una discrepancia. Debe especificar el motivo/nota de discrepancia.',
      )
      return
    }

    if (splitEnabled) {
      if (splits.length < 2) {
        setActionError('Debe agregar al menos 2 ubicaciones para dividir la cantidad.')
        return
      }
      for (const s of splits) {
        if (!s.locationId) {
          setActionError('Todas las divisiones deben tener una ubicación seleccionada.')
          return
        }
        if (!s.quantity || Number(s.quantity) <= 0) {
          setActionError('Todas las divisiones deben tener una cantidad mayor a 0.')
          return
        }
      }
      if (requiresSerial && !serialNumber.trim()) {
        setActionError('Debe ingresar el número de serie del producto (único para todas las ubicaciones).')
        return
      }
      if (totalSplitQty !== enteredQty) {
        setActionError(
          `La suma de las cantidades divididas (${totalSplitQty}) debe ser igual a la cantidad recibida (${enteredQty}).`,
        )
        return
      }
      const locIds = splits.map((s) => s.locationId)
      if (new Set(locIds).size !== locIds.length) {
        setActionError('No puede seleccionar la misma ubicación dos veces en las divisiones.')
        return
      }
    } else {
      if (!locationId) {
        setActionError('Debe seleccionar una ubicación de destino.')
        return
      }
      if (requiresSerial && !serialNumber.trim()) {
        setActionError('El número de serie es obligatorio para este producto.')
        return
      }
    }

    setSaving(true)
    try {
      const baseItem = {
        purchase_order_item_id: selectedItem.id,
        quantity_received: enteredQty,
        lot_code: lotCode.trim() || undefined,
        lot_expiration_date: expirationDate || null,
        serial_number: requiresSerial ? serialNumber.trim() : undefined,
        discrepancy_note: hasDiscrepancy ? discrepancyNote.trim() : undefined,
      }

      if (splitEnabled) {
        await receiveItem({
          po_id: orderId,
          destination_location_id: splits[0].locationId,
          notes: `Recepción de ${selectedItem.product_name} (división de ubicación)`,
          items: [
            {
              purchase_order_item_id: selectedItem.id,
              quantity_received: enteredQty,
              discrepancy_note: hasDiscrepancy ? discrepancyNote.trim() : undefined,
              serial_number: requiresSerial ? serialNumber.trim() : undefined,
              allocations: splits.map((s) => ({
                location_id: s.locationId,
                quantity_received: Number(s.quantity),
                lot_code: lotRequired && lotCode.trim() ? lotCode.trim() : undefined,
                lot_expiration_date: requiresExpiration && expirationDate ? expirationDate : null,
                serial_number: requiresSerial ? serialNumber.trim() : undefined,
              })),
            },
          ],
        })
      } else {
        await receiveItem({
          po_id: orderId,
          destination_location_id: locationId,
          notes: `Recepción de ${selectedItem.product_name}`,
          items: [baseItem],
        })
      }

      const successMsg = `Se ha registrado la recepción de ${enteredQty} unidades de ${selectedItem.product_name}.`
      setActionSuccess(successMsg)
      toast.success(successMsg)
      setIsModalOpen(false)
    } catch (err: any) {
      setActionError(extractApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const totals = useMemo(() => {
    if (!selectedOrder) return { expected: 0, received: 0 }
    let expected = 0
    let received = 0
    selectedOrder.items.forEach((item) => {
      expected += Number(item.quantity_ordered)
      received += Number(item.quantity_received)
    })
    return { expected, received }
  }, [selectedOrder])

  const isReceivable =
    selectedOrder?.status === 'pendiente' || selectedOrder?.status === 'parcialmente_recibida'

  if (loading && !selectedOrder) {
    return (
      <AppShell title="Detalle de Recepción" subtitle="Cargando...">
        <div className="page-body">
          <div className="empty-state">
            <p>Cargando información de la orden...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!selectedOrder) {
    return (
      <AppShell title="Detalle de Recepción" subtitle="Orden no encontrada">
        <div className="page-body">
          <div className="empty-state">
            <AlertTriangle size={40} />
            <p>No se pudo cargar la orden de compra especificada.</p>
            <button
              className="btn btn--secondary"
              onClick={() => navigate('/app/reception')}
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  const statusLabel: Record<string, string> = {
    pendiente: 'Pendiente de recibir',
    parcialmente_recibida: 'Parcialmente Recibida',
    completada: 'Completada',
    cancelada: 'Cancelada',
    borrador: 'Borrador',
  }

  const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
    pendiente: { bg: '#e8f2ff', color: '#1971c2', border: '#a5d8ff' },
    parcialmente_recibida: { bg: '#fff9db', color: '#f59f00', border: '#ffe066' },
    completada: { bg: '#ebfbee', color: '#099268', border: '#b2f2bb' },
    cancelada: { bg: '#fff5f5', color: '#e03131', border: '#ffc9c9' },
    borrador: { bg: '#f1f3f5', color: '#495057', border: '#dee2e6' },
  }

  const ss = statusStyle[selectedOrder.status] || statusStyle.borrador

  return (
    <AppShell
      title={`Recepción: ${selectedOrder.number}`}
      subtitle={`${selectedOrder.supplier_nombre}`}
      actions={
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          onClick={() => navigate('/app/reception')}
        >
          <ArrowLeft size={13} />
          Volver a Recepciones
        </button>
      }
    >
      <div className="page-body fade-slide-up">
        {/* Success / Error alerts */}
        {actionSuccess && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: 18 }}>
            <span>{actionSuccess}</span>
            <span className="alert-bar__spacer" />
            <button className="btn btn--ghost btn--sm" onClick={() => setActionSuccess(null)}>
              <X size={13} />
            </button>
          </div>
        )}

        {(actionError || error) && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 18 }}>
            <AlertTriangle size={14} />
            <span>{actionError || error}</span>
            <span className="alert-bar__spacer" />
            <button className="btn btn--ghost btn--sm" onClick={clearError}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Order header summary */}
        <div
          className="form-surface"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <div>
            <span className="detail-section__title" style={{ marginBottom: 8 }}>
              Proveedor
            </span>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              {selectedOrder.supplier_nombre}
            </p>
            {selectedOrder.supplier_nit && (
              <p
                className="text-mono"
                style={{ fontSize: 11.5, color: 'var(--ink-40)', margin: '4px 0 0' }}
              >
                NIT: {selectedOrder.supplier_nit}
              </p>
            )}
          </div>

          <div>
            <span className="detail-section__title" style={{ marginBottom: 8 }}>
              Detalles de la Orden
            </span>
            <p
              style={{
                fontSize: 12.5,
                color: 'var(--ink-70)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Calendar size={13} style={{ color: 'var(--ink-40)' }} />
              Creada:{' '}
              {new Date(selectedOrder.created_at).toLocaleDateString('es-CO')}
            </p>
            {selectedOrder.expected_delivery && (
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink-70)',
                  margin: '4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Warehouse size={13} style={{ color: 'var(--ink-40)' }} />
                Entrega estimada:{' '}
                {new Date(selectedOrder.expected_delivery).toLocaleDateString('es-CO')}
              </p>
            )}
          </div>

          <div>
            <span className="detail-section__title" style={{ marginBottom: 8 }}>
              Cantidades
            </span>
            <p style={{ fontSize: 12.5, color: 'var(--ink-70)', margin: 0 }}>
              Total esperado:{' '}
              <strong style={{ color: 'var(--ink)' }}>{totals.expected} unidades</strong>
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--ink-70)', margin: '4px 0 0' }}>
              Total recibido:{' '}
              <strong style={{ color: 'var(--ok)' }}>{totals.received} unidades</strong>
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <span
              className="detail-section__title"
              style={{ marginBottom: 6, display: 'block' }}
            >
              Estado de la OC
            </span>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: ss.bg,
                color: ss.color,
                border: `1px solid ${ss.border}`,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 99,
              }}
            >
              {statusLabel[selectedOrder.status] || selectedOrder.status}
            </span>
          </div>
        </div>

        {/* Product items table */}
        <div className="table-surface">
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--ink-06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong style={{ fontSize: 12.5, color: 'var(--ink)' }}>
              Productos Solicitados
            </strong>
            <span className="text-mono" style={{ fontSize: 11, color: 'var(--ink-40)' }}>
              {selectedOrder.items.length}{' '}
              {selectedOrder.items.length === 1 ? 'ítem' : 'ítems'} en total
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'center' }}>Esperado</th>
                  <th style={{ textAlign: 'center' }}>Recibido</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => {
                  const ordered = Number(item.quantity_ordered)
                  const received = Number(item.quantity_received)
                  const isComplete = received >= ordered

                  return (
                    <tr key={item.id}>
                      <td>
                        <p className="prod-name">{item.product_name}</p>
                      </td>
                      <td>
                        <span className="sku">{item.product_sku}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>
                        {ordered}
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'var(--ink-70)',
                        }}
                      >
                        {received}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {itemStatusBadge(received, ordered)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isComplete ? (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: 'var(--ok)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            ✓ Recibido
                          </span>
                        ) : isReceivable ? (
                          <button
                            className="btn btn--primary btn--sm"
                            onClick={() => handleOpenModal(item)}
                          >
                            Recibir
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--ink-40)' }}>
                            No editable
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Recibir Producto */}
      {isModalOpen && selectedItem && (
        <ModalPortal onClose={handleCloseModal}>
          <div
            className="form-surface"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: splitEnabled ? 580 : 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 18,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    margin: 0,
                    fontFamily: 'var(--ff-display)',
                  }}
                >
                  Registrar Recepción
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--ink-40)', margin: '4px 0 0' }}>
                  {selectedItem.product_name} · SKU:{' '}
                  <span className="text-mono">{selectedItem.product_sku}</span>
                </p>
              </div>
              <button
                className="btn btn--ghost btn--sm"
                type="button"
                onClick={handleCloseModal}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveReception}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Error */}
              {actionError && (
                <div className="alert-bar alert-bar--warn" role="alert" style={{ padding: '8px 12px' }}>
                  <AlertTriangle size={14} />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Basic info */}
              <div
                style={{
                  backgroundColor: 'var(--ink-06)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  color: 'var(--ink-70)',
                  display: 'flex',
                  justifyContent: 'space-around',
                }}
              >
                <span>
                  Cantidad esperada:{' '}
                  <strong>{selectedItem.quantity_ordered}</strong>
                </span>
                <span>
                  Cantidad recibida:{' '}
                  <strong style={{ color: 'var(--ok)' }}>
                    {Number(selectedItem.quantity_received) + enteredQty}
                  </strong>
                </span>
              </div>

              {/* Quantity */}
              <div className="f-group">
                <label className="f-label" htmlFor="received-qty-input">
                  Cantidad a recibir <span style={{ color: 'var(--err)' }}>*</span>
                </label>
                <input
                  id="received-qty-input"
                  className="f-input text-mono"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantityReceived}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setQuantityReceived(val)
                  }}
                  required
                />
              </div>

              {/* Discrepancy — inmediatamente debajo de Cantidad a recibir */}
              {hasDiscrepancy && (
                <div
                  className="notice notice--warn"
                  style={{ display: 'grid', gap: 8 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'var(--warn)',
                    }}
                  >
                    <AlertCircle size={14} />
                    Diferencia detectada
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-70)', margin: 0 }}>
                    La cantidad a registrar ({quantityReceived || 0}) difiere de la
                    cantidad esperada en esta entrega. Escribe el motivo:
                  </p>
                  <textarea
                    className="f-input"
                    placeholder="Escribe el motivo del faltante o retraso..."
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    style={{ minHeight: 60, resize: 'none', width: '100%' }}
                    required
                  />
                </div>
              )}

              {/* Lot + Expiration (always global) */}
              {requiresExpiration && (
                <div className="f-row f-row-2">
                  <div className="f-group">
                    <label className="f-label" htmlFor="lot-code-input">
                      Lote {lotRequired && <span style={{ color: 'var(--err)' }}>*</span>}
                    </label>
                    <input
                      id="lot-code-input"
                      className="f-input text-mono"
                      type="text"
                      placeholder="Ej. LOT-2026"
                      value={lotCode}
                      onChange={(e) => setLotCode(e.target.value)}
                      required={lotRequired}
                    />
                    {lotRequired && (
                      <span className="f-note f-note--err">
                        Obligatorio porque el producto requiere fecha de vencimiento.
                      </span>
                    )}
                  </div>

                  <div className="f-group">
                    <label className="f-label" htmlFor="expiration-date-input">
                      Vencimiento <span style={{ color: 'var(--err)' }}>*</span>
                    </label>
                    <input
                      id="expiration-date-input"
                      className="f-input"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}


              {requiresSerial && (
                <div className="f-group">
                  <label className="f-label" htmlFor="serial-number-input">
                    Número de serie <span style={{ color: 'var(--err)' }}>*</span>
                  </label>
                  <input
                    id="serial-number-input"
                    className="f-input text-mono"
                    type="text"
                    placeholder="Ej. SN-001"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    required
                  />
                  {splitEnabled && (
                    <span className="f-note" style={{ color: 'var(--ink-40)', fontSize: 11.5 }}>
                      Este número aplica para el producto completo, independientemente de cuántas ubicaciones se divida.
                    </span>
                  )}
                </div>
              )}

              {/* Split location toggle */}
              <div
                style={{
                  backgroundColor: 'var(--teal-50)',
                  border: '1px solid var(--teal-100)',
                  borderRadius: 8,
                  padding: '12px 14px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'var(--ink-70)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={splitEnabled}
                    onChange={(e) => handleToggleSplit(e.target.checked)}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: 'var(--teal-700)',
                      cursor: 'pointer',
                    }}
                  />
                  ¿Desea dividir esta cantidad recibida en diferentes ubicaciones?
                </label>

                {splitEnabled && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {splits.map((s, idx) => (
                      <div
                        key={s.id}
                        style={{
                          backgroundColor: 'var(--white)',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--ink-12)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span
                            className="text-mono"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--ink-40)',
                              width: 20,
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}.
                          </span>
                          <select
                            value={s.locationId}
                            onChange={(e) =>
                              handleSplitChange(s.id, 'locationId', e.target.value)
                            }
                            className="f-input"
                            style={{
                              flex: 1,
                              minWidth: 0,
                              height: 36,
                              fontSize: 12,
                            }}
                          >
                            <option value="">Ubicación</option>
                            {filteredLocations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.code} - {loc.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="f-input text-mono"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Cant."
                            value={s.quantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              handleSplitChange(s.id, 'quantity', val)
                            }}
                            style={{
                              width: 80,
                              flexShrink: 0,
                              height: 36,
                              fontSize: 12,
                            }}
                          />
                          {requiresSerial && (
                            <span
                              className="text-mono"
                              style={{
                                fontSize: 11,
                                color: 'var(--ink-40)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                paddingLeft: 2,
                              }}
                            >
                              SN ↑
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSplit(s.id)}
                            className="btn btn--ghost btn--sm"
                            style={{
                              color: 'var(--err)',
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                              padding: 0,
                            }}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={handleAddSplit}
                        style={{ color: 'var(--teal-700)' }}
                      >
                        <Plus size={14} />
                        Agregar ubicación
                      </button>
                      <span
                        className="text-mono"
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color:
                            totalSplitQty === enteredQty
                              ? 'var(--ok)'
                              : 'var(--err)',
                        }}
                      >
                        Total: {totalSplitQty} / {enteredQty}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Single location */}
              {!splitEnabled && (
                <div className="f-group">
                  <label className="f-label" htmlFor="location-select">
                    Ubicación destino{' '}
                    <span style={{ color: 'var(--err)' }}>*</span>
                  </label>
                  <select
                    id="location-select"
                    className="f-input"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una ubicación</option>
                    {filteredLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buttons */}
              <div className="form-footer" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Confirmar Recepción'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}
    </AppShell>
  )
}
