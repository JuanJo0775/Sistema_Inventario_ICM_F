import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  AlertTriangle,
  X,
  ArrowLeftRight,
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

  const [transfers, setTransfers] = useState<TransferItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [users, setUsers] = useState<UserItem[]>([])

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null)

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [originStockLocations, setOriginStockLocations] = useState<Array<{ id: string; name: string; code: string; quantity: number }>>([])
  const [selectedOriginId, setSelectedOriginId] = useState('')
  const [availableLots, setAvailableLots] = useState<LotOption[]>([])
  const [selectedLotId, setSelectedLotId] = useState('')
  const [selectedDestinationId, setSelectedDestinationId] = useState('')
  const [transferQuantity, setTransferQuantity] = useState<string>('1')
  const [coldChainAck, setColdChainAck] = useState(false)
  const [electricalSafetyAck, setElectricalSafetyAck] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

  const filteredTransfers = useMemo(() => {
    if (!activeSearch) return transfers
    const q = activeSearch.toLowerCase()
    return transfers.filter((t) => {
      const prodName = productsLookup[t.product]?.name?.toLowerCase() || ''
      const sku = t.product_sku?.toLowerCase() || ''
      return prodName.includes(q) || sku.includes(q)
    })
  }, [transfers, activeSearch, productsLookup])

  const kpis = useMemo(() => {
    const totalTransfers = totalCount
    const units = transfers.reduce((sum, t) => sum + t.quantity, 0)
    const uniqueProductsSet = new Set(transfers.map((t) => t.product))

    return {
      total: totalTransfers,
      units: units,
      uniqueProducts: uniqueProductsSet.size,
    }
  }, [transfers, totalCount])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchTerm)
  };

  const handleOpenCreate = () => {
    setSelectedProduct(null)
    setProductSearchTerm('')
    setOriginStockLocations([])
    setSelectedOriginId('')
    setAvailableLots([])
    setSelectedLotId('')
    setSelectedDestinationId('')
    setTransferQuantity('1')
    setColdChainAck(false)
    setElectricalSafetyAck(false)
    setFormError(null)
    setIsCreateOpen(true)
  }

  const handleSelectProduct = async (prod: CatalogProduct) => {
    setSelectedProduct(prod)
    setOriginStockLocations([])
    setSelectedOriginId('')
    setAvailableLots([])
    setSelectedLotId('')
    setFormError(null)

    try {
      const stockInfo = await fetchProductStock(prod.id)
      const perLoc = stockInfo.per_location || stockInfo.by_location || []

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

  const handleOriginChange = async (originId: string) => {
    setSelectedOriginId(originId)
    setSelectedLotId('')
    setAvailableLots([])
    setFormError(null)

    if (!selectedProduct || !originId) return

    if (selectedProduct.requires_expiration) {
      try {
        const movements = await fetchProductMovements(selectedProduct.id)

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

          if (mov.destination_location === originId) {
            lotMap[lotId].available += qty
          }
          if (mov.origin_location === originId) {
            lotMap[lotId].available -= qty
          }
        })

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

  const maxAllowedQuantity = useMemo(() => {
    if (!selectedProduct) return 0

    if (selectedProduct.requires_expiration && selectedLotId) {
      const lot = availableLots.find((l) => l.id === selectedLotId)
      return lot ? lot.available : 0
    }

    const loc = originStockLocations.find((l) => l.id === selectedOriginId)
    return loc ? loc.quantity : 0
  }, [selectedProduct, selectedLotId, selectedOriginId, availableLots, originStockLocations])

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
    const parsedQty = parseInt(transferQuantity, 10)
    if (!parsedQty || parsedQty <= 0) {
      setFormError('La cantidad a transferir debe ser mayor a 0.')
      return
    }
    if (parsedQty > maxAllowedQuantity) {
      setFormError(`La cantidad ingresada supera el stock disponible (${maxAllowedQuantity}).`)
      return
    }
    if (selectedProduct.requires_expiration && !selectedLotId) {
      setFormError('Este producto requiere control de vencimiento. Selecciona un lote.')
      return
    }

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
        quantity: parsedQty,
        lot_id: selectedProduct.requires_expiration ? selectedLotId : null,
        cold_chain_acknowledged: coldChainAck,
        electrical_safety_acknowledged: electricalSafetyAck,
      })

      setSuccessMsg(`Traslado de ${parsedQty} unidades de "${selectedProduct.name}" registrado correctamente.`)
      setIsCreateOpen(false)
      setCurrentPage(1)
      loadTransfers()
    } catch (err: any) {
      setFormError(extractErrorMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const handleOpenDetail = (transfer: TransferItem) => {
    setSelectedTransfer(transfer)
    setIsDetailOpen(true)
  }

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

  const getLocationName = (locId: string | null) => {
    if (!locId) return '-'
    const loc = locationsLookup[locId]
    return loc ? `${loc.name} (${loc.code})` : `Ubicación (${locId.slice(0, 8).toUpperCase()})`
  }

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
    <AppShell
      title="Transferencias"
      subtitle="Gestiona los traslados de stock físico entre ubicaciones"
      actions={
        <button className="btn btn--primary btn--sm" type="button" onClick={handleOpenCreate}>
          + Nueva Transferencia
        </button>
      }
    >
      <div className="catalog-page fade-slide-up">

        {/* Metric strip */}
        <div className="metric-strip mb-4" style={{ maxWidth: 600 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">Total Transferencias</p>
            <p className="metric-cell__val">{kpis.total}</p>
            <p className="metric-cell__sub">movimientos realizados</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Unidades Transferidas</p>
            <p className="metric-cell__val">{kpis.units}</p>
            <p className="metric-cell__sub">unidades movidas</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Productos Transferidos</p>
            <p className="metric-cell__val">{kpis.uniqueProducts}</p>
            <p className="metric-cell__sub">productos distintos</p>
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

        {errorMsg && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{errorMsg}</span>
            <button className="alert-bar__close" onClick={() => setErrorMsg(null)}>
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
            <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
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
                placeholder="Buscar por producto o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar transferencia"
              />
            </div>
            <button type="submit" className="btn btn--primary">
              Buscar
            </button>
          </form>
          {activeSearch && (
            <button
              onClick={() => { setSearchTerm(''); setActiveSearch(''); }}
              className="btn btn--ghost btn--sm"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Table */}
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
            <div className="table-surface">
              <div className="table-wrap">
                <table className="data-table" style={{ minWidth: 800 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>Fecha</th>
                      <th style={{ width: '28%' }}>Producto</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ width: '16%' }}>Origen</th>
                      <th style={{ width: '16%' }}>Destino</th>
                      <th style={{ width: '14%' }}>Usuario</th>
                      <th style={{ width: 'auto' }}><span className="sr-only">Acción</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map((item) => {
                      const prodName = productsLookup[item.product]?.name || 'Producto Desconocido'
                      return (
                        <tr key={item.id}>
                          <td style={{ color: 'var(--ink-70)', fontSize: '0.825rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Calendar style={{ width: '14px', height: '14px', color: 'var(--ink-40)' }} />
                              {formatFechaStr(item.created_at)}
                            </div>
                          </td>
                          <td style={{ fontWeight: 500, color: 'var(--ink)' }}>
                            <span style={{ display: 'block' }}>{prodName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ink-40)', fontWeight: 'normal' }}>SKU: {item.product_sku}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
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
                          <td style={{ color: 'var(--ink-70)', fontSize: '0.875rem' }}>
                            {getLocationName(item.origin_location)}
                          </td>
                          <td style={{ color: 'var(--ink-70)', fontSize: '0.875rem' }}>
                            {getLocationName(item.destination_location)}
                          </td>
                          <td style={{ color: 'var(--ink-70)', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <User style={{ width: '14px', height: '14px', color: 'var(--ink-40)' }} />
                              {getOperatorName(item.executed_by)}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn--outline btn--sm"
                              type="button"
                              onClick={() => handleOpenDetail(item)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--ink-40)' }}>
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

        {/* Detail Modal */}
        {isDetailOpen && selectedTransfer && (
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
              className="fade-slide-up"
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
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
                <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeftRight style={{ width: '20px', height: '20px', color: 'var(--teal-600)' }} />
                  Detalle de Transferencia
                </h2>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsDetailOpen(false)}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--ink-06)', padding: '0.6rem 0.85rem', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-70)', fontSize: '0.875rem' }}>Código:</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    TR-{selectedTransfer.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Producto:</span>
                  <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {productsLookup[selectedTransfer.product]?.name || 'Producto Desconocido'} <span style={{ color: 'var(--ink-40)', fontSize: '0.8rem' }}>({selectedTransfer.product_sku})</span>
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Cantidad:</span>
                  <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.95rem' }}>
                    {selectedTransfer.quantity} uds
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Origen:</span>
                  <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {getLocationName(selectedTransfer.origin_location)}
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Destino:</span>
                  <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {getLocationName(selectedTransfer.destination_location)}
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Lote:</span>
                  <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {selectedTransfer.lot_code ? (
                      <span style={{ background: 'var(--ink-06)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8rem', fontFamily: 'var(--ff-mono)' }}>
                        {selectedTransfer.lot_code} {selectedTransfer.lot_expiration_date ? `(Vence: ${selectedTransfer.lot_expiration_date})` : ''}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-40)', fontStyle: 'italic', fontSize: '0.85rem' }}>No requiere lote</span>
                    )}
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Usuario:</span>
                  <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {getOperatorName(selectedTransfer.executed_by)}
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Fecha:</span>
                  <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    {formatFechaStr(selectedTransfer.created_at)}
                  </span>
                </div>

                <div className="f-row f-row-2" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-40)', fontSize: '0.85rem', minWidth: 80 }}>Motivo:</span>
                  <span style={{ fontWeight: 500, color: 'var(--ink-70)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    {selectedTransfer.justification || 'Traslado interno de inventario (Reposición de vitrina)'}
                  </span>
                </div>
              </div>

              {/* footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--ink-06)',
                }}
              >
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {isCreateOpen && (
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
              className="fade-slide-up"
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                maxWidth: 540,
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
                <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeftRight style={{ width: '22px', height: '22px', color: 'var(--teal-600)' }} />
                  Nueva Transferencia
                </h2>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsCreateOpen(false)}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {formError && (
                  <div className="alert-bar alert-bar--err" role="alert" style={{ margin: 0 }}>
                    <AlertTriangle style={{ width: 14, height: 14 }} />
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSaveTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* 1. PRODUCT SELECTION */}
                  <fieldset>
                    <legend>Producto</legend>
                    {!selectedProduct ? (
                      <div className="f-group f-group--full">
                        <label className="f-label">Buscar producto <span style={{ color: 'var(--err)' }}>*</span></label>
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
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
                            placeholder="Escribe para buscar producto..."
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                          />
                        </div>
                        <div
                          style={{
                            maxHeight: 150,
                            overflowY: 'auto',
                            border: '1px solid var(--ink-06)',
                            borderRadius: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--white)',
                          }}
                        >
                          {filteredProductOptions.length === 0 ? (
                            <div style={{ padding: '0.75rem', color: 'var(--ink-40)', fontSize: '0.85rem', textAlign: 'center' }}>
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
                                  borderBottom: '1px solid var(--ink-06)', cursor: 'pointer', fontSize: '0.85rem',
                                  display: 'flex', justifyContent: 'space-between',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ink-06)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                              >
                                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{prod.name}</span>
                                <span style={{ color: 'var(--ink-40)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)' }}>{prod.sku}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ink-06)', border: '1px solid var(--ink-06)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                        <div>
                          <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>{selectedProduct.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-40)' }}>SKU: {selectedProduct.sku}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedProduct(null); setOriginStockLocations([]); setSelectedOriginId(''); setAvailableLots([]); setSelectedLotId(''); }}
                          style={{ background: 'var(--ink-06)', border: 'none', cursor: 'pointer', color: 'var(--ink-40)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '9999px' }}
                        >
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    )}
                  </fieldset>

                  {selectedProduct && (
                    <>
                      {/* 2. ORIGIN LOCATION */}
                      <fieldset>
                        <legend>Origen</legend>
                        <div className="f-group f-group--full">
                          <label className="f-label" htmlFor="origin-select">
                            Ubicación de Origen <span style={{ color: 'var(--err)' }}>*</span>
                          </label>
                          <select
                            id="origin-select"
                            className="f-input"
                            value={selectedOriginId}
                            onChange={(e) => handleOriginChange(e.target.value)}
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
                      </fieldset>

                      {/* 3. LOT SELECT */}
                      {selectedProduct.requires_expiration && selectedOriginId && (
                        <fieldset>
                          <legend>Lote</legend>
                          <div className="f-group f-group--full">
                            <label className="f-label" htmlFor="lot-select">
                              Lote de Producto <span style={{ color: 'var(--err)' }}>*</span>
                            </label>
                            <select
                              id="lot-select"
                              className="f-input"
                              value={selectedLotId}
                              onChange={(e) => setSelectedLotId(e.target.value)}
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
                        </fieldset>
                      )}

                      {/* 4. DESTINATION LOCATION */}
                      {selectedOriginId && (
                        <fieldset>
                          <legend>Destino</legend>
                          <div className="f-group f-group--full">
                            <label className="f-label" htmlFor="dest-select">
                              Ubicación de Destino <span style={{ color: 'var(--err)' }}>*</span>
                            </label>
                            <select
                              id="dest-select"
                              className="f-input"
                              value={selectedDestinationId}
                              onChange={(e) => setSelectedDestinationId(e.target.value)}
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
                        </fieldset>
                      )}

                      {/* 5. TRANSFER QUANTITY */}
                      {selectedOriginId && selectedDestinationId && (
                        <fieldset>
                          <legend>Cantidad</legend>
                          <div className="f-group f-group--full">
                            <label className="f-label" htmlFor="qty-input">
                              Cantidad a Transferir <span style={{ color: 'var(--err)' }}>*</span>
                              <span style={{ marginLeft: '0.5rem', color: 'var(--ink-40)', fontWeight: 'normal', fontSize: '0.75rem' }}>(Máximo disponible: {maxAllowedQuantity} uds)</span>
                            </label>
                            <input
                              id="qty-input"
                              className="f-input"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={transferQuantity}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '')
                                setTransferQuantity(raw)
                              }}
                              placeholder="Ej. 5"
                            />
                          </div>
                        </fieldset>
                      )}

                      {/* 6. ACKNOWLEDGEMENTS */}
                      {selectedOriginId && selectedDestinationId && (
                        <fieldset>
                          <legend>Confirmaciones</legend>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {selectedProduct.requires_cold_chain && (
                              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--ink)' }}>
                                <input
                                  type="checkbox"
                                  checked={coldChainAck}
                                  onChange={(e) => setColdChainAck(e.target.checked)}
                                  style={{ marginTop: 3 }}
                                  required
                                />
                                <span>
                                  ⚠️ <strong>Alerta de Cadena de Frío:</strong> Confirmo que conozco los requerimientos de refrigeración de este producto y aseguro las condiciones de temperatura durante su traslado.
                                </span>
                              </label>
                            )}

                            {typeof selectedProduct.category === 'object' && selectedProduct.category !== null && (selectedProduct.category as any).requires_serial_number && (
                              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--ink)' }}>
                                <input
                                  type="checkbox"
                                  checked={electricalSafetyAck}
                                  onChange={(e) => setElectricalSafetyAck(e.target.checked)}
                                  style={{ marginTop: 3 }}
                                  required
                                />
                                <span>
                                  ⚡ <strong>Seguridad Eléctrica:</strong> Confirmo la revisión técnica de seguridad eléctrica en equipos y la firma de actas de calibración operacional correspondientes.
                                </span>
                              </label>
                            )}
                          </div>
                        </fieldset>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={saving || !selectedProduct || !selectedOriginId || !selectedDestinationId}
                      style={{ opacity: saving ? 0.7 : 1 }}
                    >
                      {saving ? 'Transfiriendo…' : 'Confirmar Transferencia'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}

export default TransfersPage
