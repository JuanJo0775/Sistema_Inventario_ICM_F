import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { fetchSupplierDetail } from '../../services/suppliers'
import { extractApiError } from '../../hooks/useApiError'
import type { Supplier } from '../../interfaces/suppliers'

const SupplierDetailPage = () => {
  const { id } = useParams()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchSupplierDetail(id)
      .then((data) => {
        setSupplier(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(extractApiError(err))
        setLoading(false)
      })
  }, [id])

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <AppShell title={supplier?.nombre_comercial || 'Detalle del Proveedor'}>
      <div className="catalog-page p-6">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/app/purchasing/suppliers" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', margin: 0 }}>
            &larr; Volver a proveedores
          </Link>
        </div>

        {loading && !supplier ? (
          <p style={{ fontSize: 13, color: 'var(--ink-40)', padding: '20px 0' }}>Cargando...</p>
        ) : error ? (
          <p style={{ fontSize: 13, color: 'var(--err)', padding: '20px 0' }}>{error}</p>
        ) : !supplier ? (
          <p style={{ fontSize: 13, color: 'var(--ink-40)', padding: '20px 0' }}>Proveedor no encontrado.</p>
        ) : (
          <>
            {/* hero */}
            <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: 'var(--r-md)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink-06)', color: 'var(--ink-70)', width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}>
                    <Building2 style={{ width: 24, height: 24 }} />
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{supplier.nombre_comercial}</h2>
                    {supplier.razon_social && (
                      <p style={{ margin: 0, color: 'var(--ink-40)', fontSize: '0.875rem' }}>{supplier.razon_social}</p>
                    )}
                    {supplier.nit && (
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--ink-40)', fontSize: '0.8rem', fontFamily: 'var(--ff-mono)' }}>
                        NIT: {supplier.nit}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`pill ${supplier.is_active ? 'pill--active' : 'pill--inactive'}`}>
                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* info grid */}
            <div className="metric-strip mb-28" style={{ maxWidth: '100%' }}>
              <div className="metric-cell metric-cell--light" style={{ flex: 1 }}>
                <p className="metric-cell__eyebrow">Correo electrónico</p>
                <p className="metric-cell__val" style={{ fontSize: 14, fontWeight: 500 }}>{supplier.correo || '—'}</p>
              </div>
              <div className="metric-cell metric-cell--light" style={{ flex: 1 }}>
                <p className="metric-cell__eyebrow">Teléfono</p>
                <p className="metric-cell__val" style={{ fontSize: 14, fontWeight: 500 }}>{supplier.telefono}</p>
              </div>
              <div className="metric-cell metric-cell--light" style={{ flex: 1 }}>
                <p className="metric-cell__eyebrow">Ubicación</p>
                <p className="metric-cell__val" style={{ fontSize: 14, fontWeight: 500 }}>
                  {supplier.pais}{supplier.ciudad ? ` / ${supplier.ciudad}` : ''}
                </p>
              </div>
            </div>

            {/* sections */}
            {supplier.direccion && (
              <div className="s-head">
                <span className="s-head__label">Dirección</span>
                <div className="s-head__rule" />
              </div>
            )}
            {supplier.direccion && (
              <p style={{ fontSize: '0.875rem', color: 'var(--ink-70)', margin: '0 0 1rem 0', padding: '0.5rem 0' }}>
                {supplier.direccion}
              </p>
            )}

            {supplier.observaciones && (
              <>
                <div className="s-head">
                  <span className="s-head__label">Observaciones</span>
                  <div className="s-head__rule" />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-70)', margin: '0 0 1rem 0', padding: '0.5rem 0', lineHeight: 1.5 }}>
                  {supplier.observaciones}
                </p>
              </>
            )}

            <div className="s-head">
              <span className="s-head__label">Fechas de registro</span>
              <div className="s-head__rule" />
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--ink-40)', padding: '0.5rem 0' }}>
              <span>Creado: {formatDate(supplier.created_at)}</span>
              <span>Actualizado: {formatDate(supplier.updated_at)}</span>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default SupplierDetailPage
