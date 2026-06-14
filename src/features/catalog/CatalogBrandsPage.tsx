import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, X, Tag } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';

export const CatalogBrandsPage: React.FC = () => {
  const { 
    brands, 
    products, 
    loading, 
    error: storeError, 
    fetchBrands, 
    fetchProducts,
    createBrand,
    updateBrand,
    deactivateBrand,
    restoreBrand
  } = useCatalogStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [brandToDeactivate, setBrandToDeactivate] = useState<any | null>(null);

  useEffect(() => {
    fetchBrands(true);
    fetchProducts();
  }, [fetchBrands, fetchProducts]);

  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    brands.forEach(brand => {
      counts[brand.id] = products.filter(p => String(p.subcategory) === String(brand.id)).length;
    });
    return counts;
  }, [brands, products]);

  const filteredBrands = useMemo(() => {
    return brands.filter(brand => {
      const matchName = brand.name.toLowerCase().includes(activeSearch.toLowerCase());
      const matchDesc = (brand.description || '').toLowerCase().includes(activeSearch.toLowerCase());
      return matchName || matchDesc;
    });
  }, [brands, activeSearch]);

  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setFormName('');
    setFormDescription('');
    setFormIsActive(true);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: any) => {
    setEditingBrand(brand);
    setFormName(brand.name);
    setFormDescription(brand.description || '');
    setFormIsActive(brand.is_active);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    const nameTrimmed = formName.trim();
    if (!nameTrimmed) {
      setValidationError('El nombre de la marca es obligatorio.');
      return;
    }

    const isDuplicate = brands.some(b => 
      b.name.toLowerCase() === nameTrimmed.toLowerCase() && 
      (!editingBrand || b.id !== editingBrand.id)
    );

    if (isDuplicate) {
      setValidationError('Ya existe una marca con este nombre.');
      return;
    }

    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, {
          name: nameTrimmed,
          description: formDescription.trim(),
          is_active: formIsActive
        });
        setSuccessMsg('Marca actualizada correctamente.');
      } else {
        await createBrand({
          name: nameTrimmed,
          description: formDescription.trim()
        });
        setSuccessMsg('Marca creada correctamente.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al guardar la marca.');
    }
  };

  const handleToggleStatus = async (brand: any) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (brand.is_active) {
      setBrandToDeactivate(brand);
    } else {
      try {
        await restoreBrand(brand.id);
        setSuccessMsg(`Marca "${brand.name}" activada correctamente.`);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al activar la marca.');
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!brandToDeactivate) return;
    const brand = brandToDeactivate;
    setBrandToDeactivate(null);
    
    try {
      await deactivateBrand(brand.id);
      setSuccessMsg(`Marca "${brand.name}" desactivada correctamente.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo desactivar la marca porque tiene productos asociados.');
    }
  };

  return (
    <AppShell 
      title="Marcas" 
      subtitle="Gestiona las marcas del catálogo"
      actions={
        <button className="btn btn--primary btn--sm" onClick={handleOpenCreateModal}>
          + Nueva Marca
        </button>
      }
    >
      <div className="catalog-page fade-slide-up">

        {/* Metric strip */}
        <div className="metric-strip mb-4" style={{ maxWidth: 520 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">Total marcas</p>
            <p className="metric-cell__val">{brands.length}</p>
            <p className="metric-cell__sub">en el catálogo</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Activas</p>
            <p className="metric-cell__val">{brands.filter(b => b.is_active).length}</p>
            <p className="metric-cell__sub">marcas activas</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Inactivas</p>
            <p className="metric-cell__val" style={{ color: brands.filter(b => !b.is_active).length > 0 ? 'var(--err)' : undefined }}>
              {brands.filter(b => !b.is_active).length}
            </p>
            <p className="metric-cell__sub">marcas inactivas</p>
          </div>
        </div>

        {/* Alerts for feedback */}
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
            <button className="alert-bar__close" onClick={() => setErrorMsg(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* filters */}
        <div
          className="flex gap-10 mb-4"
          style={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); setActiveSearch(searchTerm); }}
            style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center' }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <svg
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 14,
                  height: 14,
                  stroke: "var(--teal-600)",
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
                placeholder="Buscar marcas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar marca"
              />
            </div>
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

        {/* Table representation */}
        {loading ? (
          <div className="empty-state">
            <p>Cargando marcas...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="empty-state">
            <Tag style={{ width: '48px', height: '48px', strokeWidth: 1, color: '#9ca3af', marginBottom: '1rem' }} />
            <p>No se encontraron marcas que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="table-surface">
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Nombre</th>
                    <th style={{ width: '27%' }}>Descripción</th>
                    <th style={{ width: '14%', textAlign: 'center' }}>Estado</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Productos</th>
                    <th style={{ width: '19%' }}><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((brand) => {
                    const prodCount = brandProductCounts[brand.id] || 0;
                    return (
                      <tr key={brand.id}>
                        <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{brand.name}</td>
                        <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {brand.description || <span style={{ color: 'var(--ink-40)', fontStyle: 'italic' }}>Sin descripción</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`pill ${brand.is_active ? 'pill--active' : 'pill--inactive'}`}>
                            {brand.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, textAlign: 'center' }}>
                          {prodCount}
                        </td>
                        <td>
                          <div className="flex gap-4" style={{ whiteSpace: 'nowrap' }}>
                            <button
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleOpenEditModal(brand)}
                            >
                              Editar
                            </button>
                            {brand.is_active ? (
                              <button
                                className="btn btn--danger btn--sm"
                                onClick={() => handleToggleStatus(brand)}
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                className="btn btn--sm"
                                style={{ background: 'rgba(45, 139, 111, 0.08)', color: 'var(--ok)', border: '1px solid rgba(45, 139, 111, 0.2)' }}
                                onClick={() => handleToggleStatus(brand)}
                              >
                                Activar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confirmation Deactivate Modal */}
        {brandToDeactivate && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15,30,32,.45)",
              padding: 24,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: "var(--white)",
                borderRadius: 18,
                width: "100%",
                maxWidth: 440,
                padding: 24,
                boxShadow: "0 24px 64px rgba(15,30,32,.2)",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(179,58,42,0.08)', padding: '0.5rem', borderRadius: '9999px', color: 'var(--err)' }}>
                  <AlertTriangle style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>¿Está seguro de desactivar esta marca?</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-40)', marginTop: '0.25rem', marginBottom: 0 }}>
                    La marca <strong>{brandToDeactivate.name}</strong> se marcará como inactiva. No aparecerá para la creación de nuevos productos.
                  </p>
                </div>
              </div>
              
              {brandProductCounts[brandToDeactivate.id] > 0 && (
                <div 
                  style={{
                    background: 'rgba(201, 120, 32, 0.08)',
                    border: '1px solid rgba(201, 120, 32, 0.2)',
                    borderRadius: 8,
                    padding: '0.75rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    gap: '0.5rem',
                    fontSize: '0.825rem',
                    color: 'var(--warn)'
                  }}
                >
                  <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <strong>Regla de negocio:</strong> Esta marca tiene <strong>{brandProductCounts[brandToDeactivate.id]} producto(s)</strong> asociado(s). 
                    No es posible desactivarla en este momento a menos que desactives o cambies de marca los productos asociados primero.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setBrandToDeactivate(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn--danger btn--sm"
                  disabled={brandProductCounts[brandToDeactivate.id] > 0}
                  onClick={confirmDeactivate}
                >
                  Confirmar Desactivación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Dialog Modal */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15,30,32,.45)",
              padding: 24,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: "var(--white)",
                borderRadius: 18,
                width: "100%",
                maxWidth: 480,
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 24px 64px rgba(15,30,32,.2)",
              }}
            >
              {/* header */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--ink-06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "sticky",
                  top: 0,
                  background: "var(--white)",
                  zIndex: 1,
                }}
              >
                <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0 }}>
                  {editingBrand ? 'Editar Marca' : 'Crear Marca'}
                </h2>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsModalOpen(false)}
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
                    <legend>Información de la marca</legend>
                    <div className="f-row f-row-2">
                      <div className="f-group f-group--full">
                        <label className="f-label" htmlFor="brand-name">
                          Nombre *
                        </label>
                        <input
                          id="brand-name"
                          className="f-input"
                          placeholder="Ej: Samsung"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="f-row f-row-2">
                      <div className="f-group f-group--full">
                        <label className="f-label" htmlFor="brand-desc">
                          Descripción
                        </label>
                        <textarea
                          id="brand-desc"
                          className="f-input"
                          placeholder="Descripción detallada de la marca..."
                          rows={3}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </fieldset>

                  {editingBrand && (
                    <fieldset>
                      <legend>Estado</legend>
                      <div className="f-row f-row-2">
                        <div className="f-group">
                          <label className="f-label" htmlFor="brand-status">Estado de la marca</label>
                          <select
                            id="brand-status"
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
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                    >
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
  );
};

export default CatalogBrandsPage;
