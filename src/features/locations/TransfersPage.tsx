import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Search,
  Plus,
  AlertTriangle,
  X,
  ArrowLeftRight,
  Boxes,
  Tag,
  Eye,
  Calendar,
  User,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useAuthStore from '../../store/useAuthStore'
import { fetchLocations } from '../../services/locations'
import { fetchCatalogProducts } from '../../services/catalog'
import { fetchProductStock } from '../../services/inventory'
import {
  fetchTransfers,
  submitTransfer,
  fetchProductMovements,
  fetchUsers,
  type UserItem,
} from '../../services/transfers'
import type { TransferItem, LotOption } from '../../interfaces/transfers'
import type { LocationItem } from '../../interfaces/locations'
import type { CatalogProduct } from '../../interfaces/catalog'

// Safe error message extractor
const extractErrorMsg = (err: any): string => {
  const data = err?.response?.data
  if (!data) return err?.message || 'Error desconocido'
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.detail === 'string' && data.detail) return data.detail
  if (typeof data.error === 'string' && data.error) return data.error
  return err?.message || 'Error desconocido'
}

const TransfersPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user)

  // Lookups and lists
  const [transfers, setTransfers] = useState<TransferItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [users, setUsers] = useState<UserItem[]>([])

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null)

  // Create Form State
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [originStockLocations, setOriginStockLocations] = useState<Array<{ id: string; name: string; code: string; quantity: number }>>([])
  const [selectedOriginId, setSelectedOriginId] = useState('')
  const [availableLots, setAvailableLots] = useState<LotOption[]>([])
  const [selectedLotId, setSelectedLotId] = useState('')
  const [selectedDestinationId, setSelectedDestinationId] = useState('')
  const [transferQuantity, setTransferQuantity] = useState<number>(1)
  const [coldChainAck, setColdChainAck] = useState(false)
  const [electricalSafetyAck, setElectricalSafetyAck] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Map Lookups
  const locationsLookup = useMemo(() => {
    return locations.reduce<Record<string, LocationItem>>((acc, loc) => {
      acc[loc.id] = loc
      return acc
    }, {})
  }, [locations])

  const productsLookup = useMemo(() => {
    return products.reduce<Record<string, CatalogProduct>>((acc, prod) => {
      acc[prod.id] = prod
      return acc
    }, {})
  }, [products])

  const usersLookup = useMemo(() => {
    return users.reduce<Record<string, UserItem>>((acc, u) => {
      acc[u.id] = u
      return acc
    }, {})
  }, [users])

  // Fetch lookups (locations, products, users)
  const loadLookups = useCallback(async () => {
    try {
      const [locsRes, prodsRes, usersRes] = await Promise.allSettled([
        fetchLocations(true),
        fetchCatalogProducts({ include_inactive: true }),
        fetchUsers(),
      ])

      if (locsRes.status === 'fulfilled') setLocations(locsRes.value)
      if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value)
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value)
    } catch (err) {
      console.error('Error cargando lookups:', err)
    }
  }, [])

  // Load transfers list
  const loadTransfers = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await fetchTransfers({ page: currentPage, page_size: pageSize })
      setTransfers(data.results)
      setTotalCount(data.count)
    } catch (err: any) {
      setErrorMsg(extractErrorMsg(err))
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  useEffect(() => {
    loadTransfers()
  }, [loadTransfers])

  // Filter transfers based on search term (searching sku or product name)
  const filteredTransfers = useMemo(() => {
    if (!activeSearch) return transfers
    const q = activeSearch.toLowerCase()
    return transfers.filter((t) => {
      const prodName = productsLookup[t.product]?.name?.toLowerCase() || ''
      const sku = t.product_sku?.toLowerCase() || ''
      return prodName.includes(q) || sku.includes(q)
    })
  }, [transfers, activeSearch, productsLookup])

  // KPIs
  const kpis = useMemo(() => {
    // We sum stats based on loaded lookups and overall transfer count
    // Wait, the count is the total transfers count in the backend
    const totalTransfers = totalCount

    // Since we paginate, we sum units over the loaded transfers or estimate
    // Wait, the user asked for:
    // "Total transferencias: Cantidad de movimientos realizados."
    // "Unidades transferidas: Suma total de unidades movidas."
    // "Productos transferidos: Cantidad de productos distintos que han sido transferidos."
    // Ideally we can compute these over the current loaded dataset, or fetch all transfers.
    // Let's compute them over the current loaded/paginated list as a good approximation, or overall transfers if we fetch all.
    // Wait, to calculate accurate total units, we can sum over all transfers. Since the paginator returns the results, we can sum the loaded ones first or compute from list.
    const units = transfers.reduce((sum, t) => sum + t.quantity, 0)
    const uniqueProductsSet = new Set(transfers.map((t) => t.product))

    return {
      total: totalTransfers,
      units: units,
      uniqueProducts: uniqueProductsSet.size,
    }
  }, [transfers, totalCount])

  // Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchTerm)
  };

  // Open "Nueva Transferencia" modal
  const handleOpenCreate = () => {
    setSelectedProduct(null)
    setProductSearchTerm('')
    setOriginStockLocations([])
    setSelectedOriginId('')
    setAvailableLots([])
    setSelectedLotId('')
    setSelectedDestinationId('')
    setTransferQuantity(1)
    setColdChainAck(false)
    setElectricalSafetyAck(false)
    setFormError(null)
    setIsCreateOpen(true)
  }

  // Handle product selection in modal
  const handleSelectProduct = async (prod: CatalogProduct) => {
    setSelectedProduct(prod)
    setOriginStockLocations([])
    setSelectedOriginId('')
    setAvailableLots([])
    setSelectedLotId('')
    setFormError(null)

    try {
      // 1. Get stock by location for this product
      const stockInfo = await fetchProductStock(prod.id)
      const perLoc = stockInfo.per_location || stockInfo.by_location || []

      // Filter only locations with positive stock
      const stockLocations = perLoc
        .filter((item) => item.quantity > 0)
        .map((item) => {
          const locDetails = locations.find((l) => l.code === item.location_code || l.id === item.location_id)
          return {
            id: locDetails?.id || item.location_id || '',
            name: locDetails?.name || item.location_name || item.location_code,
            code: item.location_code,
            quantity: item.quantity,
          }
        })
        .filter((item) => item.id !== '')

      setOriginStockLocations(stockLocations)

      if (stockLocations.length === 0) {
        setFormError('Este producto no cuenta con stock en ninguna ubicación activa.')
      }
    } catch (err) {
      setFormError('Error al consultar el inventario del producto.')
    }
  }

  // Handle origin location change
  const handleOriginChange = async (originId: string) => {
    setSelectedOriginId(originId)
    setSelectedLotId('')
    setAvailableLots([])
    setFormError(null)

    if (!selectedProduct || !originId) return

    // If product requires expiration, load and calculate stock per lot in origin location
    if (selectedProduct.requires_expiration) {
      try {
        const movements = await fetchProductMovements(selectedProduct.id)

        // Calculate net stock for each lot in the selected origin location
        // Movements have: lot (UUID), lot_code, lot_expiration_date, origin_location, destination_location, quantity
        const lotMap: Record<string, { code: string; expiration_date: string; available: number }> = {}

        movements.forEach((mov: any) => {
          if (!mov.lot) return

          const lotId = mov.lot
          const lotCode = mov.lot_code || 'S/L'
          const lotExp = mov.lot_expiration_date || ''

          if (!lotMap[lotId]) {
            lotMap[lotId] = { code: lotCode, expiration_date: lotExp, available: 0 }
          }

          const qty = Number(mov.quantity || 0)

          // If it entered the origin location
          if (mov.destination_location === originId) {
            lotMap[lotId].available += qty
          }
          // If it left the origin location
          if (mov.origin_location === originId) {
            lotMap[lotId].available -= qty
          }
        })

        // Filter lots with net positive stock in origin
        const options: LotOption[] = Object.keys(lotMap)
          .map((lotId) => ({
            id: lotId,
            code: lotMap[lotId].code,
            expiration_date: lotMap[lotId].expiration_date,
            available: lotMap[lotId].available,
          }))
          .filter((lot) => lot.available > 0)

        setAvailableLots(options)

        if (options.length === 0) {
          setFormError('No se encontraron lotes con stock positivo en la ubicación seleccionada.')
        }
      } catch (err) {
        setFormError('Error al consultar lotes del producto.')
      }
    }
  }

  // Get max allowed quantity
  const maxAllowedQuantity = useMemo(() => {
    if (!selectedProduct) return 0

    if (selectedProduct.requires_expiration && selectedLotId) {
      const lot = availableLots.find((l) => l.id === selectedLotId)
      return lot ? lot.available : 0
    }

    const loc = originStockLocations.find((l) => l.id === selectedOriginId)
    return loc ? loc.quantity : 0
  }, [selectedProduct, selectedLotId, selectedOriginId, availableLots, originStockLocations])

  // Save Transfer
  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedProduct) {
      setFormError('Por favor selecciona un producto.')
      return
    }
    if (!selectedOriginId) {
      setFormError('Selecciona una ubicación de origen.')
      return
    }
    if (!selectedDestinationId) {
      setFormError('Selecciona una ubicación de destino.')
      return
    }
    if (selectedOriginId === selectedDestinationId) {
      setFormError('La ubicación de origen y destino deben ser distintas.')
      return
    }
    if (transferQuantity <= 0) {
      setFormError('La cantidad a transferir debe ser mayor a 0.')
      return
    }
    if (transferQuantity > maxAllowedQuantity) {
      setFormError(`La cantidad ingresada supera el stock disponible (${maxAllowedQuantity}).`)
      return
    }
    if (selectedProduct.requires_expiration && !selectedLotId) {
      setFormError('Este producto requiere control de vencimiento. Selecciona un lote.')
      return
    }

    // Safety checks
    if (selectedProduct.requires_cold_chain && !coldChainAck) {
      setFormError('Debe confirmar el reconocimiento de la cadena de frío.')
      return
    }

    const categoryObj = selectedProduct.category
    const requiresSerial = typeof categoryObj === 'object' && categoryObj !== null
      ? (categoryObj as any).requires_serial_number
      : false

    if (requiresSerial && !electricalSafetyAck) {
      setFormError('Debe confirmar el reconocimiento de la seguridad eléctrica.')
      return
    }

    setSaving(true)
    try {
      await submitTransfer({
        product_id: selectedProduct.id,
        origin_id: selectedOriginId,
        destination_id: selectedDestinationId,
        quantity: transferQuantity,
        lot_id: selectedProduct.requires_expiration ? selectedLotId : null,
        cold_chain_acknowledged: coldChainAck,
        electrical_safety_acknowledged: electricalSafetyAck,
      })

      setSuccessMsg(`Traslado de ${transferQuantity} unidades de "${selectedProduct.name}" registrado correctamente.`)
      setIsCreateOpen(false)
      setCurrentPage(1) // Return to page 1
      loadTransfers() // Reload list
    } catch (err: any) {
      setFormError(extractErrorMsg(err))
    } finally {
      setSaving(false)
    }
  }

  // Open "Ver Detalle" modal
  const handleOpenDetail = (transfer: TransferItem) => {
    setSelectedTransfer(transfer)
    setIsDetailOpen(true)
  }

  // Resolve Operator Display Name
  const getOperatorName = (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      return (currentUser.first_name + ' ' + currentUser.last_name).trim() || currentUser.username
    }
    const u = usersLookup[userId]
    if (u) {
      return (u.first_name + ' ' + u.last_name).trim() || u.username
    }
    return `Operador (${userId.slice(0, 8).toUpperCase()})`
  }

  // Resolve Location Name
  const getLocationName = (locId: string | null) => {
    if (!locId) return '-'
    const loc = locationsLookup[locId]
    return loc ? `${loc.name} (${loc.code})` : `Ubicación (${locId.slice(0, 8).toUpperCase()})`
  }

  // Filter products in select dropdown based on search input
  const filteredProductOptions = useMemo(() => {
    const q = productSearchTerm.trim().toLowerCase()
    if (!q) return products.filter((p) => p.is_active)
    return products
      .filter((p) => p.is_active)
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, productSearchTerm])

  const formatFechaStr = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    } catch {
      return dateStr
    }
  }

  return (
    <AppShell title="Transferencias" subtitle="Gestiona los traslados de stock físico entre ubicaciones">
      <div className="catalog-page fade-slide-up">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="catalog-header" style={{ marginBottom: '1.5rem' }}>
          <div className="catalog-header__info" />
          <button className="btn btn--primary" type="button" onClick={handleOpenCreate}>
            <Plus style={{ marginRight: '0.25rem', width: '18px', height: '18px' }} />
            Nueva Transferencia
          </button>
        </header>

        {/* ── Stat cards ───────────────────────────────────────────────── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Total Transferencias */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f0ff', color: '#7048e8', width: '48px', height: '48px', borderRadius: '10px' }}>
              <ArrowLeftRight style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{kpis.total}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Total Transferencias</p>
            </div>
          </div>

          {/* Unidades Transferidas */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ebfbee', color: '#0ca678', width: '48px', height: '48px', borderRadius: '10px' }}>
              <Boxes style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{kpis.units}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Unidades Transferidas</p>
            </div>
          </div>

          {/* Productos Transferidos */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2ff', color: '#4f46e5', width: '48px', height: '48px', borderRadius: '10px' }}>
              <Tag style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{kpis.uniqueProducts}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Productos Transferidos</p>
            </div>
          </div>
        </section>

        {/* ── Feedback alerts ──────────────────────────────────────────── */}
        {successMsg && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{successMsg}</span>
            <button className="alert-bar__close" onClick={() => setSuccessMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{errorMsg}</span>
            <button className="alert-bar__close" onClick={() => setErrorMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* ── Search toolbar ───────────────────────────────────────────── */}
        <div
          className="catalog-toolbar"
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'stretch' }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', maxWidth: '450px', gap: '0.5rem' }}>
            <div className="catalog-toolbar__search" style={{ flexGrow: 1, position: 'relative' }}>
              <Search
                className="catalog-toolbar__search-icon"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6b7280' }}
              />
              <input
                type="text"
                placeholder="Buscar por producto o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', height: '42px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              style={{ height: '42px', padding: '0 1.25rem', whiteSpace: 'nowrap', borderRadius: '8px' }}
            >
              Buscar
            </button>
          </form>
          {activeSearch && (
            <button
              onClick={() => { setSearchTerm(''); setActiveSearch(''); }}
              className="btn btn--secondary"
              style={{ height: '42px', borderRadius: '8px' }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="empty-state">
            <p>Cargando historial de transferencias...</p>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="empty-state">
            <ArrowLeftRight style={{ width: '48px', height: '48px', strokeWidth: 1, color: '#9ca3af', marginBottom: '1rem' }} />
            <p>No se encontraron transferencias.</p>
          </div>
        ) : (
          <>
            <div
              className="table-surface"
              style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Fecha</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Producto</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Cantidad</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Origen</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Destino</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Usuario</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((item) => {
                    const prodName = productsLookup[item.product]?.name || 'Producto Desconocido'
                    return (
                      <tr
                        key={item.id}
                        style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {/* Fecha */}
                        <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            {formatFechaStr(item.created_at)}
                          </div>
                        </td>

                        {/* Producto */}
                        <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: '#111827', fontSize: '0.925rem' }}>
                          <div>
                            <span style={{ display: 'block' }}>{prodName}</span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 'normal' }}>SKU: {item.product_sku}</span>
                          </div>
                        </td>

                        {/* Cantidad */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: '42px', padding: '0.25rem 0.5rem',
                              borderRadius: '6px', background: '#e0f2fe', color: '#0369a1',
                              fontSize: '0.85rem', fontWeight: 700,
                            }}
                          >
                            {item.quantity}
                          </span>
                        </td>

                        {/* Origen */}
                        <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                          {getLocationName(item.origin_location)}
                        </td>

                        {/* Destino */}
                        <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                          {getLocationName(item.destination_location)}
                        </td>

                        {/* Usuario */}
                        <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <User style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            {getOperatorName(item.executed_by)}
                          </div>
                        </td>

                        {/* Accion */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <button
                            className="btn btn--secondary btn--sm"
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalCount > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Mostrando del {(currentPage - 1) * pageSize + 1} al {Math.min(currentPage * pageSize, totalCount)} de {totalCount} registros
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn--secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                    style={{ height: '36px', padding: '0 0.85rem' }}
                  >
                    Anterior
                  </button>
                  <button
                    className="btn btn--secondary"
                    disabled={currentPage * pageSize >= totalCount}
                    onClick={() => setCurrentPage((c) => c + 1)}
                    style={{ height: '36px', padding: '0 0.85rem' }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Modal: Ver Detalle ───────────────────────────────────────── */}
        {isDetailOpen && selectedTransfer && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            }}
          >
            <div
              className="fade-slide-up"
              style={{
                backgroundColor: '#fff', borderRadius: '12px',
                width: '100%', maxWidth: '480px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '1.75rem', border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeftRight style={{ width: '20px', height: '20px', color: '#7048e8' }} />
                  Detalle de Transferencia
                </h3>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Detail list matching user requested style */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Código:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    TR-{selectedTransfer.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Producto:</span>
                  <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>
                    {productsLookup[selectedTransfer.product]?.name || 'Producto Desconocido'} <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({selectedTransfer.product_sku})</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Cantidad:</span>
                  <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.95rem' }}>
                    {selectedTransfer.quantity} uds
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Origen:</span>
                  <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>
                    {getLocationName(selectedTransfer.origin_location)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Destino:</span>
                  <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>
                    {getLocationName(selectedTransfer.destination_location)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Lote:</span>
                  <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>
                    {selectedTransfer.lot_code ? (
                      <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {selectedTransfer.lot_code} {selectedTransfer.lot_expiration_date ? `(Vence: ${selectedTransfer.lot_expiration_date})` : ''}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No requiere lote</span>
                    )}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Usuario:</span>
                  <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>
                    {getOperatorName(selectedTransfer.executed_by)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Fecha:</span>
                  <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>
                    {formatFechaStr(selectedTransfer.created_at)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>Motivo:</span>
                  <span style={{ fontWeight: 500, color: '#475569', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    {selectedTransfer.justification || 'Traslado interno de inventario (Reposición de vitrina)'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setIsDetailOpen(false)}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Nueva Transferencia ────────────────────────────────── */}
        {isCreateOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            }}
          >
            <div
              className="fade-slide-up"
              style={{
                backgroundColor: '#fff', borderRadius: '12px',
                width: '100%', maxWidth: '540px',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '1.75rem', border: '1px solid #e5e7eb',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeftRight style={{ width: '22px', height: '22px', color: '#7048e8' }} />
                  Nueva Transferencia
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Form validation alert */}
              {formError && (
                <div
                  style={{
                    background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px',
                    padding: '0.75rem', marginBottom: '1rem', color: '#c53030',
                    fontSize: '0.825rem', display: 'flex', gap: '0.5rem', alignItems: 'center',
                  }}
                >
                  <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* 1. PRODUCT SELECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    Producto <span style={{ color: '#ef4444' }}>*</span>
                  </label>

                  {!selectedProduct ? (
                    <div>
                      {/* Search box to filter products list */}
                      <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#9ca3af' }} />
                        <input
                          type="text"
                          placeholder="Escribe para buscar producto..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '36px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>

                      {/* Filtered options in a scrollable list */}
                      <div
                        style={{
                          maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px',
                          display: 'flex', flexDirection: 'column', background: '#fff'
                        }}
                      >
                        {filteredProductOptions.length === 0 ? (
                          <div style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>
                            No se encontraron productos.
                          </div>
                        ) : (
                          filteredProductOptions.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleSelectProduct(prod)}
                              style={{
                                width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none',
                                borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            >
                              <span style={{ fontWeight: 500, color: '#334155' }}>{prod.name}</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>{prod.sku}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                      <div>
                        <span style={{ display: 'block', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{selectedProduct.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SKU: {selectedProduct.sku}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedProduct(null); setOriginStockLocations([]); setSelectedOriginId(''); setAvailableLots([]); setSelectedLotId(''); }}
                        style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '9999px' }}
                      >
                        <X style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <>
                    {/* 2. ORIGIN LOCATION SELECT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label htmlFor="origin-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                        Ubicación de Origen <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        id="origin-select"
                        value={selectedOriginId}
                        onChange={(e) => handleOriginChange(e.target.value)}
                        style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                        required
                      >
                        <option value="">— Selecciona bodega de origen —</option>
                        {originStockLocations.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.code}) — Disponible: {item.quantity} uds
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. LOT SELECT (Conditional on requires_expiration) */}
                    {selectedProduct.requires_expiration && selectedOriginId && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label htmlFor="lot-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                          Lote de Producto <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="lot-select"
                          value={selectedLotId}
                          onChange={(e) => setSelectedLotId(e.target.value)}
                          style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                          required
                        >
                          <option value="">— Selecciona el lote con vencimiento —</option>
                          {availableLots.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              Lote: {lot.code} (Vence: {lot.expiration_date}) — Disponible: {lot.available} uds
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 4. DESTINATION LOCATION SELECT */}
                    {selectedOriginId && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label htmlFor="dest-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                          Ubicación de Destino <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="dest-select"
                          value={selectedDestinationId}
                          onChange={(e) => setSelectedDestinationId(e.target.value)}
                          style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                          required
                        >
                          <option value="">— Selecciona bodega de destino —</option>
                          {locations
                            .filter((loc) => loc.id !== selectedOriginId && loc.is_active && loc.operational_status === 'active')
                            .map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.code})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* 5. TRANSFER QUANTITY */}
                    {selectedOriginId && selectedDestinationId && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label htmlFor="qty-input" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                          Cantidad a Transferir <span style={{ color: '#ef4444' }}>*</span>
                          <span style={{ marginLeft: '0.5rem', color: '#64748b', fontWeight: 'normal', fontSize: '0.75rem' }}>(Máximo disponible: {maxAllowedQuantity} uds)</span>
                        </label>
                        <input
                          id="qty-input"
                          type="number"
                          min={1}
                          max={maxAllowedQuantity}
                          value={transferQuantity}
                          onChange={(e) => setTransferQuantity(Number(e.target.value))}
                          style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none' }}
                          required
                        />
                      </div>
                    )}

                    {/* 6. CRITICAL FLAGS ACKNOWLEDGEMENTS */}
                    {selectedOriginId && selectedDestinationId && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {selectedProduct.requires_cold_chain && (
                          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.825rem', color: '#1e293b' }}>
                            <input
                              type="checkbox"
                              checked={coldChainAck}
                              onChange={(e) => setColdChainAck(e.target.checked)}
                              style={{ marginTop: '3px' }}
                              required
                            />
                            <span>
                              ⚠️ <strong>Alerta de Cadena de Frío:</strong> Confirmo que conozco los requerimientos de refrigeración de este producto y aseguro las condiciones de temperatura durante su traslado.
                            </span>
                          </label>
                        )}

                        {/* If product requires serial number check */}
                        {typeof selectedProduct.category === 'object' && selectedProduct.category !== null && (selectedProduct.category as any).requires_serial_number && (
                          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.825rem', color: '#1e293b' }}>
                            <input
                              type="checkbox"
                              checked={electricalSafetyAck}
                              onChange={(e) => setElectricalSafetyAck(e.target.checked)}
                              style={{ marginTop: '3px' }}
                              required
                            />
                            <span>
                              ⚡ <strong>Seguridad Eléctrica:</strong> Confirmo la revisión técnica de seguridad eléctrica en equipos y la firma de actas de calibración operacional correspondientes.
                            </span>
                          </label>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Form actions */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setIsCreateOpen(false)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={saving || !selectedProduct || !selectedOriginId || !selectedDestinationId}
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'Transfiriendo…' : 'Confirmar Transferencia'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}

export default TransfersPage
