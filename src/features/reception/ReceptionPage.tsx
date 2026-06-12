import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  AlertTriangle,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useReceptionStore from '../../store/useReceptionStore'

const statusPill = (status: string) => {
  switch (status) {
    case 'pendiente':
      return <span className="pill pill--warn">Pendiente</span>
    case 'parcialmente_recibida':
      return <span className="pill pill--amber">Parcial</span>
    case 'completada':
      return <span className="pill pill--ok">Completada</span>
    case 'cancelada':
      return <span className="pill pill--err">Cancelada</span>
    case 'borrador':
      return <span className="pill pill--muted">Borrador</span>
    default:
      return <span className="pill pill--muted">{status}</span>
  }
}

export default function ReceptionPage() {
  const navigate = useNavigate()
  const {
    pendingOrders,
    completedOrders,
    loading,
    error,
    fetchPendingOrders,
    fetchCompletedOrders,
    clearError,
  } = useReceptionStore()

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchPendingOrders()
    fetchCompletedOrders()
  }, [fetchPendingOrders, fetchCompletedOrders])

  const handleRefresh = async () => {
    await Promise.all([fetchPendingOrders(), fetchCompletedOrders()])
  }

  const filteredOrders = useMemo(() => {
    const list = activeTab === 'pending' ? pendingOrders : completedOrders
    return list.filter((order) => {
      const matchSearch =
        order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_nombre.toLowerCase().includes(searchTerm.toLowerCase())

      const matchStatus = statusFilter === 'all' || order.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [activeTab, pendingOrders, completedOrders, searchTerm, statusFilter])

  const kpis = useMemo(() => {
    const totalPending = pendingOrders.filter((o) => o.status === 'pendiente').length
    const totalPartial = pendingOrders.filter((o) => o.status === 'parcialmente_recibida').length
    const totalCompleted = completedOrders.length
    const totalCount = pendingOrders.length + completedOrders.length

    return { totalPending, totalPartial, totalCompleted, totalCount }
  }, [pendingOrders, completedOrders])

  return (
    <AppShell
      title="Recepción de Mercancía"
      subtitle="Recibe órdenes de compra y registra ingresos en el inventario"
      actions={
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw
            style={{
              width: 13,
              height: 13,
              animation: loading ? 'pulse 1.5s ease infinite' : 'none',
            }}
          />
          Actualizar
        </button>
      }
    >
      <div className="page-body fade-slide-up">
        {/* KPI Cards */}
        <div className="catalog-kpis" style={{ marginBottom: 22 }}>
          <div className="catalog-kpi" style={{ borderLeft: '4px solid #1971c2' }}>
            <span className="catalog-kpi__label">Pendientes</span>
            <span className="catalog-kpi__value">{kpis.totalPending}</span>
            <span className="catalog-kpi__sub">Órdenes por recibir</span>
          </div>
          <div className="catalog-kpi" style={{ borderLeft: '4px solid #f59f00' }}>
            <span className="catalog-kpi__label">Parciales</span>
            <span className="catalog-kpi__value">{kpis.totalPartial}</span>
            <span className="catalog-kpi__sub">Recepciones parciales</span>
          </div>
          <div className="catalog-kpi" style={{ borderLeft: '4px solid #099268' }}>
            <span className="catalog-kpi__label">Completadas</span>
            <span className="catalog-kpi__value">{kpis.totalCompleted}</span>
            <span className="catalog-kpi__sub">Finalizadas</span>
          </div>
          <div className="catalog-kpi" style={{ borderLeft: '4px solid #7048e8' }}>
            <span className="catalog-kpi__label">Total</span>
            <span className="catalog-kpi__value">{kpis.totalCount}</span>
            <span className="catalog-kpi__sub">Órdenes registradas</span>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: 20 }}>
            <AlertTriangle size={14} />
            <span>{error}</span>
            <span className="alert-bar__spacer" />
            <button className="btn btn--ghost btn--sm" onClick={clearError}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="s-head" style={{ marginBottom: 14 }}>
          <span className="s-head__label">Órdenes de compra</span>
          <div className="s-head__rule" />
          <span className="pill pill--teal s-head__action">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
          <button
            className={`btn btn--sm ${activeTab === 'pending' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => {
              setActiveTab('pending')
              setStatusFilter('all')
            }}
          >
            Pendientes de recibir
          </button>
          <button
            className={`btn btn--sm ${activeTab === 'history' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => {
              setActiveTab('history')
              setStatusFilter('all')
            }}
          >
            Historial completado
          </button>
        </div>

        {/* Search + filter */}
        <div className="catalog-toolbar" style={{ marginBottom: 18 }}>
          <div className="catalog-toolbar__search">
            <Search className="catalog-toolbar__search-icon" size={14} />
            <input
              type="text"
              placeholder="Buscar por número de orden o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="catalog-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            {activeTab === 'pending' ? (
              <>
                <option value="pendiente">Pendiente</option>
                <option value="parcialmente_recibida">Parcialmente recibida</option>
              </>
            ) : (
              <option value="completada">Completada</option>
            )}
          </select>

          {(searchTerm || statusFilter !== 'all') && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Table / loading / empty */}
        {loading ? (
          <div className="empty-state">
            <RefreshCw size={32} className="pulse" />
            <p>Cargando órdenes de compra...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <p>No se encontraron órdenes de compra</p>
            <small>Intenta cambiar la búsqueda o los filtros aplicados.</small>
          </div>
        ) : (
          <div className="table-surface">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Orden de Compra</th>
                    <th>Proveedor</th>
                    <th style={{ textAlign: 'center' }}>Productos</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th>Fecha de Solicitud</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <p className="prod-name">{order.number}</p>
                      </td>
                      <td>
                        <span className="prod-sub">{order.supplier_nombre}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="pill pill--teal">
                          {order.items.length}{' '}
                          {order.items.length === 1 ? 'Producto' : 'Productos'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{statusPill(order.status)}</td>
                      <td>
                        <span className="text-mono" style={{ fontSize: 11.5 }}>
                          {new Date(order.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={`btn btn--sm ${activeTab === 'pending' ? 'btn--primary' : 'btn--outline'}`}
                          onClick={() => navigate(`/app/reception/${order.id}`)}
                        >
                          {activeTab === 'pending' ? 'Recibir' : 'Ver Detalle'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
