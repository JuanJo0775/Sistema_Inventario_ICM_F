import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  Shield,
  Download,
  Filter,
  Search,
  AlertTriangle,
  X,
  ChevronDown,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { fetchAuditLogs, exportAuditToCSV } from '../../services/audit'
import { fetchUsers, type UserItem } from '../../services/transfers'
import useCatalogStore from '../../store/useCatalogStore'
import type { AuditLogEntry, EventTypeBadgeConfig } from '../../interfaces/audit'

// ─── Badge config por tipo de movimiento ──────────────────────────────────────

const resolveBadgeClass = (entry: AuditLogEntry): string => {
  if (entry.movement_type === 'ENTRADA') return 'pill--ok'
  if (entry.movement_type === 'TRASLADO') return 'pill--teal'
  if (entry.movement_type === 'DEVOLUCION') return 'pill--teal'
  if (entry.movement_type === 'AJUSTE') {
    return entry.destination_location ? 'pill--amber' : 'pill--warn'
  }
  if (entry.movement_type.startsWith('SALIDA') || entry.movement_type === 'SALIDA_COMBO') {
    return 'pill--err'
  }
  return 'pill--muted'
}

const resolveBadgeLabel = (entry: AuditLogEntry): string => {
  if (entry.movement_type === 'ENTRADA') return 'Entrada'
  if (entry.movement_type === 'TRASLADO') return 'Transferencia'
  if (entry.movement_type === 'DEVOLUCION') return 'Recepción'
  if (entry.movement_type === 'AJUSTE') {
    return entry.destination_location ? 'Ajuste +' : 'Ajuste -'
  }
  if (entry.movement_type.startsWith('SALIDA') || entry.movement_type === 'SALIDA_COMBO') {
    return 'Salida'
  }
  return entry.movement_type
}

