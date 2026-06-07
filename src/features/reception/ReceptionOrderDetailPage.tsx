import React, { useEffect, useState, useMemo } from 'react'
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
import AppShell from '../../components/layout/AppShell'
import useReceptionStore from '../../store/useReceptionStore'
import useLocationStore from '../../store/useLocationStore'
import useCatalogStore from '../../store/useCatalogStore'
import type { PurchaseOrderItem } from '../../interfaces/purchaseOrders'

/* ------------------------------------------------------------------ */
/* Helpers for location splits                                        */
/* ------------------------------------------------------------------ */
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

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
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
  const {
    products: catalogProducts,
    fetchProducts,
  } = useCatalogStore()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(null)

  // Form States
  const [quantityReceived, setQuantityReceived] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [lotCode, setLotCode] = useState<string>('')
  const [expirationDate, setExpirationDate] = useState<string>('')
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('')

  // Split location states
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [splits, setSplits] = useState<LocationSplit[]>([])

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

  // Find product configuration (requires_expiration, etc.)
  const productConfig = useMemo(() => {
    if (!selectedItem) return null
    return catalogProducts.find((p) => p.id === selectedItem.product)
  }, [selectedItem, catalogProducts])

  // Derived flags
  const requiresExpiration = productConfig?.requires_expiration ?? false
  // Lot is mandatory when product has expiration date; optional otherwise
  const lotRequired = requiresExpiration

  // Reset form when opening modal
  const handleOpenModal = (item: PurchaseOrderItem) => {
    setSelectedItem(item)
    const pendingQty = Number(item.quantity_ordered) - Number(item.quantity_received)
    setQuantityReceived(pendingQty.toString())
    setLocationId('')
    setLotCode('')
    setExpirationDate('')
    setDiscrepancyNote('')
    setSplitEnabled(false)
    setSplits([])
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

  const enteredQty = Number(quantityReceived) || 0

  const hasDiscrepancy = useMemo(() => {
    if (!quantityReceived) return false
    return enteredQty !== pendingQty
  }, [quantityReceived, enteredQty, pendingQty])

  // Split location handlers
  const handleAddSplit = () => {
    setSplits((prev) => [...prev, newSplit()])
  }
  const handleRemoveSplit = (id: string) => {
    setSplits((prev) => prev.filter((s) => s.id !== id))
  }
  const handleSplitChange = (id: string, field: 'locationId' | 'quantity', value: string) => {
    setSplits((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const totalSplitQty = splits.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0)

  // When enabling split, add an initial entry
  const handleToggleSplit = (checked: boolean) => {
    setSplitEnabled(checked)
    if (checked && splits.length === 0) {
      setSplits([newSplit(), newSplit()])
    }
    if (!checked) {
      setSplits([])
    }
  }

  // Save the reception
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
      setActionError(`No puede recibir más de la cantidad esperada restante (${pendingQty} unidades).`)
      return
    }

    // Lot validation
    if (lotRequired && !lotCode.trim()) {
      setActionError('Este producto requiere fecha de vencimiento, por lo tanto el lote es obligatorio.')
      return
    }

    // Expiration date validation
    if (requiresExpiration && !expirationDate) {
      setActionError('Este producto requiere fecha de vencimiento.')
      return
    }



    // Discrepancy validation
    if (hasDiscrepancy && !discrepancyNote.trim()) {
      setActionError('Se ha detectado una discrepancia. Debe especificar el motivo/nota de discrepancia.')
      return
    }

    // Split location validation
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
      if (totalSplitQty !== enteredQty) {
        setActionError(
          `La suma de las cantidades divididas (${totalSplitQty}) debe ser igual a la cantidad recibida (${enteredQty}).`
        )
        return
      }
      // Check for duplicate locations
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
    }

    setSaving(true)
    try {
      if (splitEnabled) {
        // Create one reception per location split
        for (const s of splits) {
          await receiveItem({
            po_id: orderId,
            destination_location_id: s.locationId,
            notes: `Recepción de ${selectedItem.product_name} (división de ubicación)`,
            items: [
              {
                purchase_order_item_id: selectedItem.id,
                quantity_received: Number(s.quantity),
                lot_code: lotCode.trim() || undefined,
                lot_expiration_date: expirationDate || null,
                discrepancy_note: hasDiscrepancy ? discrepancyNote.trim() : undefined,
              },
            ],
          })
        }
      } else {
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
      }

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
                let itemStatusLabel = 'Sin recibir'
                let badgeStyle = { bg: '#f1f3f5', color: '#495057', border: '#dee2e6' }

                if (received > 0 && received < ordered) {
                  itemStatusLabel = 'Parcial'
                  badgeStyle = { bg: '#fff9db', color: '#f59f00', border: '#ffe066' }
                } else if (received >= ordered) {
                  itemStatusLabel = 'Completo'
                  badgeStyle = { bg: '#ebfbee', color: '#099268', border: '#b2f2bb' }
                }

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

      {/* ========================================================== */}
      {/* Modal: Recibir Producto                                      */}
      {/* ========================================================== */}
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
              maxWidth: splitEnabled ? '580px' : '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
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

              {/* Basic Info panel — only Esperado and Recibido */}
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
                <span>Cantidad esperada: <strong>{selectedItem.quantity_ordered}</strong></span>
                <span>Cantidad recibida: <strong style={{ color: '#099268' }}>{Number(selectedItem.quantity_received) + (Number(quantityReceived) || 0)}</strong></span>
              </div>

              {/* Quantity input */}
              <div>
                <label
                  htmlFor="received-qty-input"
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}
                >
                  Cantidad a recibir <span style={{ color: '#e03131' }}>*</span>
                </label>
                <input
                  id="received-qty-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantityReceived}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setQuantityReceived(val)
                  }}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* ---------------------------------------------------------- */}
              {/* Conditional fields based on product/category config         */}
              {/* ---------------------------------------------------------- */}



              {/* Lot Code & Expiration Date */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="lot-code-input"
                    style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}
                  >
                    Lote {lotRequired && <span style={{ color: '#e03131' }}>*</span>}
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
                    required={lotRequired}
                  />
                  {lotRequired && (
                    <p style={{ fontSize: '0.75rem', color: '#e03131', margin: '0.25rem 0 0 0' }}>
                      Obligatorio porque el producto requiere fecha de vencimiento.
                    </p>
                  )}
                </div>

                {/* Expiration Date — only if product.requires_expiration */}
                {requiresExpiration && (
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

              {/* ---------------------------------------------------------- */}
              {/* Split location toggle                                       */}
              {/* ---------------------------------------------------------- */}
              <div
                style={{
                  backgroundColor: '#f0f4ff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={splitEnabled}
                    onChange={(e) => handleToggleSplit(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
                  />
                  ¿Desea dividir esta cantidad recibida en diferentes ubicaciones?
                </label>

                {splitEnabled && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', boxSizing: 'border-box' }}>
                    {splits.map((s, idx) => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          backgroundColor: '#fff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#6b7280',
                            width: '20px',
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}.
                        </span>
                        <select
                          value={s.locationId}
                          onChange={(e) => handleSplitChange(s.id, 'locationId', e.target.value)}
                          style={{
                            flex: '1 1 auto',
                            minWidth: 0,
                            height: '38px',
                            padding: '0 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.85rem',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
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
                            width: '80px',
                            flexShrink: 0,
                            height: '38px',
                            padding: '0 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSplit(s.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#e03131',
                            padding: '0.25rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            flexShrink: 0,
                          }}
                          title="Eliminar"
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={handleAddSplit}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'none',
                          border: 'none',
                          color: '#4f46e5',
                          fontWeight: 600,
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <Plus style={{ width: '15px', height: '15px' }} />
                        Agregar ubicación
                      </button>

                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: totalSplitQty === enteredQty ? '#099268' : '#e03131',
                        }}
                      >
                        Total: {totalSplitQty} / {enteredQty}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Single location — only when NOT splitting */}
              {!splitEnabled && (
                <div>
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
              )}

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
                    La cantidad a registrar ({quantityReceived || 0}) difiere de la cantidad esperada en esta entrega. Escribe el motivo:
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
