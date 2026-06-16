import { useEffect, useRef, useCallback, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { fetchProductBarcodePayload } from '../../services/barcodeScanner'

interface BarcodeDisplayProps {
  /**
   * El string del código de barras a renderizar.
   * Si se pasa `productId`, se ignora `value` y se obtiene el barcode oficial del backend.
   */
  value?: string
  /**
   * UUID del producto en el backend.
   * Si se proporciona, el componente consulta GET /catalog/products/<id>/barcode/
   * para obtener el código exacto almacenado en BD (el que fue impreso).
   */
  productId?: string | number
  /** Nombre del producto para la ventana de impresión */
  productName?: string
  /** SKU del producto */
  sku?: string
}

/**
 * Renderiza el código de barras oficial de un producto.
 *
 * Prioridad:
 *   1. Si se pasa `productId` → consulta el backend y usa el barcode real de BD.
 *   2. Si solo se pasa `value` → lo usa directamente (fallback local).
 *
 * Incluye botones para descargar como SVG, PNG e imprimir.
 */
export function BarcodeDisplay({ value, productId, productName, sku }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [resolvedValue, setResolvedValue] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Si se proporciona productId, obtener el barcode oficial del backend
  useEffect(() => {
    if (!productId) {
      setResolvedValue(value ?? null)
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(null)
    fetchProductBarcodePayload(productId)
      .then((payload) => {
        if (!cancelled) setResolvedValue(payload.barcode)
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback al value local si el backend falla
          setResolvedValue(value ?? null)
          setFetchError('No se pudo verificar el código en el servidor. Usando código local.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [productId, value])

  // Renderizar el SVG cuando el valor esté disponible
  useEffect(() => {
    if (!svgRef.current || !resolvedValue) return
    try {
      JsBarcode(svgRef.current, resolvedValue, {
        format: 'CODE128',
        lineColor: '#1a202c',
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        fontOptions: 'bold',
        margin: 12,
        background: '#ffffff',
      })
    } catch (err) {
      console.warn('JsBarcode error:', err)
    }
  }, [resolvedValue])

  /** Descarga el SVG directamente */
  const handleDownloadSVG = useCallback(() => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgRef.current)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode-${sku ?? resolvedValue}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [sku, resolvedValue])

  /** Convierte el SVG a PNG vía canvas y lo descarga */
  const handleDownloadPNG = useCallback(() => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgRef.current)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // 3× para resolución de impresión
      canvas.width = img.width * 3
      canvas.height = img.height * 3
      const ctx = canvas.getContext('2d')!
      ctx.scale(3, 3)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, img.width, img.height)
      ctx.drawImage(img, 0, 0)
      const pngUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `barcode-${sku ?? resolvedValue}.png`
      a.click()
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [sku, resolvedValue])

  /** Abre ventana de impresión solo con el código de barras */
  const handlePrint = useCallback(() => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgRef.current)
    const printWindow = window.open('', '_blank', 'width=600,height=400')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Código de barras${productName ? ` – ${productName}` : ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, sans-serif;
              background: #fff;
              padding: 24px;
            }
            .barcode-print-header {
              text-align: center;
              margin-bottom: 16px;
            }
            .barcode-print-header h1 {
              font-size: 1rem;
              font-weight: 700;
              color: #1a202c;
              margin-bottom: 4px;
            }
            .barcode-print-header p {
              font-size: 0.75rem;
              color: #718096;
            }
            svg { display: block; max-width: 100%; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-print-header">
            ${productName ? `<h1>${productName}</h1>` : ''}
            ${sku ? `<p>SKU: ${sku}</p>` : ''}
          </div>
          ${svgStr}
          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [productName, sku])

  if (loading) {
    return (
      <div className="barcode-display barcode-display--loading">
        <p style={{ fontSize: 12, color: 'var(--ink-40)', margin: 0 }}>
          Cargando código de barras…
        </p>
      </div>
    )
  }

  if (!resolvedValue) return null

  return (
    <div className="barcode-display">
      {fetchError && (
        <p style={{ fontSize: 11, color: 'var(--warn)', margin: '0 0 8px', textAlign: 'center' }}>
         {fetchError}
        </p>
      )}
      <div className="barcode-display__canvas">
        <svg ref={svgRef} />
      </div>
      <p style={{ fontSize: 10, color: 'var(--ink-40)', fontFamily: 'var(--ff-mono)', margin: 0, textAlign: 'center', letterSpacing: '0.5px' }}>
        {resolvedValue}
      </p>
      <div className="barcode-display__actions">
        <button
          type="button"
          className="barcode-display__btn"
          onClick={handleDownloadSVG}
          title="Descargar como SVG"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          SVG
        </button>
        <button
          type="button"
          className="barcode-display__btn"
          onClick={handleDownloadPNG}
          title="Descargar como PNG"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          PNG
        </button>
        <button
          type="button"
          className="barcode-display__btn barcode-display__btn--print"
          onClick={handlePrint}
          title="Imprimir código de barras"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Imprimir
        </button>
      </div>
    </div>
  )
}
