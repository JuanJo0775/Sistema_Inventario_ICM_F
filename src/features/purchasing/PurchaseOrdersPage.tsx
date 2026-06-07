import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Search,
  X,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Check,
  ChevronDown,
  Calendar,
  Building2,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import usePurchaseOrderStore from '../../store/usePurchaseOrderStore'
import useSupplierStore from '../../store/useSupplierStore'
import useCatalogStore from '../../store/useCatalogStore'
import type { Supplier } from '../../interfaces/suppliers'
import type { CatalogProduct } from '../../interfaces/catalog'
import type { PurchaseOrder, PurchaseOrderItem } from '../../interfaces/purchaseOrders'

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

  // Find currently selected option
  const selectedOption = options.find((o) => o.value === value)

  // Sync search term with selected option when not focused
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label)
    } else {
      setSearchTerm('')
    }
  }, [selectedOption, value])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        // Reset search term to active selection if exists
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

  // Filter options
  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.subLabel && o.subLabel.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleInputFocus = () => {
    if (disabled) return
    setIsOpen(true)
    // Clear search term on focus to let user see all options
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
  // Store states
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

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Form Modal States
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

  // Modal Sub-Form Product Add state
  const [addProductId, setAddProductId] = useState('')
  const [addQty, setAddQty] = useState(1)
  const [addCost, setAddCost] = useState(0)

  // Action Confirmations
  const [confirmEmitId, setConfirmEmitId] = useState<string | null>(null)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Initial load
  useEffect(() => {
    fetchOrders()
    fetchSuppliers() // Load active suppliers
    fetchProducts()  // Load catalog products
  }, [fetchOrders, fetchSuppliers, fetchProducts])

  // Filtered orders list — reactive: filters update immediately as user types or changes select
  const filteredOrders = orders.filter((o) => {
    // Search filter — live, uses searchTerm directly
    const matchesSearch =
      searchTerm.trim() === '' ||
      o.number.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      o.supplier_nombre.toLowerCase().includes(searchTerm.trim().toLowerCase())

    // Status filter — reactive to select change
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Search form submit (kept for accessibility / Enter key)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // no-op — filtering is already live via searchTerm
  }

  // Clear search filter
  const handleClearFilter = () => {
    setSearchTerm('')
    setActiveSearch('')
  }

  // Active items for combobox options
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

  // Form management
  const handleOpenCreate = () => {
    setEditingOrder(null)
    setFormSupplierId('')
    setFormNotes('')
    setFormItems([])
    setAddProductId('')
    setAddQty(1)
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
    setAddQty(1)
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
    if (addQty <= 0) {
      setValidationError('La cantidad debe ser mayor a 0.')
      return
    }

    // Check duplication
    const duplicate = formItems.some((item) => item.productId === addProductId)
    if (duplicate) {
      setValidationError('Este producto ya ha sido agregado a la orden.')
      return
    }

    // Add to items list
    setFormItems([
      ...formItems,
      {
        productId: addProductId,
        qtyOrdered: addQty,
        unitCost: addCost || 0,
        notes: '',
      },
    ])

    // Reset subform
    setAddProductId('')
    setAddQty(1)
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

    if (!editingOrder && formItems.length === 0) {
      setValidationError('Debe agregar al menos un producto a la orden.')
      return
    }

    try {
      if (editingOrder) {
        // Edit order (backend only updates notes/delivery)
        await updateOrder(editingOrder.id, {
          notes: formNotes.trim(),
        })
        setSuccessMsg('Observaciones de la orden actualizadas correctamente.')
      } else {
        // Create draft
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

    if (!editingOrder && formItems.length === 0) {
      setValidationError('Debe agregar al menos un producto a la orden.')
      return
    }

    try {
      if (editingOrder) {
        // Update first, then confirm
        await updateOrder(editingOrder.id, {
          notes: formNotes.trim(),
        })
        await confirmOrder(editingOrder.id)
        setSuccessMsg(`Orden de compra ${editingOrder.number} emitida correctamente.`)
      } else {
        // Create and emit immediately
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
        // Refresh detail view
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
        // Refresh detail view
        const refreshed = orders.find((o) => o.id === cancelOrderId)
        if (refreshed) setSelectedOrder(refreshed)
      }
    } catch (e) {}
  }

  const handleOpenDetail = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  // Format status pill
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

  // Format Date
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

  // Count order states
  const totalCount = orders.length
  const pendingCount = orders.filter((o) => o.status === 'pendiente').length
  const partialCount = orders.filter((o) => o.status === 'parcialmente_recibida').length
  const completedCount = orders.filter((o) => o.status === 'completada').length

  return (
    <AppShell title="Órdenes de Compra" subtitle="Planificación y abastecimiento de insumos">
      <div className="catalog-page fade-slide-up" style={{ padding: '0 1rem' }}>
        <header
          className="catalog-header"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '1.5rem',
            marginTop: '0.75rem',
          }}
        >
          <button className="btn btn--primary" type="button" onClick={handleOpenCreate}>
            <Plus style={{ marginRight: '0.25rem', width: '18px', height: '18px', marginTop: '2px' }} />
            Nueva Orden
          </button>
        </header>

        {/* Stats KPIs Panel */}
        <section
          className="catalog-stats"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f0ff',
                color: '#7048e8',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <FileText style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {totalCount}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Órdenes Totales
              </p>
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fffbeb',
                color: '#d97706',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <Clock style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {pendingCount}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Pendientes
              </p>
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <TrendingUp style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {partialCount}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Parciales
              </p>
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <CheckCircle style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {completedCount}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Completadas
              </p>
            </div>
          </div>
        </section>

        {/* Alert Bars */}
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

        {/* Toolbar / Search & Filter */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 1fr auto',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            {/* Buscar Orden */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                Buscar orden
              </label>

              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#9ca3af',
                  }}
                />

                <input
                  type="text"
                  placeholder="Número de orden o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                Estado
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '0.95rem',
                }}
              >
                <option value="all">Todas</option>
                <option value="borrador">Borrador</option>
                <option value="pendiente">Pendiente</option>
                <option value="parcialmente_recibida">Parcialmente recibida</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* Botón */}
            <button
              type="submit"
              style={{
                height: '46px',
                minWidth: '120px',
              }}
              className="btn btn--primary"
            >
              Buscar
            </button>
          </form>
        </div>
        {/* Table list */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Orden
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Proveedor
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Fecha
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Estado
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                  Productos
                </th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'right' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Cargando órdenes de compra...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#4f46e5' }}>
                      {order.number}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#111827' }}>
                      {order.supplier_nombre}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem' }}>
                      {renderStatusPill(order.status)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#111827', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: '#f3f0ff',
                          color: '#7048e8',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.825rem',
                        }}
                      >
                        {order.items?.length || 0}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          title="Ver detalle"
                          onClick={() => handleOpenDetail(order)}
                          style={{
                            padding: '0.375rem',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            color: '#4b5563',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                        >
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        {order.status === 'borrador' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(order)}
                              style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #4f46e5',
                                backgroundColor: '#fff',
                                color: '#4f46e5',
                                cursor: 'pointer',
                                fontSize: '0.825rem',
                                fontWeight: 500,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#4f46e5'
                                e.currentTarget.style.color = '#fff'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff'
                                e.currentTarget.style.color = '#4f46e5'
                              }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setConfirmEmitId(order.id)}
                              style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #059669',
                                backgroundColor: '#059669',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.825rem',
                                fontWeight: 500,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#047857')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                            >
                              Emitir
                            </button>
                          </>
                        )}
                        {(order.status === 'borrador' || order.status === 'pendiente') && (
                          <button
                            onClick={() => {
                              setCancelOrderId(order.id)
                              setCancelReason('')
                            }}
                            style={{
                              padding: '0.375rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              backgroundColor: '#fff0f0',
                              color: '#dc2626',
                              cursor: 'pointer',
                              fontSize: '0.825rem',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fecaca')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff0f0')}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    No se encontraron órdenes de compra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Styles injection for spinner animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />

        {/* ====================================================================
            FORM MODAL (CREATE/EDIT)
            ==================================================================== */}
        {isFormOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {editingOrder ? `Editar Orden — ${editingOrder.number}` : 'Nueva Orden de Compra'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {validationError && (
                  <div
                    style={{
                      background: '#fff5f5',
                      border: '1px solid #fed7d7',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#c53030',
                      fontSize: '0.825rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Supplier Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                    Proveedor <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Combobox
                    options={supplierOptions}
                    value={formSupplierId}
                    onChange={setFormSupplierId}
                    placeholder="Seleccione o busque un proveedor..."
                    disabled={!!editingOrder} // Cannot change supplier after creation
                  />
                  {editingOrder && (
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      El proveedor no puede modificarse en una orden existente.
                    </span>
                  )}
                </div>

                {/* Products Table / Form */}
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', backgroundColor: '#f9fafb' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>
                    Productos de la Orden
                  </h4>

                  {/* Add Product Block (Only visible when creating, items are immutable in django backend updates) */}
                  {!editingOrder ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      {/* Row 1: Product full width */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#4b5563' }}>Producto</label>
                        <Combobox
                          options={productOptions}
                          value={addProductId}
                          onChange={setAddProductId}
                          placeholder="Buscar producto..."
                        />
                      </div>
                      {/* Row 2: Cantidad + Costo + Agregar */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#4b5563' }}>Cant. Esperada</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={1}
                            value={addQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 1
                              setAddQty(Math.max(1, val))
                            }}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              outline: 'none',
                              height: '38px',
                              width: '100%',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#4b5563' }}>Costo (Opcional)</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={addCost || ''}
                            onChange={(e) => setAddCost(Math.max(0, parseFloat(e.target.value) || 0))}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              outline: 'none',
                              height: '38px',
                              width: '100%',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          className="btn btn--secondary"
                          style={{
                            height: '38px',
                            padding: '0 1.25rem',
                            borderRadius: '8px',
                            backgroundColor: '#f3f0ff',
                            color: '#7048e8',
                            border: '1px solid #dbeafe',
                            alignSelf: 'flex-end',
                          }}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Added Items List */}
                  {formItems.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#4b5563' }}>Producto</th>
                            <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#4b5563', textAlign: 'center' }}>Cantidad</th>
                            <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#4b5563', textAlign: 'right' }}>Costo Unit.</th>
                            {!editingOrder && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} />}
                          </tr>
                        </thead>
                        <tbody>
                          {formItems.map((item, idx) => {
                            const prod = products.find((p) => p.id === item.productId)
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '0.5rem 0.75rem', color: '#111827' }}>
                                  <span style={{ fontWeight: 500 }}>{prod?.name || 'Cargando...'}</span>
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280' }}>
                                    {prod?.sku || ''}
                                  </span>
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>
                                  {item.qtyOrdered}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#6b7280' }}>
                                  ${item.unitCost.toLocaleString('es-CO')}
                                </td>
                                {!editingOrder && (
                                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProduct(idx)}
                                      style={{
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: '#ef4444',
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
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                      No hay productos agregados en esta orden.
                    </div>
                  )}
                </div>

                {/* Notes/Observaciones Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                    Observaciones <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ingrese comentarios u observaciones para esta orden..."
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              {/* Form Actions footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #f3f4f6',
                  backgroundColor: '#f9fafb',
                  borderBottomLeftRadius: '12px',
                  borderBottomRightRadius: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn--secondary"
                  style={{ borderRadius: '8px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="btn btn--secondary"
                  style={{
                    borderRadius: '8px',
                    borderColor: '#4f46e5',
                    color: '#4f46e5',
                    backgroundColor: '#fff',
                  }}
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={handleEmitFromForm}
                  className="btn btn--primary"
                  style={{ borderRadius: '8px' }}
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
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    Detalle de Orden {selectedOrder.number}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Creada el {formatDate(selectedOrder.created_at)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
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

              {/* Details Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>
                      Proveedor
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
                      {selectedOrder.supplier_nombre}
                    </span>
                    {selectedOrder.supplier_nit && (
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#4b5563' }}>
                        NIT: {selectedOrder.supplier_nit}
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>
                      Estado de la Orden
                    </span>
                    <div style={{ marginTop: '0.25rem' }}>{renderStatusPill(selectedOrder.status)}</div>
                  </div>
                </div>

                {/* Cancellation Detail Box */}
                {selectedOrder.status === 'cancelada' && (
                  <div
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: '#fdf2f2',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <XCircle style={{ width: '18px', height: '18px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: '#991b1b' }}>
                        Orden Cancelada
                      </p>
                      {selectedOrder.cancelled_at && (
                        <span style={{ fontSize: '0.75rem', color: '#b91c1c', display: 'block', marginBottom: '4px' }}>
                          Cancelado el: {formatDate(selectedOrder.cancelled_at)}
                        </span>
                      )}
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#7f1d1d' }}>
                        <strong>Motivo:</strong> {selectedOrder.cancellation_reason || 'Sin motivo especificado'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>
                    Productos Esperados
                  </h4>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563' }}>Producto</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563', textAlign: 'center' }}>Esperado</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563', textAlign: 'center' }}>Recibido</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563', textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item) => {
                            // Determine item state
                            let itemStatus = 'pendiente'
                            if (item.quantity_received >= item.quantity_ordered) {
                              itemStatus = 'recibido'
                            } else if (item.quantity_received > 0) {
                              itemStatus = 'parcial'
                            }

                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>
                                  <span style={{ fontWeight: 500, display: 'block' }}>{item.product_name}</span>
                                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.product_sku}</span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#111827' }}>
                                  {item.quantity_ordered}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: item.quantity_received > 0 ? '#059669' : '#6b7280' }}>
                                  {item.quantity_received}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                  {itemStatus === 'recibido' ? (
                                    <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                                      Recibido
                                    </span>
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
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                              Sin productos en esta orden.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Observaciones detail */}
                {selectedOrder.notes && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Observaciones
                    </span>
                    <div
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        color: '#4b5563',
                        backgroundColor: '#fff',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Detail Modal footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #f3f4f6',
                  backgroundColor: '#f9fafb',
                  borderBottomLeftRadius: '12px',
                  borderBottomRightRadius: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="btn btn--secondary"
                  style={{ borderRadius: '8px' }}
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
                    style={{ borderRadius: '8px' }}
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
                    className="btn btn--secondary"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#fff0f0',
                      color: '#dc2626',
                      borderColor: '#fca5a5',
                    }}
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
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                maxWidth: '440px',
                width: '100%',
                padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ebfbee',
                    color: '#0ca678',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>
                    ¿Desea emitir esta Orden de Compra?
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                    Una vez emitida, la orden quedará visible en Recepción y ya no podrá modificarse.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setConfirmEmitId(null)}
                  className="btn btn--secondary"
                  style={{ borderRadius: '6px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEmitConfirmAction}
                  className="btn btn--primary"
                  style={{ borderRadius: '6px', backgroundColor: '#059669', borderColor: '#059669' }}
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
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                maxWidth: '440px',
                width: '100%',
                padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff0f0',
                    color: '#e03131',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    flexShrink: 0,
                  }}
                >
                  <XCircle style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>
                    Cancelar Orden de Compra
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                    Esta acción cancelará la orden de compra definitivamente. Por favor ingrese el motivo obligatorio.
                  </p>
                </div>
              </div>

              {validationError && (
                <div
                  style={{
                    background: '#fff5f5',
                    border: '1px solid #fed7d7',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#c53030',
                    fontSize: '0.8rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {validationError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
                  Motivo de cancelación <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej. Cambio de cotización o proveedor"
                  required
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCancelOrderId(null)
                    setValidationError(null)
                  }}
                  className="btn btn--secondary"
                  style={{ borderRadius: '6px' }}
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirmAction}
                  className="btn btn--danger"
                  style={{ borderRadius: '6px', backgroundColor: '#dc2626', color: '#fff', border: '1px solid #dc2626' }}
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
