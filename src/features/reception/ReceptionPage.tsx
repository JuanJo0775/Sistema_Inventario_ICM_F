import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  TrendingUp,
  X,
  RefreshCw,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useReceptionStore from '../../store/useReceptionStore'

const statusTranslation: Record<string, string> = {
  pendiente: 'Pendiente',
  parcialmente_recibida: 'Parcial',
  completada: 'Completada',
  cancelada: 'Cancelada',
  borrador: 'Borrador',
}

const statusColorMap: Record<string, { bg: string; color: string; border: string }> = {
  pendiente: { bg: '#e8f2ff', color: '#1971c2', border: '#a5d8ff' },
  parcialmente_recibida: { bg: '#fff9db', color: '#f59f00', border: '#ffe066' },
  completada: { bg: '#ebfbee', color: '#099268', border: '#b2f2bb' },
  cancelada: { bg: '#fff5f5', color: '#e03131', border: '#ffc9c9' },
  borrador: { bg: '#f1f3f5', color: '#495057', border: '#dee2e6' },
}

export const ReceptionPage: React.FC = () => {
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

  // Refresh helper
  const handleRefresh = async () => {
    await Promise.all([fetchPendingOrders(), fetchCompletedOrders()])
  }

  // Filter logic
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

  // KPIs
  const kpis = useMemo(() => {
    const totalPending = pendingOrders.filter((o) => o.status === 'pendiente').length
    const totalPartial = pendingOrders.filter((o) => o.status === 'parcialmente_recibida').length
    const totalCompleted = completedOrders.length
    const totalCount = pendingOrders.length + completedOrders.length

    return {
      totalPending,
      totalPartial,
      totalCompleted,
      totalCount,
    }
  }, [pendingOrders, completedOrders])

  return (
    <AppShell
      title="Recepción de Mercancía"
      subtitle="Recibe órdenes de compra y registra ingresos en el inventario"
      actions={
        <button
          className="btn btn--secondary"
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', height: '42px' }}
        >
          <RefreshCw style={{ width: '16px', height: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      }
    >
      <div className="catalog-page fade-slide-up" style={{ paddingBottom: '2rem' }}>
        {/* KPI Cards */}
        <section
          className="catalog-stats"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* KPI: Pendientes */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#e8f2ff',
                color: '#1971c2',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <Clock style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {kpis.totalPending}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Órdenes Pendientes
              </p>
            </div>
          </div>

          {/* KPI: Parciales */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff9db',
                color: '#f59f00',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <TrendingUp style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {kpis.totalPartial}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Recepciones Parciales
              </p>
            </div>
          </div>

          {/* KPI: Completadas */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ebfbee',
                color: '#099268',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <CheckCircle2 style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {kpis.totalCompleted}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Completadas
              </p>
            </div>
          </div>

          {/* KPI: Total */}
          <div
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f0ff',
                color: '#7048e8',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <FileText style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {kpis.totalCount}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Total de Órdenes
              </p>
            </div>
          </div>
        </section>

        {/* Error Alert */}
        {error && (
          <div
            className="alert-bar alert-bar--warn"
            role="alert"
            style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}
          >
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{error}</span>
            <button className="alert-bar__close" onClick={clearError}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Tabs and White Search/Filter Box */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            marginBottom: '1.5rem',
          }}
        >
          {/* Tab Selector */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: '1rem',
              marginBottom: '1rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending')
                setStatusFilter('all')
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'pending' ? '2px solid #1971c2' : '2px solid transparent',
                color: activeTab === 'pending' ? '#1971c2' : '#6b7280',
                padding: '0.5rem 1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Pendientes de recibir
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history')
                setStatusFilter('all')
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'history' ? '2px solid #1971c2' : '2px solid transparent',
                color: activeTab === 'history' ? '#1971c2' : '#6b7280',
                padding: '0.5rem 1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Historial completado
            </button>
          </div>

          {/* Search and Filter Box */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por número de orden o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  height: '42px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Filter by state */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label
                htmlFor="state-filter"
                style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}
              >
                Filtrar por estado:
              </label>
              <select
                id="state-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: '42px',
                  padding: '0 2.5rem 0 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  backgroundColor: '#fff',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
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
            </div>

            {/* Clear filter */}
            {(searchTerm || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
                className="btn btn--secondary"
                style={{ height: '42px', borderRadius: '8px', padding: '0 1rem' }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Table Surface */}
        {loading ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <RefreshCw style={{ width: '32px', height: '32px', animation: 'spin 1.5s linear infinite', color: '#9ca3af', marginBottom: '1rem' }} />
            <p>Cargando órdenes de compra...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
            <FileText
              style={{
                width: '48px',
                height: '48px',
                strokeWidth: 1,
                color: '#9ca3af',
                marginBottom: '1rem',
              }}
            />
            <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500 }}>
              No se encontraron órdenes de compra
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Intenta cambiar la búsqueda o los filtros aplicados.
            </p>
          </div>
        ) : (
          <div
            className="table-surface"
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <table
              className="data-table"
              style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
            >
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    Orden de Compra
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    Proveedor
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                    Productos
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                    Estado
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    Fecha de Solicitud
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const styleProps = statusColorMap[order.status] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s',
                      }}
                      className="hover-row"
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: '#111827' }}>
                        {order.number}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>
                        {order.supplier_nombre}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#f3f0ff',
                            color: '#7048e8',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                          }}
                        >
                          {order.items.length} {order.items.length === 1 ? 'Producto' : 'Productos'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: styleProps.bg,
                            color: styleProps.color,
                            border: `1px solid ${styleProps.border}`,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                          }}
                        >
                          {statusTranslation[order.status] || order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(order.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className={activeTab === 'pending' ? 'btn btn--primary' : 'btn btn--secondary'}
                          style={{
                            fontSize: '0.825rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontWeight: 500,
                            height: '32px',
                          }}
                          onClick={() => navigate(`/app/reception/${order.id}`)}
                        >
                          {activeTab === 'pending' ? 'Recibir' : 'Ver Detalle'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        .hover-row:hover {
          background-color: #f9fafb;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  )
}

export default ReceptionPage
