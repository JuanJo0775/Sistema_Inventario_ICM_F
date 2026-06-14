import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner'
import { ModalPortal } from '../../components/ui/ModalPortal';
import {
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  X,
  Warehouse,
  MapPin,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import useLocationStore from '../../store/useLocationStore';
import type { LocationItem, StorageType } from '../../interfaces/locations';

// ─── safe error extraction ─────────────────────────────────────────────────
// Backend shape: { error: string, message: string, detail: object|string }
const extractErrorMsg = (err: any): string => {
  const data = err?.response?.data
  if (!data) return err?.message || 'Error desconocido'
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.detail === 'string' && data.detail) return data.detail
  return err?.message || 'Error desconocido'
}

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  maintenance: 'Mantenimiento',
  restricted: 'Restringida',
  blocked: 'Bloqueada',
  archived: 'Archivada',
};

const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  active:      { bg: '#e6fcf5', color: '#0ca678', border: '#c3fae8' },
  maintenance: { bg: '#fff9db', color: '#e67700', border: '#ffe066' },
  restricted:  { bg: '#fff0f6', color: '#c2255c', border: '#ffdeeb' },
  blocked:     { bg: '#fff5f5', color: '#c92a2a', border: '#ffc9c9' },
  archived:    { bg: '#f8f9fa', color: '#868e96', border: '#dee2e6' },
};

const isActive = (loc: LocationItem) =>
  loc.is_active && loc.operational_status === 'active';

// ─── component ──────────────────────────────────────────────────────────────

