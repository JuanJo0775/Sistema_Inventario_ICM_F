import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  Shield,
  Download,
  Filter,
  Search,
  AlertTriangle,
  X,
  ChevronDown,
  Calendar,
  User,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { fetchAuditLogs, exportAuditToCSV } from '../../services/audit'
import { fetchUsers, type UserItem } from '../../services/transfers'
import useCatalogStore from '../../store/useCatalogStore'
import type { AuditLogEntry, EventTypeBadgeConfig } from '../../interfaces/audit'

// ─── Badge config por tipo de movimiento ──────────────────────────────────────

const BADGE_CONFIGS: Record<string, EventTypeBadgeConfig> = {
  ENTRADA: { label: 'Entrada', bg: '#d1fae5', color: '#065f46' },
  TRASLADO: { label: 'Transferencia', bg: '#dbeafe', color: '#1d4ed8' },
  DEVOLUCION: { label: 'Recepción', bg: '#ccfbf1', color: '#0f766e' },
}

const resolveBadge = (entry: AuditLogEntry): EventTypeBadgeConfig => {
  if (entry.movement_type === 'ENTRADA') return BADGE_CONFIGS.ENTRADA
  if (entry.movement_type === 'TRASLADO') return BADGE_CONFIGS.TRASLADO
  if (entry.movement_type === 'DEVOLUCION') return BADGE_CONFIGS.DEVOLUCION

  if (entry.movement_type === 'AJUSTE') {
    if (entry.destination_location) {
      return { label: 'Ajuste +', bg: '#fef9c3', color: '#a16207' }
    } else {
      return { label: 'Ajuste -', bg: '#ffedd5', color: '#c2410c' }
    }
  }

  if (entry.movement_type.startsWith('SALIDA') || entry.movement_type === 'SALIDA_COMBO') {
    return { label: 'Salida', bg: '#fee2e2', color: '#b91c1c' }
  }

  return { label: entry.movement_type, bg: '#f3f4f6', color: '#374151' }
}

// ─── Tipos de operación para el filtro ───────────────────────────────────────

