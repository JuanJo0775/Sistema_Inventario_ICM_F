import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { extractApiError } from '../../hooks/useApiError'

import {
  AlertTriangle,
  CheckCircle2,
  CheckIcon,
  ClipboardCheck,
  FileDown,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { Button } from '../../components/ui/button'
import { BarcodeScannerButton } from '../../components/ui/BarcodeScannerButton'
import { ModalPortal } from '../../components/ui/ModalPortal'

import type {
  CartItem,
  DispatchLocation,
  DispatchMovement,
} from '../../interfaces/dispatch'
import type { CatalogProduct } from '../../interfaces/catalog'
import type { BarcodeProductResult } from '../../services/barcodeScanner'
import type { Combo } from '../../interfaces/combos'

import {
  downloadInvoicePdf,
  fetchDispatchOverview,
  submitCart,
  type CartSubmissionResult,
} from '../../services/dispatch'
import { fetchCombos } from '../../services/combos'
import useCatalogStore from '../../store/useCatalogStore'
import { ThermalReceipt, buildReceiptData, type ThermalReceiptData } from './ThermalReceipt'
import useAuthStore from '../../store/useAuthStore'

type DispatchForm = Readonly<{
  customerName: string
  customerDoc: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  note: string
  damageReason: string
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

const SALE_TYPES: Record<DispatchMode, string> = {
  wholesale: 'SALIDA_VENTA_MAYOR',
  retail: 'SALIDA_VENTA_MENOR',
  damage: 'SALIDA_DANO',
  expiry: 'SALIDA_VENCIMIENTO',
}

const STEP_LABELS = ['Tipo', 'Cliente', 'Productos', 'Confirmar'] as const
const TAX_RATE_DEFAULT = 19

function DispatchTypeSelector({ options, value, onChange }: DispatchTypeSelectorProps) {
  return (
    <div className="f-row f-row-2" role="group" aria-label="Tipo de salida">
      {options.map((option) => {
        const active = option.value === value
        return (
          <label
            key={option.value}
            style={{
              display: 'block',
              padding: 13,
              border: `2px solid ${active ? 'var(--teal-700)' : 'var(--ink-20)'}`,
              borderRadius: 'var(--r-md)',
              background: active ? 'rgba(26,107,114,.05)' : 'var(--white)',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="tipo"
              style={{ display: 'none' }}
              checked={active}
              onChange={() => onChange(option.value)}
            />
            <p style={{ fontWeight: 600, fontSize: 13, color: active ? 'var(--teal-700)' : 'var(--ink)' }}>
              {option.title}
            </p>
            <p style={{ fontSize: 11, color: 'var(--ink-40)', marginTop: 2 }}>
              {option.description}
            </p>
          </label>
        )
      })}
    </div>
  )
}

function toForm(): DispatchForm {
  return {
    customerName: '',
    customerDoc: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    note: '',
    damageReason: '',
  }
}

function createCartItem(
  product: CatalogProduct,
  qty: number,
  price: number,
  locationId: string,
): CartItem {
  const taxRate = product.tax_rate_pct ?? TAX_RATE_DEFAULT
  const subtotal = qty * price
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100
  return {
    tempId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity: qty,
    unitPrice: price,
    taxRate,
    discount: 0,
    subtotal,
    taxAmount,
    total: subtotal + taxAmount,
    locationId,
    lotCode: '',
    damageReason: '',
    note: '',
  }
}

const dispatchModes: DispatchModeOption[] = [
  { value: 'wholesale', title: 'Venta Mayor', description: 'Requiere datos cliente' },
  { value: 'retail', title: 'Venta Menor', description: 'Cliente opcional' },
  { value: 'damage', title: 'Daño', description: 'Baja con nota' },
  { value: 'expiry', title: 'Vencimiento', description: 'Baja por caducidad' },
]

function DispatchPage() {
  const { t } = useTranslation()

  const { products, fetchProducts } = useCatalogStore()
  const authUser = useAuthStore((s) => s.user)

  const [overview, setOverview] = useState<{
    locations: DispatchLocation[]
    recentMovements: DispatchMovement[]
  } | null>(null)
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('wholesale')
  const [form, setForm] = useState<DispatchForm>(toForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentMovements, setRecentMovements] = useState<DispatchMovement[]>([])
  const [submissionResult, setSubmissionResult] = useState<CartSubmissionResult | null>(null)
  const [thermalReceiptData, setThermalReceiptData] = useState<ThermalReceiptData | null>(null)

  const [productSearch, setProductSearch] = useState('')
  const [combos, setCombos] = useState<Combo[]>([])
  const [pendingProduct, setPendingProduct] = useState<CatalogProduct | null>(null)
  const [pendingQty, setPendingQty] = useState('1')
  const [pendingPrice, setPendingPrice] = useState('')
  const [pendingLocation, setPendingLocation] = useState('')
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)

  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const customerDataRequired = dispatchMode === 'wholesale'

  const loadOverview = async () => {
    setError(null)
    try {
      const data = await fetchDispatchOverview()
      setOverview(data)
      setRecentMovements(data.recentMovements)
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  useEffect(() => {
    loadOverview()
    fetchProducts({ page_size: 9999 })
    fetchCombos(false).then(setCombos).catch(() => {})
  }, [])

  const locations = overview?.locations ?? []

  const productLocations = useMemo(() => {
    if (!pendingProduct?.byLocation || pendingProduct.byLocation.length === 0) return locations
    const codes = new Set(pendingProduct.byLocation.map(l => l.location_code))
    const qtyByCode = new Map(pendingProduct.byLocation.map(l => [l.location_code, l.quantity]))
    return locations.filter(l => codes.has(l.code)).map(l => ({
      ...l,
      stockQty: qtyByCode.get(l.code) ?? 0,
    }))
  }, [pendingProduct, locations])

  const availableProducts = useMemo(() => {
    let list = products.filter((p) => p.is_active)
    if (dispatchMode === 'expiry') {
      list = list.filter((p) => p.requires_expiration)
    }
    return list
  }, [products, dispatchMode])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return availableProducts.slice(0, 50)
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)),
    )
  }, [availableProducts, productSearch])

  const searchResults = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    let productResults = filteredProducts
    const comboResults = combos.filter(
      (c) =>
        !c.deleted_at &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.sku.toLowerCase().includes(q)),
    )
    return { products: productResults, combos: comboResults }
  }, [filteredProducts, combos, productSearch])

  const priceAutoFill = useMemo(() => {
    if (!pendingProduct) return ''
    if (dispatchMode === 'wholesale' && pendingProduct.sale_price_wholesale != null) {
      return String(pendingProduct.sale_price_wholesale)
    }
    if (dispatchMode === 'retail' && pendingProduct.sale_price_retail != null) {
      return String(pendingProduct.sale_price_retail)
    }
    if (pendingProduct.sale_price_retail != null) return String(pendingProduct.sale_price_retail)
    return ''
  }, [pendingProduct, dispatchMode])

  useEffect(() => {
    if (pendingProduct && !pendingPrice) {
      setPendingPrice(priceAutoFill)
    }
  }, [pendingProduct])

  const cartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0)
    const tax = cartItems.reduce((s, i) => s + i.taxAmount, 0)
    const total = cartItems.reduce((s, i) => s + i.total, 0)
    const qty = cartItems.reduce((s, i) => s + i.quantity, 0)
    return { subtotal, tax, total, qty }
  }, [cartItems])

  const currentStep = useMemo(() => {
    if (customerDataRequired && (!form.customerName.trim() || !form.customerDoc.trim())) return 1
    if (cartItems.length === 0) return 2
    return 3
  }, [customerDataRequired, form.customerName, form.customerDoc, cartItems.length])

  const canConfirm = useMemo(() => {
    if (customerDataRequired && (!form.customerName.trim() || !form.customerDoc.trim())) return false
    if (cartItems.length === 0) return false
    for (const item of cartItems) {
      if (!item.locationId) return false
      if (item.quantity <= 0) return false
    }
    return true
  }, [customerDataRequired, form.customerName, form.customerDoc, cartItems])

  const customerErrors = useMemo(() => {
    if (!customerDataRequired) return []
    const errors: string[] = []
    if (!form.customerName.trim()) errors.push('Razón social / Nombre')
    if (!form.customerDoc.trim()) errors.push('NIT / Documento')
    return errors
  }, [customerDataRequired, form.customerName, form.customerDoc])

  const confirmBlockReason = useMemo(() => {
    if (customerErrors.length > 0) return `Completa los campos obligatorios del cliente: ${customerErrors.join(' y ')}`
    if (cartItems.length === 0) return 'Agrega al menos un producto al carrito'
    return null
  }, [customerErrors, cartItems.length])

  useEffect(() => {
    if (pendingProduct && !pendingLocation && productLocations.length > 0) {
      setPendingLocation(productLocations[0].id)
    }
  }, [pendingProduct, pendingLocation, productLocations])

  const handleSelectProduct = useCallback((product: CatalogProduct, fromScan = false) => {
    setPendingProduct(product)
    setPendingQty('1')
    setPendingPrice('')
    setPendingLocation('')
    setProductSearch('')
    if (!fromScan) setLastScannedBarcode(null)
  }, [])

  function handleSelectCombo(combo: Combo) {
    let added = 0
    for (const component of combo.components) {
      const product = products.find((p) => p.id === component.product)
      if (!product) continue
      const locationId = pendingLocation || locations[0]?.id || ''
      if (!locationId) {
        toast.error('Selecciona una ubicación antes de agregar un combo')
        return
      }
      const price =
        dispatchMode === 'wholesale' && product.sale_price_wholesale != null
          ? product.sale_price_wholesale
          : product.sale_price_retail ?? 0
      const item = createCartItem(product, component.quantity, price, locationId)
      setCartItems((prev) => [...prev, item])
      added++
    }
    if (added > 0) {
      toast.success(`Combo "${combo.name}" agregado (${added} productos)`)
    }
    setProductSearch('')
  }

  const handleProductScanned = useCallback((result: BarcodeProductResult) => {
    setLastScannedBarcode(result.barcode ?? result.sku ?? null)
    const match = availableProducts.find(
      (p) =>
        p.id === String(result.id) ||
        p.sku.toLowerCase() === result.sku?.toLowerCase() ||
        (result.barcode && p.barcode && p.barcode === result.barcode),
    )
    if (match) {
      handleSelectProduct(match, true)
    } else {
      const fallback: CatalogProduct = {
        id: String(result.id),
        name: result.name,
        sku: result.sku,
        category: String(result.category ?? ''),
        category_slug: result.category_name?.toLowerCase().replace(/\s+/g, '-') ?? '',
        subcategory: null,
        barcode: result.barcode,
        brand: '',
        expiration_date: null,
        requires_expiration: false,
        requires_lot: false,
        requires_serial_number: result.requires_serial_number ?? false,
        special_conditions: false,
        requires_cold_chain: result.requires_cold_chain ?? false,
        is_active: true,
        weight_grams: null,
        notes: '',
        reorder_point: 0,
        stockTotal: result.stockTotal ?? 0,
        sale_price_retail: 0,
        sale_price_wholesale: 0,
        tax_rate_pct: 19,
      }
      handleSelectProduct(fallback, true)
    }
  }, [availableProducts, handleSelectProduct])

  function handleAddToCart() {
    if (!pendingProduct) return
    const qty = Number(pendingQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    if (!pendingLocation) {
      toast.error('Selecciona una ubicación de origen')
      return
    }
    const price = pendingPrice ? Number(pendingPrice) : 0
    const item = createCartItem(pendingProduct, qty, price, pendingLocation)
    if (lastScannedBarcode) {
      item.scannedCode = lastScannedBarcode
    }
    if (dispatchMode === 'damage') {
      item.damageReason = form.damageReason
    }
    item.note = form.note
    setCartItems((prev) => [...prev, item])
    setPendingProduct(null)
    setPendingQty('1')
    setPendingPrice('')
    setPendingLocation('')
    setLastScannedBarcode(null)
    toast.success(`${pendingProduct.name} agregado al carrito`)
  }

  function handleRemoveItem(tempId: string) {
    setCartItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }

  function handleClearCart() {
    setCartItems([])
    setSubmissionResult(null)
    setError(null)
    setThermalReceiptData(null)
  }

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSaving(true)
    setError(null)
    setSubmissionResult(null)
    try {
      const customerData = customerDataRequired
        ? {
            customer_name: form.customerName.trim(),
            customer_email: form.customerEmail.trim() || `${form.customerDoc.trim()}@cliente.com`,
            customer_phone: form.customerPhone.trim() || '0000000000',
            customer_address: form.customerAddress.trim() || 'Sin dirección',
            customer_doc: form.customerDoc.trim() || undefined,
            privacy_notice_acknowledged: true,
          }
        : null

      const items = cartItems.map((item) => ({
        productId: item.productId,
        locationId: item.locationId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || null,
        movementType: SALE_TYPES[dispatchMode],
        scannedCode: item.scannedCode ?? null,
        orderSku: item.scannedCode ? item.sku : null,
        serialNumber: null,
        note: item.note || item.damageReason || '',
      }))

      const result = await submitCart(items, customerData)

      const cName = customerData?.customer_name ?? ''
      const cDoc = customerData?.customer_doc ?? ''

      const operatorName = authUser
        ? [authUser.first_name, authUser.last_name].filter(Boolean).join(' ') || authUser.username
        : '---'

      const receipt = buildReceiptData({
        invoiceNumber: result.invoiceNumber,
        customerName: cName,
        customerDoc: cDoc,
        items: cartItems.map((ci) => ({
          productName: ci.productName,
          sku: ci.sku,
          quantity: ci.quantity,
          unitPrice: ci.unitPrice,
          taxRate: ci.taxRate,
          discount: ci.discount,
          subtotal: ci.subtotal,
          taxAmount: ci.taxAmount,
          total: ci.total,
        })),
        subtotal: cartSummary.subtotal,
        tax: cartSummary.tax,
        discount: 0,
        total: cartSummary.total,
        mode: dispatchMode === 'retail' ? 'retail' : 'wholesale',
        operator: operatorName,
      })

      setRecentMovements((current) => [...result.movements, ...current])
      setSubmissionResult(result)
      setThermalReceiptData(receipt)
      setCartItems([])
      setForm(toForm())
      toast.success(`${result.movements.length} salida(s) registrada(s) exitosamente`)
    } catch (err) {
      setError(extractApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!submissionResult?.movements[0]) return
    const mov = submissionResult.movements[0]
    try {
      await downloadInvoicePdf(mov.id, mov.invoiceNumber ?? 'ICM-PDF')
    } catch (err) {
      setError(extractApiError(err))
    }
  }

  const isSale = dispatchMode === 'wholesale' || dispatchMode === 'retail'

  return (
    <AppShell
      title={t("dispatch.title")}
      subtitle="RF-006 · BR-08 · BR-13"
      actions={
        <Button variant="ghost" size="sm" onClick={loadOverview}>
          {t("common.actions.refresh")}
        </Button>
      }
    >
      <div className="page-body reception-page">

        {/* Step tracker */}
        <nav className="step-track" aria-label="Progreso del despacho">
          {STEP_LABELS.map((label, i) => {
            let cls = 'step-item'
            if (i < currentStep) cls += ' step-item--done'
            else if (i === currentStep) cls += ' step-item--active'
            return (
              <div key={label} className={cls} aria-current={i === currentStep ? 'step' : undefined}>
                <div className="step-num">
                  {i < currentStep ? <CheckIcon size={12} /> : i + 1}
                </div>
                <span>{label}</span>
              </div>
            )
          })}
        </nav>

        {error ? (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 18 }}>
            <AlertTriangle />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Invoice preview modal */}
        {submissionResult && thermalReceiptData && (
          <ModalPortal onClose={handleClearCart}>
            <div
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                width: '100%',
                maxWidth: 600,
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid var(--ink-06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--ink-40)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.5px', margin: 0 }}>
                      ICM · RNF-006
                    </p>
                    <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 22, fontWeight: 400, margin: '4px 0' }}>
                      Factura de venta
                    </h2>
                    {submissionResult.invoiceNumber && (
                      <p style={{ fontSize: 13, color: 'var(--teal-700)', fontFamily: 'var(--ff-mono)', margin: '2px 0 0' }}>
                        #{submissionResult.invoiceNumber}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 size={32} style={{ color: 'var(--ok)', flexShrink: 0 }} />
                </div>
              </div>

              {/* Body — thermal receipt preview */}
              <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', justifyContent: 'center', background: '#f5f5f5' }}>
                <div style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.12)', maxWidth: '100%' }}>
                  <ThermalReceipt data={thermalReceiptData} />
                </div>
              </div>

              {/* Footer — actions */}
              <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--ink-06)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" onClick={handleClearCart}>
                  Salir
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                  <FileDown /> Descargar factura
                </Button>
                <Button size="sm" onClick={() => window.print()}>
                  <Printer /> Imprimir factura
                </Button>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Print portal — hidden during screen, visible on @media print */}
        {thermalReceiptData && createPortal(
          <div id="thermal-receipt-root">
            <ThermalReceipt data={thermalReceiptData} />
          </div>,
          document.body,
        )}

        <div className="dispatch-layout">

          {/* ─── Left panel ─── */}
          <div>

            {/* Tipo de salida */}
            <div className="s-head">
              <span className="s-head__label">Tipo de salida</span>
              <div className="s-head__rule" />
            </div>
            <DispatchTypeSelector
              options={dispatchModes}
              value={dispatchMode}
              onChange={(m) => { setDispatchMode(m); setPendingProduct(null); setForm(toForm()) }}
            />

            <div className="c-divider" style={{ marginTop: 0 }} />

            {/* ─── Product search (always visible) ─── */}
            <div className="s-head">
              <span className="s-head__label">Buscar producto</span>
              <div className="s-head__rule" />
              {cartItems.length > 0 && (
                <span className="pill pill--ok s-head__action">{cartItems.length} item(s)</span>
              )}
            </div>

            <div className="f-group">
              <label className="f-label">Producto</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-40)' }} />
                  <input
                    className="f-input"
                    value={productSearch}
                    placeholder="Buscar por nombre, SKU o código de barras..."
                    onChange={(e) => { setProductSearch(e.target.value); if (!e.target.value) setPendingProduct(null) }}
                    style={{ paddingLeft: 34 }}
                  />
                </div>
                <BarcodeScannerButton
                  label="Escanear"
                  onProductFound={handleProductScanned}
                />
              </div>

              {/* Product / Combo dropdown */}
              {!pendingProduct && (searchResults.products.length > 0 || searchResults.combos.length > 0) && (
                <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', border: '1px solid var(--ink-12)', borderRadius: 8, maxHeight: 240, overflowY: 'auto', background: 'var(--white)' }}>
                  {searchResults.products.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--ink-06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--teal-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <span className="sku">{p.sku}</span>
                    </li>
                  ))}
                  {searchResults.combos.map((c) => (
                    <li
                      key={`combo-${c.id}`}
                      onClick={() => handleSelectCombo(c)}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--ink-06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--amber-bg)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--amber-lt)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--amber-bg)'}
                    >
                      <span>
                        <span className="pill pill--amber" style={{ fontSize: 10, marginRight: 6 }}>COMBO</span>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                      </span>
                      <span className="sku">{c.sku}</span>
                    </li>
                  ))}
                </ul>
              )}
              {productSearch && searchResults.products.length === 0 && searchResults.combos.length === 0 && !pendingProduct && (
                <p style={{ fontSize: 12, color: 'var(--ink-40)', marginTop: 4 }}>Sin coincidencias</p>
              )}
            </div>

            {/* ─── Pending product config (selected product, about to add to cart) ─── */}
            {pendingProduct && (
              <div style={{ background: 'var(--teal-50)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 16, border: '1px solid var(--teal-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{pendingProduct.name}</p>
                    <p className="sku">{pendingProduct.sku}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ padding: '2px 8px', fontSize: 11 }}
                    onClick={() => { setPendingProduct(null); setPendingQty('1'); setPendingPrice(''); setPendingLocation('') }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="f-row f-row-2" style={{ marginBottom: 10 }}>
                  <div className="f-group">
                    <label className="f-label" htmlFor="cart-qty">Cantidad</label>
                    <input
                      id="cart-qty"
                      className="f-input"
                      type="number"
                      min="1"
                      value={pendingQty}
                      onChange={(e) => setPendingQty(e.target.value)}
                    />
                  </div>

                  {isSale && (
                    <div className="f-group">
                      <label className="f-label" htmlFor="cart-price">P/U</label>
                      <input
                        id="cart-price"
                        className="f-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={pendingPrice}
                        placeholder={priceAutoFill || '0'}
                        onChange={(e) => setPendingPrice(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="f-group">
                    <label className="f-label" htmlFor="cart-loc">Ubicación</label>
                    <select
                      id="cart-loc"
                      className="f-input"
                      value={pendingLocation}
                      onChange={(e) => setPendingLocation(e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {productLocations.map((loc: any) => (
                        <option key={loc.id} value={loc.id}>{loc.code} — {loc.name}{loc.stockQty !== undefined ? ` (${loc.stockQty} uds)` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {pendingProduct.stockTotal != null && Number(pendingQty) > pendingProduct.stockTotal && (
                  <div className="notice notice--err" style={{ marginBottom: 10 }}>
                    <AlertTriangle />
                    <div>
                      <p className="notice__title">Stock insuficiente</p>
                      <p className="notice__body">Solo hay {pendingProduct.stockTotal} unidades disponibles.</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleAddToCart}
                  disabled={
                    !Number.isFinite(Number(pendingQty)) || Number(pendingQty) <= 0 ||
                    !pendingLocation ||
                    (pendingProduct.stockTotal != null && Number(pendingQty) > pendingProduct.stockTotal)
                  }
                >
                  <Plus /> Agregar al carrito
                </button>
              </div>
            )}

            {/* ─── Cart table ─── */}
            {cartItems.length > 0 && (
              <>
                <div className="c-divider" />
                <div className="s-head">
                  <span className="s-head__label">Carrito ({cartSummary.qty} unidades)</span>
                  <div className="s-head__rule" />
                  <button
                    type="button"
                    className="btn btn--ghost s-head__action"
                    style={{ fontSize: 11, color: 'var(--err)' }}
                    onClick={() => { if (window.confirm('¿Vaciar carrito?')) setCartItems([]) }}
                  >
                    <Trash2 size={12} /> Vaciar
                  </button>
                </div>

                <div className="table-surface" style={{ marginBottom: 16 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Producto</th>
                        <th scope="col">SKU</th>
                        <th scope="col">Cant.</th>
                        {isSale && <th scope="col">P/U</th>}
                        {isSale && <th scope="col">Subtotal</th>}
                        <th scope="col">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, i) => (
                        <tr key={item.tempId}>
                          <td className="text-mono" style={{ width: 30 }}>{i + 1}</td>
                          <td>
                            <span className="sku">{item.productName}</span>
                          </td>
                          <td className="text-mono">{item.sku}</td>
                          <td className="text-mono" style={{ fontWeight: 600 }}>{item.quantity}</td>
                          {isSale && <td className="text-mono">${item.unitPrice.toFixed(2)}</td>}
                          {isSale && <td className="text-mono" style={{ fontWeight: 600 }}>${item.subtotal.toFixed(2)}</td>}
                          <td>
                            <button
                              type="button"
                              className="btn btn--ghost"
                              style={{ padding: '2px 6px', color: 'var(--err)' }}
                              onClick={() => handleRemoveItem(item.tempId)}
                              aria-label={`Eliminar ${item.productName}`}
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                {isSale && (
                  <div style={{ background: 'var(--ink-03)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Subtotal</span>
                      <span className="text-mono">${cartSummary.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>IVA 19%</span>
                      <span className="text-mono">${cartSummary.tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--ink-12)', paddingTop: 6, marginTop: 4 }}>
                      <span>Total</span>
                      <span className="text-mono">${cartSummary.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="dispatch-actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => { setCartItems([]); setError(null) }}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn--amber btn--lg"
                      onClick={handleConfirm}
                      disabled={!canConfirm || saving}
                    >
                      <ClipboardCheck />
                      {saving ? 'Registrando...' : 'Confirmar y generar factura(s)'}
                    </button>
                    {!canConfirm && confirmBlockReason && !saving && (
                      <p style={{ fontSize: 11, color: 'var(--err)', textAlign: 'right', lineHeight: 1.3, maxWidth: 220, marginLeft: 'auto' }}>
                        {confirmBlockReason}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Empty state when no product selected and no cart items */}
            {!pendingProduct && cartItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-40)', fontSize: 13 }}>
                Busca y agrega productos al carrito para continuar
              </div>
            )}

          </div>

          {/* ─── Right panel: Customer / damage / notes ─── */}
          <aside>
            <div className="s-head">
              <span className="s-head__label">
                {isSale ? 'Cliente receptor' : 'Información adicional'}
              </span>
              <div className="s-head__rule" />
            </div>
            <div className="form-surface">
              {isSale && (
                <fieldset>
                  <legend>Datos del cliente — Ley 1581</legend>
                  <div className="f-group dispatch-customer-field">
                    <label className="f-label" htmlFor="cli-name">Razón social / Nombre {customerDataRequired && <span style={{ color: 'var(--err)' }}>*</span>}</label>
                    <input
                      id="cli-name"
                      className={`f-input${customerDataRequired && !form.customerName.trim() ? ' input--err' : ''}`}
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      placeholder={customerDataRequired ? 'Obligatorio' : 'Opcional'}
                      required={customerDataRequired}
                    />
                    {customerDataRequired && !form.customerName.trim() && (
                      <p className="field-err">Campo obligatorio para venta al por mayor</p>
                    )}
                  </div>
                  {customerDataRequired && (
                    <div className="f-group dispatch-customer-field">
                      <label className="f-label" htmlFor="cli-doc">NIT / Documento *</label>
                      <input
                        id="cli-doc"
                        className={`f-input${!form.customerDoc.trim() ? ' input--err' : ''}`}
                        value={form.customerDoc}
                        onChange={(e) => setForm((f) => ({ ...f, customerDoc: e.target.value }))}
                        placeholder="NIT 900.123.456-7"
                        required
                      />
                      {!form.customerDoc.trim() && (
                        <p className="field-err">Campo obligatorio para venta al por mayor</p>
                      )}
                    </div>
                  )}
                  {!customerDataRequired && (
                    <div className="f-group dispatch-customer-field">
                      <label className="f-label" htmlFor="cli-doc">Documento</label>
                      <input id="cli-doc" className="f-input" value={form.customerDoc} onChange={(e) => setForm((f) => ({ ...f, customerDoc: e.target.value }))} placeholder="Opcional" />
                    </div>
                  )}
                  <div className="f-group dispatch-customer-field">
                    <label className="f-label" htmlFor="cli-email">Correo</label>
                    <input id="cli-email" className="f-input" type="email" value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} placeholder="correo@cliente.com" />
                  </div>
                  <div className="f-group dispatch-customer-field">
                    <label className="f-label" htmlFor="cli-tel">Teléfono</label>
                    <input id="cli-tel" className="f-input" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} placeholder="300 123 4567" />
                  </div>
                  <div className="f-group dispatch-customer-field">
                    <label className="f-label" htmlFor="cli-dir">Dirección</label>
                    <input id="cli-dir" className="f-input" value={form.customerAddress} onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))} placeholder="Cra 12 #45-67, Armenia" />
                  </div>
                </fieldset>
              )}

              {/* Damage reason - always shown for damage mode */}
              {!isSale && (
                <div className="f-group" style={{ marginTop: isSale ? 14 : 0 }}>
                  <label className="f-label">Descripción del daño <span style={{ color: 'var(--err)' }}>*</span></label>
                  <textarea
                    className="f-input"
                    style={{ minHeight: 60, resize: 'vertical' }}
                    value={form.damageReason}
                    placeholder="Describe el motivo del daño..."
                    onChange={(e) => setForm((f) => ({ ...f, damageReason: e.target.value }))}
                  />
                </div>
              )}

              {/* Observations */}
              <div className="f-group" style={{ marginTop: 14 }}>
                <label className="f-label">Observaciones</label>
                <textarea
                  className="f-input"
                  style={{ minHeight: 50, resize: 'vertical' }}
                  value={form.note}
                  placeholder="Notas adicionales..."
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              <div className="notice notice--info" style={{ marginTop: 14 }}>
                <AlertTriangle />
                <div>
                  <p className="notice__title">Privacidad — Ley 1581</p>
                  <p className="notice__body">Datos tratados bajo la política de privacidad de ICM. RNF-006.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ─── Recent movements ─── */}
        <section aria-label="Movimientos recientes" style={{ marginTop: 32 }}>
          <div className="s-head">
            <span className="s-head__label">Movimientos recientes</span>
            <div className="s-head__rule" />
          </div>
          <div className="reception-movement-grid">
            {recentMovements.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-40)', padding: '12px 0' }}>Sin movimientos recientes</p>
            ) : (
              recentMovements.map((movement) => (
                <div key={movement.id} className="reception-movement rounded-lg" style={{ background: 'var(--white)', border: '1px solid var(--ink-12)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 14px', alignItems: 'start' }}>
                    <div>
                      <p className="prod-name" style={{ margin: 0, fontWeight: 600 }}>{movement.productName}</p>
                      <p className="prod-sub" style={{ margin: '3px 0 0' }}>
                        <span className="sku">{movement.sku}</span> · {movement.locationCode}
                      </p>
                    </div>
                    <strong className="text-mono">{movement.quantity} unidades</strong>
                    <time style={{ fontSize: 11, color: 'var(--ink-40)', fontFamily: 'var(--ff-mono)' }}>{movement.confirmedAt}</time>
                  </div>
                  {movement.invoiceNumber && (
                    <p style={{ gridColumn: '1 / -1', margin: '6px 0 0', fontSize: 11 }}>
                      Factura: {movement.invoiceNumber}{movement.customerName ? ` · ${movement.customerName}` : ''}
                    </p>
                  )}
                  {movement.note && <p style={{ gridColumn: '1 / -1', margin: '4px 0 0', fontSize: 11, fontStyle: 'italic' }}>{movement.note}</p>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default DispatchPage;
