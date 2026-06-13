import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useSupplierStore from '../../store/useSupplierStore'
import type { Supplier } from '../../interfaces/suppliers'

export const SuppliersPage: React.FC = () => {
  const {
    suppliers,
    loading,
    error: storeError,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    activateSupplier,
    clearError,
  } = useSupplierStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const [formNombre, setFormNombre] = useState('')
  const [formRazonSocial, setFormRazonSocial] = useState('')
  const [formNit, setFormNit] = useState('')
  const [formCorreo, setFormCorreo] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formPais, setFormPais] = useState('')
  const [formCiudad, setFormCiudad] = useState('')
  const [formDireccion, setFormDireccion] = useState('')
  const [formObservaciones, setFormObservaciones] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      if (statusFilter === 'active' && !supplier.is_active) return false
      if (statusFilter === 'inactive' && supplier.is_active) return false
      if (!activeSearch) return true
      const query = activeSearch.toLowerCase()
      const matchName = supplier.nombre_comercial.toLowerCase().includes(query)
      const matchCountry = supplier.pais.toLowerCase().includes(query)
      const matchEmail = (supplier.correo || '').toLowerCase().includes(query)
      return matchName || matchCountry || matchEmail
    })
  }, [suppliers, statusFilter, activeSearch])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchTerm)
  }

  const handleOpenCreateModal = () => {
    setEditingSupplier(null)
    setFormNombre('')
    setFormRazonSocial('')
    setFormNit('')
    setFormCorreo('')
    setFormTelefono('')
    setFormPais('')
    setFormCiudad('')
    setFormDireccion('')
    setFormObservaciones('')
    setFormIsActive(true)
    setValidationError(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormNombre(supplier.nombre_comercial)
    setFormRazonSocial(supplier.razon_social || '')
    setFormNit(supplier.nit || '')
    setFormCorreo(supplier.correo || '')
    setFormTelefono(supplier.telefono || '')
    setFormPais(supplier.pais)
    setFormCiudad(supplier.ciudad || '')
    setFormDireccion(supplier.direccion || '')
    setFormObservaciones(supplier.observaciones || '')
    setFormIsActive(supplier.is_active)
    setValidationError(null)
    setIsFormModalOpen(true)
  }

  const handleToggleStatus = async (supplier: Supplier) => {
    clearError()
    setSuccessMsg(null)
    try {
      if (supplier.is_active) {
        await deactivateSupplier(supplier.id)
        setSuccessMsg(`Proveedor "${supplier.nombre_comercial}" desactivado correctamente.`)
      } else {
        await activateSupplier(supplier.id)
        setSuccessMsg(`Proveedor "${supplier.nombre_comercial}" activado correctamente.`)
      }
    } catch (err: any) {
      // handled by store
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setSuccessMsg(null)
    clearError()

    const nameTrimmed = formNombre.trim()
    const phoneTrimmed = formTelefono.trim()
    const countryTrimmed = formPais.trim()
    const emailTrimmed = formCorreo.trim()
    const cityTrimmed = formCiudad.trim()

    if (!nameTrimmed) {
      setValidationError('El nombre del proveedor es obligatorio.')
      return
    }
    if (!phoneTrimmed) {
      setValidationError('El teléfono es obligatorio.')
      return
    }
    if (!emailTrimmed) {
      setValidationError('El correo electrónico es obligatorio.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      setValidationError('Por favor ingrese un correo electrónico válido.')
      return
    }
    if (!countryTrimmed) {
      setValidationError('El país es obligatorio.')
      return
    }
    if (!cityTrimmed) {
      setValidationError('La ciudad es obligatoria.')
      return
    }

    const payload = {
      nombre_comercial: nameTrimmed,
      razon_social: formRazonSocial.trim() || undefined,
      nit: formNit.trim() || undefined,
      correo: emailTrimmed,
      telefono: phoneTrimmed,
      pais: countryTrimmed,
      ciudad: cityTrimmed,
      direccion: formDireccion.trim() || undefined,
      observaciones: formObservaciones.trim() || undefined,
    }

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload)

        if (formIsActive !== editingSupplier.is_active) {
          if (formIsActive) {
            await activateSupplier(editingSupplier.id)
          } else {
            await deactivateSupplier(editingSupplier.id)
          }
        }
        setSuccessMsg('Proveedor actualizado correctamente.')
      } else {
        await createSupplier(payload)
        setSuccessMsg('Proveedor creado correctamente.')
      }
      setIsFormModalOpen(false)
    } catch (err: any) {
      // Error is set in store
    }
  }

  return (
    <AppShell
      title="Proveedores"
      subtitle="Administra los proveedores del sistema"
      actions={
        <button className="btn btn--primary btn--sm" type="button" onClick={handleOpenCreateModal}>
          + Nuevo Proveedor
        </button>
      }
    >
      <div className="catalog-page fade-slide-up">

        {/* Metric strip */}
        <div className="metric-strip mb-4" style={{ maxWidth: 520 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">Total proveedores</p>
            <p className="metric-cell__val">{suppliers.length}</p>
            <p className="metric-cell__sub">en el sistema</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Activos</p>
            <p className="metric-cell__val">{suppliers.filter(s => s.is_active).length}</p>
            <p className="metric-cell__sub">proveedores activos</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Inactivos</p>
            <p className="metric-cell__val" style={{ color: suppliers.filter(s => !s.is_active).length > 0 ? 'var(--err)' : undefined }}>
              {suppliers.filter(s => !s.is_active).length}
            </p>
            <p className="metric-cell__sub">proveedores inactivos</p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{successMsg}</span>
            <button className="alert-bar__close" onClick={() => setSuccessMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {storeError && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{storeError}</span>
            <button className="alert-bar__close" onClick={clearError}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Filter toolbar — no white background box */}
        <div className="flex gap-10 mb-4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center' }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  stroke: 'var(--teal-600)',
                  strokeWidth: 1.8,
                }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="f-input"
                style={{ paddingLeft: 34 }}
                placeholder="Nombre, país o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar proveedor"
              />
            </div>
            <select
              className="f-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              style={{ maxWidth: 140 }}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <button type="submit" className="btn btn--primary">
              Buscar
            </button>
          </form>
          {activeSearch && (
            <button
              onClick={() => { setSearchTerm(''); setActiveSearch(''); }}
              className="btn btn--ghost btn--sm"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Table */}
        {loading && suppliers.length === 0 ? (
          <div className="empty-state">
            <p>Cargando proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron proveedores registrados o que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="table-surface">
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Proveedor</th>
                    <th style={{ width: '18%' }}>Ubicación</th>
                    <th style={{ width: '22%' }}>Contacto</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Estado</th>
                    <th style={{ width: '26%' }}><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        {supplier.nombre_comercial}
                        {supplier.nit && (
                          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'var(--ink-40)', marginTop: '0.125rem' }}>
                            NIT: {supplier.nit}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--ink-70)', fontSize: '0.875rem' }}>
                        {supplier.pais}
                        {supplier.ciudad && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-40)', marginTop: '0.125rem' }}>
                            {supplier.ciudad}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--ink-70)', fontSize: '0.875rem' }}>
                        <span style={{ display: 'block' }}>{supplier.correo || <span style={{ color: 'var(--ink-40)', fontStyle: 'italic' }}>--</span>}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-40)', marginTop: '0.125rem' }}>
                          {supplier.telefono}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`pill ${supplier.is_active ? 'pill--active' : 'pill--inactive'}`}>
                          {supplier.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-4" style={{ whiteSpace: 'nowrap' }}>
                          <Link
                            to={`/app/purchasing/suppliers/${supplier.id}`}
                            className="btn btn--sm"
                            style={{ background: 'rgba(25, 113, 194, 0.08)', color: '#1971c2', border: '1px solid rgba(25, 113, 194, 0.2)' }}
                          >
                            Ver detalle
                          </Link>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleOpenEditModal(supplier)}
                          >
                            Editar
                          </button>
                          {supplier.is_active ? (
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => handleToggleStatus(supplier)}
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              className="btn btn--sm"
                              style={{ background: 'rgba(45, 139, 111, 0.08)', color: 'var(--ok)', border: '1px solid rgba(45, 139, 111, 0.2)' }}
                              onClick={() => handleToggleStatus(supplier)}
                            >
                              Activar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {isFormModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,30,32,.45)',
              padding: 24,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: 'var(--white)',
                borderRadius: 18,
                width: '100%',
                maxWidth: 560,
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 24px 64px rgba(15,30,32,.2)',
              }}
            >
              {/* header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--ink-06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--white)',
                  zIndex: 1,
                }}
              >
                <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0 }}>
                  {editingSupplier ? 'Editar Proveedor' : 'Crear Proveedor'}
                </h2>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsFormModalOpen(false)}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {validationError && (
                  <div className="alert-bar alert-bar--err" role="alert" style={{ margin: 0 }}>
                    <AlertTriangle style={{ width: 14, height: 14 }} />
                    {validationError}
                  </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <fieldset>
                    <legend>Información básica</legend>
                    <div className="f-row f-row-2">
                      <div className="f-group f-group--full">
                        <label className="f-label" htmlFor="supplier-name">
                          Nombre del proveedor <span style={{ color: 'var(--err)' }}>*</span>
                        </label>
                        <input
                          id="supplier-name"
                          className="f-input"
                          placeholder="Ej. Medical SAS"
                          value={formNombre}
                          onChange={(e) => setFormNombre(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="f-row f-row-2">
                      <div className="f-group">
                        <label className="f-label" htmlFor="supplier-rs">
                          Razón social <span style={{ color: 'var(--ink-40)', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                        </label>
                        <input
                          id="supplier-rs"
                          className="f-input"
                          placeholder="Ej. Distribuidora Médica S.A.S."
                          value={formRazonSocial}
                          onChange={(e) => setFormRazonSocial(e.target.value)}
                        />
                      </div>
                      <div className="f-group">
                        <label className="f-label" htmlFor="supplier-nit">
                          NIT o identificación <span style={{ color: 'var(--ink-40)', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                        </label>
                        <input
                          id="supplier-nit"
                          className="f-input"
                          placeholder="Ej. 900123456-1"
                          value={formNit}
                          onChange={(e) => setFormNit(e.target.value)}
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend>Información de contacto</legend>
                    <div className="f-row f-row-2">
                      <div className="f-group">
                        <label className="f-label" htmlFor="supplier-email">
                          Correo electrónico <span style={{ color: 'var(--err)' }}>*</span>
                        </label>
                        <input
                          id="supplier-email"
                          className="f-input"
                          type="email"
                          placeholder="ventas@proveedor.com"
                          value={formCorreo}
                          onChange={(e) => setFormCorreo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="f-group">
                        <label className="f-label" htmlFor="supplier-phone">
                          Teléfono <span style={{ color: 'var(--err)' }}>*</span>
                        </label>
                        <input
                          id="supplier-phone"
                          className="f-input"
                          placeholder="Ej. 3001234567"
                          value={formTelefono}
                          onChange={(e) => setFormTelefono(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend>Ubicación</legend>
                    <div className="f-row f-row-2">
                      <div className="f-group">
                        <label className="f-label" htmlFor="supplier-country">
                          País <span style={{ color: 'var(--err)' }}>*</span>
                        </label>
                        <input
                          id="supplier-country"
                          className="f-input"
                          placeholder="Ej. Colombia"
                          value={formPais}
                          onChange={(e) => setFormPais(e.target.value)}
                          required
                        />
                      </div>
                      <div className="f-group">
                        <label className="f-label" htmlFor="supplier-city">
                          Ciudad <span style={{ color: 'var(--err)' }}>*</span>
                        </label>
                        <input
                          id="supplier-city"
                          className="f-input"
                          placeholder="Ej. Bogotá"
                          value={formCiudad}
                          onChange={(e) => setFormCiudad(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="f-row f-row-2" style={{ marginTop: '0.75rem' }}>
                      <div className="f-group f-group--full">
                        <label className="f-label" htmlFor="supplier-address">
                          Dirección <span style={{ color: 'var(--ink-40)', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                        </label>
                        <input
                          id="supplier-address"
                          className="f-input"
                          placeholder="Ej. Calle 100 # 15-30"
                          value={formDireccion}
                          onChange={(e) => setFormDireccion(e.target.value)}
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend>Observaciones</legend>
                    <div className="f-row f-row-2">
                      <div className="f-group f-group--full">
                        <label className="f-label" htmlFor="supplier-obs">
                          Observaciones <span style={{ color: 'var(--ink-40)', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                        </label>
                        <textarea
                          id="supplier-obs"
                          className="f-input"
                          placeholder="Información adicional sobre el proveedor..."
                          rows={3}
                          value={formObservaciones}
                          onChange={(e) => setFormObservaciones(e.target.value)}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </fieldset>

                  {editingSupplier && (
                    <fieldset>
                      <legend>Estado</legend>
                      <div className="f-row f-row-2">
                        <div className="f-group">
                          <label className="f-label" htmlFor="supplier-status">Estado del proveedor</label>
                          <select
                            id="supplier-status"
                            className="f-input"
                            value={formIsActive ? 'active' : 'inactive'}
                            onChange={(e) => setFormIsActive(e.target.value === 'active')}
                          >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                          </select>
                        </div>
                      </div>
                    </fieldset>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => setIsFormModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={loading}
                    >
                      {loading && <span className="spinner-mini" />}
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default SuppliersPage