const OPERATION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'Entrada', label: 'Entrada' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Salida', label: 'Salida' },
  { value: 'Ajuste +', label: 'Ajuste +' },
  { value: 'Ajuste -', label: 'Ajuste -' },
  { value: 'Recepción', label: 'Recepción' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTs = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const shortId = (id: string): string => id.replace(/-/g, '').slice(0, 8).toUpperCase()

// ─── Component ───────────────────────────────────────────────────────────────

const AuditPage: React.FC = () => {
  // Catalog Store
  const { products, fetchProducts } = useCatalogStore()

  // Data
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters (form input values)
  const [filterOperario, setFilterOperario] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterFecha, setFilterFecha] = useState('')
  const [filterSku, setFilterSku] = useState('')

  // Applied filters (actual filters applied to list)
  const [appliedOperario, setAppliedOperario] = useState('')
  const [appliedTipo, setAppliedTipo] = useState('')
  const [appliedFecha, setAppliedFecha] = useState('')
  const [appliedSku, setAppliedSku] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load users and products on mount
  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => {})
    fetchProducts().catch(() => {})
  }, [fetchProducts])

  // Load physical movements
  const loadEntries = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      // Intentamos resolver el SKU a un product ID antes de la consulta
      let resolvedProductId: string | undefined = undefined
      if (appliedSku.trim()) {
        const matchingProduct = products.find(
          (p) => p.sku.toLowerCase() === appliedSku.trim().toLowerCase()
        )
        if (matchingProduct) {
          resolvedProductId = matchingProduct.id
        }
      }

      // Consultamos el ledger de movimientos con un tamaño de página amplio
      const data = await fetchAuditLogs({
        product_id: resolvedProductId,
        page_size: 100,
      })
      let results = data.results ?? []

      // Filtrado del lado del cliente para aquellos parámetros no soportados nativamente
      // 1. SKU / Nombre del producto (si no fue resuelto exactamente a product_id)
      if (appliedSku.trim() && !resolvedProductId) {
        const q = appliedSku.trim().toLowerCase()
        results = results.filter((e) => {
          const sku = (e.product_sku || '').toLowerCase()
          const prodName = (
            products.find((p) => p.sku === e.product_sku)?.name || ''
          ).toLowerCase()
          return sku.includes(q) || prodName.includes(q)
        })
      }

      // 2. Operario (executed_by)
      if (appliedOperario) {
        results = results.filter((e) => String(e.executed_by) === String(appliedOperario))
      }

      // 3. Tipo de operación (mapeado de badges)
      if (appliedTipo) {
        results = results.filter((e) => {
          const badge = resolveBadge(e)
          return badge.label.toLowerCase() === appliedTipo.toLowerCase()
        })
      }

      // 4. Fecha (created_at matches YYYY-MM-DD)
      if (appliedFecha) {
        results = results.filter((e) => e.created_at.startsWith(appliedFecha))
      }

      setEntries(results)
      setTotalCount(results.length)
      setCurrentPage(1) // Volver a la primera página tras filtrar
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || 'Error al cargar los movimientos de auditoría'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }, [appliedTipo, appliedOperario, appliedFecha, appliedSku, products])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Apply filters
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedOperario(filterOperario)
    setAppliedTipo(filterTipo)
    setAppliedFecha(filterFecha)
    setAppliedSku(filterSku)
  }

  // Clear filters
  const handleClearFilters = () => {
    setFilterOperario('')
    setFilterTipo('')
    setFilterFecha('')
    setFilterSku('')
    setAppliedOperario('')
    setAppliedTipo('')
    setAppliedFecha('')
    setAppliedSku('')
  }

  const hasActiveFilters = appliedOperario || appliedTipo || appliedFecha || appliedSku

  // Export
  const handleExportCSV = () => {
    setExportOpen(false)
    exportAuditToCSV(entries, `auditoria_movimientos_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleExportExcel = () => {
    setExportOpen(false)
    
    const headers = [
      'ID',
      'Fecha',
      'Operario',
      'Tipo de Movimiento',
      'Producto SKU',
      'Producto Nombre',
      'Cantidad',
      'Stock Anterior',
      'Stock Nuevo',
      'Nota',
    ]

    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v)
      // Escapar dobles comillas para CSV
      return s.includes(';') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }

    const rows = entries.map((e) => {
      const badge = resolveBadge(e)
      
      let prevStock = ''
      let nextStock = ''
      if (e.movement_type === 'ENTRADA' || (e.movement_type === 'AJUSTE' && e.destination_location)) {
        prevStock = e.stock_previo_destino != null ? String(e.stock_previo_destino) : ''
        nextStock = e.stock_resultante_destino != null ? String(e.stock_resultante_destino) : ''
      } else if (e.movement_type.startsWith('SALIDA') || e.movement_type === 'SALIDA_COMBO' || (e.movement_type === 'AJUSTE' && e.origin_location)) {
        prevStock = e.stock_previo_origen != null ? String(e.stock_previo_origen) : ''
        nextStock = e.stock_resultante_origen != null ? String(e.stock_resultante_origen) : ''
      } else if (e.movement_type === 'TRASLADO') {
        prevStock = `Ori: ${e.stock_previo_origen ?? ''} | Des: ${e.stock_previo_destino ?? ''}`
        nextStock = `Ori: ${e.stock_resultante_origen ?? ''} | Des: ${e.stock_resultante_destino ?? ''}`
      }

      const note = e.justification || e.discrepancy_note || ''

      return [
        shortId(e.id),
        formatTs(e.created_at),
        getUserName(e.executed_by),
        badge.label,
        e.product_sku,
        getProductName(e.product_sku),
        e.quantity,
        prevStock,
        nextStock,
        note,
      ]
    })

    // Indicar explícitamente a Excel que el separador es el punto y coma (sep=;)
    // y anteponer el BOM de UTF-8 (\ufeff) para que reconozca los acentos correctamente
    const csvContent = 'sep=;\n' + [headers, ...rows].map((r) => r.map(escape).join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_movimientos_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    setExportOpen(false)
    
    // Crear iframe oculto para evitar bloqueadores de popups y permitir impresión directa
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document || iframe.contentDocument
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }

    let rowsHtml = ''
    entries.forEach((e) => {
      const badge = resolveBadge(e)
      
      let prevStock = ''
      let nextStock = ''
      if (e.movement_type === 'ENTRADA' || (e.movement_type === 'AJUSTE' && e.destination_location)) {
        prevStock = String(e.stock_previo_destino ?? '—')
        nextStock = String(e.stock_resultante_destino ?? '—')
      } else if (e.movement_type.startsWith('SALIDA') || e.movement_type === 'SALIDA_COMBO' || (e.movement_type === 'AJUSTE' && e.origin_location)) {
        prevStock = String(e.stock_previo_origen ?? '—')
        nextStock = String(e.stock_resultante_origen ?? '—')
      } else if (e.movement_type === 'TRASLADO') {
        prevStock = `Ori: ${e.stock_previo_origen ?? '—'} | Des: ${e.stock_previo_destino ?? '—'}`
        nextStock = `Ori: ${e.stock_resultante_origen ?? '—'} | Des: ${e.stock_resultante_destino ?? '—'}`
      }

      const note = e.justification || e.discrepancy_note || '—'

      rowsHtml += `
        <tr>
          <td style="font-family: monospace; font-weight: 600; color: #4f46e5;">${shortId(e.id)}</td>
          <td>${formatTs(e.created_at)}</td>
          <td>${getUserName(e.executed_by)}</td>
          <td>
            <span class="badge" style="background: ${badge.bg}; color: ${badge.color};">
              ${badge.label}
            </span>
          </td>
          <td>
            <div style="font-weight: 600;">${e.product_sku}</div>
            <div style="font-size: 10px; color: #666;">${getProductName(e.product_sku)}</div>
          </td>
          <td align="center" style="font-weight: 600;">${e.quantity}</td>
          <td>${prevStock} &rarr; ${nextStock}</td>
          <td>${note}</td>
        </tr>
      `
    })

    doc.write(`
      <html>
        <head>
          <title>Reporte de Auditoría - ICM</title>
          <style>
            @page {
              size: letter landscape;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #333;
              margin: 0;
              padding: 0;
              font-size: 11px;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              color: #111827;
              margin: 0;
            }
            .subtitle {
              font-size: 11px;
              color: #6b7280;
              margin: 4px 0 0 0;
            }
            .meta {
              text-align: right;
              font-size: 10px;
              color: #4b5563;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f9fafb;
              color: #374151;
              font-weight: 600;
              border-bottom: 1px solid #e5e7eb;
              padding: 8px 10px;
              text-align: left;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #f3f4f6;
              vertical-align: middle;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 9px;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="title">Log de Auditoría de Inventario</div>
              <div class="subtitle">Trazabilidad de movimientos físicos de stock</div>
            </div>
            <div class="meta">
              <strong>Generado por:</strong> Sistema de Inventario ICM<br/>
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="80">ID</th>
                <th width="120">Fecha</th>
                <th>Operario</th>
                <th width="100">Tipo</th>
                <th>Producto</th>
                <th width="60" style="text-align: center;">Cant.</th>
                <th>Stock Ant. &rarr; Nuevo</th>
                <th>Nota / Justificación</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    doc.close()

    // Dar tiempo para la impresión y luego remover el iframe
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 2000)
  }

  // Resolutores locales
  const usersById: Record<string, UserItem> = {}
  users.forEach((u) => {
    usersById[u.id] = u
  })

  const getUserName = (userId: number | string | null): string => {
    if (userId == null) return 'Sistema'
    const u = usersById[String(userId)]
    if (!u) return `ID ${userId}`
    return (u.first_name + ' ' + u.last_name).trim() || u.username
  }

  const getProductName = (sku: string): string => {
    const p = products.find((prod) => prod.sku === sku)
    return p ? p.name : '—'
  }

  // Renderizar la columna stock anterior / nuevo
  const renderStockChange = (e: AuditLogEntry) => {
    let prev: number | null = null
    let next: number | null = null

    if (e.movement_type === 'ENTRADA' || (e.movement_type === 'AJUSTE' && e.destination_location)) {
      prev = e.stock_previo_destino
      next = e.stock_resultante_destino
    } else if (
      e.movement_type.startsWith('SALIDA') ||
      e.movement_type === 'SALIDA_COMBO' ||
      (e.movement_type === 'AJUSTE' && e.origin_location)
    ) {
      prev = e.stock_previo_origen
      next = e.stock_resultante_origen
    } else if (e.movement_type === 'TRASLADO') {
      return (
        <div style={{ fontSize: '0.8rem', lineHeight: '1.25' }}>
          <div>
            Ori:{' '}
            <span style={{ color: '#374151' }}>
              {e.stock_previo_origen != null ? e.stock_previo_origen : '—'}
            </span>{' '}
            <span style={{ color: '#9ca3af' }}>→</span>{' '}
            <span style={{ color: '#e03131', fontWeight: 600 }}>
              {e.stock_resultante_origen != null ? e.stock_resultante_origen : '—'}
            </span>
          </div>
          <div>
            Dest:{' '}
            <span style={{ color: '#374151' }}>
              {e.stock_previo_destino != null ? e.stock_previo_destino : '—'}
            </span>{' '}
            <span style={{ color: '#9ca3af' }}>→</span>{' '}
            <span style={{ color: '#059669', fontWeight: 600 }}>
              {e.stock_resultante_destino != null ? e.stock_resultante_destino : '—'}
            </span>
          </div>
        </div>
      )
    }

    if (prev == null && next == null) return <span style={{ color: '#9ca3af' }}>—</span>

    const isPositive = next != null && prev != null && next >= prev

    return (
      <span style={{ color: '#6b7280' }}>
        <span style={{ color: '#374151' }}>{prev ?? '—'}</span>
        <span style={{ margin: '0 0.3rem', color: '#9ca3af' }}>→</span>
        <span style={{ color: isPositive ? '#059669' : '#e03131', fontWeight: 600 }}>
          {next ?? '—'}
        </span>
      </span>
    )
  }

  // Paginación local sobre la lista filtrada
  const totalPages = Math.ceil(totalCount / pageSize)
  const paginatedEntries = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return entries.slice(startIdx, startIdx + pageSize)
  }, [entries, currentPage, pageSize])

  return (
    <AppShell title="Log de auditoría" subtitle="Trazabilidad de movimientos físicos de inventario">
      <div className="catalog-page fade-slide-up">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="catalog-header" style={{ marginBottom: '1.25rem' }}>
          <div className="catalog-header__info" />
          <div style={{ position: 'relative' }} ref={exportRef}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setExportOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                height: '38px',
                padding: '0 1rem',
              }}
            >
              <Download style={{ width: '15px', height: '15px' }} />
              Exportar
              <ChevronDown style={{ width: '14px', height: '14px' }} />
            </button>
            {exportOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  zIndex: 200,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                  minWidth: '160px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                  }}
                >
                  📊 Descargar CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                  }}
                >
                  📈 Descargar Excel
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                  }}
                >
                  📄 Descargar PDF
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {errorMsg && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.25rem' }}>
            <AlertTriangle style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
            <span>{errorMsg}</span>
            <button className="alert-bar__close" onClick={() => setErrorMsg(null)}>
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        )}

        {/* ── Panel de filtros ────────────────────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <form onSubmit={handleApplyFilters}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr 160px 1fr auto',
                gap: '0.75rem',
                alignItems: 'end',
              }}
            >
              {/* Operario */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.35rem',
                  }}
                >
                  <User
                    style={{
                      width: '13px',
                      height: '13px',
                      display: 'inline',
                      marginRight: '0.25rem',
                      verticalAlign: 'middle',
                    }}
                  />
                  Operario
                </label>
                <select
                  value={filterOperario}
                  onChange={(e) => setFilterOperario(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '0 0.75rem',
                    fontSize: '0.875rem',
                    background: '#fff',
                  }}
                >
                  <option value="">Todos</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {(u.first_name + ' ' + u.last_name).trim() || u.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de operación */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Shield
                    style={{
                      width: '13px',
                      height: '13px',
                      display: 'inline',
                      marginRight: '0.25rem',
                      verticalAlign: 'middle',
                    }}
                  />
                  Tipo de operación
                </label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '0 0.75rem',
                    fontSize: '0.875rem',
                    background: '#fff',
                  }}
                >
                  {OPERATION_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Calendar
                    style={{
                      width: '13px',
                      height: '13px',
                      display: 'inline',
                      marginRight: '0.25rem',
                      verticalAlign: 'middle',
                    }}
                  />
                  Fecha
                </label>
                <input
                  type="date"
                  value={filterFecha}
                  onChange={(e) => setFilterFecha(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '0 0.75rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* SKU / Búsqueda */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Search
                    style={{
                      width: '13px',
                      height: '13px',
                      display: 'inline',
                      marginRight: '0.25rem',
                      verticalAlign: 'middle',
                    }}
                  />
                  SKU / Producto
                </label>
                <input
                  type="text"
                  value={filterSku}
                  onChange={(e) => setFilterSku(e.target.value)}
                  placeholder="Ej: ALM-..."
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '0 0.75rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{
                    height: '38px',
                    padding: '0 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Filter style={{ width: '14px', height: '14px' }} />
                  Filtrar
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn btn--secondary"
                    style={{ height: '38px', padding: '0 0.85rem' }}
                    title="Limpiar filtros"
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="empty-state">
            <p>Cargando movimientos de auditoría...</p>
          </div>
        ) : paginatedEntries.length === 0 ? (
          <div className="empty-state">
            <Shield
              style={{
                width: '48px',
                height: '48px',
                strokeWidth: 1,
                color: '#9ca3af',
                marginBottom: '1rem',
              }}
            />
            <p>No se encontraron registros de movimientos de auditoría.</p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleClearFilters}
                style={{ marginTop: '0.75rem' }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Info count */}
            <p
              style={{
                fontSize: '0.82rem',
                color: '#6b7280',
                marginBottom: '0.75rem',
                margin: '0 0 0.75rem 0',
              }}
            >
              Mostrando {paginatedEntries.length} de {totalCount} registros filtrados
              {hasActiveFilters && (
                <span style={{ marginLeft: '0.5rem', color: '#6366f1', fontWeight: 500 }}>
                  · Filtros activos
                </span>
              )}
            </p>

            <div
              className="table-surface"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <table
                className="data-table"
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.855rem' }}
              >
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {[
                      'ID',
                      'TIMESTAMP',
                      'OPERARIO',
                      'TIPO',
                      'PRODUCTO',
                      'CANTIDAD',
                      'STOCK ANT./NUEVO',
                      'NOTA',
                    ].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: '0.8rem 1rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          fontSize: '0.75rem',
                          letterSpacing: '0.04em',
                          textAlign: col === 'CANTIDAD' ? 'center' : 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.map((entry) => {
                    const badge = resolveBadge(entry)
                    const nota = entry.justification || entry.discrepancy_note || '—'
                    return (
                      <tr
                        key={entry.id}
                        style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.12s' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fafafa'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {/* ID */}
                        <td style={{ padding: '0.8rem 1rem', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.8rem',
                              color: '#4f46e5',
                              fontWeight: 600,
                            }}
                          >
                            {shortId(entry.id)}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td style={{ padding: '0.8rem 1rem', color: '#374151', whiteSpace: 'nowrap' }}>
                          {formatTs(entry.created_at)}
                        </td>

                        {/* Operario */}
                        <td style={{ padding: '0.8rem 1rem', color: '#374151', whiteSpace: 'nowrap' }}>
                          {getUserName(entry.executed_by)}
                        </td>

                        {/* Tipo (badge) */}
                        <td style={{ padding: '0.8rem 1rem', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '5px',
                              background: badge.bg,
                              color: badge.color,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Producto (SKU + Nombre) */}
                        <td style={{ padding: '0.8rem 1rem', color: '#1e293b', maxWidth: '240px' }}>
                          <span
                            style={{
                              display: 'block',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {entry.product_sku}
                          </span>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.78rem',
                              color: '#6b7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={getProductName(entry.product_sku)}
                          >
                            {getProductName(entry.product_sku)}
                          </span>
                        </td>

                        {/* Cantidad */}
                        <td
                          style={{
                            padding: '0.8rem 1rem',
                            textAlign: 'center',
                            color: '#374151',
                            fontWeight: 600,
                          }}
                        >
                          {entry.quantity}
                        </td>

                        {/* Stock Ant. / Nuevo */}
                        <td style={{ padding: '0.8rem 1rem', whiteSpace: 'nowrap' }}>
                          {renderStockChange(entry)}
                        </td>

                        {/* Nota */}
                        <td
                          style={{
                            padding: '0.8rem 1rem',
                            color: nota === '—' ? '#9ca3af' : '#b45309',
                            maxWidth: '220px',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={nota}
                          >
                            {nota}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalCount > pageSize && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.25rem',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Página {currentPage} de {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn--secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    style={{ height: '36px', padding: '0 0.85rem' }}
                  >
                    Anterior
                  </button>
                  <button
                    className="btn btn--secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    style={{ height: '36px', padding: '0 0.85rem' }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

export default AuditPage
