import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, Hash, Folder } from 'lucide-react';
import { ModalPortal } from '../../components/ui/ModalPortal';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';
import { useDebounce } from '../../hooks/useDebounce';
import { Switch } from '../../components/ui/switch';
import { extractApiError } from '../../hooks/useApiError';
import { toast } from 'sonner';

export const CatalogCategoriesPage: React.FC = () => {
  const { 
    categories, 
    products, 
    loading, 
    error: storeError, 
    fetchCategories, 
    fetchProducts,
    createCategory,
    updateCategory,
    deactivateCategory,
    restoreCategory
  } = useCatalogStore();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 150);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formRequiresSerial, setFormRequiresSerial] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Deactivate confirmation states
  const [categoryToDeactivate, setCategoryToDeactivate] = useState<any | null>(null);

  useEffect(() => {
    fetchCategories(true); // Include inactive
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Compute products count per category
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.id] = products.filter(p => String(p.category) === String(cat.id)).length;
    });
    return counts;
  }, [categories, products]);

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchName = category.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchDesc = (category.description || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchName || matchDesc;
    });
  }, [categories, debouncedSearch]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormIsActive(true);
    setFormRequiresSerial(false);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: any) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormIsActive(category.is_active);
    setFormRequiresSerial(!!category.requires_serial_number);
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
      setValidationError('El nombre de la categoría es obligatorio.');
      return;
    }

    // Check duplicate name
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === nameTrimmed.toLowerCase() && 
      (!editingCategory || cat.id !== editingCategory.id)
    );

    if (isDuplicate) {
      setValidationError('Ya existe una categoría con este nombre.');
      return;
    }

    try {
      if (editingCategory) {
        // Update category name, description, status, and serial flag
        await updateCategory(editingCategory.id, {
          name: nameTrimmed,
          description: formDescription.trim(),
          is_active: formIsActive,
          requires_serial_number: formRequiresSerial
        });
        setSuccessMsg('Categoría actualizada correctamente.');
        toast.success('Categoría actualizada correctamente');
      } else {
        // Create category
        await createCategory({
          name: nameTrimmed,
          description: formDescription.trim(),
          requires_serial_number: formRequiresSerial,
          is_returnable: false
        });
        setSuccessMsg('Categoría creada correctamente.');
        toast.success('Categoría creada correctamente');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(extractApiError(err));
    }
  };

  // Toggle status immediately
  const handleToggleStatus = async (category: any) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (category.is_active) {
      // Set category to deactivation confirmation state
      setCategoryToDeactivate(category);
    } else {
      // Activating is direct
      try {
        await restoreCategory(category.id);
        setSuccessMsg(`Categoría "${category.name}" activada correctamente.`);
        toast.success(`Categoría "${category.name}" activada correctamente`);
      } catch (err: any) {
        setErrorMsg(extractApiError(err));
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!categoryToDeactivate) return;
    const cat = categoryToDeactivate;
    setCategoryToDeactivate(null);
    
    try {
      await deactivateCategory(cat.id);
      setSuccessMsg(`Categoría "${cat.name}" desactivada correctamente.`);
      toast.success(`Categoría "${cat.name}" desactivada correctamente`);
    } catch (err: any) {
      setErrorMsg(extractApiError(err));
    }
  };

  return (
    <AppShell 
      title="Categorías" 
      subtitle="Organiza los productos por familia"
      actions={
        <button className="btn btn--primary btn--sm" onClick={handleOpenCreateModal}>
          + Nueva Categoría
        </button>
      }
    >
      <div className="catalog-page fade-slide-up">

        {/* Metric strip */}
        <div className="metric-strip mb-4" style={{ maxWidth: 520 }}>
          <div className="metric-cell metric-cell--hero">
            <p className="metric-cell__eyebrow">Total categorías</p>
            <p className="metric-cell__val">{categories.length}</p>
            <p className="metric-cell__sub">en el catálogo</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Activas</p>
            <p className="metric-cell__val">{categories.filter(c => c.is_active).length}</p>
            <p className="metric-cell__sub">categorías activas</p>
          </div>
          <div className="metric-cell metric-cell--light">
            <p className="metric-cell__eyebrow">Inactivas</p>
            <p className="metric-cell__val" style={{ color: categories.filter(c => !c.is_active).length > 0 ? 'var(--err)' : undefined }}>
              {categories.filter(c => !c.is_active).length}
            </p>
            <p className="metric-cell__sub">categorías inactivas</p>
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
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar categoría"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn btn--ghost btn--sm"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="empty-state">
            <p>Cargando categorías...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state">
            <Folder style={{ width: '48px', height: '48px', strokeWidth: 1, color: 'var(--ink-40)', marginBottom: '1rem' }} />
            <p>No se encontraron categorías que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="table-surface">
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Nombre</th>
                    <th style={{ width: '30%' }}>Descripción</th>
                    <th style={{ width: '14%', textAlign: 'center' }}>Estado</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Productos</th>
                    <th style={{ width: '16%' }}><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => {
                    const prodCount = categoryProductCounts[category.id] || 0;
                    return (
                      <tr key={category.id}>
                        <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{category.name}</td>
                        <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {category.description || <span style={{ color: 'var(--ink-40)', fontStyle: 'italic' }}>Sin descripción</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`pill ${category.is_active ? 'pill--active' : 'pill--inactive'}`}>
                            {category.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, textAlign: 'center' }}>
                          {prodCount}
                        </td>
                        <td>
                          <div className="flex gap-4" style={{ whiteSpace: 'nowrap' }}>
                            <Link
                              to={`/app/catalog/categories/${category.id}`}
                              className="btn btn--outline btn--sm"
                              style={{ textDecoration: 'none' }}
                            >
                              Ver detalle
                            </Link>
                            <button
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleOpenEditModal(category)}
                            >
                              Editar
                            </button>
                            {category.is_active ? (
                              <button
                                className="btn btn--danger btn--sm"
                                onClick={() => handleToggleStatus(category)}
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => handleToggleStatus(category)}
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
        {categoryToDeactivate && (
          <ModalPortal onClose={() => setCategoryToDeactivate(null)}>
            <div
              style={{
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto",
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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>¿Está seguro de desactivar esta categoría?</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-40)', marginTop: '0.25rem', marginBottom: 0 }}>
                    La categoría <strong>{categoryToDeactivate.name}</strong> se marcará como inactiva. No aparecerá para la creación de nuevos productos.
                  </p>
                </div>
              </div>
              
              {categoryProductCounts[categoryToDeactivate.id] > 0 && (
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
                    Esta categoría tiene <strong>{categoryProductCounts[categoryToDeactivate.id]} producto(s)</strong> asociado(s).
                    Al desactivarla, solo se ocultará del formulario de creación de nuevos productos.
                    Los productos existentes conservarán su categoría.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setCategoryToDeactivate(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={confirmDeactivate}
                >
                  Confirmar Desactivación
                </button>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Create / Edit Dialog Modal */}
        {isModalOpen && (
          <ModalPortal onClose={() => setIsModalOpen(false)}>
            <div
              style={{
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "var(--white)",
                borderRadius: 18,
                width: "100%",
                maxWidth: 480,
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
                  flexShrink: 0,
                }}
              >
                <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, margin: 0 }}>
                  {editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
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
              <div style={{ overflow: "auto", flex: 1, padding: 24 }}>
                {validationError && (
                  <div className="alert-bar alert-bar--err" role="alert" style={{ marginBottom: 20 }}>
                    <AlertTriangle style={{ width: 14, height: 14 }} />
                    {validationError}
                  </div>
                )}

                <form id="cat-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <fieldset>
                    <legend>Información de la categoría</legend>
                    <div className="f-row f-row-2">
                      <div className="f-group f-group--full">
                        <label className="f-label" htmlFor="cat-name">
                          Nombre *
                        </label>
                        <input
                          id="cat-name"
                          className="f-input"
                          placeholder="Ej: Electroterapia"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="f-row f-row-2">
                      <div className="f-group f-group--full">
                        <label className="f-label" htmlFor="cat-desc">
                          Descripción
                        </label>
                        <textarea
                          id="cat-desc"
                          className="f-input"
                          placeholder="Descripción detallada de la categoría de productos..."
                          rows={3}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend>Configuración</legend>
                    <div className="f-row f-row-1">
                      <div className="f-group">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span className="f-label" style={{ margin: 0 }}>Código serial</span>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                            <Switch
                              id="cat-requires-serial"
                              checked={formRequiresSerial}
                              onCheckedChange={setFormRequiresSerial}
                            />
                            <div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>
                                Requerir número de serie
                              </span>
                              <p style={{ fontSize: '0.775rem', color: 'var(--ink-40)', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                                Esta categoría necesita un código serial aplicado a todos los productos que estén dentro de ella.
                              </p>
                              {formRequiresSerial && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.7rem', marginTop: '0.75rem', borderRadius: 8, background: 'rgba(42,157,166,0.1)', border: '1px solid var(--teal-100)', fontSize: '0.775rem', color: 'var(--teal-700)', fontWeight: 500 }}>
                                  <Hash style={{ width: 13, height: 13 }} />
                                  Los movimientos de esta categoría exigirán un número de serie válido.
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </form>
              </div>

              {/* footer */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid var(--ink-06)",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  flexShrink: 0,
                  background: "var(--white)",
                }}
              >
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="cat-form"
                  className="btn btn--primary"
                >
                  Guardar
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </AppShell>
  );
};

export default CatalogCategoriesPage;
