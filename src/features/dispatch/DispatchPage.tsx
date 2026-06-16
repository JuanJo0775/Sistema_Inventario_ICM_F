import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { extractApiError } from '../../hooks/useApiError'
import { useDebounce } from '../../hooks/useDebounce'

import {
  AlertTriangle,
  CheckCircle2,
  CheckIcon,
  ClipboardCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'

import AppShell from '../../components/layout/AppShell'
import { Button } from '../../components/ui/button'
import { BarcodeScannerButton } from '../../components/ui/BarcodeScannerButton'

import type {
  CartItem,
  DispatchLocation,
  DispatchMovement,
} from '../../interfaces/dispatch'
import type { CatalogProduct } from '../../interfaces/catalog'
import type { BarcodeProductResult } from '../../services/barcodeScanner'
import type { BillingInvoice, BillingInvoiceCreatePayload } from '../../interfaces/billing'
import type { InventoryStockByProduct } from '../../interfaces/inventory'

import {
  fetchDispatchOverview,
  submitCart,
  type CartSubmissionResult,
} from '../../services/dispatch'
import { fetchProductStock } from '../../services/inventory'
import { createInvoice } from '../../services/billing'
import InvoiceResultModal from '../billing/InvoiceResultModal'
import useCatalogStore from '../../store/useCatalogStore'

const CUSTOMER_STORAGE_KEY = 'icm_last_customer'
const MIN_DAMAGE_REASON_LENGTH = 10

type DispatchForm = Readonly<{
  customerName: string
  customerDoc: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  note: string
  damageReason: string
  expiryLotCode: string
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

type FieldErrors = Record<string, string>

type LastCustomer = {
  name: string
  doc: string
  email: string
  phone: string
  address: string
}

const SALE_TYPES: Record<DispatchMode, string> = {
  wholesale: 'SALIDA_VENTA_MAYOR',
  retail: 'SALIDA_VENTA_MENOR',
  damage: 'SALIDA_DANO',
  expiry: 'SALIDA_VENCIMIENTO',
}

const STEP_LABELS = ['Tipo', 'Cliente', 'Productos', 'Confirmar'] as const
const TAX_RATE_DEFAULT = 19

const dispatchModes: DispatchModeOption[] = [
  { value: 'wholesale', title: 'Venta Mayor', description: 'Requiere datos cliente' },
  { value: 'retail', title: 'Venta Menor', description: 'Cliente opcional' },
  { value: 'damage', title: 'Daño', description: 'Baja con nota' },
  { value: 'expiry', title: 'Vencimiento', description: 'Baja por caducidad' },
]

/* ─── Helpers ─── */

function loadLastCustomer(): LastCustomer | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LastCustomer) : null
  } catch {
    return null
  }
}

function saveLastCustomer(data: LastCustomer): void {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data))
  } catch { /* quota exceeded — ignore */ }
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
    expiryLotCode: '',
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

/* ─── DispatchTypeSelector ─── */

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

/* ─── Main component ─── */

