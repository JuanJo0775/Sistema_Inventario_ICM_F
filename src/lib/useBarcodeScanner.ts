import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchProductByBarcode, type BarcodeProductResult } from '../services/barcodeScanner'

/**
 * Hook that listens for HID barcode scanner input (which behaves like a keyboard).
 *
 * HID scanners type characters very fast and end with Enter (or Tab).
 * We detect this pattern: a burst of keystrokes (< 50 ms between chars) ending with Enter.
 *
 * @param onScanned  Called when a barcode is fully received.
 * @param active     Whether the hook should be listening. Defaults to true.
 */
export function useHidBarcodeCapture(
  onScanned: (barcode: string) => void,
  active = true,
) {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const gap = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Reset buffer if the gap is too long (human typing)
      if (gap > 80) {
        bufferRef.current = ''
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        const code = bufferRef.current.trim()
        if (code.length >= 4) {
          onScanned(code)
        }
        bufferRef.current = ''
        return
      }

      // Only accept printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, onScanned])
}

export type ScanStatus = 'idle' | 'scanning' | 'success' | 'error'

export interface UseBarcodeResult {
  /** Start listening for HID scan events */
  status: ScanStatus
  /** Last scanned code (raw string) */
  lastCode: string
  /** Product returned by the API after a successful scan */
  product: BarcodeProductResult | null
  /** Error message if something went wrong */
  errorMessage: string | null
  /** Manually trigger lookup for a given barcode string */
  lookupBarcode: (barcode: string) => Promise<void>
  /** Reset state back to idle */
  reset: () => void
}

/**
 * High-level hook that combines HID capture + API lookup.
 *
 * Usage:
 *   const { status, product, errorMessage, lookupBarcode, reset } = useBarcodeScanner(active)
 */
export function useBarcodeScanner(active = true): UseBarcodeResult {
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [lastCode, setLastCode] = useState('')
  const [product, setProduct] = useState<BarcodeProductResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const lookupBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return
    setLastCode(barcode)
    setStatus('scanning')
    setErrorMessage(null)
    setProduct(null)
    try {
      const result = await fetchProductByBarcode(barcode.trim())
      setProduct(result)
      setStatus('success')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se encontró el producto para este código.'
      setErrorMessage(msg)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setLastCode('')
    setProduct(null)
    setErrorMessage(null)
  }, [])

  useHidBarcodeCapture(lookupBarcode, active)

  return { status, lastCode, product, errorMessage, lookupBarcode, reset }
}