const LocationsPage: React.FC = () => {
  const {
    locations,
    storageTypes,
    loading,
    error: storeError,
    fetchLocations,
    fetchStorageTypes,
    createLocation,
    updateLocation,
    deactivateLocation,
  } = useLocationStore();

  // ── search ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // ── create/edit modal ─────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStorageTypeId, setFormStorageTypeId] = useState('');
  const [formCapacityScore, setFormCapacityScore] = useState<number>(100);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // ── deactivate confirm modal ──────────────────────────────────────────────
  const [locToDeactivate, setLocToDeactivate] = useState<LocationItem | null>(null);

  // ── feedback ──────────────────────────────────────────────────────────────
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLocations(true);
    fetchStorageTypes();
  }, [fetchLocations, fetchStorageTypes]);

  // ── derived ───────────────────────────────────────────────────────────────
  const filteredLocations = useMemo(() => {
    if (!activeSearch) return locations;
    const q = activeSearch.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.storage_type_name || '').toLowerCase().includes(q)
    );
  }, [locations, activeSearch]);

  const totalActive = useMemo(() => locations.filter(isActive).length, [locations]);
  const totalInactive = useMemo(() => locations.filter((l) => !isActive(l)).length, [locations]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormStorageTypeId(storageTypes[0]?.id ?? '');
    setFormCapacityScore(100);
    setFormValidationError(null);
  };

  const handleOpenCreate = () => {
    setEditingLoc(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: LocationItem) => {
    setEditingLoc(loc);
    setFormName(loc.name);
    setFormDescription(loc.description ?? '');
    setFormStorageTypeId(loc.storage_type_id ?? storageTypes[0]?.id ?? '');
    setFormCapacityScore(loc.capacity_score ?? 100);
    setFormValidationError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);
    const nameTrimmed = formName.trim();
    if (!nameTrimmed) {
      setFormValidationError('El nombre de la ubicación es obligatorio.');
      return;
    }
    if (!editingLoc && !formStorageTypeId) {
      setFormValidationError('Selecciona un tipo de almacenamiento.');
      return;
    }
    setSaving(true);
    try {
      if (editingLoc) {
        await updateLocation(editingLoc.id, {
          name: nameTrimmed,
          description: formDescription.trim(),
          capacity_score: formCapacityScore,
        });
        setSuccessMsg(`Ubicación "${nameTrimmed}" actualizada correctamente.`);
        toast.success(`Ubicación "${nameTrimmed}" actualizada correctamente`);
      } else {
        await createLocation({
          name: nameTrimmed,
          description: formDescription.trim(),
          storage_type_id: formStorageTypeId,
          capacity_score: formCapacityScore,
        });
        setSuccessMsg(`Ubicación "${nameTrimmed}" creada correctamente.`);
        toast.success(`Ubicación "${nameTrimmed}" creada correctamente`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormValidationError(extractErrorMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (loc: LocationItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (isActive(loc)) {
      // Ask for confirm before deactivating
      setLocToDeactivate(loc);
    } else {
      // Activate directly (patch is_active = true)
      handleActivate(loc);
    }
  };

  const handleActivate = async (loc: LocationItem) => {
    try {
      await updateLocation(loc.id, { is_active: true });
      setSuccessMsg(`Ubicación "${loc.name}" activada correctamente.`);
      toast.success(`Ubicación "${loc.name}" activada correctamente`);
    } catch (err: any) {
      const msg = extractErrorMsg(err)
      setErrorMsg(msg)
    }
  };

  const confirmDeactivate = async () => {
    if (!locToDeactivate) return;
    const loc = locToDeactivate;
    setLocToDeactivate(null);
    try {
      await deactivateLocation(loc.id);
      setSuccessMsg(`Ubicación "${loc.name}" desactivada correctamente.`);
      toast.success(`Ubicación "${loc.name}" desactivada correctamente`);
    } catch (err: any) {
      const msg = extractErrorMsg(err)
      setErrorMsg(msg)
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <AppShell title="Bodega" subtitle="Gestiona las ubicaciones de almacenamiento">
      <div className="catalog-page fade-slide-up">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="catalog-header" style={{ marginBottom: '1.5rem' }}>
          <div className="catalog-header__info" />
          <button className="btn btn--primary" type="button" onClick={handleOpenCreate}>
            <Plus style={{ marginRight: '0.25rem', width: '18px', height: '18px' }} />
            Nueva Ubicación
          </button>
        </header>

        {/* ── Stat cards ───────────────────────────────────────────────── */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Total */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#2563eb', width: '48px', height: '48px', borderRadius: '10px' }}>
              <Warehouse style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{locations.length}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Ubicaciones Totales</p>
            </div>
          </div>

          {/* Activas */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ebfbee', color: '#099268', width: '48px', height: '48px', borderRadius: '10px' }}>
              <CheckCircle style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{totalActive}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Ubicaciones Activas</p>
            </div>
          </div>

          {/* Inactivas */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
              padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff0f0', color: '#e03131', width: '48px', height: '48px', borderRadius: '10px' }}>
              <XCircle style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{totalInactive}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Inactivas / Archivadas</p>
            </div>
          </div>
        </section>

        {/* ── Feedback alerts ──────────────────────────────────────────── */}
        {successMsg && (
          <div className="alert-bar alert-bar--ok" role="status" style={{ marginBottom: '1.5rem' }}>
            <span>{successMsg}</span>
            <button className="alert-bar__close" onClick={() => setSuccessMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {(errorMsg || storeError) && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{errorMsg || storeError}</span>
            <button className="alert-bar__close" onClick={() => { setErrorMsg(null); }}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* ── Search toolbar ───────────────────────────────────────────── */}
        <div
          className="catalog-toolbar"
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'stretch' }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', maxWidth: '450px', gap: '0.5rem' }}>
            <div className="catalog-toolbar__search" style={{ flexGrow: 1, position: 'relative' }}>
              <Search
                className="catalog-toolbar__search-icon"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6b7280' }}
              />
              <input
                type="text"
                placeholder="Buscar ubicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', height: '42px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              style={{ height: '42px', padding: '0 1.25rem', whiteSpace: 'nowrap', borderRadius: '8px' }}
            >
              Buscar
            </button>
          </form>
          {activeSearch && (
            <button
              onClick={() => { setSearchTerm(''); setActiveSearch(''); }}
              className="btn btn--secondary"
              style={{ height: '42px', borderRadius: '8px' }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="empty-state">
            <p>Cargando ubicaciones...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="empty-state">
            <MapPin style={{ width: '48px', height: '48px', strokeWidth: 1, color: '#9ca3af', marginBottom: '1rem' }} />
            <p>No se encontraron ubicaciones.</p>
          </div>
        ) : (
          <div
            className="table-surface"
            style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Nombre</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Tipo</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Descripción</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Capacidad</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => {
                  const statusColors = STATUS_COLOR[loc.operational_status] ?? STATUS_COLOR.archived;
                  const locIsActive = isActive(loc);
                  return (
                    <tr
                      key={loc.id}
                      style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Nombre */}
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: '#111827', fontSize: '0.925rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin style={{ width: '15px', height: '15px', color: '#6b7280', flexShrink: 0 }} />
                          {loc.name}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>
                        {loc.storage_type_name ? (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center',
                              padding: '0.2rem 0.6rem', borderRadius: '6px',
                              backgroundColor: '#f3f0ff', color: '#6741d9',
                              fontSize: '0.8rem', fontWeight: 600,
                            }}
                          >
                            {loc.storage_type_name}
                          </span>
                        ) : (
                          <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* Descripción */}
                      <td
                        style={{
                          padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem',
                          maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {loc.description || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Sin descripción</span>}
                      </td>

                      {/* Capacidad */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        {loc.capacity_score != null ? (
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: '40px', padding: '0.2rem 0.6rem',
                              borderRadius: '8px', background: '#f3f4f6', color: '#374151',
                              fontSize: '0.8rem', fontWeight: 600,
                            }}
                          >
                            {loc.capacity_score}
                          </span>
                        ) : (
                          <span style={{ color: '#d1d5db' }}>—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '0.25rem 0.625rem', borderRadius: '9999px',
                            fontSize: '0.75rem', fontWeight: 600, lineHeight: 1,
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`,
                          }}
                        >
                          {STATUS_LABEL[loc.operational_status] ?? loc.operational_status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.6rem', alignItems: 'center' }}>
                          <button
                            className="btn btn--icon"
                            title="Editar ubicación"
                            onClick={() => handleOpenEdit(loc)}
                            style={{ padding: '0.375rem', borderRadius: '6px', color: '#4b5563' }}
                          >
                            <Edit2 style={{ width: '16px', height: '16px' }} />
                          </button>

                          <button
                            className="btn"
                            title={locIsActive ? 'Desactivar' : 'Activar'}
                            onClick={() => handleToggleStatus(loc)}
                            style={{
                              padding: '0.375rem 0.75rem', borderRadius: '6px',
                              fontSize: '0.825rem', fontWeight: 500, height: '30px',
                              lineHeight: '1.25rem',
                              backgroundColor: locIsActive ? '#fff0f0' : '#ebfbee',
                              color: locIsActive ? '#e03131' : '#099268',
                              border: `1px solid ${locIsActive ? '#ffc9c9' : '#b2f2bb'}`,
                            }}
                          >
                            {locIsActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Deactivate Confirm Modal ──────────────────────────────────── */}
        {locToDeactivate && (
          <ModalPortal onClose={() => setLocToDeactivate(null)}>
            <div
              style={{
                position: 'relative',
                backgroundColor: '#fff', borderRadius: '12px',
                width: '100%', maxWidth: '460px',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '1.5rem', border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff0f6', padding: '0.5rem', borderRadius: '9999px', color: '#f03e3e' }}>
                  <AlertTriangle style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    ¿Desactivar esta ubicación?
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem', marginBottom: 0 }}>
                    La ubicación <strong>"{locToDeactivate.name}"</strong> quedará archivada.
                    No recibirá entradas, transferencias ni participará en ventas. Su historial se preserva.
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fff9db', border: '1px solid #ffe066', borderRadius: '8px',
                  padding: '0.75rem', marginBottom: '1.25rem',
                  display: 'flex', gap: '0.5rem', fontSize: '0.825rem', color: '#5c3d00',
                }}
              >
                <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Si la ubicación aún contiene inventario, el sistema no permitirá desactivarla.
                  Primero mueva o ajuste el stock existente.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn--secondary"
                  onClick={() => setLocToDeactivate(null)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                >
                  Cancelar
                </button>
                <button
                  className="btn"
                  onClick={confirmDeactivate}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px',
                    backgroundColor: '#f03e3e', color: '#fff',
                  }}
                >
                  Confirmar Desactivación
                </button>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* ── Create / Edit Modal ───────────────────────────────────────── */}
        {isModalOpen && (
          <ModalPortal onClose={() => setIsModalOpen(false)}>
            <div
              style={{
                position: 'relative',
                backgroundColor: '#fff', borderRadius: '12px',
                width: '100%', maxWidth: '500px',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '1.5rem', border: '1px solid #e5e7eb',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {editingLoc ? 'Editar Ubicación' : 'Nueva Ubicación'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Validation error inside modal */}
              {formValidationError && (
                <div
                  style={{
                    background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px',
                    padding: '0.75rem', marginBottom: '1rem', color: '#c53030',
                    fontSize: '0.825rem', display: 'flex', gap: '0.5rem', alignItems: 'center',
                  }}
                >
                  <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{formValidationError}</span>
                </div>
              )}

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Nombre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label htmlFor="loc-name" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    Nombre <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="loc-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Bodega Central"
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none' }}
                    required
                  />
                </div>

                {/* Tipo de almacenamiento – solo en creación */}
                {!editingLoc && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label htmlFor="loc-type" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                      Tipo <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="loc-type"
                      value={formStorageTypeId}
                      onChange={(e) => setFormStorageTypeId(e.target.value)}
                      style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                      required
                    >
                      <option value="">— Selecciona un tipo —</option>
                      {storageTypes.map((st: StorageType) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Capacidad relativa */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label htmlFor="loc-capacity" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    Capacidad relativa
                    <span style={{ marginLeft: '0.5rem', color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(escala 1–1000)</span>
                  </label>
                  <input
                    id="loc-capacity"
                    type="number"
                    min={1}
                    max={1000}
                    value={formCapacityScore}
                    onChange={(e) => setFormCapacityScore(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>

                {/* Descripción */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label htmlFor="loc-desc" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    Descripción
                    <span style={{ marginLeft: '0.5rem', color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                  </label>
                  <textarea
                    id="loc-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descripción breve de la ubicación..."
                    rows={3}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* Form footer */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={saving}
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </ModalPortal>
        )}

      </div>
    </AppShell>
  );
};

export default LocationsPage;
