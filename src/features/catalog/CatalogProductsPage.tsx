import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import useCatalogStore from '../../store/useCatalogStore';

const CatalogProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, loading, error: storeError, fetchProducts, categories, brands, fetchCategories, fetchBrands } = useCatalogStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [fetchProducts, fetchCategories, fetchBrands]);

  const handleRefresh = () => {
    setLocalError(null);
    fetchProducts();
    fetchCategories();
    fetchBrands();
  };

  const filteredProducts = products ? products.filter((product: any) => {
    const matchesSearch = !searchTerm.trim() ||
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // product.category holds the category UUID
    const matchesCategory = categoryFilter ? String(product.category) === String(categoryFilter) : true;
    // product.subcategory holds the subcategory (brand) UUID
    const matchesBrand = brandFilter ? String(product.subcategory) === String(brandFilter) : true;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = product.is_active === true;
    if (statusFilter === 'inactive') matchesStatus = product.is_active === false;

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  }) : [];

  return (
    <AppShell 
      title={t('catalog.products.title')} 
      subtitle={t('catalog.products.subtitle')}
      actions={
        <button
          type="button"
          onClick={handleRefresh}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#4a5568',
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          Actualizar
        </button>
      }
    >
      <div className="catalog-page fade-slide-up">
        
        {/* Top actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <button className="btn btn--primary" onClick={() => navigate('/app/catalog/products/new')} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('catalog.products.new')}
          </button>
        </div>

        {/* Error Alert Bar */}
        {(localError || storeError) && (
          <div className="alert-bar alert-bar--warn" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
            <span>{localError || storeError}</span>
            <button className="alert-bar__close" onClick={() => setLocalError(null)}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Toolbar - single row */}
        <div style={{ background: '#fff', padding: '1.25rem 1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            
            {/* Search */}
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                BUSCAR PRODUCTO
              </label>
              <div className="catalog-toolbar__search" style={{ margin: 0 }}>
                <svg className="catalog-toolbar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Nombre, SKU, Código de barras..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category filter */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                CATEGORÍA
              </label>
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: '100%', height: '42px' }}>
                <option value="">Todas</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Brand filter */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                MARCA
              </label>
              <select className="form-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} style={{ width: '100%', height: '42px' }}>
                <option value="">Todas</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Status filter */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                ESTADO
              </label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', height: '42px' }}>
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            {/* Search button */}
            <div>
              <button className="btn btn--primary" style={{ height: '42px', padding: '0 1.5rem', whiteSpace: 'nowrap' }} type="button">
                Buscar
              </button>
            </div>

          </div>
        </div>

        {/* Product list */}
        {loading ? (
          <div className="empty-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '48px', height: '48px', color: '#cbd5e0' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
            </svg>
            <p>{t('catalog.products.empty')}</p>
          </div>
        ) : (
          <div className="entity-list">
            {filteredProducts.map((product: any) => (
              <div key={product.id} className="entity-card">
                <div className="entity-card__info" style={{ flex: 1 }}>
                  <h3 className="entity-card__name" style={{ fontSize: '1rem', color: '#1a202c', marginBottom: '4px', fontWeight: 600 }}>{product.name}</h3>
                  <p className="entity-card__desc" style={{ fontSize: '0.8rem', color: '#a0aec0', margin: 0 }}>
                    SKU: {product.sku}
                  </p>
                </div>
                <div className="entity-card__meta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                    {product.stockTotal !== undefined ? `Stock: ${product.stockTotal}` : (product.stock ? `Stock: ${product.stock}` : 'Stock: 0')}
                  </span>
                  
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '100px', 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    letterSpacing: '0.05em',
                    backgroundColor: product.is_active ? '#e6fffa' : '#fff5f5',
                    color: product.is_active ? '#2c7a7b' : '#c53030'
                  }}>
                    {product.is_active 
                      ? t('catalog.products.detail.active', 'Activo')
                      : t('catalog.products.detail.inactive', 'Inactivo')
                    }
                  </span>
                  
                  <button 
                    className="btn btn--ghost btn--sm" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/app/catalog/products/${product.id}`); 
                    }} 
                    style={{ margin: 0, display: 'flex', alignItems: 'center' }} 
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '13px', height: '13px', marginRight: '4px' }}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {t('catalog.products.detail.view', 'Detalle')}
                  </button>

                  <button 
                    className="btn btn--icon" 
                    title={t('catalog.products.detail.edit', 'Editar')} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/app/catalog/products/${product.id}/edit`); 
                    }} 
                    type="button"
                    style={{ margin: 0 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CatalogProductsPage;

