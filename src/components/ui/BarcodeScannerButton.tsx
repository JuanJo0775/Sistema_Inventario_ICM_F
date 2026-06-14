import { useCallback, useEffect, useRef, useState } from 'react'
import { useBarcodeScanner, type ScanStatus } from '../../lib/useBarcodeScanner'
import type { BarcodeProductResult } from '../../services/barcodeScanner'
import { ModalPortal } from './ModalPortal'

interface BarcodeScannerButtonProps {
  /** Called when the scanner successfully resolves a product */
  onProductFound: (product: BarcodeProductResult) => void
  /** Button label override */
  label?: string
  /** Additional CSS class for the trigger button */
  className?: string
  /** Whether the button should be disabled */
  disabled?: boolean
}

const statusLabel: Record<ScanStatus, string> = {
  idle: 'Listo para escanear…',
  scanning: 'Buscando producto…',
  success: '¡Producto encontrado!',
  error: 'No encontrado',
}

const statusIcon: Record<ScanStatus, string> = {
  idle: '📷',
  scanning: '⏳',
  success: '✅',
  error: '❌',
}

export function BarcodeScannerButton({
  onProductFound,
  label = 'Escanear código de barras',
  className = '',
  disabled = false,
}: BarcodeScannerButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const lastSubmittedRef = useRef<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleProductFound = useCallback(
    (product: BarcodeProductResult) => {
      onProductFound(product)
      setManualValue('')
      // Close modal with delay so the user sees the success state
      setTimeout(() => setModalOpen(false), 2000)
    },
    [onProductFound],
  )

  const { status, lastCode, product, errorMessage, lookupBarcode, reset } =
    useBarcodeScanner(modalOpen)

  // When a product is found, fire the callback
  useEffect(() => {
    if (status === 'success' && product) {
      handleProductFound(product)
    }
  }, [status, product, handleProductFound])

  // Reset when modal opens
  const handleOpen = () => {
    reset()
    setManualValue('')
    setModalOpen(true)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const handleClose = () => {
    reset()
    setManualValue('')
    setModalOpen(false)
  }

  const doLookup = useCallback((val: string) => {
    const trimmed = val.trim()
    if (!trimmed) return
    if (lastSubmittedRef.current === trimmed) return
    lastSubmittedRef.current = trimmed
    void lookupBarcode(trimmed)
  }, [lookupBarcode])

  // Auto-submit when value stabilizes (scanner finishes typing)
  useEffect(() => {
    if (!manualValue.trim() || status !== 'idle') return
    const timer = setTimeout(() => doLookup(manualValue), 400)
    return () => clearTimeout(timer)
  }, [manualValue, status, doLookup])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doLookup(manualValue)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        className={`barcode-trigger-btn ${className}`}
        onClick={handleOpen}
        disabled={disabled}
        title="Usar lector de código de barras"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <path d="M3 5a2 2 0 0 1 2-2h1v18H5a2 2 0 0 1-2-2V5Z" />
          <path d="M9 3h1v18H9V3Z" />
          <path d="M13 3h1v18h-1V3Z" />
          <path d="M17 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2V3Z" />
        </svg>
        {label}
      </button>

      {/* Modal */}
      {modalOpen && (
        <ModalPortal onClose={handleClose}>
          <div className="barcode-modal">
            {/* Header */}
            <div className="barcode-modal__header">
              <div>
                <h2 className="barcode-modal__title">Escáner de código de barras</h2>
                <p className="barcode-modal__subtitle">
                  Apunta el lector al código o ingrésalo manualmente
                </p>
              </div>
              <button
                type="button"
                className="barcode-modal__close"
                onClick={handleClose}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Scanner visual area */}
            <div className={`barcode-scan-area barcode-scan-area--${status}`}>
              <div className="barcode-scan-area__animation">
                <div className="barcode-scan-area__laser" />
                <svg
                  viewBox="0 0 200 120"
                  className="barcode-scan-area__bars"
                  aria-hidden="true"
                >
                  {[8,16,24,30,38,42,50,60,66,72,80,88,94,100,108,114,122,130,136,144,150,158,164,172,180,188,192].map((x, i) => (
                    <rect
                      key={i}
                      x={x}
                      y={10}
                      width={i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 6}
                      height={100}
                      fill="currentColor"
                      opacity={0.7}
                    />
                  ))}
                </svg>
              </div>
              <p className="barcode-scan-area__status">
                <span className="barcode-scan-area__icon">{statusIcon[status]}</span>
                {statusLabel[status]}
              </p>
              {lastCode && status !== 'idle' && (
                <p className="barcode-scan-area__code">Código: <strong>{lastCode}</strong></p>
              )}
            </div>

            {/* Result area */}
            {status === 'success' && product ? (
              <div className="barcode-result barcode-result--ok">
                <div>
                  <p className="barcode-result__name">{product.name}</p>
                  <p className="barcode-result__meta">
                    <span className="sku">{product.sku}</span>
                    {product.category_name ? ` · ${product.category_name}` : ''}
                    {product.stockTotal !== undefined && product.stockTotal !== null
                      ? ` · Stock: ${product.stockTotal}`
                      : ''}
                  </p>
                </div>
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="barcode-result barcode-result--err">
                <div>
                  <p className="barcode-result__name">Producto no encontrado</p>
                  <p className="barcode-result__meta">
                    {errorMessage ?? `No existe un producto con código "${lastCode}"`}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Manual entry form */}
            <form className="barcode-manual" onSubmit={handleManualSubmit}>
              <label className="barcode-manual__label" htmlFor="barcode-manual-input">
                Ingresar código manualmente
              </label>
              <div className="barcode-manual__row">
                <input
                  ref={inputRef}
                  id="barcode-manual-input"
                  className="barcode-manual__input"
                  type="text"
                  placeholder="Escribe o pega el código…"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value.replace(/'/g, '-'))}
                />
                <button
                  type="submit"
                  className="barcode-manual__btn"
                  disabled={status === 'scanning'}
                >
                  {status === 'scanning' ? '…' : 'Buscar'}
                </button>
              </div>
            </form>

            <div className="barcode-modal__footer">
              <p className="barcode-modal__hint">
                El lector HID funciona automáticamente cuando el modal está abierto.
                También puedes escribir el código directamente.
              </p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
                Reintentar
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
