import { useEffect, useState, useMemo, useCallback } from 'react'
import { AlertTriangle, X, Tag } from 'lucide-react'
import { ModalPortal } from '../../components/ui/ModalPortal'
import { BarcodeScannerButton } from '../../components/ui/BarcodeScannerButton'
import AppShell from '../../components/layout/AppShell'
import useComboStore from '../../store/useComboStore'
import { fetchCatalogProducts } from '../../services/catalog'
import { fetchProductStock } from '../../services/inventory'
import { useDebounce } from '../../hooks/useDebounce'
import { toast } from 'sonner'
import { extractApiError } from '../../hooks/useApiError'
import type { Combo, ComboCreateInput } from '../../interfaces/combos'
import type { CatalogProduct } from '../../interfaces/catalog'
import type { BarcodeProductResult } from '../../services/barcodeScanner'
import { useTranslation } from 'react-i18next'

const productName = (productById: Map<string, CatalogProduct>, id: string): string =>
  productById.get(id)?.name || id.slice(0, 8)

function CatalogCombosPage() {
  const { t } = useTranslation()
  const { combos, loading, error: storeError, fetchCombos, createCombo, updateCombo, deleteCombo, restoreCombo } =
    useComboStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'noStock' | 'inactive'>('all')
  const debouncedSearch = useDebounce(searchTerm, 150)

  const [products, setProducts] = useState<CatalogProduct[]>([])
  const productById = useMemo(() => {
    const map = new Map<string, CatalogProduct>()
    products.forEach((p) => map.set(p.id, p))
    return map
  }, [products])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [comboToDeactivate, setComboToDeactivate] = useState<Combo | null>(null)

  useEffect(() => {
    fetchCombos(true)
    fetchCatalogProducts({ include_inactive: true, page_size: 500 }).then(setProducts).catch(() => {})
  }, [fetchCombos])

  const filteredCombos = useMemo(() => {
    return combos.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.sku.toLowerCase().includes(debouncedSearch.toLowerCase())
      if (!matchSearch) return false
      switch (statusFilter) {
        case 'available':
          return !c.deleted_at && c.available_quantity > 0
        case 'noStock':
          return !c.deleted_at && c.available_quantity <= 0
        case 'inactive':
          return !!c.deleted_at
        default:
          return true
      }
    })
  }, [combos, debouncedSearch, statusFilter])

  const openCreateModal = () => {
    setEditingCombo(null)
    setIsModalOpen(true)
  }

  const openEditModal = (combo: Combo) => {
    setEditingCombo(combo)
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (combo: Combo) => {
    if (!combo.deleted_at) {
      setComboToDeactivate(combo)
    } else {
      try {
        await restoreCombo(combo.id)
        setSuccessMsg(t('catalog.combos.messages.restored'))
        toast.success(t('catalog.combos.messages.restored'))
      } catch (err: any) {
        setErrorMsg(extractApiError(err))
      }
    }
  }

  const confirmDeactivate = async () => {
    if (!comboToDeactivate) return
    const combo = comboToDeactivate
    setComboToDeactivate(null)
    try {
      await deleteCombo(combo.id)
      setSuccessMsg(t('catalog.combos.messages.deleted'))
      toast.success(t('catalog.combos.messages.deleted'))
    } catch (err: any) {
      setErrorMsg(extractApiError(err))
    }
  }

  const handleDuplicate = async (combo: Combo) => {
    const newName = `Copia de ${combo.name}`
    const newSku = `${combo.sku}-COPY`
    try {
      await createCombo({
        name: newName,
        sku: newSku,
        items: combo.components.map((item) => ({
          product_id: item.product,
          quantity: item.quantity,
        })),
        price_strategy: combo.price_strategy,
        fixed_price_retail: combo.fixed_price_retail,
        fixed_price_wholesale: combo.fixed_price_wholesale,
      })
      setSuccessMsg(t('catalog.combos.messages.created'))
      toast.success(t('catalog.combos.messages.created'))
    } catch (err: any) {
      setErrorMsg(extractApiError(err))
    }
  }

  return (
    <AppShell
      title={t('catalog.combos.title')}
      subtitle={t('catalog.combos.subtitle')}
      actions={
        <button className="btn btn--primary btn--sm" onClick={openCreateModal}>
          + {t('catalog.combos.new')}
        </button>
      }
    >
      <div className="catalog-page fade-slide-up">
        <div className="metric-strip mb-4" style={{ maxWidth: 700 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">{t('catalog.combos.stats.total')}</p>
            <p className="metric-cell__val">{combos.filter((c) => !c.deleted_at).length}</p>
            <p className="metric-cell__sub">{t('catalog.combos.subtitle').toLowerCase()}</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">{t('catalog.combos.stats.available')}</p>
            <p className="metric-cell__val" style={{ color: 'var(--ok)' }}>
              {combos.filter((c) => !c.deleted_at && c.available_quantity > 0).length}
            </p>
            <p className="metric-cell__sub">con stock</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">{t('catalog.combos.stats.noStock')}</p>
            <p className="metric-cell__val" style={{ color: 'var(--err)' }}>
              {combos.filter((c) => !c.deleted_at && c.available_quantity <= 0).length}
            </p>
            <p className="metric-cell__sub">sin stock</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">{t('catalog.combos.stats.inactive')}</p>
            <p className="metric-cell__val" style={{ color: combos.filter((c) => c.deleted_at).length > 0 ? 'var(--err)' : undefined }}>
              {combos.filter((c) => c.deleted_at).length}
            </p>
            <p className="metric-cell__sub">inactivos</p>
          </div>
        </div>

        {successMsg && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{successMsg}</span>
            <button className="alert-bar__close" onClick={() => setSuccessMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {(errorMsg || storeError) && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{errorMsg || storeError}</span>
            <button className="alert-bar__close" onClick={() => setErrorMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        <div className="flex gap-10 mb-4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
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
              placeholder={t('catalog.combos.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar combo"
            />
          </div>
          <select
            className="f-input"
            style={{ width: 'auto', minWidth: 160 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="available">Disponible</option>
            <option value="noStock">Sin stock</option>
            <option value="inactive">Inactivo</option>
          </select>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="btn btn--ghost btn--sm">
              Limpiar filtro
            </button>
          )}
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Cargando combos...</p>
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="empty-state">
            <Tag style={{ width: '48px', height: '48px', strokeWidth: 1, color: '#9ca3af', marginBottom: '1rem' }} />
            <p>{t('catalog.combos.empty')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
            {filteredCombos.map((combo) => (
              <ComboCard
                key={combo.id}
                combo={combo}
                productById={productById}
                t={t}
                onEdit={() => openEditModal(combo)}
                onToggleStatus={() => handleToggleStatus(combo)}
                onDuplicate={() => handleDuplicate(combo)}
              />
            ))}
          </div>
        )}

        {comboToDeactivate && (
          <ModalPortal onClose={() => setComboToDeactivate(null)}>
            <div
              style={{
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'var(--white)',
                borderRadius: 18,
                width: '100%',
                maxWidth: 440,
                padding: 24,
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(179,58,42,0.08)',
                    padding: '0.5rem',
                    borderRadius: '9999px',
                    color: 'var(--err)',
                  }}
                >
                  <AlertTriangle style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    {t('catalog.combos.messages.deleteConfirmTitle')}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-40)', marginTop: '0.25rem', marginBottom: 0 }}>
                    {t('catalog.combos.messages.deleteConfirmBody')}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => setComboToDeactivate(null)}>
                  {t('catalog.combos.messages.deleteConfirmCancel')}
                </button>
                <button className="btn btn--danger btn--sm" onClick={confirmDeactivate}>
                  {t('catalog.combos.messages.deleteConfirmAction')}
                </button>
              </div>
            </div>
          </ModalPortal>
        )}

        {isModalOpen && (
          <ComboFormModal
            key={editingCombo ? editingCombo.id : 'new'}
            combo={editingCombo}
            products={products}
            productById={productById}
            onClose={() => { setIsModalOpen(false); setEditingCombo(null) }}
            onSave={async (data) => {
              try {
                if (editingCombo) {
                  await updateCombo(editingCombo.id, data)
                  setSuccessMsg(t('catalog.combos.messages.updated'))
                  toast.success(t('catalog.combos.messages.updated'))
                } else {
                  await createCombo(data)
                  setSuccessMsg(t('catalog.combos.messages.created'))
                  toast.success(t('catalog.combos.messages.created'))
                }
                setIsModalOpen(false)
                setEditingCombo(null)
              } catch (err: any) {
                throw err
              }
            }}
            t={t}
          />
        )}
      </div>
    </AppShell>
  )
}

function ComboCard({
  combo,
  productById,
  t,
  onEdit,
  onToggleStatus,
  onDuplicate,
}: {
  combo: Combo
  productById: Map<string, CatalogProduct>
  t: (key: string, opts?: Record<string, unknown>) => string
  onEdit: () => void
  onToggleStatus: () => void
  onDuplicate: () => void
}) {
  const isInactive = !!combo.deleted_at
  const hasStock = combo.available_quantity > 0

  const badgeClass = isInactive ? 'pill--inactive' : hasStock ? 'pill--active' : 'pill--err'
  const badgeText = isInactive
    ? t('catalog.combos.card.inactive')
    : hasStock
      ? t('catalog.combos.card.available')
      : t('catalog.combos.card.noStock')

  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-06)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--ink-06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span className={`pill ${badgeClass}`}>{badgeText}</span>
        </div>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{combo.name}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-40)', fontFamily: 'var(--ff-mono)', margin: '4px 0 8px' }}>
          {combo.sku}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-60)', margin: '0 0 12px' }}>
          {t('catalog.combos.card.products', { count: combo.components.length })}
        </p>

        <div style={{ fontSize: '0.8rem', color: 'var(--ink-60)' }}>
          {combo.components.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>{productName(productById, item.product)} ×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--ink-06)', background: 'var(--ink-03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: 8 }}>
          <span>
            <span style={{ color: 'var(--ink-40)' }}>{t('catalog.combos.card.comboPrice')}:</span>{' '}
            <strong>${Number(combo.fixed_price_retail || 0).toLocaleString()}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn--ghost btn--sm" onClick={onEdit}>
            Editar
          </button>
          <button className="btn btn--warning btn--sm" onClick={onDuplicate}>
            Duplicar
          </button>
          <button
            className={`btn btn--sm ${combo.deleted_at ? '' : 'btn--danger'}`}
            onClick={onToggleStatus}
          >
            {combo.deleted_at ? 'Restaurar' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ComboFormModal({
  combo,
  products,
  productById,
  onClose,
  onSave,
  t,
}: {
  combo: Combo | null
  products: CatalogProduct[]
  productById: Map<string, CatalogProduct>
  onClose: () => void
  onSave: (data: ComboCreateInput) => Promise<void>
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const [name, setName] = useState(combo?.name || '')
  const [sku, setSku] = useState(combo?.sku || '')
  const [items, setItems] = useState<
    {
      product_id: string
      quantity: string
      product_name?: string
      product_sku?: string
      sale_price_retail?: number | null
      stock_available?: number
    }[]
  >(
    combo?.components.map((c) => {
      const p = productById.get(c.product)
      return {
        product_id: c.product,
        quantity: String(c.quantity),
        product_name: p?.name,
        product_sku: p?.sku,
        sale_price_retail: p?.sale_price_retail,
        stock_available: 0,
      }
    }) || [],
  )
  const [fixedPrice, setFixedPrice] = useState<string>(
    combo?.fixed_price_retail ? String(combo.fixed_price_retail) : '',
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  const totalProductPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.sale_price_retail ? Number(item.sale_price_retail) : 0
      return sum + price * (parseInt(item.quantity) || 0)
    }, 0)
  }, [items])

  const parsedFixedPrice = parseFloat(fixedPrice) || 0
  const discountPct = totalProductPrice > 0 ? Math.round(((totalProductPrice - parsedFixedPrice) / totalProductPrice) * 100) : 0

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    const addedIds = new Set(items.map((i) => i.product_id))
    const available = products.filter((p) => !addedIds.has(p.id) && p.is_active)
    if (!q) return available.slice(0, 5)
    return available.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
  }, [products, productSearch, items])

  const handleAddProduct = useCallback(async (product: CatalogProduct) => {
    let stock = 0
    try {
      const resp = await fetchProductStock(product.id)
      stock = resp.total
    } catch {}
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        quantity: '1',
        product_name: product.name,
        product_sku: product.sku,
        sale_price_retail: product.sale_price_retail,
        stock_available: stock,
      },
    ])
    setProductSearch('')
    setShowProductDropdown(false)
  }, [])

  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const handleQuantityChange = (productId: string, raw: string) => {
    if (raw !== '' && !/^\d+$/.test(raw)) return
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity: raw } : i)))
  }

  const handleQuantityBlur = (productId: string) => {
    setItems((prev) => prev.map((i) => {
      if (i.product_id !== productId) return i
      const qty = parseInt(i.quantity) || 1
      return { ...i, quantity: String(Math.max(1, qty)) }
    }))
  }

  const handleProductScanned = useCallback((scanned: BarcodeProductResult) => {
    const match = products.find(
      (p) =>
        p.id === String(scanned.id) ||
        p.sku.toLowerCase() === scanned.sku?.toLowerCase() ||
        (scanned.barcode && p.barcode?.toLowerCase() === scanned.barcode.toLowerCase()),
    )
    if (match && !items.some((i) => i.product_id === match.id)) {
      handleAddProduct(match)
    }
  }, [products, items, handleAddProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!name.trim()) {
      setValidationError('El nombre del combo es obligatorio.')
      return
    }
    if (!sku.trim()) {
      setValidationError('El SKU es obligatorio.')
      return
    }
    if (items.length < 2) {
      setValidationError(t('catalog.combos.form.minProducts'))
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        sku: sku.trim(),
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: parseInt(i.quantity) || 1,
        })),
        price_strategy: 'fixed',
        fixed_price_retail: parsedFixedPrice,
      })
    } catch (err: any) {
      setValidationError(extractApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalPortal onClose={onClose}>
      <div
        style={{
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--white)',
          borderRadius: 18,
          width: '100%',
          maxWidth: 720,
          boxShadow: '0 24px 64px rgba(15,30,32,.2)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--ink-06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0 }}>
            {combo ? t('catalog.combos.edit') : t('catalog.combos.new')}
          </h2>
          <button className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div style={{ overflow: 'auto', flex: 1, padding: 24 }}>
          {validationError && (
            <div className="alert-bar alert-bar--err" role="alert" style={{ marginBottom: 20 }}>
              <AlertTriangle style={{ width: 14, height: 14 }} />
              {validationError}
            </div>
          )}

          <form id="combo-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <fieldset>
              <legend>{t('catalog.combos.form.sectionBasic')}</legend>
              <div className="f-row f-row-2">
                <div className="f-group">
                  <label className="f-label" htmlFor="combo-name">
                    {t('catalog.combos.form.nameLabel')}
                  </label>
                  <input
                    id="combo-name"
                    className="f-input"
                    placeholder={t('catalog.combos.form.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="combo-sku">
                    {t('catalog.combos.form.skuLabel')}
                  </label>
                  <input
                    id="combo-sku"
                    className="f-input"
                    placeholder={t('catalog.combos.form.skuPlaceholder')}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>{t('catalog.combos.form.sectionProducts')}</legend>

              <div className="f-group" style={{ marginBottom: 12 }}>
                <label className="f-label">{t('catalog.combos.form.searchProduct')}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="f-input"
                      placeholder={t('catalog.combos.form.searchPlaceholder')}
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(true)
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                    />
                    {showProductDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'var(--white)',
                          border: '1px solid var(--ink-06)',
                          borderRadius: 8,
                          boxShadow: '0 8px 24px rgba(15,30,32,.12)',
                          zIndex: 20,
                          maxHeight: 220,
                          overflowY: 'auto',
                        }}
                      >
                        {!productSearch.trim() && filteredProducts.length > 0 && (
                          <div style={{ padding: '6px 16px', color: 'var(--ink-40)', fontSize: '0.75rem', borderBottom: '1px solid var(--ink-06)' }}>
                            Mostrando 5 productos — escribe para filtrar
                          </div>
                        )}
                        {filteredProducts.length === 0 ? (
                          <div style={{ padding: '12px 16px', color: 'var(--ink-40)', fontSize: '0.85rem' }}>
                            {t('catalog.combos.form.noResults')}
                          </div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 16px',
                                border: 'none',
                                borderBottom: '1px solid var(--ink-06)',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                              onMouseDown={() => handleAddProduct(p)}
                            >
                              <strong>{p.name}</strong>{' '}
                              <span style={{ color: 'var(--ink-40)', fontFamily: 'var(--ff-mono)' }}>{p.sku}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <BarcodeScannerButton label="Escanear" onProductFound={handleProductScanned} />
                </div>
              </div>

              {items.length > 0 && (
                <div className="table-surface" style={{ marginBottom: 8 }}>
                  <div className="table-wrap">
                    <table className="data-table" style={{ minWidth: 550 }}>
                      <thead>
                        <tr>
                          <th>{t('catalog.combos.form.itemProduct')}</th>
                          <th>{t('catalog.combos.form.itemSku')}</th>
                          <th style={{ width: 70, textAlign: 'center' }}>Precio unit.</th>
                          <th style={{ width: 70, textAlign: 'center' }}>{t('catalog.combos.form.itemQuantity')}</th>
                          <th style={{ width: 70, textAlign: 'center' }}>{t('catalog.combos.form.itemStock')}</th>
                          <th style={{ width: 70, textAlign: 'center' }}>Subtotal</th>
                          <th style={{ width: 50 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const unitPrice = item.sale_price_retail ? Number(item.sale_price_retail) : 0
                          const qty = parseInt(item.quantity) || 0
                          const subtotal = unitPrice * qty
                          return (
                            <tr key={item.product_id}>
                              <td style={{ fontWeight: 500, color: 'var(--ink)' }}>
                                {item.product_name || item.product_id.slice(0, 8)}
                              </td>
                              <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>
                                {item.product_sku || '-'}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: 12 }}>
                                ${unitPrice.toLocaleString()}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="f-input"
                                  style={{ width: 64, textAlign: 'center', padding: '4px 8px' }}
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                                  onBlur={() => handleQuantityBlur(item.product_id)}
                                />
                              </td>
                              <td style={{ textAlign: 'center', fontSize: 12, fontFamily: 'var(--ff-mono)' }}>
                                {item.stock_available !== undefined ? `${item.stock_available}u` : '-'}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: 12, fontFamily: 'var(--ff-mono)' }}>
                                ${subtotal.toLocaleString()}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => handleRemoveItem(item.product_id)}
                                  style={{ color: 'var(--err)' }}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>{t('catalog.combos.form.sectionPricing')}</legend>
              <div className="f-row f-row-2">
                <div className="f-group">
                  <label className="f-label">Precio total de los productos</label>
                  <div className="f-input" style={{ background: 'var(--ink-03)', cursor: 'default' }}>
                    ${totalProductPrice.toLocaleString()}
                  </div>
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="combo-price">
                    {t('catalog.combos.form.comboPriceLabel')}
                  </label>
                  <input
                    id="combo-price"
                    type="text"
                    inputMode="decimal"
                    className="f-input"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="f-row f-row-2">
                <div className="f-group">
                  <label className="f-label">{t('catalog.combos.form.discountLabel')}</label>
                  <div
                    className="f-input"
                    style={{
                      background: 'var(--ink-03)',
                      cursor: 'default',
                      color: discountPct > 0 ? 'var(--ok)' : 'var(--ink-40)',
                    }}
                  >
                    {discountPct > 0 ? `-${discountPct}%` : '0%'}
                  </div>
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--ink-06)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            flexShrink: 0,
            background: 'var(--white)',
          }}
        >
          <button type="button" className="btn btn--outline" onClick={onClose}>
            {t('catalog.combos.form.cancel')}
          </button>
          <button type="submit" form="combo-form" className="btn btn--primary" disabled={saving}>
            {saving ? 'Guardando...' : t('catalog.combos.form.save')}
          </button>
        </div>
      </div>
    </ModalPortal>
  )
}

export default CatalogCombosPage
