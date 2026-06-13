import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Check,
  ChevronDown,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import usePurchaseOrderStore from '../../store/usePurchaseOrderStore'
import useSupplierStore from '../../store/useSupplierStore'
import useCatalogStore from '../../store/useCatalogStore'
import type { PurchaseOrder } from '../../interfaces/purchaseOrders'

// ============================================================================
// CUSTOM COMBOBOX COMPONENT
// ============================================================================
interface ComboboxOption {
  value: string
  label: string
  subLabel?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  required?: boolean
  error?: boolean
}

const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label)
    } else {
      setSearchTerm('')
    }
  }, [selectedOption, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (selectedOption) {
          setSearchTerm(selectedOption.label)
        } else {
          setSearchTerm('')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedOption])

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.subLabel && o.subLabel.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleInputFocus = () => {
    if (disabled) return
    setIsOpen(true)
    setSearchTerm('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  const handleSelectOption = (opt: ComboboxOption) => {
    onChange(opt.value)
    setSearchTerm(opt.label)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
          borderRadius: '8px',
          backgroundColor: disabled ? '#f3f4f6' : '#fff',
          cursor: disabled ? 'not-allowed' : 'text',
          position: 'relative',
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !value}
          style={{
            width: '100%',
            padding: '0.5rem 2.25rem 0.5rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            outline: 'none',
            backgroundColor: 'transparent',
            color: disabled ? '#9ca3af' : '#111827',
          }}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: '0.5rem',
            background: 'none',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: '#6b7280',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown style={{ width: '16px', height: '16px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {isOpen && !disabled && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            padding: '4px',
            margin: 0,
            listStyle: 'none',
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value
              return (
                <li
                  key={opt.value}
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                    color: isSelected ? '#111827' : '#374151',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{opt.label}</span>
                    {opt.subLabel && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check style={{ width: '16px', height: '16px', color: '#4f46e5' }} />}
                </li>
              )
            })
          ) : (
            <li style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>
              Sin coincidencias
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export const PurchaseOrdersPage: React.FC = () => {
  const {
    orders,
    loading,
    error: storeError,
    fetchOrders,
    createOrder,
    updateOrder,
    confirmOrder,
    cancelOrder,
    clearError,
  } = usePurchaseOrderStore()

  const { suppliers, fetchSuppliers } = useSupplierStore()
  const { products, fetchProducts } = useCatalogStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [formSupplierId, setFormSupplierId] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formItems, setFormItems] = useState<
    Array<{
      productId: string
      qtyOrdered: number
      unitCost: number
      notes: string
    }>
  >([])

  const [addProductId, setAddProductId] = useState('')
  const [addQty, setAddQty] = useState('1')
  const [addCost, setAddCost] = useState(0)

  const [confirmEmitId, setConfirmEmitId] = useState<string | null>(null)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchSuppliers()
    fetchProducts()
  }, [fetchOrders, fetchSuppliers, fetchProducts])

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      o.number.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      o.supplier_nombre.toLowerCase().includes(searchTerm.trim().toLowerCase())

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const supplierOptions: ComboboxOption[] = suppliers
    .filter((s) => s.is_active)
    .map((s) => ({
      value: s.id,
      label: s.nombre_comercial,
      subLabel: s.nit ? `NIT: ${s.nit}` : undefined,
    }))

  const productOptions: ComboboxOption[] = products
    .filter((p) => p.is_active)
    .map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: `SKU: ${p.sku}`,
    }))

  const handleOpenCreate = () => {
    setEditingOrder(null)
    setFormSupplierId('')
    setFormNotes('')
    setFormItems([])
    setAddProductId('')
    setAddQty('1')
    setAddCost(0)
    setValidationError(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setFormSupplierId(order.supplier)
    setFormNotes(order.notes)
    setFormItems(
      order.items.map((item) => ({
        productId: item.product,
        qtyOrdered: item.quantity_ordered,
        unitCost: typeof item.unit_cost === 'string' ? parseFloat(item.unit_cost) : item.unit_cost,
        notes: item.notes || '',
      })),
    )
    setAddProductId('')
    setAddQty('1')
    setAddCost(0)
    setValidationError(null)
    setIsFormOpen(true)
  }

  const handleAddProduct = () => {
    setValidationError(null)
    if (!addProductId) {
      setValidationError('Por favor seleccione un producto.')
      return
    }
    const qtyParsed = parseInt(addQty) || 0
    if (qtyParsed <= 0) {
      setValidationError('La cantidad debe ser mayor a 0.')
      return
    }

    const duplicate = formItems.some((item) => item.productId === addProductId)
    if (duplicate) {
      setValidationError('Este producto ya ha sido agregado a la orden.')
      return
    }

    setFormItems([
      ...formItems,
      {
        productId: addProductId,
        qtyOrdered: qtyParsed,
        unitCost: addCost || 0,
        notes: '',
      },
    ])

    setAddProductId('')
    setAddQty('1')
    setAddCost(0)
  }

  const handleRemoveProduct = (index: number) => {
    const next = [...formItems]
    next.splice(index, 1)
    setFormItems(next)
  }

  const handleSaveDraft = async () => {
    setValidationError(null)
    if (!formSupplierId) {
      setValidationError('El proveedor es obligatorio.')
      return
    }

    if ((!editingOrder || editingOrder.status === 'borrador') && formItems.length === 0) {
      setValidationError('Debe agregar al menos un producto a la orden.')
      return
    }

    try {
      if (editingOrder) {
        const payload: any = {
          notes: formNotes.trim(),
        }
        if (editingOrder.status === 'borrador') {
          payload.items = formItems.map((item) => ({
            product_id: item.productId,
            quantity_ordered: item.qtyOrdered,
            unit_cost: item.unitCost,
            notes: item.notes,
          }))
        }
        await updateOrder(editingOrder.id, payload)
        setSuccessMsg(
          editingOrder.status === 'borrador'
            ? 'Orden de compra borrador actualizada correctamente.'
            : 'Observaciones de la orden actualizadas correctamente.'
        )
      } else {
        const payload = {
          supplier_id: formSupplierId,
          notes: formNotes.trim(),
          items: formItems.map((item) => ({
            product_id: item.productId,
            quantity_ordered: item.qtyOrdered,
            unit_cost: item.unitCost,
            notes: item.notes,
          })),
        }
        await createOrder(payload)
        setSuccessMsg('Orden de compra guardada en borrador.')
      }
      setIsFormOpen(false)
    } catch (e) {}
  }

  const handleEmitFromForm = async () => {
    setValidationError(null)
    if (!formSupplierId) {
      setValidationError('El proveedor es obligatorio.')
      return
    }

    if ((!editingOrder || editingOrder.status === 'borrador') && formItems.length === 0) {
      setValidationError('Debe agregar al menos un producto a la orden.')
      return
    }

    try {
      if (editingOrder) {
        const payload: any = {
          notes: formNotes.trim(),
        }
        if (editingOrder.status === 'borrador') {
          payload.items = formItems.map((item) => ({
            product_id: item.productId,
            quantity_ordered: item.qtyOrdered,
            unit_cost: item.unitCost,
            notes: item.notes,
          }))
        }
        await updateOrder(editingOrder.id, payload)
        await confirmOrder(editingOrder.id)
        setSuccessMsg(`Orden de compra ${editingOrder.number} emitida correctamente.`)
      } else {
        const payload = {
          supplier_id: formSupplierId,
          notes: formNotes.trim(),
          items: formItems.map((item) => ({
            product_id: item.productId,
            quantity_ordered: item.qtyOrdered,
            unit_cost: item.unitCost,
            notes: item.notes,
          })),
        }
        const newOrder = await createOrder(payload)
        await confirmOrder(newOrder.id)
        setSuccessMsg(`Orden de compra ${newOrder.number} emitida correctamente.`)
      }
      setIsFormOpen(false)
    } catch (e) {}
  }

  const handleEmitConfirmAction = async () => {
    if (!confirmEmitId) return
    try {
      const order = orders.find((o) => o.id === confirmEmitId)
      await confirmOrder(confirmEmitId)
      setSuccessMsg(`Orden de compra ${order?.number || ''} emitida correctamente.`)
      setConfirmEmitId(null)
      if (selectedOrder && selectedOrder.id === confirmEmitId) {
        const refreshed = orders.find((o) => o.id === confirmEmitId)
        if (refreshed) setSelectedOrder(refreshed)
      }
    } catch (e) {}
  }

  const handleCancelConfirmAction = async () => {
    if (!cancelOrderId) return
    const reasonTrimmed = cancelReason.trim()
    if (!reasonTrimmed) {
      setValidationError('El motivo de cancelación es obligatorio.')
      return
    }

    try {
      const order = orders.find((o) => o.id === cancelOrderId)
      await cancelOrder(cancelOrderId, reasonTrimmed)
      setSuccessMsg(`Orden de compra ${order?.number || ''} cancelada.`)
      setCancelOrderId(null)
      setCancelReason('')
      setValidationError(null)
      if (selectedOrder && selectedOrder.id === cancelOrderId) {
        const refreshed = orders.find((o) => o.id === cancelOrderId)
        if (refreshed) setSelectedOrder(refreshed)
      }
    } catch (e) {}
  }

  const handleOpenDetail = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'borrador':
        return (
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              border: '1px solid #e5e7eb',
              textTransform: 'uppercase',
            }}
          >
            Borrador
          </span>
        )
      case 'pendiente':
        return (
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#fffbeb',
              color: '#d97706',
              border: '1px solid #fef3c7',
              textTransform: 'uppercase',
            }}
          >
            Pendiente
          </span>
        )
      case 'parcialmente_recibida':
      case 'parcial':
        return (
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #dbeafe',
              textTransform: 'uppercase',
            }}
          >
            Parcial
          </span>
        )
      case 'completada':
        return (
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #d1fae5',
              textTransform: 'uppercase',
            }}
          >
            Completada
          </span>
        )
      case 'cancelada':
        return (
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#fdf2f2',
              color: '#dc2626',
              border: '1px solid #fde8e8',
              textTransform: 'uppercase',
            }}
          >
            Cancelada
          </span>
        )
      default:
        return (
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              textTransform: 'uppercase',
            }}
          >
            {status}
          </span>
        )
    }
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (e) {
      return isoString
    }
  }

  const totalCount = orders.length
  const pendingCount = orders.filter((o) => o.status === 'pendiente').length
  const partialCount = orders.filter((o) => o.status === 'parcialmente_recibida').length
  const completedCount = orders.filter((o) => o.status === 'completada').length

  return (
    <AppShell
      title="Órdenes de Compra"
      subtitle="Planificación y abastecimiento de insumos"
      actions={
        <button className="btn btn--primary btn--sm" type="button" onClick={handleOpenCreate}>
          + Nueva Orden
        </button>
      }
    >
      <div className="catalog-page fade-slide-up">

        {/* Metric strip */}
        <div className="metric-strip mb-4" style={{ maxWidth: 700 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">Órdenes Totales</p>
            <p className="metric-cell__val">{totalCount}</p>
            <p className="metric-cell__sub">en el sistema</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Pendientes</p>
            <p className="metric-cell__val">{pendingCount}</p>
            <p className="metric-cell__sub">órdenes pendientes</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Parciales</p>
            <p className="metric-cell__val">{partialCount}</p>
            <p className="metric-cell__sub">órdenes parciales</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Completadas</p>
            <p className="metric-cell__val" style={{ color: completedCount > 0 ? 'var(--ok)' : undefined }}>
              {completedCount}
            </p>
            <p className="metric-cell__sub">órdenes completadas</p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{successMsg}</span>
            <button className="alert-bar__close" onClick={() => setSuccessMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {storeError && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{storeError}</span>
            <button className="alert-bar__close" onClick={clearError}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Filter toolbar — no white background box */}
        <div className="flex gap-10 mb-4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center' }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  stroke: 'var(--teal-600)',
                  strokeWidth: 1.8,
                }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="f-input"
                style={{ paddingLeft: 34 }}
                placeholder="Número de orden o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar orden"
              />
            </div>
            <select
              className="f-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: 200 }}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todas</option>
              <option value="borrador">Borrador</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcialmente_recibida">Parcialmente recibida</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <button type="submit" className="btn btn--primary">
              Buscar
            </button>
          </form>
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all') }}
              className="btn btn--ghost btn--sm"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Table */}
        {loading && orders.length === 0 ? (
          <div className="empty-state">
            <p>Cargando órdenes de compra...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron órdenes de compra.</p>
          </div>
        ) : (
          <div className="table-surface">
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Orden</th>
                    <th style={{ width: '22%' }}>Proveedor</th>
                    <th style={{ width: '16%' }}>Fecha</th>
                    <th style={{ width: '14%' }}>Estado</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Productos</th>
                    <th style={{ width: '18%' }}><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ color: 'var(--teal-600)', fontWeight: 600, fontFamily: 'var(--ff-mono)', fontSize: '0.8rem' }}>
                        {order.number}
                      </td>
                      <td style={{ color: 'var(--ink)', fontWeight: 500 }}>
                        {order.supplier_nombre}
                      </td>
                      <td style={{ color: 'var(--ink-40)', fontSize: '0.825rem' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td>
                        {renderStatusPill(order.status)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '0.8rem', color: 'var(--ink-70)' }}>
                          {order.items?.length || 0}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-4" style={{ whiteSpace: 'nowrap', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn--ghost btn--sm"
                            title="Ver detalle"
                            onClick={() => handleOpenDetail(order)}
                            style={{ padding: '0.375rem' }}
                          >
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          {order.status === 'borrador' && (
                            <>
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => handleOpenEdit(order)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn--sm"
                                style={{ background: 'rgba(45, 139, 111, 0.08)', color: 'var(--ok)', border: '1px solid rgba(45, 139, 111, 0.2)' }}
                                onClick={() => setConfirmEmitId(order.id)}
                              >
                                Emitir
                              </button>
                            </>
                          )}
                          {(order.status === 'borrador' || order.status === 'pendiente') && (
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => {
                                setCancelOrderId(order.id)
                                setCancelReason('')
                              }}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================================================
            FORM MODAL (CREATE/EDIT)
            ==================================================================== */}
        {isFormOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,30,32,.45)',
              padding: 24,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                maxWidth: 680,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--ink-06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--white)',
                  zIndex: 1,
                }}
              >
                <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0 }}>
                  {editingOrder ? `Editar Orden — ${editingOrder.number}` : 'Nueva Orden de Compra'}
                </h2>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsFormOpen(false)}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {validationError && (
                  <div className="alert-bar alert-bar--err" role="alert" style={{ margin: 0 }}>
                    <AlertTriangle style={{ width: 14, height: 14 }} />
                    {validationError}
                  </div>
                )}

                {/* Supplier Field */}
                <div className="f-group">
                  <label className="f-label">
                    Proveedor <span style={{ color: 'var(--err)' }}>*</span>
                  </label>
                  <Combobox
                    options={supplierOptions}
                    value={formSupplierId}
                    onChange={setFormSupplierId}
                    placeholder="Seleccione o busque un proveedor..."
                    disabled={!!editingOrder}
                  />
                  {editingOrder && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-40)' }}>
                      El proveedor no puede modificarse en una orden existente.
                    </span>
                  )}
                </div>

                {/* Products Section */}
                <fieldset>
                  <legend>Productos de la Orden</legend>

                  {/* Add Product Block */}
                  {(!editingOrder || editingOrder.status === 'borrador') ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--ink-06)',
                      }}
                    >
                      <div className="f-group f-group--full">
                        <label className="f-label">Producto</label>
                        <Combobox
                          options={productOptions}
                          value={addProductId}
                          onChange={setAddProductId}
                          placeholder="Buscar producto..."
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div className="f-group">
                          <label className="f-label">Cant. Esperada</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={1}
                            value={addQty}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              setAddQty(val)
                            }}
                            className="f-input"
                          />
                        </div>
                        <div className="f-group">
                          <label className="f-label">Costo (Opcional)</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={addCost || ''}
                            onChange={(e) => setAddCost(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="f-input"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          className="btn btn--primary"
                          style={{ height: '38px', padding: '0 1.25rem' }}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Added Items List */}
                  {formItems.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--ink-06)', borderRadius: 6, backgroundColor: 'var(--white)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--ink-06)' }}>
                            <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--ink-70)' }}>Producto</th>
                            <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--ink-70)', textAlign: 'center' }}>Cantidad</th>
                            <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--ink-70)', textAlign: 'right' }}>Costo Unit.</th>
                            {(!editingOrder || editingOrder.status === 'borrador') && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} />}
                          </tr>
                        </thead>
                        <tbody>
                          {formItems.map((item, idx) => {
                            const prod = products.find((p) => p.id === item.productId)
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--ink-06)' }}>
                                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--ink)' }}>
                                  <span style={{ fontWeight: 500 }}>{prod?.name || 'Cargando...'}</span>
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--ink-40)' }}>
                                    {prod?.sku || ''}
                                  </span>
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>
                                  {item.qtyOrdered}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--ink-40)' }}>
                                  ${item.unitCost.toLocaleString('es-CO')}
                                </td>
                                {(!editingOrder || editingOrder.status === 'borrador') && (
                                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProduct(idx)}
                                      style={{
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--err)',
                                        padding: '0.25rem',
                                      }}
                                    >
                                      <Trash2 style={{ width: '16px', height: '16px' }} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '1.5rem' }}>
                      <p>No hay productos agregados en esta orden.</p>
                    </div>
                  )}
                </fieldset>

                {/* Notes/Observaciones */}
                <div className="f-group f-group--full">
                  <label className="f-label">
                    Observaciones <span style={{ color: 'var(--ink-40)', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                  </label>
                  <textarea
                    className="f-input"
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ingrese comentarios u observaciones para esta orden..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--ink-06)',
                  background: 'var(--white)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn--outline"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="btn btn--ghost"
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={handleEmitFromForm}
                  className="btn btn--primary"
                >
                  Emitir Orden
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            DETAIL MODAL (READ-ONLY)
            ==================================================================== */}
        {isDetailOpen && selectedOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,30,32,.45)',
              padding: 24,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                maxWidth: 650,
                width: '100%',
                maxHeight: '85vh',
                overflow: 'auto',
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--ink-06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--white)',
                  zIndex: 1,
                }}
              >
                <div>
                  <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0 }}>
                    Detalle de Orden {selectedOrder.number}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-40)' }}>
                    Creada el {formatDate(selectedOrder.created_at)}
                  </span>
                </div>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsDetailOpen(false)}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Supplier & Status info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-40)', fontWeight: 500, textTransform: 'uppercase' }}>
                      Proveedor
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {selectedOrder.supplier_nombre}
                    </span>
                    {selectedOrder.supplier_nit && (
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ink-70)' }}>
                        NIT: {selectedOrder.supplier_nit}
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-40)', fontWeight: 500, textTransform: 'uppercase' }}>
                      Estado de la Orden
                    </span>
                    <div style={{ marginTop: '0.25rem' }}>{renderStatusPill(selectedOrder.status)}</div>
                  </div>
                </div>

                {/* Cancellation Detail Box */}
                {selectedOrder.status === 'cancelada' && (
                  <div
                    style={{
                      background: 'rgba(179, 58, 42, 0.08)',
                      border: '1px solid rgba(179, 58, 42, 0.2)',
                      borderRadius: 8,
                      padding: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <XCircle style={{ width: 18, height: 18, color: 'var(--err)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: 'var(--err)' }}>
                        Orden Cancelada
                      </p>
                      {selectedOrder.cancelled_at && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-40)', display: 'block', marginBottom: '4px' }}>
                          Cancelado el: {formatDate(selectedOrder.cancelled_at)}
                        </span>
                      )}
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ink-70)' }}>
                        <strong>Motivo:</strong> {selectedOrder.cancellation_reason || 'Sin motivo especificado'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div>
                  <div className="s-head" style={{ marginBottom: '0.5rem' }}>
                    <span className="s-head__label">Productos Esperados</span>
                    <div className="s-head__rule" />
                  </div>
                  <div style={{ border: '1px solid var(--ink-06)', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--ink-06)' }}>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--ink-70)' }}>Producto</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--ink-70)', textAlign: 'center' }}>Esperado</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--ink-70)', textAlign: 'center' }}>Recibido</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--ink-70)', textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item) => {
                            let itemStatus = 'pendiente'
                            if (item.quantity_received >= item.quantity_ordered) {
                              itemStatus = 'recibido'
                            } else if (item.quantity_received > 0) {
                              itemStatus = 'parcial'
                            }

                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid var(--ink-06)' }}>
                                <td style={{ padding: '0.75rem 1rem', color: 'var(--ink)' }}>
                                  <span style={{ fontWeight: 500, display: 'block' }}>{item.product_name}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-40)' }}>{item.product_sku}</span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>
                                  {item.quantity_ordered}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: item.quantity_received > 0 ? 'var(--ok)' : 'var(--ink-40)' }}>
                                  {item.quantity_received}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                  {itemStatus === 'recibido' ? (
                                    <span className="pill pill--ok">Recibido</span>
                                  ) : itemStatus === 'parcial' ? (
                                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                                      Parcial
                                    </span>
                                  ) : (
                                    <span style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-40)' }}>
                              Sin productos en esta orden.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Observaciones */}
                {selectedOrder.notes && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-40)', fontWeight: 500, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Observaciones
                    </span>
                    <div
                      style={{
                        padding: '0.75rem',
                        border: '1px solid var(--ink-06)',
                        borderRadius: 6,
                        fontSize: '0.875rem',
                        color: 'var(--ink-70)',
                        backgroundColor: 'var(--white)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--ink-06)',
                  background: 'var(--white)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="btn btn--outline"
                >
                  Cerrar
                </button>
                {selectedOrder.status === 'borrador' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false)
                      setConfirmEmitId(selectedOrder.id)
                    }}
                    className="btn btn--primary"
                  >
                    Emitir Orden
                  </button>
                )}
                {(selectedOrder.status === 'borrador' || selectedOrder.status === 'pendiente') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false)
                      setCancelOrderId(selectedOrder.id)
                      setCancelReason('')
                    }}
                    className="btn btn--danger"
                  >
                    Cancelar Orden
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            CONFIRM EMIT MODAL
            ==================================================================== */}
        {confirmEmitId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,30,32,.45)',
              padding: 24,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                maxWidth: 440,
                width: '100%',
                padding: 24,
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45, 139, 111, 0.08)', padding: '0.5rem', borderRadius: '9999px', color: 'var(--ok)' }}>
                  <CheckCircle style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    ¿Desea emitir esta Orden de Compra?
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-40)', marginTop: '0.25rem', marginBottom: 0 }}>
                    Una vez emitida, la orden quedará visible en Recepción y ya no podrá modificarse.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setConfirmEmitId(null)}
                  className="btn btn--ghost btn--sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEmitConfirmAction}
                  className="btn btn--primary btn--sm"
                >
                  Emitir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            CANCEL ORDER MODAL (WITH REASON)
            ==================================================================== */}
        {cancelOrderId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,30,32,.45)',
              padding: 24,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                maxWidth: 440,
                width: '100%',
                padding: 24,
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(179,58,42,0.08)', padding: '0.5rem', borderRadius: '9999px', color: 'var(--err)' }}>
                  <XCircle style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    Cancelar Orden de Compra
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-40)', marginTop: '0.25rem', marginBottom: 0 }}>
                    Esta acción cancelará la orden de compra definitivamente. Por favor ingrese el motivo obligatorio.
                  </p>
                </div>
              </div>

              {validationError && (
                <div className="alert-bar alert-bar--err" role="alert" style={{ margin: '0 0 0.75rem 0' }}>
                  {validationError}
                </div>
              )}

              <div className="f-group" style={{ marginBottom: '1.25rem' }}>
                <label className="f-label">
                  Motivo de cancelación <span style={{ color: 'var(--err)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="f-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej. Cambio de cotización o proveedor"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCancelOrderId(null)
                    setValidationError(null)
                  }}
                  className="btn btn--ghost btn--sm"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirmAction}
                  className="btn btn--danger btn--sm"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default PurchaseOrdersPage