function DispatchPage() {
  const { t } = useTranslation()

  const { products, fetchProducts } = useCatalogStore()
  const formRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

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
  const [invoiceResult, setInvoiceResult] = useState<BillingInvoice | null>(null)

  const [productSearch, setProductSearch] = useState('')
  const debouncedSearch = useDebounce(productSearch, 300)
  const [pendingProduct, setPendingProduct] = useState<CatalogProduct | null>(null)
  const [pendingQty, setPendingQty] = useState('1')
  const [pendingPrice, setPendingPrice] = useState('')
  const [pendingLocation, setPendingLocation] = useState('')
  const [pendingLotCode, setPendingLotCode] = useState('')

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [coldChainAck, setColdChainAck] = useState(false)
  const [electricalSafetyAck, setElectricalSafetyAck] = useState(false)

  /* ─── BUG-D1 / D2: Stock state ─── */
  const [productStock, setProductStock] = useState<InventoryStockByProduct | null>(null)
  const [stockLoading, setStockLoading] = useState(false)

  /* ─── BUG-D4: Validation errors & customer suggestion ─── */
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [suggestCustomer, setSuggestCustomer] = useState<LastCustomer | null>(null)

  /* ─── Reset stock when selected product changes ─── */
  useEffect(() => {
    if (!pendingProduct) {
      setProductStock(null)
      setPendingLocation('')
      return
    }
    let cancelled = false
    setStockLoading(true)
    setProductStock(null)
    setPendingLocation('')
    fetchProductStock(pendingProduct.id)
      .then((stock) => {
        if (!cancelled) {
          setProductStock(stock)
          setStockLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setStockLoading(false)
      })
    return () => { cancelled = true }
  }, [pendingProduct])

  /* ─── Load last customer suggestion on wholesale ─── */
  useEffect(() => {
    if (dispatchMode === 'wholesale') {
      const last = loadLastCustomer()
      setSuggestCustomer(last)
    } else {
      setSuggestCustomer(null)
    }
  }, [dispatchMode])

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
  }, [])

  useEffect(() => {
    if (debouncedSearch) {
      fetchProducts({ page_size: 9999, search: debouncedSearch })
    }
  }, [debouncedSearch])

  const locations = overview?.locations ?? []

  /* ─── Build stock map: location_id → quantity ─── */
  const stockByLocation = useMemo(() => {
    const map = new Map<string, number>()
    if (!productStock) return map
    const entries = productStock.by_location ?? productStock.per_location ?? []
    for (const entry of entries) {
      const locId = entry.location_id ?? entry.location_code
      if (locId) map.set(locId, entry.quantity)
    }
    return map
  }, [productStock])

  const stockAvailableForSelectedLocation = pendingLocation ? (stockByLocation.get(pendingLocation) ?? 0) : 0

  const availableProducts = useMemo(() => {
    let list = products.filter((p) => p.is_active)
    if (dispatchMode === 'expiry') {
      list = list.filter((p) => p.requires_expiration)
    }
    return list
  }, [products, dispatchMode])

  const requiresColdChainAck = useMemo(() =>
    cartItems.some((item) => {
      const p = availableProducts.find((ap) => ap.id === item.productId)
      return !!(p?.requires_cold_chain)
    }), [cartItems, availableProducts])

  const requiresElectricalSafetyAck = useMemo(() =>
    cartItems.some((item) => {
      const p = availableProducts.find((ap) => ap.id === item.productId)
      return !!(p?.requires_serial_number || p?.category_slug === 'electroterapia')
    }), [cartItems, availableProducts])

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
  }, [priceAutoFill, pendingProduct, pendingPrice])

  const cartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0)
    const tax = cartItems.reduce((s, i) => s + i.taxAmount, 0)
    const total = cartItems.reduce((s, i) => s + i.total, 0)
    const qty = cartItems.reduce((s, i) => s + i.quantity, 0)
    return { subtotal, tax, total, qty }
  }, [cartItems])

  const isSale = dispatchMode === 'wholesale' || dispatchMode === 'retail'

  const pendingQtyNum = Number(pendingQty)
  const qtyExceedsStock = pendingLocation && pendingProduct && Number.isFinite(pendingQtyNum) && pendingQtyNum > stockAvailableForSelectedLocation

  /* ─── BUG-D3/D4: Comprehensive canConfirm ─── */
  const canConfirm = useMemo(() => {
    if (cartItems.length === 0) return false
    if (customerDataRequired && (!form.customerName.trim() || !form.customerDoc.trim())) return false
    for (const item of cartItems) {
      if (!item.locationId) return false
      if (item.quantity <= 0) return false
    }
    if (dispatchMode === 'damage') {
      if (!form.damageReason.trim() || form.damageReason.trim().length < MIN_DAMAGE_REASON_LENGTH) return false
    }
    if (dispatchMode === 'expiry') {
      if (!form.expiryLotCode.trim()) return false
    }
    if (requiresColdChainAck && !coldChainAck) return false
    if (requiresElectricalSafetyAck && !electricalSafetyAck) return false
    return true
  }, [cartItems, customerDataRequired, form, dispatchMode, requiresColdChainAck, requiresElectricalSafetyAck, coldChainAck, electricalSafetyAck])

  const currentStep = useMemo(() => {
    if (customerDataRequired && (!form.customerName.trim() || !form.customerDoc.trim())) return 1
    if (cartItems.length === 0) return 2
    return 3
  }, [customerDataRequired, form.customerName, form.customerDoc, cartItems.length])

  function handleSelectProduct(product: CatalogProduct) {
    setPendingProduct(product)
    setPendingQty('1')
    setPendingPrice('')
    setPendingLocation('')
    setProductSearch('')
    setFieldErrors({})
  }

  function handleProductScanned(result: BarcodeProductResult) {
    const match = availableProducts.find(
      (p) =>
        p.id === String(result.id) ||
        p.sku.toLowerCase() === result.sku?.toLowerCase() ||
        (result.barcode && p.barcode && p.barcode === result.barcode),
    )
    if (match) {
      handleSelectProduct(match)
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
      }
      handleSelectProduct(fallback)
    }
  }

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
    /* ─── BUG-D1: Validate stock at add-to-cart time ─── */
    if (qtyExceedsStock) {
      toast.error(`Stock insuficiente en esta ubicación. Disponible: ${stockAvailableForSelectedLocation} unidades`)
      return
    }
    const price = pendingPrice ? Number(pendingPrice) : 0
    const item = createCartItem(pendingProduct, qty, price, pendingLocation)
    if (dispatchMode === 'damage') {
      item.damageReason = form.damageReason
    }
    if (dispatchMode === 'expiry') {
      item.lotCode = form.expiryLotCode
    } else if (pendingProduct.requires_expiration && pendingLotCode) {
      item.lotCode = pendingLotCode
    }
    item.note = form.note
    setCartItems((prev) => [...prev, item])
    setPendingProduct(null)
    setPendingQty('1')
    setPendingPrice('')
    setPendingLocation('')
    setPendingLotCode('')
    setFieldErrors({})
    toast.success(`${pendingProduct.name} agregado al carrito`)
  }

  function handleRemoveItem(tempId: string) {
    setCartItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }

  function handleClearCart() {
    setCartItems([])
    setSubmissionResult(null)
    setError(null)
    setFieldErrors({})
    setColdChainAck(false)
    setElectricalSafetyAck(false)
  }

  function applyLastCustomer(c: LastCustomer) {
    setForm((f) => ({
      ...f,
      customerName: c.name,
      customerDoc: c.doc,
      customerEmail: c.email,
      customerPhone: c.phone,
      customerAddress: c.address,
    }))
    setSuggestCustomer(null)
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.customerName
      delete next.customerDoc
      return next
    })
  }

  /* ─── BUG-D4: Full form validation ─── */
  function validateForm(): FieldErrors {
    const errs: FieldErrors = {}

    if (customerDataRequired) {
      if (!form.customerName.trim()) errs.customerName = 'El nombre o razón social es obligatorio'
      if (!form.customerDoc.trim()) errs.customerDoc = 'El NIT o documento es obligatorio'
    }

    if (cartItems.length === 0) {
      errs._cart = 'Agrega al menos un producto al carrito'
    }

    for (const item of cartItems) {
      if (!item.locationId) errs._location = 'Todos los items deben tener ubicación'
      if (item.quantity <= 0) errs._qty = 'Todos los items deben tener cantidad > 0'
    }

    if (dispatchMode === 'damage') {
      const dr = form.damageReason.trim()
      if (!dr) errs.damageReason = 'Describe el motivo del daño'
      else if (dr.length < MIN_DAMAGE_REASON_LENGTH) errs.damageReason = `Mínimo ${MIN_DAMAGE_REASON_LENGTH} caracteres`
    }

    if (dispatchMode === 'expiry') {
      if (!form.expiryLotCode.trim()) errs.expiryLotCode = 'Ingresa el lote o fecha de vencimiento'
    }

    if (requiresColdChainAck && !coldChainAck) {
      errs.coldChainAck = 'Debes confirmar la alerta de cadena de frío'
    }
    if (requiresElectricalSafetyAck && !electricalSafetyAck) {
      errs.electricalSafetyAck = 'Debes confirmar la revisión de seguridad eléctrica'
    }

    return errs
  }

  function scrollToFirstError(errs: FieldErrors) {
    const firstKey = Object.keys(errs)[0]
    if (!firstKey) return
    const el = document.getElementById(`field-${firstKey}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus?.()
    } else if (errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  /* ─── BUG-D3 warning for expiry mode with non-expiry product ─── */
  const expiryWarning = useMemo(() => {
    if (dispatchMode !== 'expiry' || !pendingProduct) return null
    if (!pendingProduct.requires_expiration) {
      return 'Este producto no maneja fecha de vencimiento. Usa "Por daño" para registrar esta salida.'
    }
    return null
  }, [dispatchMode, pendingProduct])

  const handleConfirm = async () => {
    /* ─── BUG-D4: Validate form first ─── */
    const errs = validateForm()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      toast.error('Completa los campos obligatorios antes de continuar')
      scrollToFirstError(errs)
      return
    }

    setSaving(true)
    setError(null)
    setSubmissionResult(null)
    setInvoiceResult(null)
    setFieldErrors({})

    try {
      if (isSale) {
        /* ─── Billing API path ─── */
        const invoiceType = dispatchMode === 'wholesale' ? 'wholesale' : 'retail'
        const locationId = cartItems[0]?.locationId
        if (!locationId) {
          toast.error('Selecciona una ubicación de origen')
          setSaving(false)
          return
        }

        const payload: BillingInvoiceCreatePayload = {
          invoice_type: invoiceType,
          location_id: locationId,
          customer: {
            name: form.customerName.trim() || 'Cliente general',
            id_number: form.customerDoc.trim() || undefined,
            email: form.customerEmail.trim() || undefined,
            phone: form.customerPhone.trim() || undefined,
            address: form.customerAddress.trim() || undefined,
          },
          items: cartItems.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            discount_pct: item.discount > 0 ? item.discount : undefined,
            lot_code: item.lotCode || undefined,
          })),
          note: form.note || undefined,
          privacy_notice_acknowledged: dispatchMode === 'wholesale',
          cold_chain_acknowledged: coldChainAck,
          electrical_safety_acknowledged: electricalSafetyAck,
        }

        const invoice = await createInvoice(payload)
        setInvoiceResult(invoice)

        /* ─── BUG-D4: Save customer for reuse ─── */
        if (dispatchMode === 'wholesale') {
          saveLastCustomer({
            name: form.customerName.trim(),
            doc: form.customerDoc.trim(),
            email: form.customerEmail.trim(),
            phone: form.customerPhone.trim(),
            address: form.customerAddress.trim(),
          })
        }

        const newMovements: DispatchMovement[] = (invoice.movements_detail ?? []).map((m) => ({
          id: m.id,
          productName: m.product_name,
          sku: m.product_sku,
          quantity: m.quantity,
          locationCode: m.origin_location ?? '',
          operator: invoice.issued_by_username,
          confirmedAt: m.created_at,
          invoiceNumber: invoice.number,
          customerName: invoice.customer_name,
        }))
        setRecentMovements((current) => [...newMovements, ...current])
        setCartItems([])
        setForm(toForm())
        setColdChainAck(false)
        setElectricalSafetyAck(false)
        toast.success(`Factura ${invoice.number} creada exitosamente`)
      } else {
        /* ─── Legacy path for damage/expiry ─── */
        const items = cartItems.map((item) => ({
          productId: item.productId,
          locationId: item.locationId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || null,
          movementType: SALE_TYPES[dispatchMode],
          serialNumber: null,
          lotId: item.lotId || null,
          note: item.note || item.damageReason || form.expiryLotCode || '',
        }))

        const result = await submitCart(items, null, {
          coldChainAck,
          electricalSafetyAck,
        })

        setRecentMovements((current) => [...result.movements, ...current])
        setSubmissionResult(result)
        setCartItems([])
        setForm(toForm())
        setColdChainAck(false)
        setElectricalSafetyAck(false)
        toast.success(`${result.movements.length} salida(s) registrada(s) exitosamente`)
      }
    } catch (err) {
      setError(extractApiError(err))
    } finally {
      setSaving(false)
    }
  }

  /* ─── Stock message for selected product ─── */
  const stockMessage = useMemo(() => {
    if (!pendingProduct || stockLoading) return null
    if (stockByLocation.size === 0) {
      return { text: 'Sin stock disponible en ninguna ubicación', variant: 'err' as const }
    }
    if (pendingLocation) {
      const q = stockByLocation.get(pendingLocation) ?? 0
      if (q === 0) return { text: 'Sin stock en esta ubicación', variant: 'err' as const }
      return { text: `Stock disponible: ${q} unidades`, variant: 'ok' as const }
    }
    return null
  }, [pendingProduct, stockLoading, stockByLocation, pendingLocation])

  /* ─── Filter locations with stock for BUG-D2 ─── */
  const locationsWithStock = useMemo(() => {
    if (!pendingProduct || stockByLocation.size === 0) return []
    return locations.filter((loc) => (stockByLocation.get(loc.id) ?? 0) > 0)
  }, [pendingProduct, stockByLocation, locations])

  const hasNoStockAnywhere = !!(pendingProduct && !stockLoading && stockByLocation.size > 0 && locationsWithStock.length === 0)

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
      <div className="page-body reception-page" ref={formRef}>

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
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 18 }} ref={errorRef}>
            <AlertTriangle />
            <span>{error}</span>
          </div>
        ) : null}

        {/* BUG-D4: Global validation error banner */}
        {Object.keys(fieldErrors).length > 0 && !error && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 18 }}>
            <AlertTriangle />
            <span>Completa los campos obligatorios antes de continuar</span>
          </div>
        )}

        {/* Success banner (non-sale: damage/expiry) */}
        {submissionResult && (
          <div className="alert-bar alert-bar--ok" role="alert" style={{ marginBottom: 18 }}>
            <CheckCircle2 />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>
                {submissionResult.movements.length} salida(s) registrada(s)
              </span>
              <Button size="sm" onClick={handleClearCart}>
                <X /> Nueva salida
              </Button>
            </div>
          </div>
        )}

        {/* Invoice result modal (sale: wholesale/retail) */}
        {invoiceResult && (
          <InvoiceResultModal
            invoice={invoiceResult}
            onClose={() => { setInvoiceResult(null); setError(null) }}
            onNewSale={() => { setInvoiceResult(null); setCartItems([]); setForm(toForm()); setError(null) }}
          />
        )}

        {/* ─── BUG-D4: Customer suggestion banner ─── */}
        {suggestCustomer && dispatchMode === 'wholesale' && cartItems.length === 0 && (
          <div className="alert-bar alert-bar--info" role="alert" style={{ marginBottom: 18 }}>
            <UserCheck />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>
                ¿Usar el cliente anterior? <strong>{suggestCustomer.name}</strong> — {suggestCustomer.doc}
              </span>
              <Button size="sm" variant="outline" onClick={() => applyLastCustomer(suggestCustomer)}>
                Sí, usar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSuggestCustomer(null)}>
                No, nuevo cliente
              </Button>
            </div>
          </div>
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
              onChange={(m) => { setDispatchMode(m); setPendingProduct(null); setForm(toForm()); setFieldErrors({}) }}
            />

            <div className="c-divider" style={{ marginTop: 0 }} />

            {/* ─── Product search ─── */}
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

              {/* Product dropdown */}
              {!pendingProduct && filteredProducts.length > 0 && (
                <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', border: '1px solid var(--ink-12)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', background: 'var(--white)' }}>
                  {filteredProducts.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--ink-06)', display: 'flex', justifyContent: 'space-between' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--teal-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <span className="sku">{p.sku}</span>
                    </li>
                  ))}
                </ul>
              )}
              {productSearch && filteredProducts.length === 0 && !pendingProduct && (
                <p style={{ fontSize: 12, color: 'var(--ink-40)', marginTop: 4 }}>Sin coincidencias</p>
              )}
            </div>

            {/* ─── BUG-D3: Expiry warning ─── */}
            {expiryWarning && (
              <div className="notice notice--warn" style={{ marginBottom: 10 }}>
                <AlertTriangle />
                <div>
                  <p className="notice__body">{expiryWarning}</p>
                </div>
              </div>
            )}

            {/* ─── Pending product config ─── */}
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

                {stockLoading && (
                  <div style={{ fontSize: 12, color: 'var(--ink-40)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={12} className="spin" /> Consultando stock...
                  </div>
                )}

                {/* ─── BUG-D1/D2: Stock message ─── */}
                {stockMessage && (
                  <p style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: stockMessage.variant === 'ok' ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {stockMessage.text}
                  </p>
                )}

                {/* ─── BUG-D2: No stock anywhere ─── */}
                {hasNoStockAnywhere && (
                  <div className="notice notice--err" style={{ marginBottom: 10 }}>
                    <AlertTriangle />
                    <div>
                      <p className="notice__title">Sin stock disponible</p>
                      <p className="notice__body">Este producto no tiene stock en ninguna ubicación.</p>
                    </div>
                  </div>
                )}

                <div className="f-row f-row-2" style={{ marginBottom: 10 }}>
                  <div className="f-group">
                    <label className="f-label" htmlFor="cart-qty">Cantidad</label>
                    <input
                      id="cart-qty"
                      className={`f-input${qtyExceedsStock ? ' input--err' : ''}`}
                      type="number"
                      min="1"
                      value={pendingQty}
                      onChange={(e) => setPendingQty(e.target.value)}
                      style={qtyExceedsStock ? { borderColor: 'var(--danger)' } : undefined}
                    />
                    {/* ─── BUG-D1: Inline qty error ─── */}
                    {qtyExceedsStock && (
                      <p className="field-err" style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                        Stock insuficiente. Solo hay {stockAvailableForSelectedLocation} unidades disponibles.
                      </p>
                    )}
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

                  {/* ─── BUG-D2: Location selector ─── */}
                  <div className="f-group">
                    <label className="f-label" htmlFor="cart-loc">Ubicación</label>
                    <select
                      id="cart-loc"
                      className="f-input"
                      value={pendingLocation}
                      onChange={(e) => setPendingLocation(e.target.value)}
                      disabled={!pendingProduct || stockLoading}
                      style={!pendingProduct || stockLoading ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                    >
                      <option value="">
                        {stockLoading ? 'Cargando...' : !pendingProduct ? 'Selecciona un producto primero' : 'Seleccionar ubicación'}
                      </option>
                      {/* ─── BUG-D2: Only show locations with stock ─── */}
                      {locationsWithStock.map((loc) => {
                        const q = stockByLocation.get(loc.id) ?? 0
                        return (
                          <option key={loc.id} value={loc.id}>
                            {loc.code} — {loc.name} ({q} unidades)
                          </option>
                        )
                      })}
                      {/* Show locations without stock as disabled */}
                      {locations.filter((loc) => (stockByLocation.get(loc.id) ?? 0) === 0).map((loc) => (
                        <option key={`no-stock-${loc.id}`} value="" disabled style={{ color: '#999' }}>
                          {loc.code} — {loc.name} (sin stock)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isSale && pendingProduct.requires_expiration && (
                  <div className="f-group" style={{ marginBottom: 10 }}>
                    <label className="f-label" htmlFor="cart-lot">Código de lote (obligatorio)</label>
                    <input
                      id="cart-lot"
                      className="f-input"
                      type="text"
                      value={pendingLotCode}
                      onChange={(e) => setPendingLotCode(e.target.value)}
                      placeholder="Ej: LOTE-001"
                    />
                    {!pendingLotCode && (
                      <p className="field-err" style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                        Este producto requiere especificar un lote
                      </p>
                    )}
                  </div>
                )}

                {/* ─── BUG-D1: Existing total stock check (backup for when no per-location data) ─── */}
                {!stockLoading && stockByLocation.size === 0 && pendingProduct.stockTotal != null && Number(pendingQty) > pendingProduct.stockTotal && (
                  <div className="notice notice--err" style={{ marginBottom: 10 }}>
                    <AlertTriangle />
                    <div>
                      <p className="notice__title">Stock insuficiente</p>
                      <p className="notice__body">Solo hay {pendingProduct.stockTotal} unidades disponibles en total.</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleAddToCart}
                  disabled={
                    !Number.isFinite(pendingQtyNum) || pendingQtyNum <= 0 ||
                    !pendingLocation ||
                    qtyExceedsStock ||
                    stockLoading ||
                    hasNoStockAnywhere ||
                    (isSale && pendingProduct.requires_expiration && !pendingLotCode)
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
                    onClick={() => { if (window.confirm('¿Vaciar carrito?')) { setCartItems([]); setFieldErrors({}) } }}
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
                            {item.lotCode && <span className="sku" style={{ fontSize: 10, display: 'block' }}>Lote: {item.lotCode}</span>}
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
                    onClick={() => { setCartItems([]); setError(null); setFieldErrors({}) }}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={`btn btn--amber btn--lg${!canConfirm ? ' btn--disabled' : ''}`}
                    onClick={handleConfirm}
                    disabled={!canConfirm || saving}
                    title={!canConfirm ? 'Completa todos los campos obligatorios para continuar' : undefined}
                  >
                    <ClipboardCheck />
                    {saving ? 'Registrando...' : 'Confirmar y generar factura(s)'}
                  </button>
                </div>
              </>
            )}

            {/* Empty state */}
            {!pendingProduct && cartItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-40)', fontSize: 13 }}>
                Busca y agrega productos al carrito para continuar
              </div>
            )}

          </div>

          {/* ─── Right panel: Customer / damage / expiry / notes ─── */}
          <aside>
            <div className="s-head">
              <span className="s-head__label">
                {isSale ? 'Cliente receptor' : dispatchMode === 'damage' ? 'Información del daño' : 'Información del vencimiento'}
              </span>
              <div className="s-head__rule" />
            </div>
            <div className="form-surface">
              {isSale && (
                <fieldset>
                  <legend>
                    Datos del cliente
                    {customerDataRequired && (
                      <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--err)', marginLeft: 6 }}>
                        (obligatorios para facturación)
                      </span>
                    )}
                  </legend>

                  {customerDataRequired && (
                    <div className="notice notice--warn" style={{ marginBottom: 12, padding: '8px 10px', fontSize: 12 }}>
                      <AlertTriangle size={14} />
                      <div>
                        <p className="notice__body">
                          Los datos del cliente son obligatorios para emitir la factura electrónica.
                          Completa nombre o razón social y NIT para continuar.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─── BUG-D4: Campo con id para scroll + error inline ─── */}
                  <div className="f-group dispatch-customer-field" id="field-customerName">
                    <label className="f-label" htmlFor="cli-name">
                      Razón social / Nombre {customerDataRequired && <span style={{ color: 'var(--err)' }}>*</span>}
                    </label>
                    <input
                      id="cli-name"
                      className={`f-input${fieldErrors.customerName ? ' input--err' : ''}`}
                      value={form.customerName}
                      onChange={(e) => { setForm((f) => ({ ...f, customerName: e.target.value })); setFieldErrors((prev) => { const n = { ...prev }; delete n.customerName; return n }) }}
                      placeholder={customerDataRequired ? '' : 'Opcional'}
                      style={fieldErrors.customerName ? { borderColor: 'var(--danger)' } : undefined}
                    />
                    {fieldErrors.customerName && (
                      <p className="field-err" style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>{fieldErrors.customerName}</p>
                    )}
                  </div>
                  {customerDataRequired && (
                    <div className="f-group dispatch-customer-field" id="field-customerDoc">
                      <label className="f-label" htmlFor="cli-doc">NIT / Documento *</label>
                      <input
                        id="cli-doc"
                        className={`f-input${fieldErrors.customerDoc ? ' input--err' : ''}`}
                        value={form.customerDoc}
                        onChange={(e) => { setForm((f) => ({ ...f, customerDoc: e.target.value })); setFieldErrors((prev) => { const n = { ...prev }; delete n.customerDoc; return n }) }}
                        placeholder="NIT 900.123.456-7"
                        style={fieldErrors.customerDoc ? { borderColor: 'var(--danger)' } : undefined}
                      />
                      {fieldErrors.customerDoc && (
                        <p className="field-err" style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>{fieldErrors.customerDoc}</p>
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

              {/* ─── BUG-D3: Damage reason ─── */}
              {dispatchMode === 'damage' && (
                <div className="f-group" id="field-damageReason" style={{ marginTop: 0 }}>
                  <label className="f-label">
                    Descripción del daño <span style={{ color: 'var(--err)' }}>*</span>
                    <span style={{ fontSize: 10, color: 'var(--ink-40)', fontWeight: 400, marginLeft: 4 }}>
                      (mínimo {MIN_DAMAGE_REASON_LENGTH} caracteres)
                    </span>
                  </label>
                  <textarea
                    className={`f-input${fieldErrors.damageReason ? ' input--err' : ''}`}
                    style={{ minHeight: 60, resize: 'vertical', ...(fieldErrors.damageReason ? { borderColor: 'var(--danger)' } : {}) }}
                    value={form.damageReason}
                    placeholder="Describe el motivo del daño..."
                    onChange={(e) => { setForm((f) => ({ ...f, damageReason: e.target.value })); setFieldErrors((prev) => { const n = { ...prev }; delete n.damageReason; return n }) }}
                  />
                  {fieldErrors.damageReason && (
                    <p className="field-err" style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>{fieldErrors.damageReason}</p>
                  )}
                  {form.damageReason.trim().length > 0 && form.damageReason.trim().length < MIN_DAMAGE_REASON_LENGTH && (
                    <p style={{ fontSize: 10, color: 'var(--warning)', marginTop: 2 }}>
                      {form.damageReason.trim().length}/{MIN_DAMAGE_REASON_LENGTH} caracteres
                    </p>
                  )}
                </div>
              )}

              {/* ─── BUG-D3: Expiry lot/date ─── */}
              {dispatchMode === 'expiry' && (
                <div className="f-group" id="field-expiryLotCode" style={{ marginTop: 0 }}>
                  <label className="f-label">
                    Lote o fecha de vencimiento <span style={{ color: 'var(--err)' }}>*</span>
                  </label>
                  <input
                    className={`f-input${fieldErrors.expiryLotCode ? ' input--err' : ''}`}
                    value={form.expiryLotCode}
                    placeholder="Ej: LOTE-2026A o 2026-12-31"
                    onChange={(e) => { setForm((f) => ({ ...f, expiryLotCode: e.target.value })); setFieldErrors((prev) => { const n = { ...prev }; delete n.expiryLotCode; return n }) }}
                    style={fieldErrors.expiryLotCode ? { borderColor: 'var(--danger)' } : undefined}
                  />
                  {fieldErrors.expiryLotCode && (
                    <p className="field-err" style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>{fieldErrors.expiryLotCode}</p>
                  )}
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
                  <p className="notice__title">Privacidad</p>
                  <p className="notice__body">Los datos del cliente se tratan bajo la política de privacidad de ICM.</p>
                </div>
              </div>

              {requiresColdChainAck && (
                <label className={`dispatch-ack-label${fieldErrors.coldChainAck ? ' dispatch-ack-label--err' : ''}`}>
                  <input
                    type="checkbox"
                    checked={coldChainAck}
                    onChange={(e) => setColdChainAck(e.target.checked)}
                  />
                  <span>
                    <strong>Alerta de Cadena de Frío:</strong> Confirmo que conozco los requerimientos de refrigeración de este producto y aseguro las condiciones de temperatura durante su despacho.
                  </span>
                </label>
              )}
              {requiresElectricalSafetyAck && (
                <label className={`dispatch-ack-label${fieldErrors.electricalSafetyAck ? ' dispatch-ack-label--err' : ''}`}>
                  <input
                    type="checkbox"
                    checked={electricalSafetyAck}
                    onChange={(e) => setElectricalSafetyAck(e.target.checked)}
                  />
                  <span>
                    <strong>Seguridad Eléctrica:</strong> Confirmo la revisión técnica de seguridad eléctrica en equipos y la firma de actas de calibración operacional correspondientes.
                  </span>
                </label>
              )}
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