const resolveBadge = (entry: AuditLogEntry): EventTypeBadgeConfig => {
  if (entry.movement_type === 'ENTRADA') return { label: 'Entrada', bg: '#d1fae5', color: '#065f46' }
  if (entry.movement_type === 'TRASLADO') return { label: 'Transferencia', bg: '#dbeafe', color: '#1d4ed8' }
  if (entry.movement_type === 'DEVOLUCION') return { label: 'Recepción', bg: '#ccfbf1', color: '#0f766e' }
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
      let resolvedProductId: string | undefined = undefined
      if (appliedSku.trim()) {
        const matchingProduct = products.find(
          (p) => p.sku.toLowerCase() === appliedSku.trim().toLowerCase()
        )
        if (matchingProduct) {
          resolvedProductId = matchingProduct.id
        }
      }

      const data = await fetchAuditLogs({
        product_id: resolvedProductId,
        page_size: 100,
      })
      let results = data.results ?? []

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

      if (appliedOperario) {
        results = results.filter((e) => String(e.executed_by) === String(appliedOperario))
      }

      if (appliedTipo) {
        results = results.filter((e) => {
          const badge = resolveBadge(e)
          return badge.label.toLowerCase() === appliedTipo.toLowerCase()
        })
      }

      if (appliedFecha) {
        results = results.filter((e) => e.created_at.startsWith(appliedFecha))
      }

      setEntries(results)
      setTotalCount(results.length)
      setCurrentPage(1)
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
            @page { size: letter landscape; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 0; font-size: 11px; }
            .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; color: #111827; margin: 0; }
            .subtitle { font-size: 11px; color: #6b7280; margin: 4px 0 0 0; }
            .meta { text-align: right; font-size: 10px; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f9fafb; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
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
          <script>window.onload = function() { window.focus(); window.print(); }</script>
        </body>
      </html>
    `)
    doc.close()

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
            <span style={{ color: 'var(--ink-70)' }}>
              {e.stock_previo_origen != null ? e.stock_previo_origen : '—'}
            </span>{' '}
            <span style={{ color: 'var(--ink-40)' }}>→</span>{' '}
            <span style={{ color: 'var(--err)', fontWeight: 600 }}>
              {e.stock_resultante_origen != null ? e.stock_resultante_origen : '—'}
            </span>
          </div>
          <div>
            Dest:{' '}
            <span style={{ color: 'var(--ink-70)' }}>
              {e.stock_previo_destino != null ? e.stock_previo_destino : '—'}
            </span>{' '}
            <span style={{ color: 'var(--ink-40)' }}>→</span>{' '}
            <span style={{ color: 'var(--ok)', fontWeight: 600 }}>
              {e.stock_resultante_destino != null ? e.stock_resultante_destino : '—'}
            </span>
          </div>
        </div>
      )
    }

    if (prev == null && next == null) return <span style={{ color: 'var(--ink-40)' }}>—</span>

    const isPositive = next != null && prev != null && next >= prev

    return (
      <span style={{ color: 'var(--ink-40)' }}>
        <span style={{ color: 'var(--ink-70)' }}>{prev ?? '—'}</span>
        <span style={{ margin: '0 0.3rem', color: 'var(--ink-40)' }}>→</span>
        <span style={{ color: isPositive ? 'var(--ok)' : 'var(--err)', fontWeight: 600 }}>
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

  // Metric calculations
  const uniqueOperarios = useMemo(() => {
    const ids = new Set(entries.map((e) => String(e.executed_by)))
    return ids.size
  }, [entries])

  const uniqueTipos = useMemo(() => {
    const tipos = new Set(entries.map((e) => resolveBadgeLabel(e)))
    return tipos.size
  }, [entries])

  // Export dropdown content
  const exportDropdown = useMemo(() => exportOpen && (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 4px)',
        zIndex: 200,
        background: '#fff',
        border: '1px solid var(--ink-12)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
        minWidth: '180px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={handleExportCSV}
        className="btn btn--ghost btn--sm"
        style={{ display: 'flex', width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', borderRadius: 0, fontSize: '0.825rem' }}
      >
        📊 Descargar CSV
      </button>
      <button
        type="button"
        onClick={handleExportExcel}
        className="btn btn--ghost btn--sm"
        style={{ display: 'flex', width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', borderRadius: 0, fontSize: '0.825rem' }}
      >
        📈 Descargar Excel
      </button>
      <button
        type="button"
        onClick={handleExportPDF}
        className="btn btn--ghost btn--sm"
        style={{ display: 'flex', width: '100%', textAlign: 'left', padding: '0.65rem 1rem', border: 'none', borderRadius: 0, fontSize: '0.825rem' }}
      >
        📄 Descargar PDF
      </button>
    </div>
  ), [exportOpen, handleExportCSV, handleExportExcel, handleExportPDF])

  return (
    <AppShell
      title="Log de auditoría"
      subtitle="Trazabilidad de movimientos físicos de inventario"
      actions={
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setExportOpen((o) => !o)}
            style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.85rem' }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            Exportar
            <ChevronDown style={{ width: '12px', height: '12px' }} />
          </button>
          {exportDropdown}
        </div>
      }
    >
      <div className="catalog-page fade-slide-up">

        {/* ── Metric strip ──────────────────────────────────────────────── */}
        <div className="metric-strip mb-4" style={{ maxWidth: 700 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">Total registros</p>
            <p className="metric-cell__val">{totalCount}</p>
            <p className="metric-cell__sub">movimientos en el ledger</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Operarios</p>
            <p className="metric-cell__val">{uniqueOperarios}</p>
            <p className="metric-cell__sub">usuarios con movimientos</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Tipos de operación</p>
            <p className="metric-cell__val">{uniqueTipos}</p>
            <p className="metric-cell__sub">categorías de movimiento</p>
          </div>
        </div>

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

        {/* ── Filter toolbar ────────────────────────────────────────────── */}
        <div
          className="catalog-toolbar"
          style={{
            background: '#fff',
            border: '1px solid var(--ink-12)',
            borderRadius: 'var(--r-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'end',
            width: '100%',
          }}
        >
          <form onSubmit={handleApplyFilters} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', flex: 1, flexWrap: 'nowrap' }}>
            {/* Search SKU */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-50)', whiteSpace: 'nowrap' }}>
                Filtrar por SKU / Producto
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '14px',
                    height: '14px',
                    color: 'var(--teal-600)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar por SKU…"
                  value={filterSku}
                  onChange={(e) => setFilterSku(e.target.value)}
                  className="f-input"
                  style={{ paddingLeft: '2rem', width: '100%' }}
                />
              </div>
            </div>

            {/* Operario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '165px', flexShrink: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-50)', whiteSpace: 'nowrap' }}>
                Filtrar por operario
              </label>
              <select
                value={filterOperario}
                onChange={(e) => setFilterOperario(e.target.value)}
                className="f-input"
                style={{ width: '100%' }}
              >
                <option value="">Todos los operarios</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.first_name + ' ' + u.last_name).trim() || u.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '155px', flexShrink: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-50)', whiteSpace: 'nowrap' }}>
                Filtrar por estados
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="f-input"
                style={{ width: '100%' }}
              >
                {OPERATION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '145px', flexShrink: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-50)', whiteSpace: 'nowrap' }}>
                Filtrar por fechas
              </label>
              <input
                type="date"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="f-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'end', flexShrink: 0, paddingBottom: '1px' }}>
              <button type="submit" className="btn btn--primary btn--sm" style={{ height: '36px', padding: '0 0.9rem' }}>
                <Filter style={{ width: '14px', height: '14px', marginRight: '0.25rem' }} />
                Filtrar
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn--ghost btn--sm"
                  style={{ height: '36px', padding: '0 0.65rem' }}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="empty-state">
            <p>Cargando movimientos de auditoría…</p>
          </div>
        ) : paginatedEntries.length === 0 ? (
          <div className="empty-state">
            <Shield
              style={{
                width: '48px',
                height: '48px',
                strokeWidth: 1,
                color: 'var(--ink-40)',
                marginBottom: '1rem',
              }}
            />
            <p>No se encontraron registros de movimientos de auditoría.</p>
            {hasActiveFilters && (
              <button type="button" className="btn btn--secondary" onClick={handleClearFilters} style={{ marginTop: '0.75rem' }}>
                Limpiar filtros
      </button>
    )}
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-40)', marginBottom: '0.75rem' }}>
              Mostrando {paginatedEntries.length} de {totalCount} registros filtrados
              {hasActiveFilters && (
                <span style={{ marginLeft: '0.5rem', color: 'var(--teal-600)', fontWeight: 500 }}>
                  · Filtros activos
                </span>
              )}
            </p>

            <div className="table-surface">
              <div className="table-wrap">
                <table className="data-table" style={{ minWidth: 800 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '9%' }}>ID</th>
                      <th style={{ width: '13%' }}>TIMESTAMP</th>
                      <th style={{ width: '14%' }}>OPERARIO</th>
                      <th style={{ width: '11%' }}>TIPO</th>
                      <th style={{ width: '18%' }}>PRODUCTO</th>
                      <th style={{ width: '7%', textAlign: 'center' }}>CANT.</th>
                      <th style={{ width: '16%' }}>STOCK ANT./NUEVO</th>
                      <th>NOTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.map((entry) => {
                      const pillClass = resolveBadgeClass(entry)
                      const badgeLabel = resolveBadgeLabel(entry)
                      const nota = entry.justification || entry.discrepancy_note || '—'
                      return (
                        <tr key={entry.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className="sku">{shortId(entry.id)}</span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {formatTs(entry.created_at)}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {getUserName(entry.executed_by)}
                          </td>
                          <td>
                            <span className={`pill ${pillClass}`}>
                              {badgeLabel}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                              {entry.product_sku}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ink-40)' }}>
                              {getProductName(entry.product_sku)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {entry.quantity}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {renderStockChange(entry)}
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: nota === '—' ? 'var(--ink-40)' : 'var(--amber-dk)',
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
            </div>

            {/* Paginación */}
            {totalCount > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  className="btn btn--secondary btn--sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{ height: '36px', padding: '0 0.85rem' }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--ink-40)' }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  className="btn btn--secondary btn--sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  style={{ height: '36px', padding: '0 0.85rem' }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

export default AuditPage
