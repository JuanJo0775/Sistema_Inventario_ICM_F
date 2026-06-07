import React, { useEffect, useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Info,
  Calendar,
  Globe,
  FileText,
  ChevronDown,
} from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import useSupplierStore from '../../store/useSupplierStore'
import type { Supplier } from '../../interfaces/suppliers'

export const SuppliersPage: React.FC = () => {
  const {
    suppliers,
    selectedSupplier,
    loading,
    error: storeError,
    fetchSuppliers,
    fetchSupplierDetail,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    activateSupplier,
    clearError,
    setSelectedSupplier,
  } = useSupplierStore()

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  // Form fields state
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

  // Local feedback & validation
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Fetch on mount
  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  // Filter & Search Logic (Client-side search to allow instant filter by Nombre, País, Correo)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      // 1. Status Filter
      if (statusFilter === 'active' && !supplier.is_active) return false
      if (statusFilter === 'inactive' && supplier.is_active) return false

      // 2. Search query
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

  const handleClearFilter = () => {
    setSearchTerm('')
    setActiveSearch('')
  }

  // Form Modal management
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

  // Open detail panel
  const handleOpenDetail = async (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDetailModalOpen(true)
    // Fetch latest detail from backend asynchronously to ensure fresh data
    try {
      await fetchSupplierDetail(supplier.id)
    } catch (err) {
      // Handled by store
    }
  }

  // Toggle state using API
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
      // Error msg will be handled by store/alert bar
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setSuccessMsg(null)
    clearError()

    // Validation
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
      nit: formNit.trim() || undefined, // NIT is optional, sent as undefined/blank if empty
      correo: emailTrimmed,
      telefono: phoneTrimmed,
      pais: countryTrimmed,
      ciudad: cityTrimmed,
      direccion: formDireccion.trim() || undefined,
      observaciones: formObservaciones.trim() || undefined,
    }

    try {
      if (editingSupplier) {
        // Update basic info
        await updateSupplier(editingSupplier.id, payload)
        
        // Update active/inactive state if changed
        if (formIsActive !== editingSupplier.is_active) {
          if (formIsActive) {
            await activateSupplier(editingSupplier.id)
          } else {
            await deactivateSupplier(editingSupplier.id)
          }
        }
        setSuccessMsg('Proveedor actualizado correctamente.')
      } else {
        // Create
        await createSupplier(payload)
        setSuccessMsg('Proveedor creado correctamente.')
      }
      setIsFormModalOpen(false)
    } catch (err: any) {
      // Error is set in store
    }
  }

  // Format Iso Dates nicely
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
    } catch (e) {
      return isoString
    }
  }

  return (
    <AppShell title="Proveedores" subtitle="Administra los proveedores del sistema">
      <div className="catalog-page fade-slide-up" style={{ padding: '0 1rem' }}>
        <header
          className="catalog-header"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '1.5rem',
            marginTop: '0.75rem',
          }}
        >
          <button className="btn btn--primary" type="button" onClick={handleOpenCreateModal}>
            <Plus style={{ marginRight: '0.25rem', width: '18px', height: '18px', marginTop: '2px' }} />
            Nuevo Proveedor
          </button>
        </header>

        {/* Stats Cards Section */}
        <section
          className="catalog-stats"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
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
              <Building2 style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
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
                {suppliers.length}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Proveedores Totales
              </p>
            </div>
          </div>

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
                color: '#0ca678',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <Building2 style={{ width: '22px', height: '22px', color: '#0ca678', strokeWidth: 2 }} />
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
                {suppliers.filter((s) => s.is_active).length}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Proveedores Activos
              </p>
            </div>
          </div>

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
                backgroundColor: '#fff0f0',
                color: '#e03131',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
              }}
            >
              <Building2 style={{ width: '22px', height: '22px', color: '#f03e3e', strokeWidth: 2 }} />
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
                {suppliers.filter((s) => !s.is_active).length}
              </span>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500,
                }}
              >
                Proveedores Inactivos
              </p>
            </div>
          </div>
        </section>

        {/* Alerts */}
        {successMsg && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{successMsg}</span>
            <button className="alert-bar__close" onClick={() => setSuccessMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {(storeError) && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{storeError}</span>
            <button className="alert-bar__close" onClick={clearError}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 1fr auto',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            {/* Buscar proveedor */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                Buscar proveedor
              </label>

              <div style={{ position: 'relative' }}>
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
                  placeholder="Nombre, país o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '2.5rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    backgroundColor: '#fff',
                  }}
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                Estado
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as 'all' | 'active' | 'inactive'
                  )
                }
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  padding: '0 0.75rem',
                  fontSize: '0.95rem',
                  backgroundColor: '#fff',
                }}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="btn btn--primary"
              style={{
                height: '46px',
                minWidth: '120px',
                borderRadius: '8px',
              }}
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Suppliers List Table */}
        {loading && suppliers.length === 0 ? (
          <div
            className="empty-state"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <p style={{ color: '#4b5563', fontWeight: 500 }}>Cargando proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div
            className="empty-state"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2
              style={{
                width: '48px',
                height: '48px',
                strokeWidth: 1.25,
                color: '#9ca3af',
                marginBottom: '1rem',
              }}
            />
            <p style={{ color: '#6b7280', fontSize: '0.925rem' }}>
              No se encontraron proveedores registrados o que coincidan con la búsqueda.
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
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                    }}
                  >
                    Nombre del proveedor
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                    }}
                  >
                    País
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                    }}
                  >
                    Correo electrónico
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                    }}
                  >
                    Teléfono
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                    }}
                  >
                    Estado
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                    }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.15s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td
                      style={{
                        padding: '1rem 1.25rem',
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: '0.925rem',
                      }}
                    >
                      {supplier.nombre_comercial}
                      {supplier.nit && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontWeight: 400,
                            marginTop: '0.125rem',
                          }}
                        >
                          NIT: {supplier.nit}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                      {supplier.pais}
                      {supplier.ciudad && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#868e96',
                            marginTop: '0.125rem',
                          }}
                        >
                          {supplier.ciudad}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                      {supplier.correo || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>--</span>}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                      {supplier.telefono}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          lineHeight: 1,
                          backgroundColor: supplier.is_active ? '#ebfbee' : '#fff0f0',
                          color: supplier.is_active ? '#0ca678' : '#e03131',
                          border: `1px solid ${supplier.is_active ? '#b2f2bb' : '#ffc9c9'}`,
                        }}
                      >
                        {supplier.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          gap: '0.5rem',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          className="btn btn--secondary"
                          type="button"
                          onClick={() => handleOpenDetail(supplier)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.825rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                            height: '30px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          Ver
                        </button>
                        <button
                          className="btn btn--icon"
                          title="Editar Proveedor"
                          onClick={() => handleOpenEditModal(supplier)}
                          style={{
                            padding: '0.375rem',
                            borderRadius: '6px',
                            color: '#4b5563',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#fff',
                            height: '30px',
                            width: '30px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Edit2 style={{ width: '14px', height: '14px' }} />
                        </button>

                        <button
                          className="btn"
                          title={supplier.is_active ? 'Desactivar Proveedor' : 'Activar Proveedor'}
                          onClick={() => handleToggleStatus(supplier)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.825rem',
                            fontWeight: 500,
                            height: '30px',
                            lineHeight: '1.25rem',
                            backgroundColor: supplier.is_active ? '#fff0f0' : '#ebfbee',
                            color: supplier.is_active ? '#e03131' : '#099268',
                            border: `1px solid ${supplier.is_active ? '#ffc9c9' : '#b2f2bb'}`,
                            cursor: 'pointer',
                          }}
                        >
                          {supplier.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create / Edit Form Modal */}
        {isFormModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              className="fade-slide-up"
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '1.75rem',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid #f3f4f6',
                  paddingBottom: '0.75rem',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {editingSupplier ? 'Editar Proveedor' : 'Crear Proveedor'}
                </h3>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '0.25rem',
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {validationError && (
                <div
                  style={{
                    background: '#fff5f5',
                    border: '1px solid #fed7d7',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    color: '#c53030',
                    fontSize: '0.825rem',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                  }}
                >
                  <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Basic Info Section */}
                <div>
                  <h4
                    style={{
                      fontSize: '0.875rem',
                      color: '#4f46e5',
                      fontWeight: 600,
                      margin: '0 0 0.75rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Información básica
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                        Nombre del proveedor <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        placeholder="Ej. Medical SAS"
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                        Razón social <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={formRazonSocial}
                        onChange={(e) => setFormRazonSocial(e.target.value)}
                        placeholder="Ej. Distribuidora Médica S.A.S."
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                      NIT o identificación <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formNit}
                      onChange={(e) => setFormNit(e.target.value)}
                      placeholder="Ej. 900123456-1"
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Contact Section */}
                <div>
                  <h4
                    style={{
                      fontSize: '0.875rem',
                      color: '#4f46e5',
                      fontWeight: 600,
                      margin: '0 0 0.75rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Información de contacto
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                        Correo electrónico <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={formCorreo}
                        onChange={(e) => setFormCorreo(e.target.value)}
                        placeholder="ventas@proveedor.com"
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                        Teléfono <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formTelefono}
                        onChange={(e) => setFormTelefono(e.target.value)}
                        placeholder="Ej. 3001234567"
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <h4
                    style={{
                      fontSize: '0.875rem',
                      color: '#4f46e5',
                      fontWeight: 600,
                      margin: '0 0 0.75rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Ubicación
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                        País <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formPais}
                        onChange={(e) => setFormPais(e.target.value)}
                        placeholder="Ej. Colombia"
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                        Ciudad <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formCiudad}
                        onChange={(e) => setFormCiudad(e.target.value)}
                        placeholder="Ej. Bogotá"
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                      Dirección <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formDireccion}
                      onChange={(e) => setFormDireccion(e.target.value)}
                      placeholder="Ej. Calle 100 # 15-30"
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Status & Observaciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editingSupplier && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                        Estado del proveedor
                      </label>
                      <select
                        value={formIsActive ? 'active' : 'inactive'}
                        onChange={(e) => setFormIsActive(e.target.value === 'active')}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          backgroundColor: '#fff',
                        }}
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#374151' }}>
                      Observaciones <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                    </label>
                    <textarea
                      value={formObservaciones}
                      onChange={(e) => setFormObservaciones(e.target.value)}
                      placeholder="Información adicional sobre el proveedor..."
                      rows={3}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    width: '100%',
                    justifyContent: 'flex-end',
                    marginTop: '0.5rem',
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setIsFormModalOpen(false)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    
                    className="btn btn--primary"
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={loading}
                  >
                    {loading && <span className="spinner-mini" />}
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {isDetailModalOpen && selectedSupplier && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              className="fade-slide-up"
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e5e7eb',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: '#f9fafb',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e8f2ff',
                      color: '#1971c2',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                    }}
                  >
                    <Building2 style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Detalle del Proveedor
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
                      Ficha técnica y estado del proveedor
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '0.25rem',
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* General Info Grid */}
                <div>
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      color: '#4f46e5',
                      fontWeight: 700,
                      margin: '0 0 1rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid #e5e7eb',
                      paddingBottom: '0.25rem',
                    }}
                  >
                    Información general
                  </h4>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1.25rem',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Nombre comercial
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.925rem', fontWeight: 600, color: '#111827' }}>
                        {selectedSupplier.nombre_comercial}
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Razón social
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.925rem', color: '#212529' }}>
                        {selectedSupplier.razon_social || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>No provisto</span>}
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        NIT o Identificación
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.925rem', color: '#212529', fontWeight: 500 }}>
                        {selectedSupplier.nit || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>No provisto</span>}
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Estado
                      </p>
                      <div style={{ marginTop: '0.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: selectedSupplier.is_active ? '#ebfbee' : '#fff0f0',
                            color: selectedSupplier.is_active ? '#0ca678' : '#e03131',
                            border: `1px solid ${selectedSupplier.is_active ? '#b2f2bb' : '#ffc9c9'}`,
                          }}
                        >
                          {selectedSupplier.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Teléfono
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.925rem', color: '#212529', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Phone style={{ width: '14px', height: '14px', color: '#868e96' }} />
                        {selectedSupplier.telefono}
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Correo electrónico
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.925rem', color: '#212529', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Mail style={{ width: '14px', height: '14px', color: '#868e96' }} />
                        {selectedSupplier.correo || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>No provisto</span>}
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        País / Ciudad
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.925rem', color: '#212529', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Globe style={{ width: '14px', height: '14px', color: '#868e96' }} />
                        {selectedSupplier.pais}
                        {selectedSupplier.ciudad ? ` / ${selectedSupplier.ciudad}` : ''}
                      </p>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Dirección
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.925rem', color: '#212529', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <MapPin style={{ width: '14px', height: '14px', color: '#868e96' }} />
                        {selectedSupplier.direccion || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>No provista</span>}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                      Observaciones
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.4, backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                      {selectedSupplier.observaciones || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Sin observaciones registradas</span>}
                    </p>
                  </div>
                </div>

                {/* Futuras Integraciones Section (Mandatory Placeholder) */}
                <div
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '12px',
                    padding: '1.25rem',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      color: '#495057',
                      fontWeight: 700,
                      margin: '0 0 1rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FileText style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
                    Compras (Módulo futuro)
                  </h4>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Órdenes de compra
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5' }}>
                        0
                      </p>
                    </div>

                    <div style={{ backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#868e96', fontWeight: 500 }}>
                        Última recepción
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#495057' }}>
                        --
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Dates */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '1rem',
                    fontSize: '0.75rem',
                    color: '#868e96',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar style={{ width: '12px', height: '12px' }} />
                    Creado: {formatDate(selectedSupplier.created_at)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Info style={{ width: '12px', height: '12px' }} />
                    Actualizado: {formatDate(selectedSupplier.updated_at)}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #f3f4f6',
                  backgroundColor: '#f9fafb',
                  borderBottomLeftRadius: '16px',
                  borderBottomRightRadius: '16px',
                }}
              >
                <button
                  className="btn btn--secondary"
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                >
                  Cerrar ficha
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}

export default SuppliersPage
