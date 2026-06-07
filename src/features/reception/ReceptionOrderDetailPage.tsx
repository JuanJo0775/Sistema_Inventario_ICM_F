import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  X,
  Warehouse,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useReceptionStore from '../../store/useReceptionStore'
import useLocationStore from '../../store/useLocationStore'
import useCatalogStore from '../../store/useCatalogStore'
import type { PurchaseOrderItem } from '../../interfaces/purchaseOrders'

export const ReceptionOrderDetailPage: React.FC = () => {
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
  const { products: catalogProducts, fetchProducts } = useCatalogStore()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(null)

  // Form States
  const [quantityReceived, setQuantityReceived] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [lotCode, setLotCode] = useState<string>('')
  const [expirationDate, setExpirationDate] = useState<string>('')
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('')

  // Local feedback/saving state
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Load order and data on mount
  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId)
    }
    fetchLocations(true)
    fetchProducts()
  }, [orderId, fetchOrderDetail, fetchLocations, fetchProducts])

  // Get active and restricted locations for the dropdown
  const filteredLocations = useMemo(() => {
    return locations.filter(
      (loc) => loc.operational_status === 'active' || loc.operational_status === 'restricted'
    )
  }, [locations])

  // Find expiration/cold chain configuration of the selected item
  const productConfig = useMemo(() => {
    if (!selectedItem) return null
    return catalogProducts.find((p) => p.id === selectedItem.product)
  }, [selectedItem, catalogProducts])

  // Reset form when opening modal
  const handleOpenModal = (item: PurchaseOrderItem) => {
    setSelectedItem(item)
    // Default to the full pending quantity
    const pendingQty = Number(item.quantity_ordered) - Number(item.quantity_received)
    setQuantityReceived(pendingQty.toString())
    setLocationId('')
    setLotCode('')
    setExpirationDate('')
    setDiscrepancyNote('')
    setActionError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  // Check if discrepancy note is required
  const pendingQty = selectedItem
    ? Number(selectedItem.quantity_ordered) - Number(selectedItem.quantity_received)
    : 0

  const hasDiscrepancy = useMemo(() => {
    if (!quantityReceived) return false
    const entered = Number(quantityReceived)
    return entered !== pendingQty
  }, [quantityReceived, pendingQty])

  // Save the reception
  const handleSaveReception = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !orderId) return

    setActionError(null)
    setActionSuccess(null)

    const enteredQty = Number(quantityReceived)
    if (isNaN(enteredQty) || enteredQty <= 0) {
      setActionError('La cantidad recibida debe ser un número entero mayor que 0.')
      return
    }

    if (enteredQty > pendingQty) {
      setActionError(`No puede recibir más de la cantidad pendiente (${pendingQty} unidades).`)
      return
    }

    if (!locationId) {
      setActionError('Debe seleccionar una ubicación de destino.')
      return
    }

    if (productConfig?.requires_expiration && !expirationDate) {
      setActionError('Este producto requiere fecha de vencimiento.')
      return
    }

    if (hasDiscrepancy && !discrepancyNote.trim()) {
      setActionError('Se ha detectado una discrepancia. Debe especificar el motivo/nota de discrepancia.')
      return
    }

    setSaving(true)
    try {
      await receiveItem({
        po_id: orderId,
        destination_location_id: locationId,
        notes: `Recepción de ${selectedItem.product_name}`,
        items: [
          {
            purchase_order_item_id: selectedItem.id,
            quantity_received: enteredQty,
            lot_code: lotCode.trim() || undefined,
            lot_expiration_date: expirationDate || null,
            discrepancy_note: hasDiscrepancy ? discrepancyNote.trim() : undefined,
          },
        ],
      })

      setActionSuccess(`Se ha registrado la recepción de ${enteredQty} unidades de ${selectedItem.product_name}.`)
      setIsModalOpen(false)
    } catch (err: any) {
      setActionError(err.message || 'Error al procesar la recepción.')
    } finally {
      setSaving(false)
    }
  }

  // Total sums for the header
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

  if (loading && !selectedOrder) {
    return (
      <AppShell title="Detalle de Recepción" subtitle="Cargando...">
        <div className="empty-state" style={{ padding: '4rem' }}>
          <p>Cargando información de la orden...</p>
        </div>
      </AppShell>
    )
  }

  if (!selectedOrder) {
    return (
      <AppShell title="Detalle de Recepción" subtitle="Orden no encontrada">
        <div
          className="empty-state"
          style={{
            padding: '4rem',
            textAlign: 'center',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
          }}
        >
          <AlertTriangle style={{ width: '48px', height: '48px', color: '#e03131', marginBottom: '1rem' }} />
          <p>No se pudo cargar la orden de compra especificada.</p>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/app/reception')}
          >
            Volver a la lista
          </button>
        </div>
      </AppShell>
    )
  }

  // Determine order is editable (receivable)
  const isReceivable = selectedOrder.status === 'pendiente' || selectedOrder.status === 'parcialmente_recibida'

  return (
    <AppShell
      title={`Recepción: ${selectedOrder.number}`}
      subtitle={`Gestión de ingreso de mercancía · ${selectedOrder.supplier_nombre}`}
      actions={
        <button
          className="btn btn--secondary"
          type="button"
          onClick={() => navigate('/app/reception')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', height: '42px' }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Volver a Recepciones
        </button>
      }
    >
      <div className="catalog-page fade-slide-up" style={{ paddingBottom: '3rem' }}>
        {/* Info alerts */}
        {actionSuccess && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{actionSuccess}</span>
            <button className="alert-bar__close" onClick={() => setActionSuccess(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {(actionError || error) && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{actionError || error}</span>
            <button className="alert-bar__close" onClick={clearError}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Order Header Summary Panel */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
              Proveedor
            </h3>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0.25rem 0 0 0' }}>
              {selectedOrder.supplier_nombre}
            </p>
            {selectedOrder.supplier_nit && (
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.15rem 0 0 0' }}>
                NIT: {selectedOrder.supplier_nit}
              </p>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
              Detalles de la Orden
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar style={{ width: '15px', height: '15px', color: '#9ca3af' }} />
              Creada: {new Date(selectedOrder.created_at).toLocaleDateString('es-CO')}
            </p>
            {selectedOrder.expected_delivery && (
              <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0.15rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Warehouse style={{ width: '15px', height: '15px', color: '#9ca3af' }} />
                Entrega estimada: {new Date(selectedOrder.expected_delivery).toLocaleDateString('es-CO')}
              </p>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
              Resumen de Cantidades
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0.25rem 0 0 0' }}>
              Total esperado: <strong style={{ color: '#111827' }}>{totals.expected} unidades</strong>
            </p>
            <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0.15rem 0 0 0' }}>
              Total recibido: <strong style={{ color: '#099268' }}>{totals.received} unidades</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#9ca3af',
                marginBottom: '0.25rem',
              }}
            >
              Estado de la OC
            </span>
            <span
              style={{
                display: 'inline-block',
                backgroundColor:
                  selectedOrder.status === 'completada'
                    ? '#ebfbee'
                    : selectedOrder.status === 'parcialmente_recibida'
                    ? '#fff9db'
                    : '#e8f2ff',
                color:
                  selectedOrder.status === 'completada'
                    ? '#099268'
                    : selectedOrder.status === 'parcialmente_recibida'
                    ? '#f59f00'
                    : '#1971c2',
                border: `1px solid ${
                  selectedOrder.status === 'completada'
                    ? '#b2f2bb'
                    : selectedOrder.status === 'parcialmente_recibida'
                    ? '#ffe066'
                    : '#a5d8ff'
                }`,
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '12px',
              }}
            >
              {selectedOrder.status === 'pendiente'
                ? 'Pendiente de recibir'
                : selectedOrder.status === 'parcialmente_recibida'
                ? 'Parcialmente Recibida'
                : selectedOrder.status === 'completada'
                ? 'Completada'
                : selectedOrder.status}
            </span>
          </div>
        </div>

        {/* Product items table */}
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
          <div
            style={{
              padding: '1.25rem',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
              Productos Solicitados
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {selectedOrder.items.length} {selectedOrder.items.length === 1 ? 'ítem' : 'ítems'} en total
            </span>
          </div>

          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Producto
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  SKU
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                  Esperado
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                  Recibido
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                  Estado
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item) => {
                const ordered = Number(item.quantity_ordered)
                const received = Number(item.quantity_received)
                const isComplete = received >= ordered

                // Compute product status badge
                let itemStatusLabel = 'Pendiente'
                let badgeStyle = { bg: '#f1f3f5', color: '#495057', border: '#dee2e6' }

                if (received > 0 && received < ordered) {
                  itemStatusLabel = 'Parcial'
                  badgeStyle = { bg: '#fff9db', color: '#f59f00', border: '#ffe066' }
                } else if (received >= ordered) {
                  itemStatusLabel = 'Completo'
                  badgeStyle = { bg: '#ebfbee', color: '#099268', border: '#b2f2bb' }
                }

                // Check product configuration for cold chain or serial requirements
                const matchProd = catalogProducts.find((p) => p.id === item.product)

                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <p style={{ fontWeight: 500, color: '#111827', margin: 0 }}>
                        {item.product_name}
                      </p>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {item.product_sku}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 600, color: '#111827' }}>
                      {ordered}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 600, color: '#4b5563' }}>
                      {received}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '12px',
                        }}
                      >
                        {itemStatusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                      {isComplete ? (
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: '#099268',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          ✓ Recibido
                        </span>
                      ) : isReceivable ? (
                        <button
                          type="button"
                          className="btn btn--primary"
                          style={{
                            fontSize: '0.825rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontWeight: 500,
                            height: '32px',
                          }}
                          onClick={() => handleOpenModal(item)}
                        >
                          Recibir
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>No editable</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Recibir Producto */}
      {isModalOpen && selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Registrar Recepción
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                  {selectedItem.product_name} · SKU: {selectedItem.product_sku}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0.25rem',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveReception} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Form feedback error */}
              {actionError && (
                <div
                  className="alert-bar alert-bar--warn"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <AlertTriangle style={{ marginRight: '0.5rem', width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Basic Info panel inside form */}
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  display: 'flex',
                  justifyContent: 'space-around',
                }}
              >
                <span>Total esperado: <strong>{selectedItem.quantity_ordered}</strong></span>
                <span>Total recibido: <strong style={{ color: '#099268' }}>{selectedItem.quantity_received}</strong></span>
              </div>

              {/* Quantity to receive input & Location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 1. PRODUCT & QUANTITY */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="received-qty-input"
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}
                    >
                      Cantidad a recibir <span style={{ color: '#e03131' }}>*</span>
                    </label>
                    <input
                      id="received-qty-input"
                      type="number"
                      min="1"
                      max={pendingQty}
                      value={quantityReceived}
                      onChange={(e) => setQuantityReceived(e.target.value)}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        outline: 'none',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>

                  <div style={{ flex: 1.5 }}>
                    <label
                      htmlFor="location-select"
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}
                    >
                      Ubicación destino <span style={{ color: '#e03131' }}>*</span>
                    </label>
                    <select
                      id="location-select"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        outline: 'none',
                        fontSize: '0.9rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}
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
                </div>

                {/* 2. LOT CODE & EXPIRATION DATE */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="lot-code-input"
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}
                    >
                      Lote
                    </label>
                    <input
                      id="lot-code-input"
                      type="text"
                      placeholder="Ej. LOT-2026"
                      value={lotCode}
                      onChange={(e) => setLotCode(e.target.value)}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        outline: 'none',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>

                  {productConfig?.requires_expiration && (
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor="expiration-date-input"
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#374151',
                          display: 'block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Vencimiento <span style={{ color: '#e03131' }}>*</span>
                      </label>
                      <input
                        id="expiration-date-input"
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          outline: 'none',
                          fontSize: '0.9rem',
                        }}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Discrepancy warning and field */}
              {hasDiscrepancy && (
                <div
                  style={{
                    backgroundColor: '#fff9db',
                    border: '1px solid #ffe066',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59f00', fontWeight: 700, fontSize: '0.85rem' }}>
                    <AlertCircle style={{ width: '16px', height: '16px' }} />
                    Diferencia detectada
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#665400', margin: 0 }}>
                    La cantidad a registrar ({quantityReceived || 0}) es inferior a la cantidad esperada en esta entrega. Se registrará como recepción parcial. Escribe el motivo:
                  </p>
                  <textarea
                    placeholder="Escribe el motivo del faltante o retraso..."
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      height: '60px',
                      borderRadius: '6px',
                      border: '1px solid #ffe066',
                      outline: 'none',
                      fontSize: '0.85rem',
                      resize: 'none',
                    }}
                    required
                  />
                </div>
              )}

              {/* Form buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn--secondary"
                  style={{ height: '42px', borderRadius: '8px', padding: '0 1.25rem' }}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ height: '42px', borderRadius: '8px', padding: '0 1.25rem' }}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Confirmar Recepción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default ReceptionOrderDetailPage
