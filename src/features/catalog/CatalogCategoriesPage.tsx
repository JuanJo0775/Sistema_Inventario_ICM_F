import React, { useEffect, useState, useMemo } from 'react';

import { 
  Search, 
  Plus, 
  Edit2,
  AlertTriangle, 
  X, 
  Folder 
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';

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
  const [activeSearch, setActiveSearch] = useState(''); // Used for the search button
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  
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

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchName = category.name.toLowerCase().includes(activeSearch.toLowerCase());
      const matchDesc = (category.description || '').toLowerCase().includes(activeSearch.toLowerCase());
      return matchName || matchDesc;
    });
  }, [categories, activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormIsActive(true);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: any) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormIsActive(category.is_active);
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
        // Update category name, description, and status
        await updateCategory(editingCategory.id, {
          name: nameTrimmed,
          description: formDescription.trim(),
          is_active: formIsActive
        });
        setSuccessMsg('Categoría actualizada correctamente.');
      } else {
        // Create category
        await createCategory({
          name: nameTrimmed,
          description: formDescription.trim(),
          requires_serial_number: false,
          is_returnable: false
        });
        setSuccessMsg('Categoría creada correctamente.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al guardar la categoría.');
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
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al activar la categoría.');
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
    } catch (err: any) {
      // Show backend message
      setErrorMsg(err.message || 'No se pudo desactivar la categoría porque tiene productos asociados.');
    }
  };

  return (
    <AppShell 
      title="Categorías" 
      subtitle="Organiza los productos por familia"
    >
      <div className="catalog-page fade-slide-up">
        <header className="catalog-header" style={{ marginBottom: '1.5rem' }}>
          <div className="catalog-header__info">
          </div>
          <button 
            className="btn btn--primary" 
            type="button"
            onClick={handleOpenCreateModal}
          >
            <Plus style={{ marginRight: '0.25rem', width: '18px', height: '18px' }} />
            Nueva Categoría
          </button>
        </header>

        {/* Stats Cards Section */}
        <section className="catalog-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f2ff', color: '#1971c2', width: '48px', height: '48px', borderRadius: '10px' }}>
              <Folder style={{ width: '22px', height: '22px', strokeWidth: 2 }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{categories.length}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Categorías Totales</p>
            </div>
          </div>
          
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ebfbee', color: '#099268', width: '48px', height: '48px', borderRadius: '10px' }}>
              <Folder style={{ width: '22px', height: '22px', color: '#0ca678', strokeWidth: 2 }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{categories.filter(c => c.is_active).length}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Categorías Activas</p>
            </div>
          </div>
          
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff0f0', color: '#e03131', width: '48px', height: '48px', borderRadius: '10px' }}>
              <Folder style={{ width: '22px', height: '22px', color: '#f03e3e', strokeWidth: 2 }} />
            </div>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#111827', lineHeight: 1, display: 'block' }}>{categories.filter(c => !c.is_active).length}</span>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Categorías Inactivas</p>
            </div>
          </div>
        </section>

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

        {/* Toolbar with Spanish Search and Button */}
        <div className="catalog-toolbar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', maxWidth: '450px', gap: '0.5rem' }}>
            <div className="catalog-toolbar__search" style={{ flexGrow: 1, position: 'relative' }}>
              <Search className="catalog-toolbar__search-icon" style={{ position: 'absolute', left: '0.75rem', top: '45%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6b7280' }} />
              <input 
                type="text" 
                placeholder="Buscar categorías..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', height: '42px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn--primary" 
              style={{ height: '42px', padding: '0 1.25rem', whiteSpace: 'nowrap', borderRadius: '8px', marginTop: '-1px' }}
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
            <Folder style={{ width: '48px', height: '48px', strokeWidth: 1, color: '#9ca3af', marginBottom: '1rem' }} />
            <p>No se encontraron categorías que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="table-surface" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Nombre</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Descripción</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Productos Asociados</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const prodCount = categoryProductCounts[category.id] || 0;
                  return (
                    <tr 
                      key={category.id} 
                      style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.15s ease-in-out' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 500, color: '#111827', fontSize: '0.925rem' }}>{category.name}</td>
                      <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {category.description || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Sin descripción</span>}
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
                            backgroundColor: category.is_active ? '#e6fcf5' : '#fff0f6',
                            color: category.is_active ? '#0ca678' : '#f03e3e',
                            border: `1px solid ${category.is_active ? '#c3fae8' : '#ffdeeb'}`
                          }}
                        >
                          {category.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <span 
                          style={{
                            display: 'inline-flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: '24px',
                            height: '24px',
                            padding: '0 0.375rem',
                            borderRadius: '12px',
                            backgroundColor: prodCount > 0 ? '#e8f2ff' : '#f3f4f6',
                            color: prodCount > 0 ? '#1971c2' : '#868e96',
                            fontSize: '0.825rem',
                            fontWeight: 600
                          }}
                        >
                          {prodCount}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            className="btn btn--icon" 
                            title="Editar Categoría"
                            onClick={() => handleOpenEditModal(category)}
                            style={{ padding: '0.375rem', borderRadius: '6px', color: '#4b5563' }}
                          >
                            <Edit2 style={{ width: '16px', height: '16px' }} />
                          </button>
                          
                          <button 
                            className="btn"
                            title={category.is_active ? 'Desactivar Categoría' : 'Activar Categoría'}
                            onClick={() => handleToggleStatus(category)}
                            style={{ 
                              padding: '0.375rem 0.75rem', 
                              borderRadius: '6px', 
                              fontSize: '0.825rem',
                              fontWeight: 500,
                              height: '30px',
                              lineHeight: '1.25rem',
                              backgroundColor: category.is_active ? '#fff0f0' : '#ebfbee',
                              color: category.is_active ? '#e03131' : '#099268',
                              border: `1px solid ${category.is_active ? '#ffc9c9' : '#b2f2bb'}`
                            }}
                          >
                            {category.is_active ? 'Desactivar' : 'Activar'}
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

        {/* Confirmation Deactivate Modal */}
        {categoryToDeactivate && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div 
              className="fade-slide-up"
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff0f6', padding: '0.5rem', borderRadius: '9999px', color: '#f03e3e' }}>
                  <AlertTriangle style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>¿Está seguro de desactivar esta categoría?</h3>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem', marginBottom: 0 }}>
                    La categoría <strong>"{categoryToDeactivate.name}"</strong> se marcará como inactiva. No aparecerá para la creación de nuevos productos.
                  </p>
                </div>
              </div>
              
              {categoryProductCounts[categoryToDeactivate.id] > 0 && (
                <div 
                  style={{
                    backgroundColor: '#fff9db',
                    border: '1px solid #ffe066',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    gap: '0.5rem',
                    fontSize: '0.825rem',
                    color: '#862e00'
                  }}
                >
                  <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <strong>Regla de negocio:</strong> Esta categoría tiene <strong>{categoryProductCounts[categoryToDeactivate.id]} producto(s)</strong> asociado(s). 
                    No es posible desactivarla en este momento a menos que desactives o cambies de categoría los productos asociados primero.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn--secondary" 
                  onClick={() => setCategoryToDeactivate(null)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                >
                  Cancelar
                </button>
                <button 
                  className="btn" 
                  disabled={categoryProductCounts[categoryToDeactivate.id] > 0}
                  onClick={confirmDeactivate}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '8px', 
                    backgroundColor: '#f03e3e', 
                    color: '#fff',
                    opacity: categoryProductCounts[categoryToDeactivate.id] > 0 ? 0.5 : 1,
                    cursor: categoryProductCounts[categoryToDeactivate.id] > 0 ? 'not-allowed' : 'pointer'
                  }}
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
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div 
              className="fade-slide-up"
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {validationError && (
                <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#c53030', fontSize: '0.825rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }} htmlFor="cat-name">
                    Nombre <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    id="cat-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Electroterapia"
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none' }}
                    required
                  />
                </div>

                <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }} htmlFor="cat-desc">
                    Descripción <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '0.75rem' }}>(Opcional)</span>
                  </label>
                  <textarea 
                    id="cat-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descripción detallada de la categoría de productos..."
                    rows={4}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {editingCategory && (
                  <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                      Estado de la categoría
                    </label>
                    <select
                      value={formIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormIsActive(e.target.value === 'active')}
                      style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CatalogCategoriesPage;
